import type {
  Session,
  CreateSessionParams,
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

export interface ClaudeAPI {
  session: {
    create(opts: CreateSessionParams): Promise<Session>
    send(sessionId: string, prompt: string, attachments?: FileAttachment[]): Promise<{ success: boolean }>
    interrupt(sessionId: string): Promise<{ success: boolean }>
    resume(sessionId: string): Promise<{ session: Session; messages: Message[] }>
    delete(sessionId: string): Promise<{ success: boolean }>
    list(): Promise<Session[]>
    update(sessionId: string, updates: { title?: string; model?: string; permMode?: string }): Promise<Session>
    search(query: string): Promise<Session[]>
  }

  onStreamChunk(cb: (data: StreamChunk) => void): () => void
  onToolUse(cb: (data: { sessionId: string; toolName: string; toolInput: Record<string, unknown> }) => void): () => void
  onToolResult(cb: (data: { sessionId: string; toolCallId: string; content: string; isError: boolean }) => void): () => void
  onStreamComplete(cb: (data: { sessionId: string }) => void): () => void
  onStreamError(cb: (data: { sessionId: string; error: string; code: string }) => void): () => void
  onPermissionRequest(cb: (data: PermissionRequest) => void): () => void

  permission: {
    respond(sessionId: string, toolCallId: string, allowed: boolean): Promise<void>
  }

  skill: {
    list(): Promise<Skill[]>
    toggle(name: string, enabled: boolean): Promise<{ success: boolean }>
    import(sourcePath: string): Promise<{ success: boolean; skill?: Skill }>
    read(name: string): Promise<{ content: string; path: string }>
  }

  mcp: {
    list(): Promise<MCPServerConfig[]>
    add(config: MCPServerConfig): Promise<{ success: boolean }>
    delete(name: string): Promise<{ success: boolean }>
    status(): Promise<MCPServerStatus[]>
    tools(name: string): Promise<{ tools: string[] }>
  }

  config: {
    get(key: string): Promise<unknown>
    set(key: string, value: unknown): Promise<{ success: boolean }>
    getAll(): Promise<AppConfig>
    setAll(config: AppConfig): Promise<{ success: boolean }>
  }

  claudeMd: {
    read(scope: 'global' | 'project', projectDir?: string): Promise<{ content: string; path: string }>
    save(content: string, scope: 'global' | 'project', projectDir?: string): Promise<{ success: boolean }>
  }

  user: {
    profile(): Promise<{
      authMethod: string
      totalSessions: number
      totalMessages: number
      totalCostUsd: number
      totalInputTokens: number
      totalOutputTokens: number
    }>
    usage(sessionId?: string): Promise<{ costUsd: number; inputTokens: number; outputTokens: number }>
  }

  file: {
    pickDirectory(): Promise<{ path: string } | null>
    pickFiles(filters?: Array<{ name: string; extensions: string[] }>): Promise<FileAttachment[]>
    read(path: string): Promise<{ content: string; name: string }>
  }

  window: {
    getState(): Promise<WindowState>
    saveState(state: WindowState): Promise<{ success: boolean }>
    minimize(): void
    maximize(): void
    close(): void
  }

  update: {
    check(): Promise<{ available: boolean; version?: string }>
    install(): Promise<{ success: boolean }>
  }

  terminal: {
    create(sessionId: string, cwd?: string, cols?: number, rows?: number): Promise<{ terminalId: string }>
    input(terminalId: string, data: string): Promise<{ success: boolean }>
    resize(terminalId: string, cols: number, rows: number): Promise<{ success: boolean }>
    onOutput(cb: (data: { terminalId: string; data: string }) => void): () => void
  }
}

declare global {
  interface Window {
    claudeAPI: ClaudeAPI
  }
}