// ========================================
// cc-bot 共享类型定义
// ========================================

// --- 权限模式 ---
export type PermissionMode = 'default' | 'acceptEdits' | 'plan' | 'auto' | 'bypassPermissions'

// --- 模型标识 ---
export type ModelName =
  | 'claude-opus-4-6'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5'
  | string

// --- API Provider ---
export type ApiProvider = 'anthropic' | 'bedrock' | 'vertex' | 'azure'

// --- 会话 ---
export interface Session {
  id: string
  title: string
  projectDir: string
  model: ModelName
  permMode: PermissionMode
  createdAt: number
  updatedAt: number
  sdkSessionId: string | null
}

// --- 消息 ---
export type MessageRole = 'user' | 'assistant' | 'tool_use' | 'tool_result'

export interface MessageContent {
  text?: string
  toolUse?: ToolUse
  toolResult?: ToolResult
}

export interface Message {
  id: string
  sessionId: string
  role: MessageRole
  content: MessageContent
  createdAt: number
}

// --- 工具调用 ---
export interface ToolUse {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResult {
  toolUseId: string
  content: string
  isError: boolean
}

export interface ToolCall {
  id: string
  messageId: string
  toolName: string
  toolInput: string // JSON
  toolResult: string // JSON
  status: 'pending' | 'success' | 'error' | 'blocked'
  createdAt: number
}

// --- 流式消息 ---
export type StreamChunkType = 'text' | 'tool_use' | 'tool_result' | 'assistant' | 'user' | 'system'

export interface StreamChunk {
  type: StreamChunkType
  sessionId: string
  data: Record<string, unknown>
}

// --- 用量统计 ---
export interface UsageStats {
  id: string
  sessionId: string
  costUsd: number
  inputTokens: number
  outputTokens: number
  createdAt: number
}

// --- 会话创建参数 ---
export interface CreateSessionParams {
  projectDir: string
  model?: ModelName
  permMode?: PermissionMode
  title?: string
}

// --- 发送消息参数 ---
export interface SendMessageParams {
  sessionId: string
  prompt: string
  attachments?: FileAttachment[]
}

export interface FileAttachment {
  name: string
  path: string
  type: 'image' | 'pdf' | 'text'
  content?: string
}

// --- 权限请求 ---
export interface PermissionRequest {
  sessionId: string
  toolName: string
  toolInput: Record<string, unknown>
}

export interface PermissionResponse {
  sessionId: string
  toolCallId: string
  allowed: boolean
}

// --- Skill ---
export interface Skill {
  name: string
  description: string
  path: string
  enabled: boolean
  scope: 'global' | 'project'
}

// --- MCP Server ---
export type MCPTransport = 'stdio' | 'http' | 'sse'

export interface MCPServerConfig {
  name: string
  command?: string
  args?: string[]
  url?: string
  transport: MCPTransport
  env?: Record<string, string>
}

export interface MCPServerStatus {
  name: string
  status: 'online' | 'offline' | 'error'
  tools: string[]
  error?: string
}

// --- 配置 ---
export interface AppConfig {
  apiKey?: string
  apiProvider: ApiProvider
  defaultModel: ModelName
  defaultPermMode: PermissionMode
  theme: 'dark' | 'light' | 'system'
  language: 'zh-CN' | 'en-US'
  fontSize: number
  proxy?: string
  // Bedrock
  bedrockAccessKeyId?: string
  bedrockSecretAccessKey?: string
  bedrockRegion?: string
  // Vertex
  vertexProjectId?: string
  vertexRegion?: string
  // Azure
  azureEndpoint?: string
  azureApiVersion?: string
}

// --- 窗口状态 ---
export interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
}