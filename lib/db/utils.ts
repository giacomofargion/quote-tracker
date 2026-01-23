import type { ProjectRow, TimeSessionRow, UserSettingsRow, Project, TimeSession, UserSettings } from '@/lib/types'

/**
 * Convert database row to application type
 */
export function projectRowToProject(row: ProjectRow, sessions: TimeSession[] = []): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    client: row.client,
    quoteAmount: Number(row.quote_amount),
    desiredHourlyRate: Number(row.desired_hourly_rate),
    targetHours: Number(row.target_hours),
    totalTrackedTime: row.total_tracked_time,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sessions,
  }
}

/**
 * Convert database row to application type
 */
export function timeSessionRowToTimeSession(row: TimeSessionRow): TimeSession {
  return {
    id: row.id,
    projectId: row.project_id,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    isManual: row.is_manual,
    note: row.note || undefined,
  }
}

/**
 * Convert database row to application type
 */
export function userSettingsRowToUserSettings(row: UserSettingsRow): UserSettings {
  return {
    userId: row.user_id,
    desiredHourlyRate: Number(row.desired_hourly_rate),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
