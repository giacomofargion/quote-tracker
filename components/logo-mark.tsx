'use client'

import React from 'react'

/** Shared "Q" logo mark for consistent branding across sidebar, landing nav, etc. */
export function LogoMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'h-7 w-7 text-sm' : 'h-8 w-8 text-base'

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground ${sizeClasses}`}
      aria-hidden
    >
      Q
    </div>
  )
}
