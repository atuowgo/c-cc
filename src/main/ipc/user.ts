import { ipcMain } from 'electron'
import type { DatabaseService } from '../services/DatabaseService'

export function registerUserHandlers(databaseService: DatabaseService): void {
  ipcMain.handle('user:profile', async () => {
    return databaseService.getUserProfile()
  })

  ipcMain.handle('user:usage', async (_event, args) => {
    const { sessionId } = (args as { sessionId?: string }) ?? {}
    return databaseService.getUsage(sessionId)
  })
}