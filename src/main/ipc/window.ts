import { ipcMain } from 'electron'
import { WindowStateSchema } from '../../shared/schemas'
import type { ConfigManager } from '../services/ConfigManager'

export function registerWindowHandlers(configManager: ConfigManager): void {
  ipcMain.handle('window:state', async () => {
    return configManager.getWindowState()
  })

  ipcMain.handle('window:save-state', async (_event, args) => {
    const parsed = WindowStateSchema.parse(args)
    configManager.saveWindowState(parsed)
    return { success: true }
  })
}