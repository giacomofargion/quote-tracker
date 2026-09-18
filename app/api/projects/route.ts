import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { ensureSchema } from '@/lib/db/ensure-schema'
import { projectRowToProject } from '@/lib/db/utils'
import { computeTargetHours, parseBillingType } from '@/lib/billing'
import type { BillingType, ProjectRow } from '@/lib/types'

// GET /api/projects - List projects for the authenticated user.
// Sessions are loaded per-project on the detail page so the dashboard stays fast.
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureSchema()

    const projects = await sql`
      SELECT * FROM projects
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(projects.map((project) => projectRowToProject(project as ProjectRow)))
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

    await ensureSchema()

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
      billingType: rawBillingType,
      quoteAmount,
      desiredHourlyRate,
      desiredDayRate,
      hoursPerDay,
      status = 'active',
    } = body as {
      name?: string
      client?: string
      description?: string
      billingType?: BillingType
      quoteAmount?: number | null
      desiredHourlyRate?: number
      desiredDayRate?: number
      hoursPerDay?: number | null
      status?: 'active' | 'completed'
    }

    const billingType = parseBillingType(rawBillingType)

    if (!name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (billingType === 'fixed_quote' && (quoteAmount == null || Number(quoteAmount) <= 0)) {
      return NextResponse.json({ error: 'Quote amount is required for fixed-quote projects' }, { status: 400 })
    }
    if (billingType === 'hourly' && (desiredHourlyRate == null || Number(desiredHourlyRate) <= 0)) {
      return NextResponse.json({ error: 'Hourly rate is required' }, { status: 400 })
    }
    if (billingType === 'daily' && (desiredDayRate == null || Number(desiredDayRate) <= 0)) {
      return NextResponse.json({ error: 'Day rate is required' }, { status: 400 })
    }
    if (billingType === 'fixed_quote' && desiredHourlyRate == null && desiredDayRate == null) {
      return NextResponse.json({ error: 'A baseline rate is required' }, { status: 400 })
    }

    const [settings] = await sql`
      SELECT hours_per_day FROM user_settings WHERE user_id = ${userId}
    `
    const globalHoursPerDay = Number(settings?.hours_per_day ?? 8)
    const projectHoursPerDay = hoursPerDay !== undefined && hoursPerDay !== null ? Number(hoursPerDay) : globalHoursPerDay

    const nextDesiredDayRate = billingType === 'hourly' || (billingType === 'fixed_quote' && desiredDayRate == null)
      ? null
      : (desiredDayRate != null ? Number(desiredDayRate) : null)

    const effectiveHourlyRate =
      nextDesiredDayRate != null
        ? nextDesiredDayRate / projectHoursPerDay
        : Number(desiredHourlyRate)

    const nextQuoteAmount = billingType === 'fixed_quote' ? Number(quoteAmount) : null
    const targetHours = computeTargetHours({
      billingType,
      quoteAmount: nextQuoteAmount,
      desiredHourlyRate: effectiveHourlyRate,
      desiredDayRate: nextDesiredDayRate,
      hoursPerDay: projectHoursPerDay,
    })

    const [project] = await sql`
      INSERT INTO projects (
        user_id, name, client, description, billing_type, quote_amount,
        desired_hourly_rate, desired_day_rate, hours_per_day, target_hours, status
      )
      VALUES (
        ${userId},
        ${name},
        ${client || 'No Client'},
        ${description ?? ''},
        ${billingType},
        ${nextQuoteAmount},
        ${effectiveHourlyRate},
        ${nextDesiredDayRate},
        ${hoursPerDay !== undefined && hoursPerDay !== null ? hoursPerDay : null},
        ${targetHours},
        ${status}
      )
      RETURNING *
    `

    return NextResponse.json(projectRowToProject(project as ProjectRow))
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
