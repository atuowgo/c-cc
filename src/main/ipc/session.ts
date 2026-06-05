import { ipcMain } from 'electron'
import { CreateSessionSchema, SendMessageSchema, SessionIdSchema, DeleteSessionSchema, SearchSessionsSchema } from '../../shared/schemas'
import type { SessionManager } from '../services/SessionManager'

export function registerSessionHandlers(sessionManager: SessionManager): void {
  ipcMain.handle('session:create', async (_event, args) => {
    const parsed = CreateSessionSchema.parse(args)
    return sessionManager.createSession(parsed)
  })

  ipcMain.handle('session:send', async (_event, args) => {
    const parsed = SendMessageSchema.parse(args)
    await sessionManager.sendMessage(parsed)
    return { success: true }
  })

  ipcMain.handle('session:interrupt', async (_event, args) => {
    const { sessionId } = SessionIdSchema.parse(args)
    sessionManager.interruptSession(sessionId)
    return { success: true }
  })

  ipcMain.handle('session:resume', async (_event, args) => {
    const { sessionId } = SessionIdSchema.parse(args)
    return sessionManager.resumeSession(sessionId)
  })

  ipcMain.handle('session:delete', async (_event, args) => {
    const { sessionId } = DeleteSessionSchema.parse(args)
    sessionManager.deleteSession(sessionId)
    return { success: true }
  })

  ipcMain.handle('session:list', async () => {
    return sessionManager.listSessions()
  })

  ipcMain.handle('session:update', async (_event, args) => {
    const { sessionId, title, model, permMode } = args as {
      sessionId: string
      title?: string
      model?: string
      permMode?: string
    }
    const result = sessionManager.updateSession(sessionId, { title, model, permMode } as Parameters<SessionManager['updateSession']>[1])
    if (!result) {
      throw new Error(`Session not found: ${sessionId}`)
    }
    return result
  })

  ipcMain.handle('session:search', async (_event, args) => {
    const { query } = SearchSessionsSchema.parse(args)
    return sessionManager.searchSessions(query)
  })
}