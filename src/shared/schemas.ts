import { z } from 'zod'

// ========================================
// cc-bot Zod 校验 Schema
// ========================================

// --- 权限模式 ---
export const PermissionModeSchema = z.enum([
  'default',
  'acceptEdits',
  'plan',
  'auto',
  'bypassPermissions'
])

// --- API Provider ---
export const ApiProviderSchema = z.enum(['anthropic', 'bedrock', 'vertex', 'azure'])

// --- 会话创建 ---
export const CreateSessionSchema = z.object({
  projectDir: z.string().optional(),
  model: z.string().optional(),
  permMode: PermissionModeSchema.optional().default('default'),
  title: z.string().optional()
})

// --- 发送消息 ---
export const FileAttachmentSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(['image', 'pdf', 'text']),
  content: z.string().optional()
})

export const SendMessageSchema = z.object({
  sessionId: z.string().min(1),
  prompt: z.string().min(1),
  attachments: z.array(FileAttachmentSchema).optional()
})

// --- 会话操作 ---
export const SessionIdSchema = z.object({
  sessionId: z.string().min(1)
})

export const DeleteSessionSchema = z.object({
  sessionId: z.string().min(1)
})

// --- 权限响应 ---
export const PermissionResponseSchema = z.object({
  sessionId: z.string().min(1),
  toolCallId: z.string().min(1),
  allowed: z.boolean()
})

// --- Skill 操作 ---
export const SkillToggleSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean()
})

export const SkillImportSchema = z.object({
  sourcePath: z.string().min(1)
})

// --- MCP 操作 ---
export const MCPTransportSchema = z.enum(['stdio', 'http', 'sse'])

export const MCPAddSchema = z.object({
  name: z.string().min(1),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  url: z.string().optional(),
  transport: MCPTransportSchema,
  env: z.record(z.string(), z.string()).optional()
})

export const MCPDeleteSchema = z.object({
  name: z.string().min(1)
})

// --- 配置 ---
export const ConfigSetSchema = z.object({
  key: z.string().min(1),
  value: z.unknown()
})

export const ConfigGetSchema = z.object({
  key: z.string().min(1)
})

export const AppConfigSchema = z.object({
  apiKey: z.string().optional(),
  apiProvider: ApiProviderSchema.default('anthropic'),
  defaultModel: z.string().default('claude-sonnet-4-6'),
  defaultPermMode: PermissionModeSchema.default('default'),
  theme: z.enum(['dark', 'light', 'system']).default('dark'),
  language: z.enum(['zh-CN', 'en-US']).default('zh-CN'),
  fontSize: z.number().min(12).max(24).default(14),
  proxy: z.string().optional(),
  bedrockAccessKeyId: z.string().optional(),
  bedrockSecretAccessKey: z.string().optional(),
  bedrockRegion: z.string().optional(),
  vertexProjectId: z.string().optional(),
  vertexRegion: z.string().optional(),
  azureEndpoint: z.string().optional(),
  azureApiVersion: z.string().optional()
})

// --- 窗口状态 ---
export const WindowStateSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().min(900),
  height: z.number().min(600),
  isMaximized: z.boolean().default(false)
})

// --- 会话搜索 ---
export const SearchSessionsSchema = z.object({
  query: z.string().min(1)
})

// --- CLAUDE.md ---
export const SaveClaudeMdSchema = z.object({
  content: z.string(),
  scope: z.enum(['global', 'project']),
  projectDir: z.string().optional()
})

// --- 终端 ---
export const TerminalCreateSchema = z.object({
  sessionId: z.string().min(1),
  cwd: z.string().optional(),
  cols: z.number().optional().default(80),
  rows: z.number().optional().default(24)
})

export const TerminalInputSchema = z.object({
  terminalId: z.string().min(1),
  data: z.string()
})

export const TerminalResizeSchema = z.object({
  terminalId: z.string().min(1),
  cols: z.number(),
  rows: z.number()
})