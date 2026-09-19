'use client'

import { useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useStore } from '@/lib/store'
import { billingTypeLabel, calculateEffectiveRate, getProjectAnalytics } from '@/lib/billing'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, CheckCircle, Briefcase, Clock, Wallet, TrendingUp, FolderKanban } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { CardSpotlight } from '@/components/aceternity/card-spotlight'
import { PageTransition } from '@/components/page-transition'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'

/** Max stagger delay so large lists don't wait too long for later items to animate in */
const STAGGER_MAX_DELAY = 0.5

export default function DashboardPage() {
  const {
    projects,
    isInitialized,
    fetchProjects,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    settings,
    fetchSettings,
  } = useStore()

  useEffect(() => {
    if (!isInitialized) {
      fetchProjects()
    }
  }, [isInitialized, fetchProjects])

  useEffect(() => {
    if (!settings) {
      fetchSettings()
    }
  }, [settings, fetchSettings])
  const currencyCode = settings?.currencyCode ?? 'gbp'

  const overview = useMemo(() => {
    const activeCount = projects.filter((project) => project.status === 'active').length
    const totalQuoted = projects.reduce((sum, project) => sum + (project.quoteAmount ?? 0), 0)
    const totalSeconds = projects.reduce((sum, project) => sum + project.totalTrackedTime, 0)
    const totalHours = totalSeconds / 3600
    const trackedQuotes = projects.filter(
      (project) => project.billingType === 'fixed_quote' && project.totalTrackedTime > 0,
    )
    const averageRate = trackedQuotes.length > 0
      ? trackedQuotes.reduce((sum, project) => sum + calculateEffectiveRate(project), 0) / trackedQuotes.length
      : 0

    return { activeCount, totalQuoted, totalHours, averageRate }
  }, [projects])

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.client.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter)
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'client':
          comparison = a.client.localeCompare(b.client)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'quoteAmount':
          comparison = (a.quoteAmount ?? 0) - (b.quoteAmount ?? 0)
          break
        case 'effectiveRate':
          comparison = calculateEffectiveRate(a) - calculateEffectiveRate(b)
          break
        default: {
          const _exhaustive: never = sortField
          return _exhaustive
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [projects, searchQuery, statusFilter, sortField, sortDirection])

  const getSortLabel = () => {
    switch (sortField) {
      case 'createdAt': return sortDirection === 'desc' ? 'Newest First' : 'Oldest First'
      case 'name': return 'Name'
      case 'client': return 'Client'
      case 'quoteAmount': return 'Quote Amount'
      case 'effectiveRate': return 'Current Rate'
      default: {
        const _exhaustive: never = sortField
        return _exhaustive
      }
    }
  }

  return (
    <PageTransition>
      <div className="min-w-0 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PageHeader
            title="Dashboard"
            description="Overview of your freelance performance."
          >
            <Button asChild className="w-full sm:w-auto">
              <Link href="/new-project">
                <Plus className="h-4 w-4" />
                New Project
              </Link>
            </Button>
          </PageHeader>
        </motion.div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active"
            value={isInitialized ? overview.activeCount : '—'}
            hint={`${projects.length} total projects`}
            icon={<Briefcase className="size-4" />}
          />
          <StatCard
            label="Quoted"
            value={isInitialized ? formatCurrency(overview.totalQuoted, currencyCode) : '—'}
            hint="Fixed-quote projects only"
            icon={<Wallet className="size-4" />}
          />
          <StatCard
            label="Time tracked"
            value={isInitialized ? `${Math.floor(overview.totalHours)}h ${Math.floor((overview.totalHours * 60) % 60)}m` : '—'}
            hint="All sessions combined"
            icon={<Clock className="size-4" />}
          />
          <StatCard
            label="Avg. rate"
            value={isInitialized ? formatCurrency(overview.averageRate, currencyCode) : '—'}
            hint="Effective hourly on quoted work"
            icon={<TrendingUp className="size-4" />}
          />
        </div>

        <div className="surface-glass flex min-w-0 flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:p-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-transparent bg-background/50 pl-9"
            />
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <Select
              value={`${sortField}-${sortDirection}`}
              onValueChange={(v) => {
                const [field, direction] = v.split('-') as [typeof sortField, typeof sortDirection]
                setSortField(field)
                setSortDirection(direction)
              }}
            >
              <SelectTrigger className="min-w-0 w-full overflow-hidden sm:w-40">
                <SelectValue>{getSortLabel()}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name</SelectItem>
                <SelectItem value="quoteAmount-desc">Quote Amount</SelectItem>
                <SelectItem value="effectiveRate-desc">Current Rate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="min-w-0 w-full overflow-hidden sm:w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Projects</h2>
            <span className="text-muted-foreground text-sm">{filteredAndSortedProjects.length} shown</span>
          </div>
          {!isInitialized ? (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="min-w-0"
                >
                  <Card className="gap-0 py-0">
                    <CardContent className="p-5">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-3" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : filteredAndSortedProjects.length === 0 ? (
            <Card className="gap-0 py-0">
              <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <FolderKanban className="size-5" />
                </div>
                <p className="font-medium">
                  {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
                </p>
                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                  {projects.length === 0
                    ? 'Create your first project to start tracking quotes against real hours.'
                    : 'Try a different search or status filter.'}
                </p>
                {projects.length === 0 && (
                  <Button asChild className="mt-5">
                    <Link href="/new-project">
                      <Plus className="h-4 w-4" />
                      New Project
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {filteredAndSortedProjects.map((project, index) => {
                const hoursPerDay = project.hoursPerDay ?? settings?.hoursPerDay ?? 8
                const analytics = getProjectAnalytics(project, hoursPerDay)
                const hours = Math.floor(project.totalTrackedTime / 3600)
                const minutes = Math.floor((project.totalTrackedTime % 3600) / 60)
                const isCompleted = project.status === 'completed'
                const delay = Math.min(index * 0.05, STAGGER_MAX_DELAY)

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay }}
                    className="min-w-0"
                  >
                    <Link href={`/project/${project.id}`}>
                      <CardSpotlight
                        radius={400}
                        color={isCompleted ? "rgba(16, 185, 129, 0.16)" : "rgba(96, 165, 250, 0.18)"}
                        className="surface-glass h-full cursor-pointer p-5 transition-transform hover:-translate-y-0.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className={cn(
                              'flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold',
                              isCompleted ? 'bg-emerald-500/15 text-emerald-400' : 'bg-primary/12 text-primary'
                            )}>
                              {(project.client || project.name).slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate font-semibold">{project.name}</h3>
                              <p className="text-muted-foreground truncate text-sm">
                                {project.client || 'No client'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {analytics.billingType === 'fixed_quote' && project.quoteAmount != null
                              ? formatCurrency(project.quoteAmount, currencyCode)
                              : billingTypeLabel(project.billingType)}
                          </Badge>
                        </div>

                        {isCompleted && (
                          <Badge variant="outline" className="mt-3 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                            <CheckCircle className="h-3 w-3" />
                            Complete
                          </Badge>
                        )}

                        {analytics.billingType === 'fixed_quote' ? (
                          <div className="mt-5">
                            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                              <span>Budgeted time</span>
                              <span className="font-mono">
                                {analytics.hoursWorked.toFixed(1)}h / {analytics.targetHours > 0 ? `${analytics.targetHours.toFixed(1)}h` : '—'}
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  analytics.targetHours > 0 && analytics.hoursWorked >= analytics.targetHours
                                    ? 'bg-red-400'
                                    : analytics.isAboveTarget
                                      ? 'bg-emerald-400'
                                      : 'bg-primary'
                                )}
                                style={{
                                  width: `${analytics.targetHours > 0 ? Math.min((analytics.hoursWorked / analytics.targetHours) * 100, 100) : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-5">
                            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                              <span>Earned so far</span>
                              <span className="font-mono">{formatCurrency(analytics.accruedEarnings, currencyCode)}</span>
                            </div>
                            <p className="text-muted-foreground text-xs">
                              {analytics.hoursWorked.toFixed(1)}h at{' '}
                              {analytics.billingType === 'daily'
                                ? `${formatCurrency(analytics.billedDayRate, currencyCode)}/day`
                                : `${formatCurrency(analytics.billedRate, currencyCode)}/hr`}
                            </p>
                          </div>
                        )}

                        <div className="mt-5 flex items-end justify-between">
                          {analytics.billingType === 'fixed_quote' ? (
                            <div>
                              <span className="text-muted-foreground text-xs">Current rate</span>
                              <p className={cn(
                                'font-mono text-sm font-semibold sm:text-base',
                                analytics.isAboveTarget ? 'text-emerald-500' : 'text-red-500'
                              )}>
                                {formatCurrency(analytics.effectiveRate, currencyCode)}/hr
                              </p>
                            </div>
                          ) : (
                            <div>
                              <span className="text-muted-foreground text-xs">
                                {analytics.billingType === 'daily' ? 'Day rate' : 'Hourly rate'}
                              </span>
                              <p className="font-mono text-sm font-semibold sm:text-base">
                                {analytics.billingType === 'daily'
                                  ? `${formatCurrency(analytics.billedDayRate, currencyCode)}/day`
                                  : `${formatCurrency(analytics.billedRate, currencyCode)}/hr`}
                              </p>
                            </div>
                          )}
                          <div className="text-right">
                            <span className="text-muted-foreground text-xs">Time spent</span>
                            <p className="font-mono text-sm sm:text-base">
                              {hours}h {minutes}m
                            </p>
                          </div>
                        </div>
                      </CardSpotlight>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
