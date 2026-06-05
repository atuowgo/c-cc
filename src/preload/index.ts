import { contextBridge, ipcRenderer } from 'electron'
import type {
  Session,
  CreateSessionParams,
  SendMessageParams,
  FileAttachment,
  StreamChunk,
  PermissionRequest,
  Skill,
  MCPServerConfig,
  MCPServerStatus,
  AppConfig,
  WindowState,
  Message,
} from '../shared/types'

// ========================================
// cc-bot Preload Script
// contextBridge API: window.claudeAPI
// ========================================

const claudeAPI = {
  // --- Session ---
  session: {
    create: (opts: CreateSessionParams): Promise<Session> =>
      ipcRenderer.invoke('session:create', opts),
    send: (
      sessionId: string,
      prompt: string,
      attachments?: FileAttachment[],
    ): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('session:send', { sessionId, prompt, attachments } as SendMessageParams),
    interrupt: (sessionId: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('session:interrupt', { sessionId }),
    resume: (sessionId: string): Promise<{ session: Session; messages: Message[] }> =>
      ipcRenderer.invoke('session:resume', { sessionId }),
    delete: (sessionId: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('session:delete', { sessionId }),
    list: (): Promise<Session[]> => ipcRenderer.invoke('session:list'),
    update: (
      sessionId: string,
      updates: { title?: string; model?: string; permMode?: string },
    ): Promise<Session> => ipcRenderer.invoke('session:update', { sessionId, ...updates }),
    search: (query: string): Promise<Session[]> =>
      ipcRenderer.invoke('session:search', { query }),
  },

  // --- Stream listeners (main -> renderer push) ---
  onStreamChunk: (cb: (data: StreamChunk) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: StreamChunk) => cb(data)
    ipcRenderer.on('stream:chunk', handler)
    return () => ipcRenderer.removeListener('stream:chunk', handler)
  },

  onToolUse: (
    cb: (data: { sessionId: string; toolName: string; toolInput: Record<string, unknown> }) => void,
  ): (() => void) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      data: { sessionId: string; toolName: string; toolInput: Record<string, unknown> },
    ) => cb(data)
    ipcRenderer.on('stream:tool-use', handler)
    return () => ipcRenderer.removeListener('stream:tool-use', handler)
  },

  onToolResult: (
    cb: (data: {
      sessionId: string
      toolCallId: string
      content: string
      isError: boolean
    }) => void,
  ): (() => void) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      data: { sessionId: string; toolCallId: string; content: string; isError: boolean },
    ) => cb(data)
    ipcRenderer.on('stream:tool-result', handler)
    return () => ipcRenderer.removeListener('stream:tool-result', handler)
  },

  onStreamComplete: (cb: (data: { sessionId: string }) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: { sessionId: string }) => cb(data)
    ipcRenderer.on('stream:complete', handler)
    return () => ipcRenderer.removeListener('stream:complete', handler)
  },

  onStreamError: (
    cb: (data: { sessionId: string; error: string; code: string }) => void,
  ): (() => void) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      data: { sessionId: string; error: string; code: string },
    ) => cb(data)
    ipcRenderer.on('stream:error', handler)
    return () => ipcRenderer.removeListener('stream:error', handler)
  },

  onPermissionRequest: (cb: (data: PermissionRequest) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: PermissionRequest) => cb(data)
    ipcRenderer.on('permission:request', handler)
    return () => ipcRenderer.removeListener('permission:request', handler)
  },

  // --- Permission ---
  permission: {
    respond: (
      sessionId: string,
      toolCallId: string,
      allowed: boolean,
    ): Promise<void> => ipcRenderer.invoke('permission:respond', { sessionId, toolCallId, allowed }),
  },

  // --- Skill ---
  skill: {
    list: (): Promise<Skill[]> => ipcRenderer.invoke('skill:list'),
    toggle: (name: string, enabled: boolean): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('skill:toggle', { name, enabled }),
    import: (sourcePath: string): Promise<{ success: boolean; skill?: Skill }> =>
      ipcRenderer.invoke('skill:import', { sourcePath }),
    read: (name: string): Promise<{ content: string; path: string }> =>
      ipcRenderer.invoke('skill:read', { name }),
  },

  // --- MCP ---
  mcp: {
    list: (): Promise<MCPServerConfig[]> => ipcRenderer.invoke('mcp:list'),
    add: (config: MCPServerConfig): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('mcp:add', config),
    delete: (name: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('mcp:delete', { name }),
    status: (): Promise<MCPServerStatus[]> => ipcRenderer.invoke('mcp:status'),
    tools: (name: string): Promise<{ tools: string[] }> =>
      ipcRenderer.invoke('mcp:tools', { name }),
  },

  // --- Config ---
  config: {
    get: (key: string): Promise<unknown> => ipcRenderer.invoke('config:get', { key }),
    set: (key: string, value: unknown): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('config:set', { key, value }),
    getAll: (): Promise<AppConfig> => ipcRenderer.invoke('config:get-all'),
    setAll: (config: AppConfig): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('config:set-all', config),
  },

  // --- CLAUDE.md ---
  claudeMd: {
    read: (
      scope: 'global' | 'project',
      projectDir?: string,
    ): Promise<{ content: string; path: string }> =>
      ipcRenderer.invoke('claude-md:read', { scope, projectDir }),
    save: (
      content: string,
      scope: 'global' | 'project',
      projectDir?: string,
    ): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('claude-md:save', { content, scope, projectDir }),
  },

  // --- User ---
  user: {
    profile: (): Promise<{
      authMethod: string
      totalSessions: number
      totalMessages: number
      totalCostUsd: number
      totalInputTokens: number
      totalOutputTokens: number
    }> => ipcRenderer.invoke('user:profile'),
    usage: (
      sessionId?: string,
    ): Promise<{ costUsd: number; inputTokens: number; outputTokens: number }> =>
      ipcRenderer.invoke('user:usage', { sessionId }),
  },

  // --- File ---
  file: {
    pickDirectory: (): Promise<{ path: string } | null> =>
      ipcRenderer.invoke('file:pick-directory'),
    pickFiles: (
      filters?: Array<{ name: string; extensions: string[] }>,
    ): Promise<FileAttachment[]> => ipcRenderer.invoke('file:pick-files', { filters }),
    read: (path: string): Promise<{ content: string; name: string }> =>
      ipcRenderer.invoke('file:read', { path }),
  },

  // --- Window ---
  window: {
    getState: (): Promise<WindowState> => ipcRenderer.invoke('window:state'),
    saveState: (state: WindowState): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('window:save-state', state),
  },

  // --- Update ---
  update: {
    check: (): Promise<{ available: boolean; version?: string }> =>
      ipcRenderer.invoke('update:check'),
    install: (): Promise<{ success: boolean }> => ipcRenderer.invoke('update:install'),
  },

  // --- Terminal ---
  terminal: {
    create: (
      sessionId: string,
      cwd?: string,
      cols?: number,
      rows?: number,
    ): Promise<{ terminalId: string }> =>
      ipcRenderer.invoke('terminal:create', { sessionId, cwd, cols, rows }),
    input: (terminalId: string, data: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('terminal:input', { terminalId, data }),
    resize: (terminalId: string, cols: number, rows: number): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('terminal:resize', { terminalId, cols, rows }),
    onOutput: (
      cb: (data: { terminalId: string; data: string }) => void,
    ): (() => void) => {
      const handler = (
        _: Electron.IpcRendererEvent,
        data: { terminalId: string; data: string },
      ) => cb(data)
      ipcRenderer.on('terminal:output', handler)
      return () => ipcRenderer.removeListener('terminal:output', handler)
    },
  },
}

contextBridge.exposeInMainWorld('claudeAPI', claudeAPI)

export type ClaudeAPI = typeof claudeAPI