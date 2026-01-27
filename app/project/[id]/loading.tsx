'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header skeleton */}
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

      {/* Main content skeleton */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr,320px] xl:grid-cols-[1fr,340px]">
        {/* Left column - gauge and timer */}
        <Card className="border-dashed">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col items-center justify-center py-4 sm:py-8">
              <Skeleton className="h-40 w-40 sm:h-56 sm:w-56 rounded-full mb-4" />
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Right column - stats */}
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
