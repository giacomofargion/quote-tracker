import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import type { TimeSessionRow, ProjectRow } from '@/lib/types'

// DELETE /api/sessions/[id] - Delete a time session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session to find project and duration
    const [session] = await sql<TimeSessionRow[]>`
      SELECT * FROM time_sessions WHERE id = ${id}
    `

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify project belongs to user
    const [project] = await sql<ProjectRow[]>`
      SELECT id FROM projects 
      WHERE id = ${session.project_id} AND user_id = ${userId}
    `

    if (!project) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete session
    await sql`DELETE FROM time_sessions WHERE id = ${id}`

    // Update project's total_tracked_time
    await sql`
      UPDATE projects 
      SET total_tracked_time = GREATEST(0, total_tracked_time - ${session.duration})
      WHERE id = ${session.project_id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
