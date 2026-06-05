import { ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'

export function registerUpdateHandlers(): void {
  ipcMain.handle('update:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return {
        available: !!result?.updateInfo?.version,
        version: result?.updateInfo?.version
      }
    } catch {
      return { available: false }
    }
  })

  ipcMain.handle('update:install', async () => {
    try {
      autoUpdater.quitAndInstall()
      return { success: true }
    } catch {
      return { success: false }
    }
  })
}