import { create } from 'zustand'
import type { AppConfig } from '@shared/types'

interface ConfigState {
  config: AppConfig | null
  isLoading: boolean

  fetchConfig: () => Promise<void>
  updateConfig: (partial: Partial<AppConfig>) => Promise<void>
  setTheme: (theme: AppConfig['theme']) => void
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  isLoading: false,

  fetchConfig: async () => {
    set({ isLoading: true })
    try {
      const config = await window.claudeAPI.config.getAll()
      set({ config, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  updateConfig: async (partial) => {
    const current = get().config
    if (!current) return
    const updated = { ...current, ...partial }
    set({ config: updated })
    try {
      await window.claudeAPI.config.setAll(updated)
    } catch {
      // revert on failure - next fetch will correct
    }
  },

  setTheme: (theme) => {
    const current = get().config
    if (current) {
      get().updateConfig({ theme })
    }
  }
}))