'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { billingTypeLabel, getProjectAnalytics, assertNever } from '@/lib/billing'
import { currencyOptions } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { PageTransition } from '@/components/page-transition'

export default function SettingsPage() {
  const { settings, fetchSettings, updateSettings, projects, fetchProjects, isLoading } = useStore()
  const [desiredHourlyRate, setDesiredHourlyRate] = useState('')
  const [currencyCode, setCurrencyCode] = useState<'gbp' | 'usd' | 'eur'>('gbp')
  const [hoursPerDay, setHoursPerDay] = useState('')
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!settings) {
      fetchSettings()
    } else {
      setDesiredHourlyRate(settings.desiredHourlyRate.toString())
      setCurrencyCode(settings.currencyCode)
      setHoursPerDay(settings.hoursPerDay.toString())
    }
  }, [settings, fetchSettings])

  useEffect(() => {
    if (projects.length === 0) {
      fetchProjects()
    }
  }, [projects.length, fetchProjects])

  const handleSaveChanges = async () => {
    if (!desiredHourlyRate || !hoursPerDay) return
    setIsSaving(true)
    try {
      await updateSettings({
        desiredHourlyRate: parseFloat(desiredHourlyRate),
        currencyCode,
        hoursPerDay: parseFloat(hoursPerDay),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to update settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportJSON = () => {
    const data = {
      settings,
      projects,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quotereality-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const hoursPerDay = settings?.hoursPerDay ?? 8
    const headers = ['Project Name', 'Client', 'Billing Type', 'Quote Amount', 'Rate', 'Target Hours', 'Time Tracked (hours)', 'Earned So Far', 'Status', 'Created At']
    const rows = projects.map(p => {
      const analytics = getProjectAnalytics(p, p.hoursPerDay ?? hoursPerDay)
      let rate: number
      let earned: number | ''
      switch (analytics.billingType) {
        case 'fixed_quote':
          rate = p.desiredHourlyRate
          earned = ''
          break
        case 'hourly':
          rate = analytics.billedRate
          earned = analytics.accruedEarnings
          break
        case 'daily':
          rate = analytics.billedDayRate
          earned = analytics.accruedEarnings
          break
        default:
          return assertNever(analytics)
      }
      return [
        p.name,
        p.client,
        billingTypeLabel(p.billingType),
        p.quoteAmount ?? '',
        rate,
        p.targetHours?.toFixed(2) ?? '',
        (p.totalTrackedTime / 3600).toFixed(2),
        earned,
        p.status,
        new Date(p.createdAt).toISOString(),
      ]
    })

    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quotereality-projects-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageTransition>
      <div className="max-w-2xl space-y-6">
        <PageHeader
          title="Settings"
          description="Configure your global preferences."
        />

        <Card className="gap-0 py-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Rate & Currency</CardTitle>
            <CardDescription>
              This rate will be used as the default target for new projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-2">
              <Label htmlFor="rate">Default Hourly Rate Target</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={desiredHourlyRate}
                  onChange={(e) => setDesiredHourlyRate(e.target.value)}
                  className="w-full sm:w-48"
                />
                <span className="text-muted-foreground text-sm">per hour</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursPerDay">Hours Per Day</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Input
                  id="hoursPerDay"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                  className="w-full sm:w-48"
                />
                <span className="text-muted-foreground text-sm">used for day-rate conversions</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Currency Display</Label>
              <Select value={currencyCode} onValueChange={(value) => setCurrencyCode(value as typeof currencyCode)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSaveChanges} className="w-full sm:w-auto" disabled={isSaving || isLoading || !settings}>
              {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Data Management</CardTitle>
            <CardDescription>
              Your data is stored securely in the cloud. Export your data as a backup.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="flex flex-col flex-wrap gap-2 sm:flex-row sm:gap-3">
              <Button variant="outline" onClick={handleExportJSON} className="w-full sm:w-auto">
                Export JSON
              </Button>
              <Button variant="outline" onClick={handleExportCSV} className="w-full sm:w-auto">
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
