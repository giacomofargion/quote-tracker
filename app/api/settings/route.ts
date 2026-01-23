import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@/lib/db'
import { userSettingsRowToUserSettings } from '@/lib/db/utils'
import type { UserSettingsRow } from '@/lib/types'

// GET /api/settings - Get user settings
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let [settings] = await sql<UserSettingsRow[]>`
      SELECT * FROM user_settings WHERE user_id = ${userId}
    `

    // Create default settings if they don't exist
    if (!settings) {
      [settings] = await sql<UserSettingsRow[]>`
        INSERT INTO user_settings (user_id, desired_hourly_rate)
        VALUES (${userId}, 100.00)
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

    const body = await request.json()
    const { desiredHourlyRate } = body

    if (desiredHourlyRate === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Upsert settings
    const [settings] = await sql<UserSettingsRow[]>`
      INSERT INTO user_settings (user_id, desired_hourly_rate)
      VALUES (${userId}, ${desiredHourlyRate})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        desired_hourly_rate = ${desiredHourlyRate},
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
