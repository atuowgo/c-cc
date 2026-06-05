export const APP_NAME = 'cc-bot'

export const SIDEBAR_WIDTH = 240
export const STATUS_BAR_HEIGHT = 32
export const TITLE_BAR_HEIGHT = 40

export const MIN_WINDOW_WIDTH = 900
export const MIN_WINDOW_HEIGHT = 600

export const ACCENT_COLOR = '#D4774C'
export const ACCENT_COLOR_HOVER = '#E08D6A'
export const DARK_BG = '#0d1117'
export const DARK_BG_SECONDARY = '#161b22'
export const DARK_BORDER = '#30363d'
export const TEXT_PRIMARY = '#e6edf3'
export const TEXT_SECONDARY = '#8b949e'
export const TEXT_MUTED = '#484f58'

export const STREAM_TIMEOUT_MS = 300_000
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 10MB

export const IPC_CHANNELS = {
  SESSION_CREATE: 'session:create',
  SESSION_SEND: 'session:send',
  SESSION_INTERRUPT: 'session:interrupt',
  SESSION_RESUME: 'session:resume',
  SESSION_DELETE: 'session:delete',
  SESSION_LIST: 'session:list',
  SESSION_UPDATE: 'session:update',
  SESSION_SEARCH: 'session:search',

  STREAM_CHUNK: 'stream:chunk',
  STREAM_TOOL_USE: 'stream:tool-use',
  STREAM_TOOL_RESULT: 'stream:tool-result',
  STREAM_COMPLETE: 'stream:complete',
  STREAM_ERROR: 'stream:error',

  PERMISSION_REQUEST: 'permission:request',
  PERMISSION_RESPOND: 'permission:respond',

  SKILL_LIST: 'skill:list',
  SKILL_TOGGLE: 'skill:toggle',
  SKILL_IMPORT: 'skill:import',
  SKILL_READ: 'skill:read',

  MCP_LIST: 'mcp:list',
  MCP_ADD: 'mcp:add',
  MCP_DELETE: 'mcp:delete',
  MCP_STATUS: 'mcp:status',
  MCP_TOOLS: 'mcp:tools',

  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_GET_ALL: 'config:get-all',
  CONFIG_SET_ALL: 'config:set-all',

  CLAUDE_MD_READ: 'claude-md:read',
  CLAUDE_MD_SAVE: 'claude-md:save',

  USER_PROFILE: 'user:profile',
  USER_USAGE: 'user:usage',

  FILE_PICK_DIRECTORY: 'file:pick-directory',
  FILE_PICK_FILES: 'file:pick-files',
  FILE_READ: 'file:read',

  WINDOW_STATE: 'window:state',
  WINDOW_SAVE_STATE: 'window:save-state',

  UPDATE_CHECK: 'update:check',
  UPDATE_INSTALL: 'update:install',

  TERMINAL_CREATE: 'terminal:create',
  TERMINAL_INPUT: 'terminal:input',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_OUTPUT: 'terminal:output',
} as const