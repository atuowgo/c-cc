import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'

import { databaseService } from './services/DatabaseService'
import { configManager } from './services/ConfigManager'
import { skillManager } from './services/SkillManager'
import { mcpManager } from './services/MCPManager'
import { sessionManager } from './services/SessionManager'
import { WindowManager } from './services/WindowManager'

import { registerAllHandlers } from './ipc/index'

// Initialize singletons (trigger lazy init)
const windowManager = WindowManager.getInstance()

// Register all IPC handlers
registerAllHandlers({
  sessionManager,
  skillManager,
  mcpManager,
  configManager,
  databaseService
})

let streamForwardingSetup = false

function setupStreamForwarding(): void {
  if (streamForwardingSetup) return
  streamForwardingSetup = true

  const forward = (channel: string, data: unknown): void => {
    const win = windowManager.getMainWindow()
    if (win && !win.isDestroyed()) {
      console.log(`[forward] ${channel}`, JSON.stringify(data).slice(0, 120))
      win.webContents.send(channel, data)
    } else {
      console.warn(`[forward] no window for channel=${channel}`)
    }
  }

  sessionManager.on('stream:chunk', (data) => forward('stream:chunk', data))
  sessionManager.on('stream:tool-use', (data) => forward('stream:tool-use', data))
  sessionManager.on('stream:tool-result', (data) => forward('stream:tool-result', data))
  sessionManager.on('stream:complete', (data) => forward('stream:complete', data))
  sessionManager.on('stream:error', (data) => forward('stream:error', data))
  sessionManager.on('permission:request', (data) => forward('permission:request', data))
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.cc-bot')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  windowManager.createMainWindow()
  setupStreamForwarding()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createMainWindow()
      setupStreamForwarding()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})