import { create } from 'zustand'
import type { Session } from '@shared/types'

interface SessionState {
  sessions: Session[]
  activeSessionId: string | null
  isLoading: boolean

  setSessions: (sessions: Session[]) => void
  addSession: (session: Session) => void
  removeSession: (id: string) => void
  setActiveSession: (id: string | null) => void
  updateSession: (id: string, updates: Partial<Session>) => void
  fetchSessions: () => Promise<void>
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  activeSessionId: null,
  isLoading: false,

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id
    })),

  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId
    })),

  setActiveSession: (id) => set({ activeSessionId: id }),

  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s))
    })),

  fetchSessions: async () => {
    set({ isLoading: true })
    try {
      const sessions = await window.claudeAPI.session.list()
      set({ sessions, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  }
}))