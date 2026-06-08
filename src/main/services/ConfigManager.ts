import Store from 'electron-store'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { AppConfig, WindowState } from '../../shared/index.js'

/**
 * 返回本应用专属的 .claude 配置目录。
 * 结构与 ~/.claude 完全相同，但与系统全局安装的 Claude Code 隔离。
 * macOS:   ~/Library/Application Support/cc-bot/.claude/
 * Windows: C:\Users\<user>\AppData\Roaming\cc-bot\.claude\
 * Linux:   ~/.config/cc-bot/.claude/
 */
export function getAppClaudeDir(): string {
  const dir = join(app.getPath('userData'), '.claude')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

let keytar: typeof import('keytar') | null = null
try {
  keytar = require('keytar')
} catch {
  console.warn('[ConfigManager] keytar not available, API key will be stored in electron-store (less secure)')
}

const SERVICE_NAME = 'cc-bot'
const ACCOUNT_NAME = 'anthropic-api-key'

export class ConfigManager {
  private static instance: ConfigManager
  private store: Store<{ config: Partial<AppConfig>; windowState: WindowState }>

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  constructor() {
    this.store = new Store({
      defaults: {
        config: {
          apiProvider: 'anthropic',
          defaultModel: 'claude-sonnet-4-6',
          defaultPermMode: 'default',
          theme: 'dark',
          language: 'zh-CN',
          fontSize: 14
        } as Partial<AppConfig>,
        windowState: {
          width: 900,
          height: 670,
          isMaximized: false
        } as WindowState
      }
    })
  }

  // --- API Key (via keytar, fallback to electron-store) ---

  async getApiKey(): Promise<string | null> {
    if (keytar) {
      try {
        return await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME)
      } catch (err) {
        console.error('[ConfigManager] keytar getPassword failed:', err)
      }
    }
    // fallback: electron-store
    const config = this.getConfig()
    return config.apiKey ?? null
  }

  async setApiKey(key: string): Promise<void> {
    if (keytar) {
      try {
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, key)
        return
      } catch (err) {
        console.error('[ConfigManager] keytar setPassword failed, falling back to electron-store:', err)
      }
    }
    // fallback: electron-store
    this.setConfig({ apiKey: key })
  }

  async deleteApiKey(): Promise<void> {
    if (keytar) {
      try {
        await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME)
        return
      } catch (err) {
        console.error('[ConfigManager] keytar deletePassword failed:', err)
      }
    }
    this.setConfig({ apiKey: undefined })
  }

  // --- App Config ---

  getConfig(): AppConfig {
    return this.store.get('config') as AppConfig
  }

  setConfig(partial: Partial<AppConfig>): void {
    const current = this.getConfig()
    this.store.set('config', { ...current, ...partial })
  }

  get(key: string): unknown {
    const cfg = this.getConfig() as unknown as Record<string, unknown>
    return cfg[key] ?? null
  }

  set(key: string, value: unknown): void {
    this.setConfig({ [key]: value } as Partial<AppConfig>)
  }

  getAll(): AppConfig {
    return this.getConfig()
  }

  setAll(config: AppConfig): void {
    this.store.set('config', config)
  }

  // --- Window State ---

  getWindowState(): WindowState {
    return this.store.get('windowState') as WindowState
  }

  saveWindowState(state: WindowState): void {
    this.store.set('windowState', state)
  }

  // --- CLAUDE.md ---

  readClaudeMd(
    scope: 'global' | 'project',
    projectDir?: string
  ): { content: string; path: string } {
    const path = this.getClaudeMdPath(scope, projectDir)
    try {
      if (existsSync(path)) {
        return { content: readFileSync(path, 'utf-8'), path }
      }
    } catch (err) {
      console.error(`[ConfigManager] Failed to read CLAUDE.md at ${path}:`, err)
    }
    return { content: '', path }
  }

  saveClaudeMd(content: string, scope: 'global' | 'project', projectDir?: string): void {
    const path = this.getClaudeMdPath(scope, projectDir)
    try {
      writeFileSync(path, content, 'utf-8')
    } catch (err) {
      console.error(`[ConfigManager] Failed to write CLAUDE.md at ${path}:`, err)
      throw err
    }
  }

  getClaudeMdPath(scope: 'global' | 'project', projectDir?: string): string {
    if (scope === 'project' && projectDir) {
      return join(projectDir, 'CLAUDE.md')
    }
    return join(getAppClaudeDir(), 'CLAUDE.md')
  }
}

export const configManager = new ConfigManager()