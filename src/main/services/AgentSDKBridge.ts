import { EventEmitter } from 'events'
import { query } from '@anthropic-ai/claude-agent-sdk'
import type { PermissionMode, MCPServerConfig, Skill, MessageContent, ToolUse, ToolResult } from '../../shared/index.js'
import { configManager } from './ConfigManager.js'

export interface AgentSDKBridgeOptions {
  sessionId: string
  projectDir: string
  model?: string
  permMode?: PermissionMode
  sdkSessionId?: string | null
  mcpServers?: Record<string, MCPServerConfig>
  skills?: Skill[]
  resume?: string | null
}

export declare interface AgentSDKBridge {
  on(event: 'stream:chunk', listener: (chunk: { sessionId: string; type: string; data: { text: string } }) => void): this
  on(event: 'stream:tool-use', listener: (tool: { sessionId: string; toolUse: ToolUse }) => void): this
  on(event: 'stream:tool-result', listener: (result: { sessionId: string; toolResult: ToolResult }) => void): this
  on(event: 'stream:complete', listener: (data: { sessionId: string; messages: MessageContent[] }) => void): this
  on(event: 'stream:error', listener: (error: { sessionId: string; error: string; code: string }) => void): this
  on(event: 'permission:request', listener: (req: { sessionId: string; toolName: string; toolInput: Record<string, unknown> }) => void): this
  on(event: 'usage', listener: (usage: { costUsd: number; inputTokens: number; outputTokens: number }) => void): this
}

export class AgentSDKBridge extends EventEmitter {
  readonly sessionId: string
  private projectDir: string
  private model: string
  private permMode: PermissionMode
  private mcpServers: Record<string, MCPServerConfig>
  private skills: Skill[]
  private resumeSessionId: string | null
  private abortController: AbortController | null = null
  private permissionResolver: ((allowed: boolean) => void) | null = null
  private isRunning = false

  constructor(options: AgentSDKBridgeOptions) {
    super()
    this.sessionId = options.sessionId
    this.projectDir = options.projectDir
    this.model = options.model ?? 'claude-sonnet-4-6'
    this.permMode = options.permMode ?? 'default'
    this.mcpServers = options.mcpServers ?? {}
    this.skills = options.skills ?? []
    this.resumeSessionId = options.resume ?? null
  }

  get active(): boolean {
    return this.isRunning
  }

