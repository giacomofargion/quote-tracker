'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <Link
            href="/dashboard"
            className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-2 h-7 w-48" />
            <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr,320px] xl:grid-cols-[1fr,340px]">
        <Card className="gap-0 py-0">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col items-center justify-center py-4 sm:py-8">
              <Skeleton className="mb-4 h-40 w-40 rounded-full sm:h-56 sm:w-56" />
              <Skeleton className="mb-2 h-10 w-48" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="gap-0 py-0">
              <CardContent className="p-4">
                <Skeleton className="mb-2 h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
