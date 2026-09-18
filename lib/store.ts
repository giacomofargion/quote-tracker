'use client'

import { create } from 'zustand'
import type { BillingType, Project, TimeSession, UserSettings, SortField, SortDirection, StatusFilter } from './types'

interface AppState {
  // Loading and error states
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  clearError: () => void

  // User settings
  settings: UserSettings | null
  fetchSettings: () => Promise<void>
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>

  // Projects
  projects: Project[]
  /**
   * Project ids whose sessions have been fetched.
   * Dashboard list skips sessions, so this distinguishes "none yet" from "not loaded".
   */
  loadedSessionProjectIds: string[]
  fetchProjects: () => Promise<void>
  fetchProject: (id: string) => Promise<void>
  addProject: (project: {
    name: string
    client: string
    description?: string
    billingType: BillingType
    quoteAmount?: number | null
    desiredHourlyRate?: number
    desiredDayRate?: number
    hoursPerDay?: number | null
    status?: 'active' | 'completed'
  }) => Promise<void>
  updateProject: (id: string, updates: Partial<Project> & { desiredDayRate?: number | null }) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  // Time sessions
  addSession: (projectId: string, session: Omit<TimeSession, 'id' | 'projectId'>) => Promise<void>
  updateSession: (
    projectId: string,
    sessionId: string,
    updates: { duration: number; startTime?: Date; note?: string | null }
  ) => Promise<void>
  deleteSession: (projectId: string, sessionId: string) => Promise<void>

  // Active timer (client-side only, persists across navigation)
  activeProjectId: string | null
  timerStartTime: Date | null
  startTimer: (projectId: string) => void
  stopTimer: (note?: string) => Promise<void>

  // Filters and sorting (client-side only)
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: StatusFilter
  setStatusFilter: (filter: StatusFilter) => void
  sortField: SortField
  setSortField: (field: SortField) => void
  sortDirection: SortDirection
  setSortDirection: (direction: SortDirection) => void
}

