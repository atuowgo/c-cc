import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import type { Session, Message, ToolCall, UsageStats, MessageRole, MessageContent } from '../../shared/index.js'

interface SessionRow {
  id: string
  title: string
  project_dir: string
  model: string
  perm_mode: string
  sdk_session_id: string | null
  created_at: number
  updated_at: number
}

interface MessageRow {
  id: string
  session_id: string
  role: string
  content: string
  created_at: number
}

interface ToolCallRow {
  id: string
  message_id: string
  tool_name: string
  tool_input: string
  tool_result: string
  status: string
  created_at: number
}

export class DatabaseService {
  private static instance: DatabaseService
  private db: Database.Database

  private constructor() {
    const dbPath = join(app.getPath('userData'), 'cc-bot.db')
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('foreign_keys = ON')
    this.initTables()
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        project_dir TEXT NOT NULL,
        model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
        perm_mode TEXT NOT NULL DEFAULT 'default',
        sdk_session_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tool_calls (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        tool_input TEXT NOT NULL,
        tool_result TEXT NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS usage_stats (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        cost_usd REAL NOT NULL DEFAULT 0,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_tool_calls_message ON tool_calls(message_id);
      CREATE INDEX IF NOT EXISTS idx_usage_stats_session ON usage_stats(session_id);
    `)
  }

  getDb(): Database.Database {
    return this.db
  }

  // --- Sessions ---

  createSession(session: Session): void {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, title, project_dir, model, perm_mode, sdk_session_id, created_at, updated_at)
      VALUES (@id, @title, @project_dir, @model, @perm_mode, @sdk_session_id, @created_at, @updated_at)
    `)
    stmt.run({
      id: session.id,
      title: session.title,
      project_dir: session.projectDir,
      model: session.model,
      perm_mode: session.permMode,
      sdk_session_id: session.sdkSessionId,
      created_at: session.createdAt,
      updated_at: session.updatedAt
    })
  }

  getSession(id: string): Session | null {
    const row = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow | undefined
    if (!row) return null
    return this.rowToSession(row)
  }

  listSessions(): Session[] {
    const rows = this.db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC').all() as SessionRow[]
    return rows.map((r) => this.rowToSession(r))
  }

  searchSessions(query: string): Session[] {
    const rows = this.db
      .prepare('SELECT * FROM sessions WHERE title LIKE ? ORDER BY updated_at DESC')
      .all(`%${query}%`) as SessionRow[]
    return rows.map((r) => this.rowToSession(r))
  }

  updateSession(id: string, partial: Partial<Pick<Session, 'title' | 'model' | 'permMode' | 'sdkSessionId'>>): void {
    const sets: string[] = ['updated_at = ?']
    const vals: unknown[] = [Date.now()]

    if (partial.title !== undefined) { sets.push('title = ?'); vals.push(partial.title) }
    if (partial.model !== undefined) { sets.push('model = ?'); vals.push(partial.model) }
    if (partial.permMode !== undefined) { sets.push('perm_mode = ?'); vals.push(partial.permMode) }
    if (partial.sdkSessionId !== undefined) { sets.push('sdk_session_id = ?'); vals.push(partial.sdkSessionId) }

    vals.push(id)
    this.db.prepare(`UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  }

  deleteSession(id: string): void {
    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
  }

  // --- Messages ---

  createMessage(message: Message): void {
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, session_id, role, content, created_at)
      VALUES (@id, @session_id, @role, @content, @created_at)
    `)
    stmt.run({
      id: message.id,
      session_id: message.sessionId,
      role: message.role,
      content: JSON.stringify(message.content),
      created_at: message.createdAt
    })
  }

  getMessages(sessionId: string): Message[] {
    const rows = this.db
      .prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC')
      .all(sessionId) as MessageRow[]
    return rows.map((r) => this.rowToMessage(r))
  }

  getMessage(id: string): Message | null {
    const row = this.db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as MessageRow | undefined
    if (!row) return null
    return this.rowToMessage(row)
  }

  // --- Tool Calls ---

  createToolCall(toolCall: ToolCall): void {
    const stmt = this.db.prepare(`
      INSERT INTO tool_calls (id, message_id, tool_name, tool_input, tool_result, status, created_at)
      VALUES (@id, @message_id, @tool_name, @tool_input, @tool_result, @status, @created_at)
    `)
    stmt.run({
      id: toolCall.id,
      message_id: toolCall.messageId,
      tool_name: toolCall.toolName,
      tool_input: toolCall.toolInput,
      tool_result: toolCall.toolResult,
      status: toolCall.status,
      created_at: toolCall.createdAt
    })
  }

  updateToolCallStatus(id: string, status: string, toolResult?: string): void {
    if (toolResult) {
      this.db
        .prepare('UPDATE tool_calls SET status = ?, tool_result = ? WHERE id = ?')
        .run(status, toolResult, id)
    } else {
      this.db.prepare('UPDATE tool_calls SET status = ? WHERE id = ?').run(status, id)
    }
  }

  getToolCalls(messageId: string): ToolCall[] {
    const rows = this.db
      .prepare('SELECT * FROM tool_calls WHERE message_id = ? ORDER BY created_at ASC')
      .all(messageId) as ToolCallRow[]
    return rows.map((r) => this.rowToToolCall(r))
  }

  // --- Usage Stats ---

  recordUsage(stats: UsageStats): void {
    const stmt = this.db.prepare(`
      INSERT INTO usage_stats (id, session_id, cost_usd, input_tokens, output_tokens, created_at)
      VALUES (@id, @session_id, @cost_usd, @input_tokens, @output_tokens, @created_at)
    `)
    stmt.run({
      id: stats.id,
      session_id: stats.sessionId,
      cost_usd: stats.costUsd,
      input_tokens: stats.inputTokens,
      output_tokens: stats.outputTokens,
      created_at: stats.createdAt
    })
  }

  getSessionUsage(sessionId: string): { costUsd: number; inputTokens: number; outputTokens: number } {
    const row = this.db
      .prepare(`
        SELECT
          COALESCE(SUM(cost_usd), 0) AS costUsd,
          COALESCE(SUM(input_tokens), 0) AS inputTokens,
          COALESCE(SUM(output_tokens), 0) AS outputTokens
        FROM usage_stats WHERE session_id = ?
      `)
      .get(sessionId) as { costUsd: number; inputTokens: number; outputTokens: number } | undefined
    return row ?? { costUsd: 0, inputTokens: 0, outputTokens: 0 }
  }

  getUserProfile(): {
    authMethod: string
    totalSessions: number
    totalMessages: number
    totalCostUsd: number
    totalInputTokens: number
    totalOutputTokens: number
  } {
    const sessions = this.db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number }
    const messages = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }
    const usage = this.db
      .prepare(
        'SELECT COALESCE(SUM(cost_usd), 0) as cost, COALESCE(SUM(input_tokens), 0) as input, COALESCE(SUM(output_tokens), 0) as output FROM usage_stats'
      )
      .get() as { cost: number; input: number; output: number }

