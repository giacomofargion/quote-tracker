import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { projectRowToProject, timeSessionRowToTimeSession } from '@/lib/db/utils'
import type { ProjectRow, TimeSessionRow } from '@/lib/types'

async function ensureProjectColumns() {
  // Keep project writes resilient if the database hasn't been migrated yet.
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT`
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS desired_day_rate DECIMAL(10, 2)`
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS hours_per_day DECIMAL(4, 1)`
}

async function ensureSettingsColumns() {
  // Used to correctly derive hourly rate from day rate.
  await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'gbp'`
  await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hours_per_day DECIMAL(4, 1) NOT NULL DEFAULT 8.0`
}

// GET /api/projects - Get all projects for the authenticated user
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureProjectColumns()

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

    await ensureSettingsColumns()
    await ensureProjectColumns()

    // Projects FK references user_settings; ensure the user has a row so INSERT doesn't fail
    await sql`
      INSERT INTO user_settings (user_id, desired_hourly_rate, currency_code, hours_per_day)
      VALUES (${userId}, 100.00, 'gbp', 8.0)
      ON CONFLICT (user_id) DO NOTHING
    `

    const body = await request.json()
    const {
      name,
      client,
      description,
      quoteAmount,
      desiredHourlyRate,
      desiredDayRate,
      hoursPerDay,
      status = 'active',
    } = body as {
      name?: string
      client?: string
      description?: string
      quoteAmount?: number
      desiredHourlyRate?: number
      desiredDayRate?: number
      hoursPerDay?: number | null
      status?: 'active' | 'completed'
    }

    if (!name || quoteAmount === undefined || (desiredHourlyRate === undefined && desiredDayRate === undefined)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const [settings] = await sql<{ hours_per_day: number }[]>`
      SELECT hours_per_day FROM user_settings WHERE user_id = ${userId}
    `
    const globalHoursPerDay = Number(settings?.hours_per_day ?? 8)
    // Use project-specific hoursPerDay if provided, otherwise use global setting
    const projectHoursPerDay = hoursPerDay !== undefined && hoursPerDay !== null ? Number(hoursPerDay) : globalHoursPerDay

    const effectiveHourlyRate =
      desiredDayRate !== undefined
        ? Number(desiredDayRate) / projectHoursPerDay
        : Number(desiredHourlyRate)

    const targetHours =
      desiredDayRate !== undefined
        ? (Number(quoteAmount) / Number(desiredDayRate)) * projectHoursPerDay
        : Number(quoteAmount) / Number(desiredHourlyRate)

    const [project] = await sql<ProjectRow[]>`
      INSERT INTO projects (user_id, name, client, description, quote_amount, desired_hourly_rate, desired_day_rate, hours_per_day, target_hours, status)
      VALUES (
        ${userId},
        ${name},
        ${client || 'No Client'},
        ${description ?? ''},
        ${quoteAmount},
        ${effectiveHourlyRate},
        ${desiredDayRate ?? null},
        ${hoursPerDay !== undefined && hoursPerDay !== null ? hoursPerDay : null},
        ${targetHours},
        ${status}
      )
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
