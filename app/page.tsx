'use client'

import { useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useStore, calculateEffectiveRate } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { CardSpotlight } from '@/components/aceternity/card-spotlight'
import { PageTransition } from '@/components/page-transition'

export default function Home() {
  const {
    projects,
    isLoading,
    isInitialized,
    fetchProjects,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortField,
    setSortField,
    sortDirection,
  } = useStore()

  useEffect(() => {
    if (!isInitialized) {
      fetchProjects()
    }
  }, [isInitialized, fetchProjects])

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.client.toLowerCase().includes(query)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter)
    }

    // Sort
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
          comparison = a.quoteAmount - b.quoteAmount
          break
        case 'effectiveRate':
          comparison = calculateEffectiveRate(a) - calculateEffectiveRate(b)
          break
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
      case 'effectiveRate': return 'Effective Rate'
      default: return 'Newest First'
    }
  }

  return (
    <PageTransition>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div 
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Overview of your freelance performance.</p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/new-project">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </motion.div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={`${sortField}-${sortDirection}`}
            onValueChange={(v) => {
              const [field] = v.split('-') as [typeof sortField]
              setSortField(field)
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue>{getSortLabel()}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name</SelectItem>
              <SelectItem value="quoteAmount-desc">Quote Amount</SelectItem>
              <SelectItem value="effectiveRate-desc">Effective Rate</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-full sm:w-[120px]">
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

      {/* Projects */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Projects</h2>
        {isLoading && !isInitialized ? (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <Card className="border-dashed">
                  <CardContent className="p-4 sm:p-5">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {projects.length === 0
                ? 'No projects yet. Create your first project to get started!'
                : 'No projects match your filters.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAndSortedProjects.map((project, index) => {
              const effectiveRate = calculateEffectiveRate(project)
              const isAboveTarget = effectiveRate >= project.desiredHourlyRate
              const hours = Math.floor(project.totalTrackedTime / 3600)
              const minutes = Math.floor((project.totalTrackedTime % 3600) / 60)

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link href={`/project/${project.id}`}>
                    <CardSpotlight
                      radius={400}
                      color="rgba(120, 119, 198, 0.3)"
                      className="h-full border border-dashed border-border bg-card hover:border-primary/50 transition-colors cursor-pointer p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                        <h3 className="font-semibold text-base sm:text-lg truncate">{project.name}</h3>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          ${project.quoteAmount.toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 sm:mb-4 truncate">
                        {project.client || 'No client'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs sm:text-sm text-muted-foreground">Effective Rate</span>
                          <p className={cn(
                            'font-mono font-semibold text-sm sm:text-base',
                            isAboveTarget ? 'text-emerald-500' : 'text-red-500'
                          )}>
                            ${effectiveRate.toFixed(2)}/hr
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs sm:text-sm text-muted-foreground">Time Spent</span>
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
