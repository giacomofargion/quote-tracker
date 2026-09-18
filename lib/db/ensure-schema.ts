import { sql } from '@/lib/db'

let ensurePromise: Promise<void> | null = null

/**
 * Idempotent column backfills for older databases.
 * Cached per server instance so dashboard GETs are not paying ALTER round-trips every time.
 */
export function ensureSchema(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = applySchemaPatches().catch((error) => {
      ensurePromise = null
      throw error
    })
  }
  return ensurePromise
}

async function applySchemaPatches() {
  await Promise.all([
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS desired_day_rate DECIMAL(10, 2)`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS hours_per_day DECIMAL(4, 1)`,
    sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_type TEXT NOT NULL DEFAULT 'fixed_quote'`,
    sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'gbp'`,
    sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS hours_per_day DECIMAL(4, 1) NOT NULL DEFAULT 8.0`,
  ])
  // T&M projects have a rate but no sold price, so quote/target hours must be optional.
  await sql`ALTER TABLE projects ALTER COLUMN quote_amount DROP NOT NULL`
  await sql`ALTER TABLE projects ALTER COLUMN target_hours DROP NOT NULL`
}
