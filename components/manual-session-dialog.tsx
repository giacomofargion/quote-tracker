'use client'

import React from "react"
import { useState } from 'react'
import { useStore } from '@/lib/store'
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
}

export function ManualSessionDialog({ open, onOpenChange, projectId }: ManualSessionDialogProps) {
  const { addSession } = useStore()

  const [date, setDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [hours, setHours] = useState('0')
  const [minutes, setMinutes] = useState('0')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const hoursNum = parseInt(hours) || 0
    const minutesNum = parseInt(minutes) || 0
    const totalSeconds = (hoursNum * 3600) + (minutesNum * 60)

    if (totalSeconds === 0) return

    // Create start time from date
    const startDateTime = new Date(date)
    startDateTime.setHours(12, 0, 0, 0) // Default to noon

    const endDateTime = new Date(startDateTime.getTime() + totalSeconds * 1000)

    try {
      await addSession(projectId, {
        startTime: startDateTime,
        endTime: endDateTime,
        duration: totalSeconds,
        isManual: true,
        note: notes.trim() || undefined,
      })

      // Reset form
      setHours('0')
      setMinutes('0')
      setNotes('')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to add session:', error)
    }
  }

  const resetForm = () => {
    const today = new Date()
    setDate(today.toISOString().split('T')[0])
    setHours('0')
    setMinutes('0')
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Manual Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
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

          <Button type="submit" className="w-full" disabled={hours === '0' && minutes === '0'}>
            Save Session
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
