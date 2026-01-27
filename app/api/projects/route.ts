import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { projectRowToProject, timeSessionRowToTimeSession } from '@/lib/db/utils'
import type { ProjectRow, TimeSessionRow } from '@/lib/types'

// GET /api/projects - Get all projects for the authenticated user
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch projects
    const projects = await sql<ProjectRow[]>`
      SELECT * FROM projects 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    // Fetch sessions for all projects
    const projectIds = projects.map(p => p.id)
    let sessions: TimeSessionRow[] = []
    
    if (projectIds.length > 0) {
      sessions = await sql<TimeSessionRow[]>`
        SELECT * FROM time_sessions 
        WHERE project_id = ANY(${projectIds})
        ORDER BY start_time DESC
      `
    }

    // Group sessions by project
    const sessionsByProject = new Map<string, typeof sessions>()
    sessions.forEach(session => {
      if (!sessionsByProject.has(session.project_id)) {
        sessionsByProject.set(session.project_id, [])
      }
      sessionsByProject.get(session.project_id)!.push(session)
    })

    // Convert to application types
    const projectsWithSessions = projects.map(project => {
      const projectSessions = sessionsByProject.get(project.id) || []
      return projectRowToProject(
        project,
        projectSessions.map(timeSessionRowToTimeSession)
      )
    })

    return NextResponse.json(projectsWithSessions)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, client, quoteAmount, desiredHourlyRate, status = 'active' } = body

    if (!name || quoteAmount === undefined || desiredHourlyRate === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const targetHours = quoteAmount / desiredHourlyRate

    const [project] = await sql<ProjectRow[]>`
      INSERT INTO projects (user_id, name, client, quote_amount, desired_hourly_rate, target_hours, status)
      VALUES (${userId}, ${name}, ${client || 'No Client'}, ${quoteAmount}, ${desiredHourlyRate}, ${targetHours}, ${status})
      RETURNING *
    `

    return NextResponse.json(projectRowToProject(project))
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
