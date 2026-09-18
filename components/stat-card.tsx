import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'positive' | 'negative'
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  className,
}: StatCardProps) {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
            <p
              className={cn(
                'mt-1.5 font-semibold tracking-tight text-xl sm:text-2xl',
                tone === 'positive' && 'text-emerald-500',
                tone === 'negative' && 'text-red-500',
              )}
            >
              {value}
            </p>
            {hint ? <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p> : null}
          </div>
          {icon ? (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              {icon}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
