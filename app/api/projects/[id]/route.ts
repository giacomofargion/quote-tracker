import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { ensureSchema } from '@/lib/db/ensure-schema'
import { computeTargetHours, parseBillingType } from '@/lib/billing'
import { projectRowToProject, timeSessionRowToTimeSession } from '@/lib/db/utils'
import type { BillingType, ProjectRow, TimeSessionRow } from '@/lib/types'

// GET /api/projects/[id] - Get a single project with its sessions
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

    await ensureSchema()

    const [project] = await sql`
      SELECT * FROM projects
      WHERE id = ${id} AND user_id = ${userId}
    `

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const sessions = await sql`
      SELECT * FROM time_sessions
      WHERE project_id = ${id}
      ORDER BY start_time DESC
    `

    return NextResponse.json(
      projectRowToProject(
        project as ProjectRow,
        sessions.map((row) => timeSessionRowToTimeSession(row as TimeSessionRow))
      )
    )
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

    await ensureSchema()

    const body = await request.json()
    const updates: Partial<{
      name: string
      client: string
      description: string
      billing_type: BillingType
      quote_amount: number | null
      desired_hourly_rate: number
      desired_day_rate: number | null
      hours_per_day: number | null
      target_hours: number | null
      status: 'active' | 'completed'
    }> = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.client !== undefined) updates.client = body.client
    if (body.description !== undefined) updates.description = body.description
    if (body.billingType !== undefined) updates.billing_type = parseBillingType(body.billingType)
    if (body.quoteAmount !== undefined) {
      updates.quote_amount = body.quoteAmount === null || Number(body.quoteAmount) <= 0 ? null : Number(body.quoteAmount)
    }
    if (body.desiredHourlyRate !== undefined) updates.desired_hourly_rate = body.desiredHourlyRate
    if (body.desiredDayRate !== undefined) {
      // Convention: the client can send `0` to explicitly clear the day rate.
      updates.desired_day_rate = Number(body.desiredDayRate) <= 0 ? null : body.desiredDayRate
    }
    if (body.hoursPerDay !== undefined) {
      updates.hours_per_day = body.hoursPerDay === null || Number(body.hoursPerDay) <= 0 ? null : Number(body.hoursPerDay)
    }
    if (body.status !== undefined) updates.status = body.status

    if (
      body.billingType !== undefined ||
      body.quoteAmount !== undefined ||
      body.desiredHourlyRate !== undefined ||
      body.desiredDayRate !== undefined ||
      body.hoursPerDay !== undefined
    ) {
      const currentProject = await sql`
        SELECT * FROM projects WHERE id = ${id} AND user_id = ${userId}
      `
      if (currentProject.length > 0) {
        const current = currentProject[0] as ProjectRow
        const nextBillingType = parseBillingType(body.billingType ?? current.billing_type)
        updates.billing_type = nextBillingType

        const hasDesiredDayRateUpdate = Object.prototype.hasOwnProperty.call(body, 'desiredDayRate')
        const rawNextDesiredDayRate = hasDesiredDayRateUpdate ? body.desiredDayRate : current.desired_day_rate
        const requestedDayRate = rawNextDesiredDayRate != null && Number(rawNextDesiredDayRate) <= 0 ? null : rawNextDesiredDayRate
        const nextDesiredHourlyRate = body.desiredHourlyRate ?? current.desired_hourly_rate

        const [settings] = await sql`
          SELECT hours_per_day FROM user_settings WHERE user_id = ${userId}
        `
        const globalHoursPerDay = Number(settings?.hours_per_day ?? 8)
        const hasHoursPerDayUpdate = Object.prototype.hasOwnProperty.call(body, 'hoursPerDay')
        const nextHoursPerDay = hasHoursPerDayUpdate
          ? (body.hoursPerDay === null || Number(body.hoursPerDay) <= 0 ? null : Number(body.hoursPerDay))
          : current.hours_per_day
        const effectiveHoursPerDay = nextHoursPerDay != null ? Number(nextHoursPerDay) : globalHoursPerDay

        switch (nextBillingType) {
          case 'hourly':
            updates.desired_day_rate = null
            updates.quote_amount = null
            updates.target_hours = null
            updates.desired_hourly_rate = Number(nextDesiredHourlyRate)
            break
          case 'daily': {
            const nextDesiredDayRate = requestedDayRate != null ? Number(requestedDayRate) : Number(current.desired_day_rate)
            updates.desired_day_rate = nextDesiredDayRate
            updates.desired_hourly_rate = nextDesiredDayRate / effectiveHoursPerDay
            updates.quote_amount = null
            updates.target_hours = null
            break
          }
          case 'fixed_quote': {
            const quote = updates.quote_amount !== undefined ? updates.quote_amount : (body.quoteAmount ?? current.quote_amount)
            const nextQuote = quote == null || Number(quote) <= 0 ? null : Number(quote)
            const nextDesiredDayRate = requestedDayRate != null ? Number(requestedDayRate) : null
            if (nextDesiredDayRate != null) {
              updates.desired_day_rate = nextDesiredDayRate
              updates.desired_hourly_rate = nextDesiredDayRate / effectiveHoursPerDay
            } else {
              updates.desired_day_rate = null
              updates.desired_hourly_rate = Number(nextDesiredHourlyRate)
            }
            updates.quote_amount = nextQuote
            updates.target_hours = computeTargetHours({
              billingType: nextBillingType,
              quoteAmount: nextQuote,
              desiredHourlyRate: updates.desired_hourly_rate,
              desiredDayRate: updates.desired_day_rate ?? null,
              hoursPerDay: effectiveHoursPerDay,
            })
            break
          }
          default: {
            const exhaustiveCheck: never = nextBillingType
            return exhaustiveCheck
          }
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
    if (updates.billing_type !== undefined) {
      setClauses.push(`billing_type = $${paramIndex++}`)
      queryParams.push(updates.billing_type)
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

    const sessions = await sql`
      SELECT * FROM time_sessions
      WHERE project_id = ${id}
      ORDER BY start_time DESC
    `
    return NextResponse.json(
      projectRowToProject(
        project,
        sessions.map((row) => timeSessionRowToTimeSession(row as TimeSessionRow))
      )
    )
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
