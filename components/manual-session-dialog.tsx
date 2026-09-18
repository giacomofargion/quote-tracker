'use client'

import React from "react"
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import type { TimeSession } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ManualSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  session?: TimeSession | null
}

function durationToParts(durationSeconds: number) {
  const total = Math.max(0, Math.floor(Number(durationSeconds) || 0))
  return {
    hours: String(Math.floor(total / 3600)),
    minutes: String(Math.floor((total % 3600) / 60)),
    seconds: String(total % 60),
  }
}

function dateInputValue(date: Date) {
  const local = new Date(date)
  const offsetDate = new Date(local.getTime() - local.getTimezoneOffset() * 60_000)
  return offsetDate.toISOString().split('T')[0]
}

export function ManualSessionDialog({ open, onOpenChange, projectId, session }: ManualSessionDialogProps) {
  const { addSession, updateSession } = useStore()
  const isEditing = Boolean(session)

  const [date, setDate] = useState(() => dateInputValue(new Date()))
  const [hours, setHours] = useState('0')
  const [minutes, setMinutes] = useState('0')
  const [seconds, setSeconds] = useState('0')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (session) {
      const parts = durationToParts(session.duration)
      setDate(dateInputValue(new Date(session.startTime)))
      setHours(parts.hours)
      setMinutes(parts.minutes)
      setSeconds(parts.seconds)
      setNotes(session.note ?? '')
    } else {
      setDate(dateInputValue(new Date()))
      setHours('0')
      setMinutes('0')
      setSeconds('0')
      setNotes('')
    }
    setFormError(null)
  }, [open, session])

  const durationSeconds =
    ((parseInt(hours, 10) || 0) * 3600) +
    ((parseInt(minutes, 10) || 0) * 60) +
    (parseInt(seconds, 10) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (durationSeconds <= 0) {
      setFormError('Enter a duration greater than zero.')
      return
    }

    const startDateTime = new Date(`${date}T12:00:00`)
    if (Number.isNaN(startDateTime.getTime())) {
      setFormError('Enter a valid date.')
      return
    }

    // Keep the original time of day when editing so we only change the date/duration.
    if (session) {
      const original = new Date(session.startTime)
      startDateTime.setHours(original.getHours(), original.getMinutes(), original.getSeconds(), 0)
    }

    const endDateTime = new Date(startDateTime.getTime() + durationSeconds * 1000)

    setIsSaving(true)
    try {
      if (session) {
        await updateSession(projectId, session.id, {
          startTime: startDateTime,
          duration: durationSeconds,
          note: notes.trim() || null,
        })
      } else {
        await addSession(projectId, {
          startTime: startDateTime,
          endTime: endDateTime,
          duration: durationSeconds,
          isManual: true,
          note: notes.trim() || undefined,
        })
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save session:', error)
      setFormError('Could not save this session. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Session' : 'Add Manual Session'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {formError && (
            <p className="text-sm text-destructive" role="alert">{formError}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                step="1"
                value={hours}
                onChange={(e) => {
                  setHours(e.target.value)
                  setFormError(null)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                step="1"
                value={minutes}
                onChange={(e) => {
                  setMinutes(e.target.value)
                  setFormError(null)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seconds">Seconds</Label>
              <Input
                id="seconds"
                type="number"
                min="0"
                max="59"
                step="1"
                value={seconds}
                onChange={(e) => {
                  setSeconds(e.target.value)
                  setFormError(null)
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-notes">Notes (optional)</Label>
            <Textarea
              id="manual-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              placeholder="e.g. Refined proposal, client emails..."
              rows={3}
              maxLength={200}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">{notes.length}/200</p>
          </div>

          <Button type="submit" className="w-full" disabled={isSaving || durationSeconds <= 0}>
            {isEditing ? 'Update Session' : 'Save Session'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
