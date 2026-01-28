'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { currencyOptions } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function SettingsPage() {
  const { settings, fetchSettings, updateSettings, projects, fetchProjects, isLoading } = useStore()
  const [desiredHourlyRate, setDesiredHourlyRate] = useState('')
  const [currencyCode, setCurrencyCode] = useState<'gbp' | 'usd' | 'eur'>('gbp')
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!settings) {
      fetchSettings()
    } else {
      setDesiredHourlyRate(settings.desiredHourlyRate.toString())
      setCurrencyCode(settings.currencyCode)
    }
  }, [settings, fetchSettings])

  useEffect(() => {
    if (projects.length === 0) {
      fetchProjects()
    }
  }, [projects.length, fetchProjects])

  const handleSaveChanges = async () => {
    if (!desiredHourlyRate) return
    setIsSaving(true)
    try {
      await updateSettings({
        desiredHourlyRate: parseFloat(desiredHourlyRate),
        currencyCode,
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
    const headers = ['Project Name', 'Client', 'Quote Amount', 'Target Rate', 'Target Hours', 'Time Tracked (hours)', 'Status', 'Created At']
    const rows = projects.map(p => [
      p.name,
      p.client,
      p.quoteAmount,
      p.desiredHourlyRate,
      p.targetHours.toFixed(2),
      (p.totalTrackedTime / 3600).toFixed(2),
      p.status,
      new Date(p.createdAt).toISOString(),
    ])
    
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
    <div className="space-y-4 sm:space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Configure your global preferences.</p>
      </div>

      {/* Rate & Currency */}
      <Card className="border-dashed">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Rate & Currency</CardTitle>
          <CardDescription>
            This rate will be used as the default target for new projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="rate">Default Hourly Rate Target</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
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

      {/* Data Management */}
      <Card className="border-dashed">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Data Management</CardTitle>
          <CardDescription>
            Your data is stored securely in the cloud. Export your data as a backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
            <Button variant="outline" onClick={handleExportJSON} className="w-full sm:w-auto bg-transparent">
              Export JSON
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="w-full sm:w-auto bg-transparent">
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
