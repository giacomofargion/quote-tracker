import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { CurrencyCode } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyMap: Record<CurrencyCode, { currency: string; locale: string; label: string }> = {
  gbp: { currency: 'GBP', locale: 'en-GB', label: 'GBP (£)' },
  usd: { currency: 'USD', locale: 'en-US', label: 'USD ($)' },
  eur: { currency: 'EUR', locale: 'de-DE', label: 'EUR (€)' },
}

export const currencyOptions = (Object.keys(currencyMap) as CurrencyCode[]).map((code) => ({
  value: code,
  label: currencyMap[code].label,
}))

export function formatCurrency(value: number, currencyCode: CurrencyCode = 'gbp') {
  const { currency, locale } = currencyMap[currencyCode]
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
