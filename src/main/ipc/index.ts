import type { SessionManager } from '../services/SessionManager'
import type { SkillManager } from '../services/SkillManager'
import type { MCPManager } from '../services/MCPManager'
import type { ConfigManager } from '../services/ConfigManager'
import type { DatabaseService } from '../services/DatabaseService'

import { registerSessionHandlers } from './session'
import { registerSkillHandlers } from './skill'
import { registerMCPHandlers } from './mcp'
import { registerConfigHandlers } from './config'
import { registerPermissionHandlers } from './permission'
import { registerFileHandlers } from './file'
import { registerWindowHandlers } from './window'
import { registerUserHandlers } from './user'
import { registerUpdateHandlers } from './update'

export interface ServiceInstances {
  sessionManager: SessionManager
  skillManager: SkillManager
  mcpManager: MCPManager
  configManager: ConfigManager
  databaseService: DatabaseService
}

export function registerAllHandlers(services: ServiceInstances): void {
  registerSessionHandlers(services.sessionManager)
  registerSkillHandlers(services.skillManager)
  registerMCPHandlers(services.mcpManager)
  registerConfigHandlers(services.configManager)
  registerPermissionHandlers(services.sessionManager)
  registerFileHandlers()
  registerWindowHandlers(services.configManager)
  registerUserHandlers(services.databaseService)
  registerUpdateHandlers()
}