  async run(prompt: string): Promise<void> {
    if (this.isRunning) {
      throw new Error(`Session ${this.sessionId} is already running a query`)
    }

    this.isRunning = true
    this.abortController = new AbortController()

    try {
      const apiKey = await configManager.getApiKey()
      if (!apiKey) {
        throw new Error('API key not configured')
      }

      const config = configManager.getConfig()

      // 构建 SDK options
      const sdkOptions: Record<string, unknown> = {
        model: this.model,
        permissionMode: this.permMode,
        cwd: this.projectDir,
        abortController: this.abortController
      }

      // MCP servers 配置
      if (Object.keys(this.mcpServers).length > 0) {
        sdkOptions.mcpServers = this.mcpServers
      }

      // Skills
      if (this.skills.length > 0) {
        sdkOptions.skills = this.skills
      }

      // Session resume
      if (this.resumeSessionId) {
        sdkOptions.resume = this.resumeSessionId
      }

      // CLAUDE.md 注入
      const globalClaudeMd = configManager.readClaudeMd('global')
      const projectClaudeMd = configManager.readClaudeMd('project', this.projectDir)
      if (globalClaudeMd.content || projectClaudeMd.content) {
        const settingSources: string[] = []
        if (globalClaudeMd.content) {
          settingSources.push(globalClaudeMd.content)
        }
        if (projectClaudeMd.content) {
          settingSources.push(projectClaudeMd.content)
        }
        sdkOptions.settingSources = settingSources
      }

      // Proxy
      if (config.proxy) {
        sdkOptions.proxy = config.proxy
      }

      // 权限钩子
      const hooks = {
        PreToolUse: async (input: { tool_name: string; tool_input: Record<string, unknown> }) => {
          this.emit('stream:tool-use', {
            sessionId: this.sessionId,
            toolUse: {
              id: this.generateId(),
              name: input.tool_name,
              input: input.tool_input
            }
          })

          // 发送权限请求并等待回复
          return new Promise<{ allowed: boolean }>((resolve) => {
            this.permissionResolver = (allowed: boolean) => {
              resolve({ allowed })
            }
            this.emit('permission:request', {
              sessionId: this.sessionId,
              toolName: input.tool_name,
              toolInput: input.tool_input
            })
          })
        }
      }

      sdkOptions.hooks = hooks

      // 执行 query
      console.log(`[AgentSDKBridge] query starting session=${this.sessionId} model=${this.model}`)
      const generator = query({
        prompt,
        options: sdkOptions as Record<string, unknown>
      }) as AsyncGenerator<Record<string, unknown>, void, unknown>

      let msgCount = 0
      for await (const msg of generator) {
        if (this.abortController?.signal.aborted) break
        msgCount++
        console.log(`[AgentSDKBridge] msg #${msgCount} type=${msg.type}`)
        this.processSDKMessage(msg)
      }
      console.log(`[AgentSDKBridge] query finished, total msgs=${msgCount}`)

      this.emit('stream:complete', {
        sessionId: this.sessionId,
        messages: []
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[AgentSDKBridge] Error in session ${this.sessionId}:`, message)
      this.emit('stream:error', {
        sessionId: this.sessionId,
        error: message,
        code: 'SDK_ERROR'
      })
    } finally {
      this.isRunning = false
      this.abortController = null
    }
  }

  resolvePermission(allowed: boolean): void {
    if (this.permissionResolver) {
      this.permissionResolver(allowed)
      this.permissionResolver = null
    }
  }

  interrupt(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  private processSDKMessage(msg: Record<string, unknown>): void {
    const type = msg.type as string

    switch (type) {
      case 'assistant':
      case 'user':
      case 'system': {
        // 提取文本内容
        const content = this.extractTextContent(msg)
        if (content) {
          this.emit('stream:chunk', {
            sessionId: this.sessionId,
            type,
            data: { text: content }
          })
        }

        // 提取 usage 信息
        const usage = msg.usage as Record<string, unknown> | undefined
        if (usage) {
          const costUsd = (usage.cost_usd as number) ?? (usage.costUSD as number) ?? 0
          const inputTokens = (usage.input_tokens as number) ?? 0
          const outputTokens = (usage.output_tokens as number) ?? 0
          if (costUsd > 0 || inputTokens > 0 || outputTokens > 0) {
            this.emit('usage', { costUsd, inputTokens, outputTokens })
          }
        }

        break
      }

      case 'tool_use': {
        const toolName = msg.tool as string
        const toolInput = msg.input as Record<string, unknown>
        this.emit('stream:tool-use', {
          sessionId: this.sessionId,
          toolUse: {
            id: this.generateId(),
            name: toolName,
            input: toolInput
          }
        })
        break
      }

      case 'tool_result': {
        this.emit('stream:tool-result', {
          sessionId: this.sessionId,
          toolResult: {
            toolUseId: (msg.tool_use_id as string) ?? '',
            content: (msg.content as string) ?? JSON.stringify(msg),
            isError: (msg.is_error as boolean) ?? false
          }
        })
        break
      }

      case 'stream_event':
      case 'content_block_delta':
      case 'content_block_start':
      case 'content_block_stop': {
        const text = this.extractTextContent(msg)
        if (text) {
          this.emit('stream:chunk', {
            sessionId: this.sessionId,
            type: 'text',
            content: text
          })
        }
        break
      }

      default:
        // 忽略未知消息类型
        break
    }
  }

  private extractTextContent(msg: Record<string, unknown>): string {
    // 尝试多个可能的文本字段路径
    const content = msg.content
    if (typeof content === 'string') return content

    if (Array.isArray(content)) {
      return content
        .map((block: Record<string, unknown>) => {
          if (block.type === 'text' && typeof block.text === 'string') return block.text
          return ''
        })
        .join('')
    }

    const text = msg.text
    if (typeof text === 'string') return text

    const delta = msg.delta as Record<string, unknown> | undefined
    if (delta && typeof delta.text === 'string') return delta.text

    return ''
  }

  private generateId(): string {
    return `tool-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }
}