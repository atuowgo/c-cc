import { ipcMain } from 'electron'
import { ConfigSetSchema, ConfigGetSchema, AppConfigSchema, SaveClaudeMdSchema } from '../../shared/schemas'
import type { ConfigManager } from '../services/ConfigManager'

export function registerConfigHandlers(configManager: ConfigManager): void {
  ipcMain.handle('config:get', async (_event, args) => {
    const { key } = ConfigGetSchema.parse(args)
    return configManager.get(key)
  })

  ipcMain.handle('config:set', async (_event, args) => {
    const { key, value } = ConfigSetSchema.parse(args)
    configManager.set(key, value)
    return { success: true }
  })

  ipcMain.handle('config:get-all', async () => {
    return configManager.getAll()
  })

  ipcMain.handle('config:set-all', async (_event, args) => {
    const parsed = AppConfigSchema.parse(args)
    configManager.setAll(parsed)
    return { success: true }
  })

  ipcMain.handle('claude-md:read', async (_event, args) => {
    const { scope, projectDir } = SaveClaudeMdSchema.omit({ content: true }).parse(args)
    return configManager.readClaudeMd(scope, projectDir)
  })

  ipcMain.handle('claude-md:save', async (_event, args) => {
    const { content, scope, projectDir } = SaveClaudeMdSchema.parse(args)
    configManager.saveClaudeMd(content, scope, projectDir)
    return { success: true }
  })
}