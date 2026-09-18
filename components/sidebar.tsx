'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore, formatTime } from '@/lib/store'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Plus, Settings, Sun, Moon, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/logo-mark'
import { useEffect, useState, type ReactNode } from 'react'
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

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

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
      "fixed left-0 top-0 z-40 flex h-dvh w-64 flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex h-16 items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <LogoMark size="sm" />
          <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">QuoteReality</span>
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

      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
        <NavItem
          href="/dashboard"
          active={pathname === '/dashboard'}
          onClick={handleLinkClick}
          icon={LayoutDashboard}
        >
          Dashboard
        </NavItem>
        <NavItem
          href="/new-project"
          active={pathname === '/new-project'}
          onClick={handleLinkClick}
          icon={Plus}
        >
          New Project
        </NavItem>

        {recentProjects.length > 0 && (
          <div className="pt-6">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Recent Projects
            </p>
            <div className="mt-2 space-y-1">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center gap-2.5 truncate rounded-xl px-3 py-2 text-sm transition-colors',
                    pathname === `/project/${project.id}`
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      project.status === 'completed' ? 'bg-emerald-400' : 'bg-primary/80'
                    )}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {activeProject && (
        <div className="px-3 pb-3">
          <Link
            href={`/project/${activeProject.id}`}
            onClick={handleLinkClick}
            className="surface-glass flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors hover:bg-primary/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Clock className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-sidebar-foreground">{activeProject.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{formatTime(elapsedTime)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
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

      <div className="border-t border-sidebar-border p-3 pb-24 space-y-1 lg:pb-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <NavItem
          href="/settings"
          active={pathname === '/settings'}
          onClick={handleLinkClick}
          icon={Settings}
        >
          Settings
        </NavItem>
        <div className="pt-2 px-1">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  )
}

function NavItem({
  href,
  active,
  onClick,
  icon: Icon,
  children,
}: {
  href: string
  active: boolean
  onClick: () => void
  icon: typeof LayoutDashboard
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/15 text-foreground'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      <Icon className={cn('h-4 w-4', active && 'text-primary')} />
      {children}
    </Link>
  )
}
