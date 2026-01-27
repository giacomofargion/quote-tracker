'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, calculateEffectiveRate, getRateStatus } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  Play,
  Square,
  Plus,
  Trash2,
  Clock,
  Settings,
  X,
  CheckCircle
} from 'lucide-react'
import { cn, currencyOptions, formatCurrency } from '@/lib/utils'
import { ManualSessionDialog } from '@/components/manual-session-dialog'
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
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'

export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter()
  const { projects, isLoading, isInitialized, fetchProjects, settings, fetchSettings, activeProjectId, timerStartTime, startTimer, stopTimer, updateProject, deleteSession, deleteProject } = useStore()
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isManualSessionOpen, setIsManualSessionOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editClient, setEditClient] = useState('')
  const [editQuote, setEditQuote] = useState('')
  const [editRate, setEditRate] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<'active' | 'completed'>('active')

  const project = projects.find((p) => p.id === id)
  const currencyCode = settings?.currencyCode ?? 'gbp'
  const currencyLabel = currencyOptions.find((option) => option.value === currencyCode)?.label ?? 'GBP (£)'
  const isTimerActive = activeProjectId === id

  // Fetch project data if not loaded
  useEffect(() => {
    if (!project && !isLoading) {
      fetchProjects()
    }
  }, [project, isLoading, fetchProjects])

  // Fetch settings if not loaded
  useEffect(() => {
    if (!settings) {
      fetchSettings()
    }
  }, [settings, fetchSettings])

  useEffect(() => {
    if (project) {
      setEditName(project.name)
      setEditClient(project.client)
      setEditQuote(project.quoteAmount.toString())
      setEditRate(project.desiredHourlyRate.toString())
      setEditStatus(project.status)
    }
  }, [project])

  useEffect(() => {
    if (!isTimerActive || !timerStartTime) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(timerStartTime).getTime()) / 1000)
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerActive, timerStartTime])

  // Show skeleton while loading OR if project not yet in store (avoids flash of "not found")
  if (!project) {
    // If we're not loading and project is missing, it genuinely doesn't exist
    // But give fetchProjects a chance to run first (isInitialized check)
    if (isInitialized && !isLoading) {
      return (
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Project not found</p>
          </div>
        </div>
      )
    }
    // Still loading or not initialized yet - show skeleton
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <Skeleton className="h-7 w-48 mb-2" />
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr,320px] xl:grid-cols-[1fr,340px]">
          <Card className="border-dashed">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col items-center justify-center py-4 sm:py-8">
                <Skeleton className="h-40 w-40 sm:h-56 sm:w-56 rounded-full mb-4" />
                <Skeleton className="h-10 w-48 mb-2" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-dashed">
                  <CardContent className="p-3 sm:p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const effectiveRate = calculateEffectiveRate(project)
  // const rateStatus = getRateStatus(project)
  const hoursWorked = project.totalTrackedTime / 3600
  const hoursRemaining = Math.max(project.targetHours - hoursWorked, 0)
  const isOverBudget = hoursWorked > project.targetHours
  const rateDifference = project.desiredHourlyRate - effectiveRate
  const earningsPerMinute = project.totalTrackedTime > 0
    ? project.quoteAmount / (project.totalTrackedTime / 60)
    : 0

  // Gauge calculations
  const gaugePercentage = Math.min((effectiveRate / (project.desiredHourlyRate * 1.5)) * 100, 100)
  const isAboveTarget = effectiveRate >= project.desiredHourlyRate
  const gaugeColor = isAboveTarget ? 'stroke-emerald-500' : 'stroke-red-500'

  const handleTimerToggle = () => {
    if (isTimerActive) {
      stopTimer()
    } else {
      startTimer(project.id)
    }
  }

  const handleDeleteProject = async () => {
    try {
      await deleteProject(project.id)
      router.push('/')
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProject(project.id, {
        name: editName,
        client: editClient,
        quoteAmount: parseFloat(editQuote),
        desiredHourlyRate: parseFloat(editRate),
        status: editStatus,
      })
      setIsEditOpen(false)
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const handleMarkAsComplete = async () => {
    try {
      await updateProject(project.id, {
        status: 'completed',
      })
      toast({
        title: 'Project completed',
        description: `${project.name} has been marked as complete.`,
      })
    } catch (error) {
      console.error('Failed to mark project as complete:', error)
      toast({
        variant: 'destructive',
        title: 'Failed to mark as complete',
        description: 'An error occurred while updating the project status. Please try again.',
      })
    }
  }

  const budgetedTime = editQuote && editRate
    ? (parseFloat(editQuote) / parseFloat(editRate)).toFixed(1)
    : '0'

  const sortedSessions = [...project.sessions].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m ${secs}s`
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">{project.name}</h1>
              {project.status === 'completed' && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shrink-0">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
              <Badge variant="secondary" className="shrink-0">{formatCurrency(project.quoteAmount, currencyCode)} Fixed</Badge>
              <span className="text-sm text-muted-foreground">
                Target: {formatCurrency(project.desiredHourlyRate, currencyCode)}/hr
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Edit
          </Button>
          {project.status === 'active' && (
            <Button variant="outline" size="sm" onClick={handleMarkAsComplete}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as complete
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this project? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProject}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr,320px] xl:grid-cols-[1fr,340px]">
        {/* Left Column - Timer and Gauge */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-dashed">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            {/* Circular Gauge */}
            <div className="flex flex-col items-center justify-center py-4 sm:py-8">
              <motion.div
                className="relative w-40 h-40 sm:w-56 sm:h-56"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/20"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={gaugeColor}
                    initial={{ strokeDasharray: "0 264" }}
                    animate={{ strokeDasharray: `${gaugePercentage * 2.64} 264` }}
                    transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    className={cn(
                      "text-2xl sm:text-4xl font-bold",
                      isAboveTarget ? "text-emerald-500" : "text-red-500"
                    )}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    {formatCurrency(effectiveRate, currencyCode)}
                  </motion.span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Effective / HR
                  </span>
                </div>
              </motion.div>

              <motion.div
                className="text-center mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <p className="text-sm text-muted-foreground">
                  Target: {formatCurrency(project.desiredHourlyRate, currencyCode)}/hr
                </p>
                {!isAboveTarget && project.totalTrackedTime > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    {rateDifference.toFixed(0)} below target
                  </p>
                )}
              </motion.div>

              {/* Timer Button */}
              <motion.div
                className="w-full max-w-xs mt-6 sm:mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                {project.status === 'completed' ? (
                  <div className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-lg bg-muted text-muted-foreground cursor-not-allowed">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Project Completed
                  </div>
                ) : (
                  <motion.button
                    onClick={handleTimerToggle}
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-2 px-6 py-3",
                      "text-sm font-medium rounded-lg",
                      "bg-primary text-primary-foreground",
                      "hover:bg-primary/90",
                      "transition-colors"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <AnimatePresence mode="wait">
                      {isTimerActive ? (
                        <motion.span
                          key="stop"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center"
                        >
                          <Square className="mr-2 h-5 w-5" />
                          Stop
                        </motion.span>
                      ) : (
                        <motion.span
                          key="start"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center"
                        >
                          <Play className="mr-2 h-5 w-5" />
                          Start
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )}
              </motion.div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Right Column - Stats and Sessions */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Time Tracked */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="border-dashed">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs sm:text-sm text-muted-foreground">Time Tracked</span>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </div>
                <p className="text-lg sm:text-2xl font-bold font-mono">
                  {Math.floor(hoursWorked)}h {Math.floor((project.totalTrackedTime % 3600) / 60)}m
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            </motion.div>

            {/* Target Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <Card className="border-dashed">
              <CardContent className="p-3 sm:p-4">
                <span className="text-xs sm:text-sm text-muted-foreground">Target Hours</span>
                <p className="text-lg sm:text-2xl font-bold font-mono mt-1">
                  {project.targetHours.toFixed(1)}h
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Based on {formatCurrency(project.desiredHourlyRate, currencyCode)}/hr
                </p>
              </CardContent>
            </Card>
            </motion.div>

            {/* Remaining */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className={cn(
              "border-dashed",
              isOverBudget && "border-red-500/50"
            )}>
              <CardContent className="p-3 sm:p-4">
                <span className="text-xs sm:text-sm text-muted-foreground">Remaining</span>
                <p className={cn(
                  "text-lg sm:text-2xl font-bold font-mono mt-1",
                  isOverBudget ? "text-red-500" : "text-foreground"
                )}>
                  {hoursRemaining.toFixed(0)}h
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOverBudget ? 'Over budget' : 'Left in budget'}
                </p>
              </CardContent>
            </Card>
            </motion.div>

            {/* Earnings/Min */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
            >
              <Card className="border-dashed">
              <CardContent className="p-3 sm:p-4">
                <span className="text-xs sm:text-sm text-muted-foreground">Earnings/Min</span>
                <p className="text-lg sm:text-2xl font-bold font-mono mt-1">
                  {formatCurrency(earningsPerMinute, currencyCode)}
                </p>
                <p className="text-xs text-muted-foreground">Current pace</p>
              </CardContent>
            </Card>
            </motion.div>
          </div>

          {/* Recent Sessions */}
          <Card className="border-dashed">
            <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base">Recent Sessions</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs sm:text-sm"
                  onClick={() => setIsManualSessionOpen(true)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Manual
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
              {sortedSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sessions recorded yet
                </p>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
                    <span>Date</span>
                    <span>Duration</span>
                  </div>
                  <div className="max-h-[200px] sm:max-h-[300px] overflow-y-auto space-y-1">
                    <AnimatePresence>
                      {sortedSessions.map((session, index) => (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="flex items-center justify-between py-2 group"
                        >
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm">
                            {new Date(session.startTime).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.startTime).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-mono">
                            {formatDuration(session.duration)}
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                await deleteSession(project.id, session.id)
                              } catch (error) {
                                console.error('Failed to delete session:', error)
                                toast({
                                  variant: 'destructive',
                                  title: 'Failed to delete session',
                                  description: 'An error occurred while deleting the session. Please try again.',
                                })
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Manual Session Dialog */}
      <ManualSessionDialog
        open={isManualSessionOpen}
        onOpenChange={setIsManualSessionOpen}
        projectId={project.id}
      />

      {/* Edit Project Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-client">Client</Label>
              <Input
                id="edit-client"
                value={editClient}
                onChange={(e) => setEditClient(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quote">Quote Amount ({currencyLabel})</Label>
                <Input
                  id="edit-quote"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editQuote}
                  onChange={(e) => setEditQuote(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-rate">Target Rate ({currencyLabel}/hr)</Label>
                <Input
                  id="edit-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <span className="text-muted-foreground text-sm">Budgeted Time:</span>
              <span className="font-mono font-semibold">{budgetedTime} hours</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Project Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as 'active' | 'completed')}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Scope details..."
                rows={3}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
                className="sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Update Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
