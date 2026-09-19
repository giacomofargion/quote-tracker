'use client'

import React, { useState } from 'react'
import { Sidebar } from './sidebar'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative min-h-dvh">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-[-8%] size-[34rem] rounded-full bg-[var(--ambient-1)] blur-3xl" />
        <div className="absolute bottom-[-12%] left-[10%] size-[28rem] rounded-full bg-[var(--ambient-2)] blur-3xl" />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 lg:ml-64">
        <div className="sticky top-0 z-20 flex h-14 items-center border-b border-border/70 bg-background/70 px-3 backdrop-blur-xl lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
