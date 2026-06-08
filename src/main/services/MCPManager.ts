import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { MCPServerConfig, MCPServerStatus } from '../../shared/index.js'
import { getAppClaudeDir } from './ConfigManager.js'

function getConfigPath(): string {
  return join(getAppClaudeDir(), 'claude.json')
}

interface ClaudeConfig {
  mcpServers?: Record<string, MCPServerConfig>
  [key: string]: unknown
}

function readClaudeConfig(): ClaudeConfig {
  const configPath = getConfigPath()
  try {
    if (existsSync(configPath)) {
      const raw = readFileSync(configPath, 'utf-8')
      return JSON.parse(raw) as ClaudeConfig
    }
  } catch (err) {
    console.error('[MCPManager] Failed to read claude.json:', err)
  }
  return {}
}

function writeClaudeConfig(config: ClaudeConfig): void {
  const configPath = getConfigPath()
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
  } catch (err) {
    console.error('[MCPManager] Failed to write claude.json:', err)
    throw err
  }
}

export class MCPManager {
  private serverStatuses: Map<string, MCPServerStatus> = new Map()

  loadServers(): MCPServerConfig[] {
    const config = readClaudeConfig()
    if (config.mcpServers) {
      for (const [name, _serverConfig] of Object.entries(config.mcpServers)) {
        if (!this.serverStatuses.has(name)) {
          this.serverStatuses.set(name, {
            name,
            status: 'offline',
            tools: []
          })
        }
      }
    }
    return this.listServers()
  }

  listServers(): MCPServerConfig[] {
    const config = readClaudeConfig()
    const servers = config.mcpServers ?? {}
    return Object.entries(servers).map(([name, srv]) => ({
      name,
      command: srv.command,
      args: srv.args,
      url: srv.url,
      transport: srv.transport,
      env: srv.env
    }))
  }

  addServer(serverConfig: MCPServerConfig): void {
    const config = readClaudeConfig()
    if (!config.mcpServers) {
      config.mcpServers = {}
    }

    config.mcpServers[serverConfig.name] = {
      name: serverConfig.name,
      command: serverConfig.command,
      args: serverConfig.args,
      url: serverConfig.url,
      transport: serverConfig.transport,
      env: serverConfig.env
    }

    writeClaudeConfig(config)

    this.serverStatuses.set(serverConfig.name, {
      name: serverConfig.name,
      status: 'offline',
      tools: []
    })
  }

  removeServer(name: string): void {
    const config = readClaudeConfig()
    if (config.mcpServers) {
      delete config.mcpServers[name]
      writeClaudeConfig(config)
    }
    this.serverStatuses.delete(name)
  }

  getServerStatus(): MCPServerStatus[] {
    return Array.from(this.serverStatuses.values())
  }

  getServerTools(name: string): string[] {
    const status = this.serverStatuses.get(name)
    return status?.tools ?? []
  }

  updateServerStatus(name: string, status: 'online' | 'offline' | 'error', error?: string): void {
    if (this.serverStatuses.has(name)) {
      this.serverStatuses.set(name, {
        ...this.serverStatuses.get(name)!,
        status,
        error
      })
    }
  }

  setServerTools(name: string, tools: string[]): void {
    if (this.serverStatuses.has(name)) {
      this.serverStatuses.set(name, {
        ...this.serverStatuses.get(name)!,
        tools
      })
    }
  }
}

export const mcpManager = new MCPManager()