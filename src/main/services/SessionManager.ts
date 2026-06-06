import { EventEmitter } from 'events'
import { homedir } from 'os'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { databaseService } from './DatabaseService.js'
import { AgentSDKBridge } from './AgentSDKBridge.js'
import { configManager } from './ConfigManager.js'
import type {
  Session,
  Message,
  CreateSessionParams,
  SendMessageParams,
  UsageStats,
  ToolCall,
  PermissionMode,
  MCPServerConfig,
  Skill
} from '../../shared/index.js'

function generateId(): string {
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateUsageId(): string {
  return `usage-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateToolCallId(): string {
  return `tc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export declare interface SessionManager {
  on(event: 'stream:chunk', listener: (data: { sessionId: string; type: string; data: { text: string } }) => void): this
  on(event: 'stream:tool-use', listener: (data: { sessionId: string; toolName: string; toolInput: Record<string, unknown> }) => void): this
  on(event: 'stream:tool-result', listener: (data: { sessionId: string; toolCallId: string; content: string; isError: boolean }) => void): this
  on(event: 'stream:complete', listener: (data: { sessionId: string }) => void): this
  on(event: 'stream:error', listener: (data: { sessionId: string; error: string; code: string }) => void): this
  on(event: 'permission:request', listener: (data: { sessionId: string; toolName: string; toolInput: Record<string, unknown> }) => void): this
}

export class SessionManager extends EventEmitter {
  private activeBridges: Map<string, AgentSDKBridge> = new Map()

  createSession(params: CreateSessionParams): Session {
    const config = configManager.getConfig()
    const now = Date.now()
    const id = generateId()
    let projectDir = params.projectDir
    if (!projectDir) {
      projectDir = join(homedir(), '.c-cc', 'sessions', id)
      mkdirSync(projectDir, { recursive: true })
    }
    const session: Session = {
      id,
      title: params.title ?? `Session ${new Date(now).toLocaleString()}`,
      projectDir,
      model: params.model ?? config.defaultModel,
      permMode: params.permMode ?? config.defaultPermMode,
      createdAt: now,
      updatedAt: now,
      sdkSessionId: null
    }

    databaseService.createSession(session)
    return session
  }

  resumeSession(sessionId: string): { session: Session; messages: Message[] } {
    const session = databaseService.getSession(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }
    const messages = databaseService.getMessages(sessionId)
    return { session, messages }
  }

  async sendMessage(
    params: SendMessageParams,
    mcpServers?: Record<string, MCPServerConfig>,
    skills?: Skill[]
  ): Promise<void> {
    const { sessionId, prompt } = params
    console.log(`[SessionManager] sendMessage sessionId=${sessionId} prompt="${prompt.slice(0, 60)}"`)

    const session = databaseService.getSession(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    // 保存用户消息
    const userMessage: Message = {
      id: generateMessageId(),
      sessionId,
      role: 'user',
      content: { text: prompt },
      createdAt: Date.now()
    }
    databaseService.createMessage(userMessage)
    this.updateSessionTime(sessionId)

    // 创建或获取 Bridge
    let bridge = this.activeBridges.get(sessionId)
    if (!bridge) {
      bridge = new AgentSDKBridge({
        sessionId,
        projectDir: session.projectDir,
        model: session.model,
        permMode: session.permMode as PermissionMode,
        sdkSessionId: session.sdkSessionId,
        mcpServers,
        skills,
        resume: session.sdkSessionId
      })
      this.activeBridges.set(sessionId, this.setupBridgeListeners(bridge))
    }

    console.log(`[SessionManager] bridge.run starting for ${sessionId}`)
    await bridge.run(prompt)
    console.log(`[SessionManager] bridge.run completed for ${sessionId}`)

    const current = databaseService.getSession(sessionId)
    if (current && /^Session \d/.test(current.title)) {
      const autoTitle = prompt.replace(/\n/g, ' ').slice(0, 50)
      databaseService.updateSession(sessionId, { title: autoTitle })
    }
  }

  private setupBridgeListeners(bridge: AgentSDKBridge): AgentSDKBridge {
    const sessionId = bridge.sessionId

    bridge.on('stream:chunk', (data) => {
      this.emit('stream:chunk', data)
    })

    bridge.on('stream:tool-use', (data) => {
      this.emit('stream:tool-use', {
        sessionId,
        toolName: data.toolUse.name,
        toolInput: data.toolUse.input
      })

      const toolCall: ToolCall = {
        id: generateToolCallId(),
        messageId: '',
        toolName: data.toolUse.name,
        toolInput: JSON.stringify(data.toolUse.input),
        toolResult: '{}',
        status: 'pending',
        createdAt: Date.now()
      }
      databaseService.createToolCall(toolCall)
    })

    bridge.on('stream:tool-result', (data) => {
      this.emit('stream:tool-result', {
        sessionId,
        toolCallId: data.toolResult.toolUseId,
        content: data.toolResult.content,
        isError: data.toolResult.isError
      })
    })

    bridge.on('stream:complete', (_data) => {
      this.emit('stream:complete', { sessionId })

      const assistantMessage: Message = {
        id: generateMessageId(),
        sessionId,
        role: 'assistant',
        content: { text: '' },
        createdAt: Date.now()
      }
      databaseService.createMessage(assistantMessage)

      this.updateSessionTime(sessionId)
    })

    bridge.on('stream:error', (data) => {
      this.emit('stream:error', data)
      this.updateSessionTime(sessionId)
    })

    bridge.on('permission:request', (data) => {
      this.emit('permission:request', data)
    })

    bridge.on('usage', (usage) => {
      const usageStats: UsageStats = {
        id: generateUsageId(),
        sessionId,
        costUsd: usage.costUsd,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        createdAt: Date.now()
      }
      databaseService.recordUsage(usageStats)
    })

    return bridge
  }

  resolvePermission(sessionId: string, _toolCallId: string, allowed: boolean): void {
    const bridge = this.activeBridges.get(sessionId)
    if (bridge) {
      bridge.resolvePermission(allowed)
    }
  }

  interruptSession(sessionId: string): void {
    const bridge = this.activeBridges.get(sessionId)
    if (bridge) {
      bridge.interrupt()
    }
  }

  deleteSession(sessionId: string): void {
    this.interruptSession(sessionId)
    this.activeBridges.delete(sessionId)
    databaseService.deleteSession(sessionId)
  }

  listSessions(): Session[] {
    return databaseService.listSessions()
  }

  searchSessions(query: string): Session[] {
    return databaseService.searchSessions(query)
  }

  getMessages(sessionId: string): Message[] {
    return databaseService.getMessages(sessionId)
  }

  getSession(sessionId: string): Session | null {
    return databaseService.getSession(sessionId)
  }

  updateSession(
    sessionId: string,
    partial: Partial<Pick<Session, 'title' | 'model' | 'permMode'>>
  ): Session | null {
    databaseService.updateSession(sessionId, partial)
    return databaseService.getSession(sessionId)
  }

  getSessionUsage(sessionId: string): { costUsd: number; inputTokens: number; outputTokens: number } {
    return databaseService.getSessionUsage(sessionId)
  }

  getGlobalUsageStats(): {
    totalCostUsd: number
    totalInputTokens: number
    totalOutputTokens: number
    totalSessions: number
    totalMessages: number
  } {
    return databaseService.getGlobalUsageStats()
  }

  private updateSessionTime(sessionId: string): void {
    databaseService.updateSession(sessionId, {})
  }
}

export const sessionManager = new SessionManager()