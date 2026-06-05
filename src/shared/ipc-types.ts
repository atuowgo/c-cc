// ========================================
// cc-bot IPC 通道类型定义
// 命名规范: {namespace}:{action}
// ========================================

import type {
  Session,
  Message,
  StreamChunk,
  PermissionRequest,
  PermissionResponse,
  Skill,
  MCPServerConfig,
  MCPServerStatus,
  AppConfig,
  CreateSessionParams,
  SendMessageParams,
  WindowState,
  FileAttachment
} from './types'

// ==========================================
// IPC 通道清单 & 请求/响应类型映射
// ==========================================

export interface IPCChannelMap {
  // --- Session ---
  'session:create': {
    request: CreateSessionParams
    response: Session
  }
  'session:send': {
    request: SendMessageParams
    response: { success: boolean }
  }
  'session:interrupt': {
    request: { sessionId: string }
    response: { success: boolean }
  }
  'session:resume': {
    request: { sessionId: string }
    response: { session: Session; messages: Message[] }
  }
  'session:delete': {
    request: { sessionId: string }
    response: { success: boolean }
  }
  'session:list': {
    request: void
    response: Session[]
  }
  'session:update': {
    request: { sessionId: string; title?: string; model?: string; permMode?: string }
    response: Session
  }
  'session:search': {
    request: { query: string }
    response: Session[]
  }

  // --- Stream (main → renderer push) ---
  'stream:chunk': {
    request: StreamChunk
    response: void
  }
  'stream:tool-use': {
    request: { sessionId: string; toolName: string; toolInput: Record<string, unknown> }
    response: void
  }
  'stream:tool-result': {
    request: { sessionId: string; toolCallId: string; content: string; isError: boolean }
    response: void
  }
  'stream:complete': {
    request: { sessionId: string }
    response: void
  }
  'stream:error': {
    request: { sessionId: string; error: string; code: string }
    response: void
  }

  // --- Permission ---
  'permission:request': {
    request: PermissionRequest
    response: void
  }
  'permission:respond': {
    request: PermissionResponse
    response: void
  }

  // --- Skill ---
  'skill:list': {
    request: void
    response: Skill[]
  }
  'skill:toggle': {
    request: { name: string; enabled: boolean }
    response: { success: boolean }
  }
  'skill:import': {
    request: { sourcePath: string }
    response: { success: boolean; skill?: Skill }
  }
  'skill:read': {
    request: { name: string }
    response: { content: string; path: string }
  }

  // --- MCP ---
  'mcp:list': {
    request: void
    response: MCPServerConfig[]
  }
  'mcp:add': {
    request: MCPServerConfig
    response: { success: boolean }
  }
  'mcp:delete': {
    request: { name: string }
    response: { success: boolean }
  }
  'mcp:status': {
    request: void
    response: MCPServerStatus[]
  }
  'mcp:tools': {
    request: { name: string }
    response: { tools: string[] }
  }

  // --- Config ---
  'config:get': {
    request: { key: string }
    response: unknown
  }
  'config:set': {
    request: { key: string; value: unknown }
    response: { success: boolean }
  }
  'config:get-all': {
    request: void
    response: AppConfig
  }
  'config:set-all': {
    request: AppConfig
    response: { success: boolean }
  }

  // --- CLAUDE.md ---
  'claude-md:read': {
    request: { scope: 'global' | 'project'; projectDir?: string }
    response: { content: string; path: string }
  }
  'claude-md:save': {
    request: { content: string; scope: 'global' | 'project'; projectDir?: string }
    response: { success: boolean }
  }

  // --- User Profile ---
  'user:profile': {
    request: void
    response: {
      authMethod: string
      totalSessions: number
      totalMessages: number
      totalCostUsd: number
      totalInputTokens: number
      totalOutputTokens: number
    }
  }
  'user:usage': {
    request: { sessionId?: string }
    response: {
      costUsd: number
      inputTokens: number
      outputTokens: number
    }
  }

  // --- File ---
  'file:pick-directory': {
    request: void
    response: { path: string } | null
  }
  'file:pick-files': {
    request: { filters?: Array<{ name: string; extensions: string[] }> }
    response: FileAttachment[]
  }
  'file:read': {
    request: { path: string }
    response: { content: string; name: string }
  }

  // --- Window ---
  'window:state': {
    request: void
    response: WindowState
  }
  'window:save-state': {
    request: WindowState
    response: { success: boolean }
  }

  // --- Update ---
  'update:check': {
    request: void
    response: { available: boolean; version?: string }
  }
  'update:install': {
    request: void
    response: { success: boolean }
  }

  // --- Terminal ---
  'terminal:create': {
    request: { sessionId: string; cwd?: string; cols?: number; rows?: number }
    response: { terminalId: string }
  }
  'terminal:input': {
    request: { terminalId: string; data: string }
    response: { success: boolean }
  }
  'terminal:resize': {
    request: { terminalId: string; cols: number; rows: number }
    response: { success: boolean }
  }
  'terminal:output': {
    request: { terminalId: string; data: string }
    response: void
  }
}

// 辅助类型：提取请求/响应类型
export type IPCChannel = keyof IPCChannelMap
export type IPCRequest<T extends IPCChannel> = IPCChannelMap[T]['request']
export type IPCResponse<T extends IPCChannel> = IPCChannelMap[T]['response']