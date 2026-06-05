import { create } from 'zustand'

interface PermissionModalData {
  sessionId: string
  toolCallId: string
  toolName: string
  toolInput: Record<string, unknown>
}

interface UIState {
  sidebarOpen: boolean
  sidebarWidth: number
  settingsOpen: boolean
  permissionModal: PermissionModalData | null

  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  openSettings: () => void
  closeSettings: () => void
  showPermissionModal: (data: PermissionModalData) => void
  hidePermissionModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarWidth: 240,
  settingsOpen: false,
  permissionModal: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  showPermissionModal: (data) => set({ permissionModal: data }),
  hidePermissionModal: () => set({ permissionModal: null })
}))