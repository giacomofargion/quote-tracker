import type { BillingType, Project } from '@/lib/types'

export function parseBillingType(value: unknown): BillingType {
  if (value === 'hourly' || value === 'daily' || value === 'fixed_quote') {
    return value
  }
  return 'fixed_quote'
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`)
}

export function billingTypeLabel(billingType: BillingType): string {
  switch (billingType) {
    case 'fixed_quote':
      return 'Fixed quote'
    case 'hourly':
      return 'Hourly'
    case 'daily':
      return 'Day rate'
    default:
      return assertNever(billingType)
  }
}

export function computeTargetHours(args: {
  billingType: BillingType
  quoteAmount: number | null
  desiredHourlyRate: number
  desiredDayRate: number | null
  hoursPerDay: number
}): number | null {
  if (args.billingType !== 'fixed_quote') return null
  if (args.quoteAmount == null || args.quoteAmount <= 0) return null

  if (args.desiredDayRate != null && args.desiredDayRate > 0) {
    return (args.quoteAmount / args.desiredDayRate) * args.hoursPerDay
  }
  if (args.desiredHourlyRate <= 0) return null
  return args.quoteAmount / args.desiredHourlyRate
}

export function calculateEffectiveRate(project: Project): number {
  if (project.billingType !== 'fixed_quote' || project.quoteAmount == null || project.totalTrackedTime === 0) {
    return project.desiredHourlyRate
  }
  const hoursWorked = project.totalTrackedTime / 3600
  return project.quoteAmount / hoursWorked
}

export type ProjectAnalytics =
  | {
      billingType: 'fixed_quote'
      hoursWorked: number
      effectiveRate: number
      targetHours: number
      hoursRemaining: number
      isOverBudget: boolean
      earningsPerMinute: number
      isAboveTarget: boolean
    }
  | {
      billingType: 'hourly'
      hoursWorked: number
      billedRate: number
      accruedEarnings: number
    }
  | {
      billingType: 'daily'
      hoursWorked: number
      billedDayRate: number
      billedHourlyRate: number
      accruedEarnings: number
    }

export function getProjectAnalytics(project: Project, hoursPerDay: number): ProjectAnalytics {
  const hoursWorked = project.totalTrackedTime / 3600

  switch (project.billingType) {
    case 'fixed_quote': {
      const quote = project.quoteAmount ?? 0
      const effectiveRate = calculateEffectiveRate(project)
      const targetHours = project.targetHours ?? 0
      return {
        billingType: 'fixed_quote',
        hoursWorked,
        effectiveRate,
        targetHours,
        hoursRemaining: Math.max(targetHours - hoursWorked, 0),
        isOverBudget: targetHours > 0 && hoursWorked > targetHours,
        earningsPerMinute: project.totalTrackedTime > 0 ? quote / (project.totalTrackedTime / 60) : 0,
        isAboveTarget: effectiveRate >= project.desiredHourlyRate,
      }
    }
    case 'hourly':
      return {
        billingType: 'hourly',
        hoursWorked,
        billedRate: project.desiredHourlyRate,
        accruedEarnings: hoursWorked * project.desiredHourlyRate,
      }
    case 'daily': {
      const dayRate = project.desiredDayRate ?? project.desiredHourlyRate * hoursPerDay
      const daysWorked = hoursPerDay > 0 ? hoursWorked / hoursPerDay : 0
      return {
        billingType: 'daily',
        hoursWorked,
        billedDayRate: dayRate,
        billedHourlyRate: project.desiredHourlyRate,
        accruedEarnings: daysWorked * dayRate,
      }
    }
    default:
      return assertNever(project.billingType)
  }
}