export const useStore = create<AppState>((set, get) => ({
  // Loading and error states
  isLoading: false,
  error: null,
  isInitialized: false,
  clearError: () => set({ error: null }),

  // User settings
  settings: null,
  fetchSettings: async () => {
    try {
      set({ isLoading: true, error: null })
      const response = await fetch('/api/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      const settings = await response.json()
      set({ settings, isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch settings', isLoading: false })
    }
  },
  updateSettings: async (newSettings) => {
    try {
      set({ isLoading: true, error: null })
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })
      if (!response.ok) throw new Error('Failed to update settings')
      const settings = await response.json()
      set({ settings, isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update settings', isLoading: false })
      throw error
    }
  },

  // Projects
  projects: [],
  loadedSessionProjectIds: [],
  fetchProjects: async () => {
    try {
      set({ isLoading: true, error: null })
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const projects = await response.json() as Project[]
      set((state) => {
        const sessionsByProjectId = new Map(state.projects.map((project) => [project.id, project.sessions]))
        return {
          projects: projects.map((project) => ({
            ...project,
            sessions: sessionsByProjectId.get(project.id) ?? project.sessions ?? [],
          })),
          isLoading: false,
          isInitialized: true,
        }
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch projects', isLoading: false, isInitialized: true })
    }
  },
  fetchProject: async (id) => {
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (response.status === 404) {
        set({ error: 'Project not found' })
        return
      }
      if (!response.ok) throw new Error('Failed to fetch project')
      const project = await response.json() as Project
      set((state) => ({
        projects: state.projects.some((existing) => existing.id === id)
          ? state.projects.map((existing) => (existing.id === id ? project : existing))
          : [project, ...state.projects],
        loadedSessionProjectIds: state.loadedSessionProjectIds.includes(id)
          ? state.loadedSessionProjectIds
          : [...state.loadedSessionProjectIds, id],
        error: null,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch project' })
    }
  },
  addProject: async (project) => {
    try {
      set({ isLoading: true, error: null })
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: project.name,
          client: project.client,
          description: project.description ?? '',
          billingType: project.billingType,
          quoteAmount: project.quoteAmount ?? null,
          ...(project.desiredHourlyRate !== undefined && { desiredHourlyRate: project.desiredHourlyRate }),
          ...(project.desiredDayRate !== undefined && { desiredDayRate: project.desiredDayRate }),
          ...(project.hoursPerDay !== undefined && { hoursPerDay: project.hoursPerDay }),
          status: project.status,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const message = typeof data?.error === 'string' ? data.error : `Failed to create project (${response.status})`
        throw new Error(message)
      }
      const newProject = await response.json()
      set((state) => ({
        projects: [newProject, ...state.projects],
        loadedSessionProjectIds: state.loadedSessionProjectIds.includes(newProject.id)
          ? state.loadedSessionProjectIds
          : [...state.loadedSessionProjectIds, newProject.id],
        isLoading: false,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create project', isLoading: false })
      throw error
    }
  },
  updateProject: async (id, updates) => {
    try {
      set({ isLoading: true, error: null })
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update project')
      }
      const updatedProject = await response.json()
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        loadedSessionProjectIds: state.loadedSessionProjectIds.includes(id)
          ? state.loadedSessionProjectIds
          : [...state.loadedSessionProjectIds, id],
        isLoading: false,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update project', isLoading: false })
      throw error
    }
  },
  deleteProject: async (id) => {
    try {
      set({ isLoading: true, error: null })
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete project')
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        loadedSessionProjectIds: state.loadedSessionProjectIds.filter((projectId) => projectId !== id),
        isLoading: false,
        // Clear timer if deleting active project
        activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        timerStartTime: state.activeProjectId === id ? null : state.timerStartTime,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete project', isLoading: false })
      throw error
    }
  },

  // Time sessions
  addSession: async (projectId, session) => {
    try {
      set({ isLoading: true, error: null })
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          startTime: session.startTime.toISOString(),
          endTime: session.endTime?.toISOString() || null,
          duration: session.duration,
          isManual: session.isManual,
          note: session.note,
        }),
      })
      if (!response.ok) throw new Error('Failed to create session')
      const newSession = await response.json()

      // Update local state optimistically
      set((state) => ({
        projects: state.projects.map((p) => {
          if (p.id !== projectId) return p
          return {
            ...p,
            sessions: [newSession, ...p.sessions],
            totalTrackedTime: p.totalTrackedTime + session.duration,
          }
        }),
        loadedSessionProjectIds: state.loadedSessionProjectIds.includes(projectId)
          ? state.loadedSessionProjectIds
          : [...state.loadedSessionProjectIds, projectId],
        isLoading: false,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create session', isLoading: false })
      await get().fetchProject(projectId)
      throw error
    }
  },
  updateSession: async (projectId, sessionId, updates) => {
    try {
      set({ isLoading: true, error: null })
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: updates.duration,
          startTime: updates.startTime?.toISOString(),
          note: updates.note,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update session')
      }
      const { session: updatedSession, totalTrackedTime } = await response.json() as {
        session: TimeSession
        totalTrackedTime: number
      }

      set((state) => ({
        projects: state.projects.map((p) => {
          if (p.id !== projectId) return p
          return {
            ...p,
            sessions: p.sessions.map((s) => (s.id === sessionId ? updatedSession : s)),
            totalTrackedTime,
          }
        }),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update session', isLoading: false })
      await get().fetchProject(projectId)
      throw error
    }
  },
  deleteSession: async (projectId, sessionId) => {
    try {
      set({ isLoading: true, error: null })
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete session')

      // Update local state optimistically
      set((state) => {
        const project = state.projects.find((p) => p.id === projectId)
        const session = project?.sessions.find((s) => s.id === sessionId)
        return {
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            return {
              ...p,
              sessions: p.sessions.filter((s) => s.id !== sessionId),
              totalTrackedTime: Math.max(0, p.totalTrackedTime - (session?.duration || 0)),
            }
          }),
          isLoading: false,
        }
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete session', isLoading: false })
      await get().fetchProject(projectId)
      throw error
    }
  },

  // Active timer (client-side only)
  activeProjectId: null,
  timerStartTime: null,
  startTimer: (projectId) => {
    set({
      activeProjectId: projectId,
      timerStartTime: new Date(),
    })
  },
  stopTimer: async (note?: string) => {
    const { activeProjectId, timerStartTime, addSession } = get()
    if (activeProjectId && timerStartTime) {
      const endTime = new Date()
      const duration = Math.floor((endTime.getTime() - timerStartTime.getTime()) / 1000)

      if (duration > 0) {
        try {
          await addSession(activeProjectId, {
            startTime: timerStartTime,
            endTime,
            duration,
            isManual: false,
            note: note?.trim() || undefined,
          })
        } catch (error) {
          console.error('Failed to save session:', error)
          // Keep timer running if save failed
          return
        }
      }
    }
    set({
      activeProjectId: null,
      timerStartTime: null,
    })
  },

  // Filters and sorting (client-side only)
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  statusFilter: 'all',
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  sortField: 'createdAt',
  setSortField: (field) => set({ sortField: field }),
  sortDirection: 'desc',
  setSortDirection: (direction) => set({ sortDirection: direction }),
}))

// Helper to format time
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatHours(seconds: number): string {
  const hours = seconds / 3600
  return hours.toFixed(1)
}