    return {
      authMethod: 'api_key',
      totalSessions: sessions.count,
      totalMessages: messages.count,
      totalCostUsd: usage.cost,
      totalInputTokens: usage.input,
      totalOutputTokens: usage.output
    }
  }

  getUsage(sessionId?: string): {
    costUsd: number
    inputTokens: number
    outputTokens: number
  } {
    if (sessionId) {
      const row = this.db
        .prepare(
          'SELECT COALESCE(SUM(cost_usd), 0) as cost, COALESCE(SUM(input_tokens), 0) as input, COALESCE(SUM(output_tokens), 0) as output FROM usage_stats WHERE session_id = ?'
        )
        .get(sessionId) as { cost: number; input: number; output: number }
      return { costUsd: row.cost, inputTokens: row.input, outputTokens: row.output }
    }

    const row = this.db
      .prepare(
        'SELECT COALESCE(SUM(cost_usd), 0) as cost, COALESCE(SUM(input_tokens), 0) as input, COALESCE(SUM(output_tokens), 0) as output FROM usage_stats'
      )
      .get() as { cost: number; input: number; output: number }
    return { costUsd: row.cost, inputTokens: row.input, outputTokens: row.output }
  }

  getGlobalUsageStats(): {
    totalCostUsd: number
    totalInputTokens: number
    totalOutputTokens: number
    totalSessions: number
    totalMessages: number
  } {
    const profile = this.getUserProfile()
    return {
      totalCostUsd: profile.totalCostUsd,
      totalInputTokens: profile.totalInputTokens,
      totalOutputTokens: profile.totalOutputTokens,
      totalSessions: profile.totalSessions,
      totalMessages: profile.totalMessages
    }
  }

  // --- Row mappers ---

  private rowToSession(r: SessionRow): Session {
    return {
      id: r.id,
      title: r.title,
      projectDir: r.project_dir,
      model: r.model,
      permMode: r.perm_mode as Session['permMode'],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      sdkSessionId: r.sdk_session_id
    }
  }

  private rowToMessage(r: MessageRow): Message {
    return {
      id: r.id,
      sessionId: r.session_id,
      role: r.role as MessageRole,
      content: JSON.parse(r.content) as MessageContent,
      createdAt: r.created_at
    }
  }

  private rowToToolCall(r: ToolCallRow): ToolCall {
    return {
      id: r.id,
      messageId: r.message_id,
      toolName: r.tool_name,
      toolInput: r.tool_input,
      toolResult: r.tool_result,
      status: r.status as ToolCall['status'],
      createdAt: r.created_at
    }
  }
}

export const databaseService = DatabaseService.getInstance()