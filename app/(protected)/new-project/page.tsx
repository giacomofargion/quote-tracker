'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { currencyOptions } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatefulButton } from '@/components/aceternity/stateful-button'
import { PageTransition } from '@/components/page-transition'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function NewProjectPage() {
  const router = useRouter()
  const { settings, fetchSettings, addProject, isLoading, error, clearError } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    clearError()
  }, [clearError])

  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [rateType, setRateType] = useState<'hourly' | 'daily'>('hourly')
  const [desiredHourlyRate, setDesiredHourlyRate] = useState('')
  const [desiredDayRate, setDesiredDayRate] = useState('')
  const [hoursPerDay, setHoursPerDay] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!settings) {
      fetchSettings()
    } else {
      setDesiredHourlyRate(settings.desiredHourlyRate.toString())
    }
  }, [settings, fetchSettings])

  const currencyCode = settings?.currencyCode ?? 'gbp'
  const currencyLabel = currencyOptions.find((option) => option.value === currencyCode)?.label ?? 'GBP (£)'
  const globalHoursPerDay = settings?.hoursPerDay ?? 8
  // Use custom hoursPerDay if set, otherwise use global setting
  const effectiveHoursPerDay = hoursPerDay ? parseFloat(hoursPerDay) : globalHoursPerDay

  const qa = parseFloat(quoteAmount)
  const hourly = parseFloat(desiredHourlyRate)
  const daily = parseFloat(desiredDayRate)

  const budgetedTimeHours = (() => {
    if (!Number.isFinite(qa) || qa <= 0) return 0
    if (rateType === 'daily') {
      if (!Number.isFinite(daily) || daily <= 0) return 0
      const days = qa / daily
      return days * effectiveHoursPerDay
    }
    if (!Number.isFinite(hourly) || hourly <= 0) return 0
    return qa / hourly
  })()

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    const hasRate = rateType === 'daily' ? !!desiredDayRate : !!desiredHourlyRate
    if (!name || !quoteAmount || !hasRate) return

    setIsSubmitting(true)
    try {
      await addProject({
        name,
        client: client || 'No Client',
        description: description || '',
        quoteAmount: parseFloat(quoteAmount),
        ...(rateType === 'daily'
          ? { desiredDayRate: parseFloat(desiredDayRate) }
          : { desiredHourlyRate: parseFloat(desiredHourlyRate) }),
        // Send null/undefined to use global setting, otherwise send the number
        ...(hoursPerDay ? { hoursPerDay: parseFloat(hoursPerDay) } : {}),
        status: 'active',
      })
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to create project:', error)
      setIsSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-dashed">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">New Fixed-Price Project</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website Redesign"
                required
              />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quote">Quote Amount ({currencyLabel})</Label>
                <Input
                  id="quote"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rate Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={rateType === 'hourly' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setRateType('hourly')}
                  >
                    Hourly
                  </Button>
                  <Button
                    type="button"
                    variant={rateType === 'daily' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setRateType('daily')}
                  >
                    Day
                  </Button>
                </div>
              </div>
            </div>

            {rateType === 'hourly' ? (
              <div className="space-y-2">
                <Label htmlFor="rate">Baseline Rate ({currencyLabel}/hr)</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={desiredHourlyRate}
                  onChange={(e) => setDesiredHourlyRate(e.target.value)}
                  placeholder="100"
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="dayRate">Baseline Day Rate ({currencyLabel}/day)</Label>
                <Input
                  id="dayRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={desiredDayRate}
                  onChange={(e) => setDesiredDayRate(e.target.value)}
                  placeholder="800"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  We’ll convert day rate using {effectiveHoursPerDay} hours/day.
                </p>
              </div>
            )}

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
                Leave empty to use global setting ({globalHoursPerDay}h/day). Used for day-rate conversions and analytics.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-muted-foreground text-sm">Budgeted Time:</span>
              <span className="font-mono font-semibold">{budgetedTimeHours.toFixed(1)} hours</span>
            </div>

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
                      await handleSubmit(e)
                    }}
                    onError={(error) => {
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
