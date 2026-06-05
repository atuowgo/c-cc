import { ipcMain } from 'electron'
import { MCPAddSchema, MCPDeleteSchema } from '../../shared/schemas'
import type { MCPManager } from '../services/MCPManager'

export function registerMCPHandlers(mcpManager: MCPManager): void {
  ipcMain.handle('mcp:list', async () => {
    return mcpManager.listServers()
  })

  ipcMain.handle('mcp:add', async (_event, args) => {
    const parsed = MCPAddSchema.parse(args)
    mcpManager.addServer(parsed)
    return { success: true }
  })

  ipcMain.handle('mcp:delete', async (_event, args) => {
    const { name } = MCPDeleteSchema.parse(args)
    mcpManager.removeServer(name)
    return { success: true }
  })

  ipcMain.handle('mcp:status', async () => {
    return mcpManager.getServerStatus()
  })

  ipcMain.handle('mcp:tools', async (_event, args) => {
    const { name } = MCPDeleteSchema.parse(args)
    return { tools: mcpManager.getServerTools(name) }
  })
}