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
  description?: string
  quoteAmount: number
  desiredHourlyRate: number
  /**
   * Some freelancers quote day rates instead of hourly.
   * When null, the project is using the hourly-rate workflow.
   * When present, we can derive an hourly rate via (desiredDayRate / hoursPerDay).
   */
  desiredDayRate: number | null
  /**
   * Custom hours per day for this project. If null, uses the global setting from user_settings.
   * Used for day-rate conversions and day-rate analytics.
   */
  hoursPerDay: number | null
  targetHours: number // auto-calculated: quoteAmount / desiredHourlyRate
  totalTrackedTime: number // in seconds
  status: 'active' | 'completed'
  createdAt: Date
  updatedAt: Date
  sessions: TimeSession[]
}

export type CurrencyCode = 'gbp' | 'usd' | 'eur'

export interface UserSettings {
  userId: string
  desiredHourlyRate: number
  currencyCode: CurrencyCode
  /**
   * How many hours you consider "a working day".
   * Used to convert hourly <-> daily rates and to compute day-based analytics.
   */
  hoursPerDay: number
  createdAt: Date
  updatedAt: Date
}

// Database row types (from Neon)
export interface ProjectRow {
  id: string
  user_id: string
  name: string
  client: string
  description?: string | null
  quote_amount: number
  desired_hourly_rate: number
  desired_day_rate?: number | null
  hours_per_day?: number | null
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
  currency_code: CurrencyCode
  hours_per_day?: number | null
  created_at: Date
  updated_at: Date
}

export type SortField = 'name' | 'client' | 'createdAt' | 'quoteAmount' | 'effectiveRate'
export type SortDirection = 'asc' | 'desc'
export type StatusFilter = 'all' | 'active' | 'completed'
