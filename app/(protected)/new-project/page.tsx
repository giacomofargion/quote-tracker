'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { cn, currencyOptions } from '@/lib/utils'
import type { BillingType } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatefulButton } from '@/components/aceternity/stateful-button'
import { PageTransition } from '@/components/page-transition'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FieldError } from '@/components/ui/field'
import { PageHeader } from '@/components/page-header'
import { SegmentedControl } from '@/components/segmented-control'

const BILLING_OPTIONS: { value: BillingType; label: string; hint: string }[] = [
  { value: 'fixed_quote', label: 'Fixed quote', hint: 'You already sold a price' },
  { value: 'hourly', label: 'Hourly', hint: 'Track time at your rate' },
  { value: 'daily', label: 'Day rate', hint: 'Track time at a day rate' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const { settings, fetchSettings, addProject, isLoading, error, clearError } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    clearError()
  }, [clearError])

  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [billingType, setBillingType] = useState<BillingType>('fixed_quote')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [fixedRateType, setFixedRateType] = useState<'hourly' | 'daily'>('hourly')
  const [desiredHourlyRate, setDesiredHourlyRate] = useState('')
  const [desiredDayRate, setDesiredDayRate] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState('')
  const [description, setDescription] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string
    quoteAmount?: string
    rate?: string
  }>({})

  useEffect(() => {
    if (!settings) {
      fetchSettings()
    } else {
      const hourlyRate = Number(settings.desiredHourlyRate) || 0
      const globalHoursPerDayForRate = settings.hoursPerDay ?? 8
      const dayRate = hourlyRate * globalHoursPerDayForRate
      setDesiredHourlyRate(hourlyRate.toString())
      setDesiredDayRate(dayRate.toString())
    }
  }, [settings, fetchSettings])

  const currencyCode = settings?.currencyCode ?? 'gbp'
  const currencyLabel = currencyOptions.find((option) => option.value === currencyCode)?.label ?? 'GBP (£)'
  const globalHoursPerDay = settings?.hoursPerDay ?? 8
  const effectiveHoursPerDay = hoursPerDay ? parseFloat(hoursPerDay) : globalHoursPerDay

  const usesDayRate = billingType === 'daily' || (billingType === 'fixed_quote' && fixedRateType === 'daily')
  const qa = parseFloat(quoteAmount)
  const hourly = parseFloat(desiredHourlyRate)
  const daily = parseFloat(desiredDayRate)

  const budgetedTimeHours = (() => {
    if (billingType !== 'fixed_quote') return 0
    if (!Number.isFinite(qa) || qa <= 0) return 0
    if (usesDayRate) {
      if (!Number.isFinite(daily) || daily <= 0) return 0
      return (qa / daily) * effectiveHoursPerDay
    }
    if (!Number.isFinite(hourly) || hourly <= 0) return 0
    return qa / hourly
  })()

  const handleSubmit = async (e?: FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    const rateValue = usesDayRate ? parseFloat(desiredDayRate) : parseFloat(desiredHourlyRate)
    const parsedQuote = parseFloat(quoteAmount)
    const nextErrors: { name?: string; quoteAmount?: string; rate?: string } = {}

    if (!name.trim()) {
      nextErrors.name = 'Enter a project name.'
    }
    if (billingType === 'fixed_quote' && (!quoteAmount.trim() || !Number.isFinite(parsedQuote) || parsedQuote <= 0)) {
      nextErrors.quoteAmount = 'Enter a quote amount so we can calculate your budgeted time.'
    }
    if (!Number.isFinite(rateValue) || rateValue <= 0) {
      nextErrors.rate = usesDayRate
        ? 'Enter a day rate.'
        : 'Enter an hourly rate.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return false
    }

    setIsSubmitting(true)
    try {
      await addProject({
        name,
        client: client || 'No Client',
        description: description || '',
        billingType,
        quoteAmount: billingType === 'fixed_quote' ? parseFloat(quoteAmount) : null,
        ...(usesDayRate
          ? { desiredDayRate: parseFloat(desiredDayRate) }
          : { desiredHourlyRate: parseFloat(desiredHourlyRate) }),
        ...(hoursPerDay ? { hoursPerDay: parseFloat(hoursPerDay) } : {}),
        status: 'active',
      })
      router.push('/dashboard')
      return true
    } catch (error) {
      console.error('Failed to create project:', error)
      setIsSubmitting(false)
      throw error
    }
  }

  const title = (() => {
    switch (billingType) {
      case 'fixed_quote':
        return 'New Fixed-Quote Project'
      case 'hourly':
        return 'New Hourly Project'
      case 'daily':
        return 'New Day-Rate Project'
      default: {
        const exhaustiveCheck: never = billingType
        return exhaustiveCheck
      }
    }
  })()

  const descriptionText = (() => {
    switch (billingType) {
      case 'fixed_quote':
        return 'Set the quote and we’ll calculate how many hours you can spend.'
      case 'hourly':
        return 'Track time against your hourly rate.'
      case 'daily':
        return 'Track time against your day rate.'
      default: {
        const exhaustiveCheck: never = billingType
        return exhaustiveCheck
      }
    }
  })()

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader title={title} description={descriptionText} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="gap-0 py-0">
            <CardContent className="p-4 sm:p-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {(fieldErrors.quoteAmount || fieldErrors.name || fieldErrors.rate) && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>
                    Fill in the highlighted fields before creating the project.
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }))
                }}
                placeholder="e.g. Website Redesign"
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                required
              />
              {fieldErrors.name && (
                <FieldError id="name-error">{fieldErrors.name}</FieldError>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>

            <div className="space-y-2">
              <Label>How are you billing?</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {BILLING_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      'rounded-2xl border px-3 py-3 text-left transition-colors',
                      billingType === option.value
                        ? 'border-primary/40 bg-primary/12'
                        : 'border-border/80 bg-background/40 hover:bg-accent/60',
                    )}
                    onClick={() => {
                      setBillingType(option.value)
                      if (option.value !== 'fixed_quote') {
                        setFieldErrors((prev) => ({ ...prev, quoteAmount: undefined }))
                      }
                    }}
                  >
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="text-muted-foreground mt-0.5 block text-xs">{option.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {billingType === 'fixed_quote' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quote">Quote Amount ({currencyLabel})</Label>
                  <Input
                    id="quote"
                    type="number"
                    min="0"
                    step="0.01"
                    value={quoteAmount}
                    onChange={(e) => {
                      setQuoteAmount(e.target.value)
                      if (fieldErrors.quoteAmount) setFieldErrors((prev) => ({ ...prev, quoteAmount: undefined }))
                    }}
                    placeholder="0"
                    aria-invalid={Boolean(fieldErrors.quoteAmount)}
                    aria-describedby={fieldErrors.quoteAmount ? 'quote-error' : undefined}
                    required
                  />
                  {fieldErrors.quoteAmount && (
                    <FieldError id="quote-error">{fieldErrors.quoteAmount}</FieldError>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Baseline as</Label>
                  <SegmentedControl
                    value={fixedRateType}
                    onChange={setFixedRateType}
                    options={[
                      { value: 'hourly', label: 'Hourly' },
                      { value: 'daily', label: 'Day' },
                    ]}
                  />
                </div>
              </div>
            )}

            {usesDayRate ? (
              <div className="space-y-2">
                <Label htmlFor="dayRate">
                  {billingType === 'fixed_quote' ? 'Baseline Day Rate' : 'Day Rate'} ({currencyLabel}/day)
                </Label>
                <Input
                  id="dayRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={desiredDayRate}
                  onChange={(e) => {
                    setDesiredDayRate(e.target.value)
                    if (fieldErrors.rate) setFieldErrors((prev) => ({ ...prev, rate: undefined }))
                  }}
                  placeholder="800"
                  aria-invalid={Boolean(fieldErrors.rate)}
                  required
                />
                {fieldErrors.rate && (
                  <FieldError>{fieldErrors.rate}</FieldError>
                )}
                <p className="text-xs text-muted-foreground">
                  We’ll convert day rate using {effectiveHoursPerDay} hours/day.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="rate">
                  {billingType === 'fixed_quote' ? 'Baseline Rate' : 'Hourly Rate'} ({currencyLabel}/hr)
                </Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={desiredHourlyRate}
                  onChange={(e) => {
                    setDesiredHourlyRate(e.target.value)
                    if (fieldErrors.rate) setFieldErrors((prev) => ({ ...prev, rate: undefined }))
                  }}
                  placeholder="100"
                  aria-invalid={Boolean(fieldErrors.rate)}
                  required
                />
                {fieldErrors.rate && (
                  <FieldError>{fieldErrors.rate}</FieldError>
                )}
              </div>
            )}

            {usesDayRate && (
              <div className="space-y-2">
                <Label htmlFor="hoursPerDay">Hours Per Day (Optional)</Label>
                <Input
                  id="hoursPerDay"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                  placeholder={globalHoursPerDay.toString()}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use global setting ({globalHoursPerDay}h/day).
                </p>
              </div>
            )}

            {billingType === 'fixed_quote' && (
              <div className="flex items-center justify-between rounded-2xl bg-primary/8 px-4 py-3">
                <span className="text-muted-foreground text-sm">Budgeted time</span>
                <span className="font-mono font-semibold">{budgetedTimeHours.toFixed(1)} hours</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope details..."
                rows={3}
              />
            </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push('/dashboard')}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <StatefulButton
                    type="button"
                    className="flex-1"
                    disabled={isLoading || isSubmitting}
                    onClick={async (e) => {
                      const created = await handleSubmit(e)
                      if (!created) {
                        throw new Error('Please fill in the required fields')
                      }
                    }}
                    onError={(error) => {
                      if (error instanceof Error && error.message === 'Please fill in the required fields') {
                        return
                      }
                      console.error('Create project error:', error)
                    }}
                  >
                    Create Project
                  </StatefulButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  )
}
