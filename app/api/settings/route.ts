import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { userSettingsRowToUserSettings } from '@/lib/db/utils'
import type { CurrencyCode, UserSettingsRow } from '@/lib/types'

async function ensureCurrencyColumn() {
  // Keep settings updates resilient if the database hasn't been migrated yet.
  await sql`
    ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'gbp'
  `
}

// GET /api/settings - Get user settings
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureCurrencyColumn()

    let [settings] = await sql<UserSettingsRow[]>`
      SELECT * FROM user_settings WHERE user_id = ${userId}
    `

    // Create default settings if they don't exist
    if (!settings) {
      [settings] = await sql<UserSettingsRow[]>`
        INSERT INTO user_settings (user_id, desired_hourly_rate, currency_code)
        VALUES (${userId}, 100.00, 'gbp')
        RETURNING *
      `
    }

    return NextResponse.json(userSettingsRowToUserSettings(settings))
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureCurrencyColumn()

    const body = await request.json()
    const { desiredHourlyRate, currencyCode } = body as {
      desiredHourlyRate?: number
      currencyCode?: CurrencyCode
    }

    if (desiredHourlyRate === undefined && currencyCode === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supportedCurrencies: CurrencyCode[] = ['gbp', 'usd', 'eur']
    if (currencyCode && !supportedCurrencies.includes(currencyCode)) {
      return NextResponse.json(
        { error: 'Unsupported currency' },
        { status: 400 }
      )
    }

    const [existingSettings] = await sql<UserSettingsRow[]>`
      SELECT * FROM user_settings WHERE user_id = ${userId}
    `

    const nextDesiredHourlyRate = desiredHourlyRate ?? existingSettings?.desired_hourly_rate ?? 100.00
    const nextCurrencyCode = currencyCode ?? existingSettings?.currency_code ?? 'gbp'

    // Upsert settings
    const [settings] = await sql<UserSettingsRow[]>`
      INSERT INTO user_settings (user_id, desired_hourly_rate, currency_code)
      VALUES (${userId}, ${nextDesiredHourlyRate}, ${nextCurrencyCode})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        desired_hourly_rate = ${nextDesiredHourlyRate},
        currency_code = ${nextCurrencyCode},
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json(userSettingsRowToUserSettings(settings))
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
