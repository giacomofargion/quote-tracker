'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore, formatTime } from '@/lib/store'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Plus, Settings, Sun, Moon, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { projects, activeProjectId, timerStartTime, stopTimer } = useStore()
  const [isDark, setIsDark] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Get recent projects (last 5 accessed/created, active first)
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  // Update elapsed time for active timer
  useEffect(() => {
    if (!activeProjectId || !timerStartTime) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(timerStartTime).getTime()) / 1000)
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeProjectId, timerStartTime])

  const activeProject = activeProjectId ? projects.find(p => p.id === activeProjectId) : null

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    if (newIsDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:translate-x-0",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            Q
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">QuoteReality</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-sidebar-foreground"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <Link
          href="/dashboard"
          onClick={handleLinkClick}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/dashboard'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/new-project"
          onClick={handleLinkClick}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/new-project'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="pt-6">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Projects
            </p>
            <div className="mt-2 space-y-1">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  onClick={handleLinkClick}
                  className={cn(
                    'block truncate rounded-lg px-3 py-2 text-sm transition-colors',
                    pathname === `/project/${project.id}`
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  {project.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Active Timer Indicator */}
      {activeProject && (
        <div className="border-t border-sidebar-border p-3">
          <Link
            href={`/project/${activeProject.id}`}
            onClick={handleLinkClick}
            className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm transition-colors hover:bg-primary/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Clock className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-sidebar-foreground">{activeProject.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{formatTime(elapsedTime)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.preventDefault()
                stopTimer()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Bottom Actions — extra bottom padding on mobile so Settings + Clerk avatar sit above the browser UI bar */}
      <div className="border-t border-sidebar-border p-3 pb-24 space-y-1 lg:pb-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <Link
          href="/settings"
          onClick={handleLinkClick}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="pt-2 border-t border-sidebar-border">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  )
}
