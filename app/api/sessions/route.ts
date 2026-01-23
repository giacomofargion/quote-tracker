import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { timeSessionRowToTimeSession } from '@/lib/db/utils'
import type { TimeSessionRow, ProjectRow } from '@/lib/types'

// POST /api/sessions - Create a new time session
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, startTime, endTime, duration, isManual = false, note } = body

    if (!projectId || !startTime || duration === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify project belongs to user
    const [project] = await sql<ProjectRow[]>`
      SELECT id FROM projects 
      WHERE id = ${projectId} AND user_id = ${userId}
    `

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create session - convert ISO strings to Date objects for PostgreSQL
    const startTimeDate = new Date(startTime)
    const endTimeDate = endTime ? new Date(endTime) : null
    
    const [session] = await sql<TimeSessionRow[]>`
      INSERT INTO time_sessions (project_id, start_time, end_time, duration, is_manual, note)
      VALUES (${projectId}, ${startTimeDate}, ${endTimeDate}, ${duration}, ${isManual}, ${note || null})
      RETURNING *
    `

    // Update project's total_tracked_time
    await sql`
      UPDATE projects 
      SET total_tracked_time = total_tracked_time + ${duration}
      WHERE id = ${projectId}
    `

    return NextResponse.json(timeSessionRowToTimeSession(session))
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
