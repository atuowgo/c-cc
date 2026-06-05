import { ipcMain } from 'electron'
import { PermissionResponseSchema } from '../../shared/schemas'
import type { SessionManager } from '../services/SessionManager'

export function registerPermissionHandlers(sessionManager: SessionManager): void {
  ipcMain.handle('permission:respond', async (_event, args) => {
    const { sessionId, toolCallId, allowed } = PermissionResponseSchema.parse(args)
    sessionManager.resolvePermission(sessionId, toolCallId, allowed)
  })
}