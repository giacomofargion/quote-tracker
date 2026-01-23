export interface TimeSession {
  id: string
  projectId: string
  startTime: Date
  endTime: Date | null
  duration: number // in seconds
  isManual: boolean
  note?: string
}

export interface Project {
  id: string
  userId: string
  name: string
  client: string
  quoteAmount: number
  desiredHourlyRate: number
  targetHours: number // auto-calculated: quoteAmount / desiredHourlyRate
  totalTrackedTime: number // in seconds
  status: 'active' | 'completed'
  createdAt: Date
  updatedAt: Date
  sessions: TimeSession[]
}

export interface UserSettings {
  userId: string
  desiredHourlyRate: number
  createdAt: Date
  updatedAt: Date
}

// Database row types (from Neon)
export interface ProjectRow {
  id: string
  user_id: string
  name: string
  client: string
  quote_amount: number
  desired_hourly_rate: number
  target_hours: number
  total_tracked_time: number
  status: 'active' | 'completed'
  created_at: Date
  updated_at: Date
}

export interface TimeSessionRow {
  id: string
  project_id: string
  start_time: Date
  end_time: Date | null
  duration: number
  is_manual: boolean
  note: string | null
  created_at: Date
}

export interface UserSettingsRow {
  user_id: string
  desired_hourly_rate: number
  created_at: Date
  updated_at: Date
}

export type SortField = 'name' | 'client' | 'createdAt' | 'quoteAmount' | 'effectiveRate'
export type SortDirection = 'asc' | 'desc'
export type StatusFilter = 'all' | 'active' | 'completed'
