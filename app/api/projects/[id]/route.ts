import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { projectRowToProject } from '@/lib/db/utils'
import type { ProjectRow, TimeSessionRow } from '@/lib/types'

async function ensureProjectColumns() {
  // Keep project writes resilient if the database hasn't been migrated yet.
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT`
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS desired_day_rate DECIMAL(10, 2)`
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS hours_per_day DECIMAL(4, 1)`
}

async function ensureSettingsColumns() {
  await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'gbp'`
  await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hours_per_day DECIMAL(4, 1) NOT NULL DEFAULT 8.0`
}

// GET /api/projects/[id] - Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureProjectColumns()
    await ensureSettingsColumns()

    const [project] = await sql<ProjectRow[]>`
      SELECT * FROM projects
      WHERE id = ${id} AND user_id = ${userId}
    `

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch sessions
    const sessions = await sql`
      SELECT * FROM time_sessions
      WHERE project_id = ${id}
      ORDER BY start_time DESC
    `

    return NextResponse.json(projectRowToProject(project, sessions.map(s => ({
      id: s.id,
      projectId: s.project_id,
      startTime: s.start_time,
      endTime: s.end_time,
      duration: s.duration,
      isManual: s.is_manual,
      note: s.note || undefined,
    }))))
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureProjectColumns()
    await ensureSettingsColumns()

    const body = await request.json()
    const updates: Partial<{
      name: string
      client: string
      description: string
      quote_amount: number
      desired_hourly_rate: number
      desired_day_rate: number | null
      hours_per_day: number | null
      target_hours: number
      status: 'active' | 'completed'
    }> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.client !== undefined) updates.client = body.client
    if (body.description !== undefined) updates.description = body.description
    if (body.quoteAmount !== undefined) updates.quote_amount = body.quoteAmount
    if (body.desiredHourlyRate !== undefined) updates.desired_hourly_rate = body.desiredHourlyRate
    if (body.desiredDayRate !== undefined) {
      // Convention: the client can send `0` to explicitly clear the day rate.
      // We avoid sending `null` from the UI to keep types/simple JSON payloads consistent.
      updates.desired_day_rate = Number(body.desiredDayRate) <= 0 ? null : body.desiredDayRate
    }
    if (body.hoursPerDay !== undefined) {
      // Convention: the client can send `0` or `null` to use global setting.
      updates.hours_per_day = body.hoursPerDay === null || Number(body.hoursPerDay) <= 0 ? null : Number(body.hoursPerDay)
    }
    if (body.status !== undefined) updates.status = body.status

    // Recalculate target_hours if quote, rates, or hoursPerDay changed.
    // Supports both hourly- and day-rate workflows:
    // - If desiredDayRate is present, targetHours is computed from days × hoursPerDay.
    // - Otherwise we keep the classic quote / hourly formula.
    if (body.quoteAmount !== undefined || body.desiredHourlyRate !== undefined || body.desiredDayRate !== undefined || body.hoursPerDay !== undefined) {
      const currentProject = await sql<ProjectRow[]>`
        SELECT * FROM projects WHERE id = ${id} AND user_id = ${userId}
      `
      if (currentProject.length > 0) {
        const quote = body.quoteAmount ?? currentProject[0].quote_amount
        const hasDesiredDayRateUpdate = Object.prototype.hasOwnProperty.call(body, 'desiredDayRate')
        const rawNextDesiredDayRate = hasDesiredDayRateUpdate ? body.desiredDayRate : currentProject[0].desired_day_rate
        const nextDesiredDayRate = rawNextDesiredDayRate != null && Number(rawNextDesiredDayRate) <= 0 ? null : rawNextDesiredDayRate
        const nextDesiredHourlyRate = body.desiredHourlyRate ?? currentProject[0].desired_hourly_rate

        const [settings] = await sql<{ hours_per_day: number }[]>`
          SELECT hours_per_day FROM user_settings WHERE user_id = ${userId}
        `
        const globalHoursPerDay = Number(settings?.hours_per_day ?? 8)

        // Determine which hoursPerDay to use: project-specific if set, otherwise global
        const hasHoursPerDayUpdate = Object.prototype.hasOwnProperty.call(body, 'hoursPerDay')
        const nextHoursPerDay = hasHoursPerDayUpdate
          ? (body.hoursPerDay === null || Number(body.hoursPerDay) <= 0 ? null : Number(body.hoursPerDay))
          : currentProject[0].hours_per_day
        const effectiveHoursPerDay = nextHoursPerDay != null ? Number(nextHoursPerDay) : globalHoursPerDay

        if (nextDesiredDayRate != null) {
          const derivedHourlyRate = Number(nextDesiredDayRate) / effectiveHoursPerDay
          // Keep desired_hourly_rate in sync so the rest of the app can keep using it.
          updates.desired_hourly_rate = derivedHourlyRate
          updates.target_hours = (Number(quote) / Number(nextDesiredDayRate)) * effectiveHoursPerDay
        } else {
          updates.target_hours = Number(quote) / Number(nextDesiredHourlyRate)
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    // Neon `sql` is a query function, not a query-builder (no `sql.join`).
    // For dynamic UPDATEs we use `sql.query()` with `$1`, `$2`, ... placeholders.
    const setClauses: string[] = []
    const queryParams: unknown[] = []
    let paramIndex = 1

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`)
      queryParams.push(updates.name)
    }
    if (updates.client !== undefined) {
      setClauses.push(`client = $${paramIndex++}`)
      queryParams.push(updates.client)
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`)
      queryParams.push(updates.description)
    }
    if (updates.quote_amount !== undefined) {
      setClauses.push(`quote_amount = $${paramIndex++}`)
      queryParams.push(updates.quote_amount)
    }
    if (updates.desired_hourly_rate !== undefined) {
      setClauses.push(`desired_hourly_rate = $${paramIndex++}`)
      queryParams.push(updates.desired_hourly_rate)
    }
    if (updates.desired_day_rate !== undefined) {
      setClauses.push(`desired_day_rate = $${paramIndex++}`)
      queryParams.push(updates.desired_day_rate)
    }
    if (updates.hours_per_day !== undefined) {
      setClauses.push(`hours_per_day = $${paramIndex++}`)
      queryParams.push(updates.hours_per_day)
    }
    if (updates.target_hours !== undefined) {
      setClauses.push(`target_hours = $${paramIndex++}`)
      queryParams.push(updates.target_hours)
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`)
      queryParams.push(updates.status)
    }

    // WHERE params
    const idParam = paramIndex++
    const userIdParam = paramIndex++
    queryParams.push(id, userId)

    const query = `
      UPDATE projects
      SET ${setClauses.join(', ')}
      WHERE id = $${idParam} AND user_id = $${userIdParam}
      RETURNING *
    `

    const rows = await sql.query(query, queryParams)
    const project = (rows as ProjectRow[])[0]

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const sessions = await sql<TimeSessionRow[]>`
      SELECT * FROM time_sessions
      WHERE project_id = ${id}
      ORDER BY start_time DESC
    `
    const sessionsMapped = sessions.map((s) => ({
      id: s.id,
      projectId: s.project_id,
      startTime: s.start_time,
      endTime: s.end_time,
      duration: s.duration,
      isManual: s.is_manual,
      note: s.note || undefined,
    }))
    return NextResponse.json(projectRowToProject(project, sessionsMapped))
  } catch (error) {
    console.error('Error updating project:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update project'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete a project
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

    const result = await sql`
      DELETE FROM projects
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
