# cc-bot 桌面工具产品规划文档

> 版本：v1.2  
> 日期：2026-06-05（用户决策更新）  
> 定位：基于 Claude Code Agent SDK 封装的可分发桌面 AI 编程助手工具

---

## 目录

1. [产品概述](#1-产品概述)
2. [功能设计](#2-功能设计)
3. [界面设计](#3-界面设计)
4. [系统架构](#4-系统架构)
5. [功能清单](#5-功能清单)
6. [技术选型](#6-技术选型)
7. [实施步骤](#7-实施步骤)
8. [实施计划](#8-实施计划)
9. [待确定项](#9-待确定项open-decisions)
10. [风险与注意事项](#10-风险与注意事项)
11. [参考资料](#附录-a参考资料)
12. [竞品分析](#附录-b竞品分析)

---

## 1. 产品概述

### 1.1 产品定位

**cc-bot** 是一款基于 Anthropic Claude Code Agent SDK 封装的跨平台桌面应用，旨在将 Claude Code 的强大 AI 编程能力通过友好的图形界面对企业/团队内部成员开放，支持打包分发安装。

产品对标 Claude Code Desktop 官方客户端的核心交互模式，在此基础上扩展企业定制能力：统一的 API Key 管理、Skill 配置、MCP 服务器管理、会话历史本地持久化等。

### 1.2 核心价值

| 价值点 | 说明 |
|--------|------|
| **开箱即用** | 封装 Claude Code Agent SDK，无需用户自行安装 Claude CLI |
| **可分发** | 打包为 .dmg / .exe / .AppImage，支持企业内网分发 |
| **可配置** | Skill、MCP Server、CLAUDE.md、权限模式均可通过 UI 管理 |
| **会话持久** | 本地 SQLite 存储全量对话历史，跨重启可恢复 |
| **多会话并行** | 侧边栏管理多个会话，支持 Tab 切换并行执行不同任务 |

### 1.3 目标用户

- 企业/团队内部开发者，需要统一部署 Claude Code 能力
- 希望拥有 GUI 界面而非纯命令行的 AI 编程工具用户
- 需要对 Skill / MCP / 权限进行精细管理的高级用户

---

## 2. 功能设计

### 2.1 核心功能模块

#### 2.1.1 会话管理（Session Management）

- **新建会话**：选择工作目录、模型、权限模式后创建独立会话
- **会话列表**：左侧边栏展示历史会话，支持搜索、置顶、删除
- **会话恢复**：基于 Claude Agent SDK 的 `query({ resume: sessionId })` 能力恢复上下文（SDK 0.3.142+ 统一 API，不再有独立 resumeSession 方法）
- **会话分叉（Fork）**：基于现有会话创建分支会话（P2，16 周内不实现）
- **多 Tab 切换**：多个会话通过 Tab 切换，单窗口内运行

#### 2.1.2 对话交互（Chat Interface）

- **流式输出**：实时展示 Claude 的 token 流，支持中断
- **Markdown 渲染**：代码块高亮、表格、数学公式渲染
- **文件引用**：`@` 语法引用工作目录文件注入上下文
- **文件附件**：拖拽 / 粘贴图片、PDF 文件
- **工具调用展示**：可视化展示 Bash、Read、Edit 等工具调用过程
- **Diff 视图**：文件变更的 Diff 展示与接受/拒绝操作
- **权限确认弹窗**：在 `default` 权限模式下弹出权限申请对话框

#### 2.1.3 Skill 管理（Skill Manager）

- **Skill 列表**：展示已配置的 Skill（来自 `~/.claude/skills/`）
- **Skill 导入**：从本地目录或 ZIP 文件导入 Skill
- **Skill 编辑**：内置 Markdown 编辑器编辑 SKILL.md
- **Skill 启用/禁用**：按会话粒度或全局开关某个 Skill
- **Skill 市场预留**：预留 Marketplace 接入入口

#### 2.1.4 MCP 服务器管理（MCP Manager）

- **MCP 服务器列表**：展示全局和项目级 MCP 配置
- **新增 MCP**：支持 stdio、HTTP、SSE 三种 transport 类型
- **MCP 状态监控**：显示连接状态（在线/离线/错误）
- **工具预览**：展示 MCP Server 暴露的 Tool 列表
- **常用 MCP 快速安装**：预置 GitHub、Slack、Google Drive 等常用 MCP

#### 2.1.5 配置管理（Settings）

- **API Key 配置**：支持 Anthropic 直连 / Bedrock / Vertex AI / Azure Foundry
- **模型选择**：列出可用模型（claude-opus-4-6、sonnet-4-6、haiku-4-5 等）
- **默认权限模式**：Ask / AutoAccept / Plan / Auto / BypassPermissions
- **CLAUDE.md 编辑**：内置编辑器管理全局和项目级 CLAUDE.md
- **主题设置**：深色/浅色/跟随系统
- **语言设置**：中文/English
- **键盘快捷键**：可自定义快捷键（默认：发送 Ctrl+Enter、中断 Esc、新建会话 Ctrl+N、搜索 Ctrl+Shift+F）
- **更新设置**：检查更新、自动更新开关

#### 2.1.6 用户信息（User Profile）

- **API Key 绑定状态**：展示当前鉴权方式
- **用量统计**：展示本月 Token 消耗、成本估算（来自 SDK cost_usd 字段）
- **会话统计**：总会话数、总消息数

### 2.2 扩展功能模块

#### 2.2.1 工作区（Workspace）

- **多面板布局**：聊天区 + 文件树 + 终端 + Diff 视图自由拖拽
- **内置文件编辑器**：轻量文件查看/编辑，高亮只读视图
- **内置终端**：xterm.js 集成，查看 Bash 工具执行输出

#### 2.2.2 插件系统（Plugin System）

- **插件目录**：`~/.cc-bot/plugins/`，每个插件含 `plugin.json` manifest
- **插件包含能力**：Skill + Agent + Hook + MCP Server 的组合包
- **插件安装**：支持本地 ZIP 安装，预留远程 Registry 接口

#### 2.2.3 Hook 管理

- **Hook 配置 UI**：可视化配置 `PreToolUse` / `PostToolUse` 等 Hook
- **审计日志**：Hook 触发记录写入本地日志文件

---

## 3. 界面设计

### 3.1 整体布局

```
┌─────────────────────────────────────────────────────────────────┐
│  TitleBar（自定义，含最小化/最大化/关闭）                          │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                       │
│  左侧    │                  主内容区                              │
│  面板    │                                                       │
│  (240px) │                                                       │
│          ├──────────────────────────────────────────────────────┤
│          │  状态栏（模型 | 权限模式 | Token 用量 | 连接状态）       │
└──────────┴──────────────────────────────────────────────────────┘
```

### 3.2 左侧面板布局

```
┌──────────────────────┐
│  [Logo] cc-bot       │  ← 应用 Logo + 名称
├──────────────────────┤
│  [+] 新建会话         │  ← 主要操作按钮
├──────────────────────┤
│  搜索会话...           │  ← 会话搜索框
├──────────────────────┤
│  📁 最近              │
│  ├─ 会话标题1  03-01  │  ← 会话列表项（标题+日期）
│  ├─ 会话标题2  02-28  │
│  ├─ 会话标题3  02-25  │
│  └─ ...              │
├──────────────────────┤
│  [底部操作栏]         │
│  👤 用户信息           │  ← 底部固定
│  ⚙️  设置              │
└──────────────────────┘
```

### 3.3 主对话区布局

```
┌─────────────────────────────────────────────────────────┐
│  会话标题 [编辑]  📁 /path/to/project  [模型▼] [模式▼]   │  ← 会话 Header
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  👤 用户消息                                        │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  🤖 Claude 响应                                    │ │
│  │  ┌─────────────────────┐                          │ │
│  │  │ 🔧 工具调用: Bash   │  ← 可折叠工具调用区        │ │
│  │  │ $ npm test          │                          │ │
│  │  └─────────────────────┘                          │ │
│  │  运行测试完成，发现2个错误...                         │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │  @ Skill▼  📎  [输入框...                ]  发送 │   │  ← 输入区
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 3.4 设置页面

- **通用**：主题、语言、字体大小、启动行为
- **API 配置**：API Key、Provider 选择、代理设置
- **模型**：默认模型、上下文长度、温度
- **Skill**：Skill 目录管理、启用状态
- **MCP**：MCP Server 管理
- **权限**：默认权限模式、工具白名单
- **更新**：自动更新、更新渠道
- **高级**：日志级别、数据目录、重置

### 3.5 设计规范

| 要素 | 规范 |
|------|------|
| **色彩** | 深色主题为主（`#0d1117` 背景），浅色可选，accent 使用 Claude 品牌橙 `#D4774C` |
| **字体** | 界面 Inter / System Font，代码区 JetBrains Mono / Fira Code |
| **图标** | Lucide React 图标库 |
| **组件库** | shadcn/ui + Radix UI |
| **动效** | Framer Motion，流式输出逐字动画 |
| **响应式** | 最小窗口 900×600px，支持拖拽调整面板宽度 |

---

## 4. 系统架构

### 4.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     Electron Application                         │
│                                                                  │
│  ┌─────────────────────┐     IPC      ┌──────────────────────┐  │
│  │   Renderer Process   │ ◄──────────► │    Main Process      │  │
│  │   (React + Vite)     │             │   (Node.js)          │  │
│  │                      │             │                      │  │
│  │  ┌───────────────┐   │             │  ┌────────────────┐  │  │
│  │  │  UI Layer     │   │             │  │ Session Manager│  │  │
│  │  │  (shadcn/ui)  │   │             │  └───────┬────────┘  │  │
│  │  └───────────────┘   │             │          │           │  │
│  │  ┌───────────────┐   │             │  ┌───────▼────────┐  │  │
│  │  │  State Layer  │   │             │  │  Agent SDK     │  │  │
│  │  │  (Zustand)    │   │             │  │  Bridge        │  │  │
│  │  └───────────────┘   │             │  └───────┬────────┘  │  │
│  │  ┌───────────────┐   │             │          │           │  │
│  │  │  IPC Client   │   │             │  ┌───────▼────────┐  │  │
│  │  │  (typed)      │   │             │  │  SQLite DB     │  │  │
│  │  └───────────────┘   │             │  │  (better-      │  │  │
│  └─────────────────────┘             │  │   sqlite3)     │  │  │
│                                      │  └───────┬────────┘  │  │
│                                      │          │           │  │
│                                      └──────────┼───────────┘  │
│                                                 │              │
└─────────────────────────────────────────────────┼──────────────┘
                                                  │
                                    ┌─────────────▼──────────────┐
                                    │  @anthropic-ai/claude-      │
                                    │  agent-sdk                  │
                                    │  (bundled binary)           │
                                    └─────────────┬──────────────┘
                                                  │
                                    ┌─────────────▼──────────────┐
                                    │   Anthropic API             │
                                    │   / Bedrock / Vertex        │
                                    └────────────────────────────┘
```

### 4.2 进程模型

#### Main Process（主进程）职责

| 模块 | 职责 |
|------|------|
| **SessionManager** | 创建、恢复、销毁 Claude Agent 会话；管理并行会话生命周期 |
| **AgentSDKBridge** | 封装 `@anthropic-ai/claude-agent-sdk` 的 `query()` / `createSession()` 调用，流式输出转 IPC 事件 |
| **DatabaseService** | SQLite 操作，管理 conversations / messages / settings 表 |
| **ConfigManager** | 读写 `electron-store` 配置、CLAUDE.md 文件、settings.json |
| **SkillManager** | 扫描、加载、启用/禁用 Skill 目录 |
| **MCPManager** | 管理 MCP Server 配置，代理 MCP 工具调用状态 |
| **UpdateManager** | 基于 `electron-updater` 实现增量自动更新（GitHub Releases 作为更新源） |
| **WindowManager** | BrowserWindow 生命周期管理（单窗口 + Tab 架构） |

#### Renderer Process（渲染进程）职责

- 纯 UI 渲染，无 Node.js 直接访问（context isolation 开启）
- 通过 Preload Script 暴露的类型安全 IPC API 与主进程通信
- 使用 Zustand 管理 UI 状态，TanStack Query 缓存 IPC 请求结果

#### Preload Script

```typescript
// preload.ts - 暴露类型安全的桥接 API
contextBridge.exposeInMainWorld('claudeAPI', {
  session: {
    create: (opts) => ipcRenderer.invoke('session:create', opts),
    sendMessage: (sessionId, msg) => ipcRenderer.invoke('session:send', sessionId, msg),
    interrupt: (sessionId) => ipcRenderer.invoke('session:interrupt', sessionId),
    list: () => ipcRenderer.invoke('session:list'),
  },
  onStreamChunk: (cb) => ipcRenderer.on('stream:chunk', (_, data) => cb(data)),
  // ...
})
```

### 4.3 数据模型（SQLite）

```sql
-- 会话表
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  title       TEXT,
  project_dir TEXT,
  model       TEXT,
  perm_mode   TEXT,
  created_at  INTEGER,
  updated_at  INTEGER,
  sdk_session_id TEXT  -- Claude Agent SDK session ID，用于 query({ resume: sessionId })
);

-- 消息表
CREATE TABLE messages (
  id          TEXT PRIMARY KEY,
  session_id  TEXT REFERENCES sessions(id),
  role        TEXT,  -- user | assistant | tool_use | tool_result
  content     TEXT,  -- JSON
  created_at  INTEGER
);

-- 工具调用记录
CREATE TABLE tool_calls (
  id          TEXT PRIMARY KEY,
  message_id  TEXT REFERENCES messages(id),
  tool_name   TEXT,
  tool_input  TEXT,  -- JSON
  tool_result TEXT,  -- JSON
  status      TEXT,  -- pending | success | error | blocked
  created_at  INTEGER
);

-- 用量统计
CREATE TABLE usage_stats (
  id          TEXT PRIMARY KEY,
  session_id  TEXT,
  cost_usd    REAL,
  input_tokens  INTEGER,
  output_tokens INTEGER,
  created_at  INTEGER
);
```

### 4.4 IPC 通信约定

采用 `{namespace}:{action}` 命名规范，所有 IPC 通道通过 Zod schema 校验：

```typescript
// IPC 通道清单（部分）
'session:create'          // 创建会话
'session:send'            // 发送消息
'session:interrupt'       // 中断当前执行
'session:resume'          // 恢复会话
'session:delete'          // 删除会话
'session:list'            // 获取会话列表
'stream:chunk'            // 流式输出推送（主→渲）
'stream:tool-use'         // 工具调用推送
'stream:complete'         // 完成推送
'permission:request'      // 权限申请推送
'permission:respond'      // 权限响应
'skill:list'              // Skill 列表
'skill:toggle'            // 启用/禁用 Skill
'mcp:list'                // MCP 列表
'mcp:add'                 // 添加 MCP
'mcp:status'              // MCP 状态推送
'config:get'              // 读取配置
'config:set'              // 写入配置
'update:check'            // 检查更新
'update:install'          // 安装更新
```

### 4.5 Claude Agent SDK 集成方式

```typescript
// main/services/AgentSDKBridge.ts
// SDK 0.3.163: unstable_v2_createSession 已移除，统一使用 query()
import { query } from '@anthropic-ai/claude-agent-sdk'

export class AgentSDKBridge {
  async startQuery(sessionId: string, params: QueryParams): Promise<void> {
    const options = {
      model: params.model,
      allowedTools: params.allowedTools,
      permissionMode: params.permissionMode,
      // 0.3.142+: skills 通过 options 传入，SDK 自动加载
      mcpServers: params.mcpServers,  // MCP 配置
      cwd: params.projectDir,
      // 会话恢复: 传入 resume 参数（session ID），SDK 自动恢复上下文
      resume: params.resumeSessionId,
      // Hook: 工具调用前后通知 renderer
      hooks: {
        PreToolUse: [{
          matcher: '*',
          hooks: [async (input) => {
            this.emit('stream:tool-use', { sessionId, ...input })
            // 若权限模式为 ask，等待用户确认
            if (params.permissionMode === 'default') {
              return await this.awaitPermission(sessionId, input)
            }
            return {}
          }]
        }]
      }
    }

    for await (const message of query({ prompt: params.prompt, options })) {
      this.emit('stream:chunk', { sessionId, message })
    }
    this.emit('stream:complete', { sessionId })
  }
}
```

---

## 5. 功能清单

### 5.1 MVP 功能清单（P0 - 必须实现）

| 编号 | 功能 | 说明 |
|------|------|------|
| F001 | 会话创建 | 选择工作目录、模型、权限模式新建会话 |
| F002 | 消息发送与流式响应 | 支持流式输出、工具调用可视化 |
| F003 | 会话列表 | 左侧边栏展示历史会话，点击切换 |
| F004 | 会话持久化 | 会话消息存储至本地 SQLite |
| F005 | API Key 配置 | 支持 Anthropic 直连配置 |
| F006 | 权限模式配置 | 支持 Ask / AutoAcceptEdits / Plan / Auto / BypassPermissions 五种模式 |
| F007 | 工具调用展示 | 可折叠的工具调用详情，含 input/output |
| F008 | 权限申请弹窗 | Ask 模式下弹出 Allow/Reject 确认 |
| F009 | 中断操作 | 发送中止信号，停止当前执行 |
| F010 | Diff 视图 | 文件变更的 diff 展示与接受/拒绝 |
| F011 | 主题切换 | 深色 / 浅色 / 跟随系统 |
| F012 | 打包分发 | macOS .dmg、Windows NSIS .exe、Linux AppImage |
| F013 | 应用自动更新 | electron-updater 增量更新（GitHub Releases 作为更新源） |

### 5.2 标准功能清单（P1 - 重要实现）

| 编号 | 功能 | 说明 |
|------|------|------|
| F014 | Skill 管理 | Skill 列表展示、导入、启用/禁用 |
| F015 | CLAUDE.md 编辑 | 内置编辑器管理项目/全局 CLAUDE.md |
| F016 | MCP Server 管理 | 添加、删除、状态监控 MCP Server |
| F017 | 文件 @ 引用 | 输入框 @ 语法引用工作目录文件 |
| F018 | 文件/图片附件 | 支持拖拽/粘贴 PDF、图片上传 |
| F019 | 会话搜索 | 按标题/内容搜索历史会话 |
| F020 | 用量统计 | 展示 Token 消耗与成本估算 |
| F021 | 模型切换 | 会话内切换模型 |
| F022 | Bedrock/Vertex 支持 | 支持第三方 API Provider 鉴权 |
| F023 | 多语言 | 中文 / 英文 UI |
| F024 | 内置终端 | xterm.js 集成，查看命令输出 |

### 5.3 增强功能清单（P2 - 后期迭代）

| 编号 | 功能 | 说明 |
|------|------|------|
| F025 | 会话分叉（Fork） | 基于现有会话创建分支 |
| F026 | 多 Tab 并行会话 | 多 Tab 并行运行不同会话 |
| F027 | 插件系统 | 插件安装/管理（Skill+MCP 组合包） |
| F028 | Hook 管理 UI | 可视化配置 PreToolUse / PostToolUse Hook |
| F029 | 审计日志 | 工具调用审计日志查看 |
| F030 | Skill 编辑器 | 内置 Markdown 编辑器编辑 SKILL.md |
| F031 | 子 Agent 可视化 | SubAgent 调用链可视化展示 |
| F032 | 导出会话 | 导出为 Markdown / JSON |
| F033 | SSH 远程会话 | 连接远程机器运行 Agent |
| F034 | 企业 License | 离线授权、用量配额管理 |

---

## 6. 技术选型

### 6.1 核心技术栈

| 层次 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| **桌面框架** | Electron | 36+ | 成熟跨平台方案，VS Code、Slack 等均采用 |
| **构建工具** | electron-vite | latest | 替代 webpack，HMR 快 3-5x，TypeScript 一等公民 |
| **前端框架** | React | 19 | 生态成熟，shadcn/ui 组件库支持 |
| **状态管理** | Zustand | 5 | 轻量，Electron 窗口重载后状态稳定 |
| **服务端状态** | TanStack Query | 5 | IPC 请求缓存与同步 |
| **组件库** | shadcn/ui + Radix UI | latest | 可访问性好，深度可定制 |
| **样式** | Tailwind CSS | 4 | 工具类优先，暗色主题方便 |
| **动画** | Framer Motion | 12 | 流式输出动效、面板切换 |
| **代码高亮** | Shiki | latest | 基于 TextMate，效果接近 VS Code |
| **Markdown** | react-markdown + rehype | latest | 消息渲染 |
| **本地数据库** | better-sqlite3 | latest | 同步 API，主进程直用，性能优秀 |
| **小型配置** | electron-store | latest | API Key、主题等偏好设置 |
| **安全存储** | keytar（OS Keychain） | latest | API Key 加密存储 |
| **自动更新** | electron-updater | latest | 增量更新，支持 GitHub Releases |
| **打包发布** | electron-builder | latest | 多平台打包，代码签名 |
| **终端** | xterm.js | 5 | 内置终端组件 |
| **AI SDK** | @anthropic-ai/claude-agent-sdk | 0.3.163 | 官方 TypeScript SDK，核心 API 已稳定（unstable_ 前缀已移除），统一使用 query() |
| **类型验证** | Zod | 3 | IPC 通道 schema 验证 |
| **语言** | TypeScript | 5.7+ | 全栈 TS，`await using` session 管理 |

### 6.2 安全设计

```typescript
// BrowserWindow 安全配置
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,       // 必须开启
    nodeIntegration: false,       // 必须关闭
    sandbox: true,                // 渲染进程沙箱
    preload: path.join(__dirname, 'preload.js'),
  }
})
```

- API Key 存储在 OS Keychain（keytar），不写入明文配置文件
- IPC 通道全部经 Zod schema 校验，防止渲染进程注入非法参数
- Content Security Policy 限制渲染进程网络请求

---

## 7. 实施步骤

### Step 1：项目初始化与基础架构搭建

1. **初始化 electron-vite 项目**
   ```bash
   npm create @quick-start/electron@latest cc-bot -- --template react-ts
   ```

2. **配置 TypeScript 严格模式**，启用 `"target": "ES2022"` 支持 `await using`

3. **建立目录结构**
   ```
   src/
   ├── main/               # 主进程
   │   ├── index.ts        # 入口
   │   ├── windows/        # 窗口管理
   │   ├── services/       # 业务服务
   │   │   ├── AgentSDKBridge.ts
   │   │   ├── SessionManager.ts
   │   │   ├── DatabaseService.ts
   │   │   ├── ConfigManager.ts
   │   │   ├── SkillManager.ts
   │   │   └── MCPManager.ts
   │   └── ipc/            # IPC 处理器
   ├── preload/            # Preload 脚本
   │   └── index.ts
   ├── renderer/           # 渲染进程 (React)
   │   ├── App.tsx
   │   ├── components/
   │   ├── pages/
   │   ├── stores/         # Zustand stores
   │   └── hooks/
   └── shared/             # 共享类型定义
       ├── ipc-types.ts
       └── schemas.ts      # Zod schemas
   ```

4. **安装核心依赖**
   ```bash
   npm install @anthropic-ai/claude-agent-sdk better-sqlite3 electron-store
   npm install keytar electron-updater
   npm install zustand @tanstack/react-query
   npm install tailwindcss shadcn-ui radix-ui framer-motion shiki
   npm install zod xterm
   npm install -D electron-builder @types/better-sqlite3
   ```

### Step 2：主进程核心服务实现

1. **DatabaseService**：初始化 SQLite，执行 migration，提供 CRUD 方法
2. **ConfigManager**：electron-store 封装 + keytar API Key 安全存储
3. **AgentSDKBridge**：
   - 封装 `query()` async generator，转为 EventEmitter 流式事件
   - 生产环境通过 `options.pathToClaudeCodeExecutable` 指定 extraResources 中的 binary 路径
   - 实现权限拦截 Hook，挂起并等待 renderer 确认
   - 成本和 token 统计写入 usage_stats 表
4. **SessionManager**：会话 CRUD，管理多个并发 AgentSDKBridge 实例
5. **IPC 注册**：`ipcMain.handle` 注册所有通道，Zod 校验入参

### Step 3：Preload 与 IPC 类型系统

1. 在 `shared/ipc-types.ts` 定义全量 IPC 接口（请求/响应类型）
2. Preload 脚本 `contextBridge.exposeInMainWorld` 暴露类型安全 API
3. Renderer 侧封装 custom hooks（`useSession`, `useStreamMessage`）

### Step 4：Renderer UI 实现

1. **布局框架**：自定义 TitleBar + 双栏布局（左侧 Sidebar + 右侧主区）
2. **Sidebar**：会话列表、新建会话按钮、用户信息、设置入口
3. **ChatArea**：消息列表、流式渲染、工具调用折叠面板、Diff 视图
4. **InputArea**：文本输入、@ 文件引用、附件、发送/中断
5. **权限弹窗**：工具调用权限确认对话框
6. **Settings 页面**：各配置分组表单

### Step 5：Skill 与 MCP 管理实现

1. **SkillManager**：扫描 `~/.claude/skills/` 目录，解析 SKILL.md frontmatter
2. **Skill UI**：列表页 + 详情展示 + 启用开关
3. **MCPManager**：读写 Claude Code `settings.json` MCP 配置段
4. **MCP UI**：服务器列表 + 添加向导 + 连接状态指示器

### Step 6：打包与分发配置

1. **electron-builder.yml 配置**
   ```yaml
   appId: com.yourcompany.cc-bot
   productName: cc-bot
   
   mac:
     target: dmg
     darkModeSupport: true
     category: public.app-category.developer-tools
     hardenedRuntime: true
     entitlements: entitlements.mac.plist
   
   win:
     target: nsis
     icon: resources/icon.ico
   
   linux:
     target: AppImage
   
   # 更新源：使用 GitHub Releases 作为 electron-updater 更新源
   publish:
     provider: github
     owner: <your-github-org>
     repo: cc-bot

   # SDK native binary 必须放在 ASAR 外部
   extraResources:
     - from: "node_modules/@anthropic-ai/claude-agent-sdk-darwin-arm64/claude"
       to: "claude-arm64"
     - from: "node_modules/@anthropic-ai/claude-agent-sdk-darwin-x64/claude"
       to: "claude-x64"
     - from: "node_modules/@anthropic-ai/claude-agent-sdk-win32-x64/claude.exe"
       to: "claude.exe"
     - from: "node_modules/@anthropic-ai/claude-agent-sdk-linux-x64/claude"
       to: "claude-linux"
   ```

2. **代码签名**：macOS 需要 Apple Developer ID + notarization；Windows 需要 EV 证书
3. **electron-updater 配置**：对接 GitHub Releases API，支持自动检测和增量更新
4. **CI/CD**：GitHub Actions 多平台并行构建（macOS / Windows / Linux）

### Step 7：测试与质量保证

1. **单元测试**：Vitest 测试 Service 层（AgentSDKBridge、DatabaseService）
2. **集成测试**：Mock Claude Agent SDK 测试会话流程
3. **E2E 测试**：Playwright for Electron 测试关键用户路径
4. **安全审计**：IPC 通道 schema 覆盖率检查，CSP 配置验证

---

## 8. 实施计划

### 总体时间线（共 16 周）

```
第1-2周   [Phase 1] 基础架构
第3-5周   [Phase 2] 核心对话功能
第6-8周   [Phase 3] Skill/MCP/配置
第9-10周  [Phase 4] 打包分发
第11-13周 [Phase 5] P1 功能补全
第14-15周 [Phase 6] 测试与性能优化
第16周    [Phase 7] 发布准备
```

### Phase 1：基础架构（第 1-2 周）

| 任务 | 交付物 |
|------|--------|
| 初始化 electron-vite + React + TypeScript 项目 | 可运行的 Hello World |
| 建立主/渲染进程目录结构 | 标准化项目骨架 |
| 配置 SQLite（better-sqlite3），执行初始 migration | 数据库服务可用 |
| 配置 electron-store + keytar | 配置持久化可用 |
| 建立 IPC 类型系统（shared/ipc-types.ts + Zod schema） | 类型安全 IPC 框架 |
| 实现 BrowserWindow 基础创建（安全配置） | 安全的窗口创建 |
| 配置 electron-builder 基础打包 | 可打包产出 |

### Phase 2：核心对话功能（第 3-5 周）

| 任务 | 交付物 |
|------|--------|
| AgentSDKBridge：封装 query()，流式 → IPC 事件 | 核心 AI 调用链 |
| SessionManager：会话创建/恢复/删除 | 会话生命周期管理 |
| 权限拦截 Hook + renderer 确认弹窗 | 权限确认流程 |
| ChatArea UI：消息列表 + 流式渲染 | 基础对话界面 |
| 工具调用可视化组件 | 工具调用展示 |
| 左侧 Sidebar（会话列表 + 新建会话） | 会话导航 |
| InputArea（输入框 + 发送 + 中断） | 消息输入 |
| 会话消息 SQLite 持久化 | 历史记录保存 |
| Diff 视图组件（文件变更展示） | 代码变更视图 |

**里程碑**：可以使用 App 与 Claude Code 进行完整对话，会话历史持久化。

### Phase 3：Skill / MCP / 配置（第 6-8 周）

| 任务 | 交付物 |
|------|--------|
| Settings 页面框架 + 路由 | 设置页骨架 |
| API Key 配置（keytar 安全存储） | API 鉴权配置 |
| 模型选择、权限模式配置 | 基础模型配置 |
| SkillManager 实现 + Skill 列表 UI | Skill 管理功能 |
| CLAUDE.md 编辑器 | 项目配置编辑 |
| MCPManager 实现 + MCP 管理 UI | MCP 管理功能 |
| Bedrock / Vertex AI Provider 支持 | 多 Provider 鉴权 |
| 主题切换（深色/浅色） | UI 主题 |

**里程碑**：完整的配置管理能力，Skill 和 MCP 可从 UI 管理。

### Phase 4：打包与分发（第 9-10 周）

| 任务 | 交付物 |
|------|--------|
| electron-builder 完整配置（三平台） | 三平台打包脚本 |
| macOS 代码签名 + notarization 配置 | macOS 可分发包 |
| Windows NSIS 签名配置 | Windows 可分发包 |
| Linux AppImage 配置 | Linux 可分发包 |
| electron-updater 对接 GitHub Releases | 自动更新能力 |
| GitHub Actions CI/CD pipeline | 自动化构建发布 |
| 内网分发包测试（企业场景） | 企业分发验证 |

**里程碑**：可向用户分发的安装包，支持自动更新。

### Phase 5：P1 功能补全（第 11-13 周）

| 任务 | 交付物 |
|------|--------|
| 文件 @ 引用 autocomplete | 文件引用功能 |
| 图片/PDF 附件支持 | 多模态输入 |
| 会话搜索功能 | 历史检索 |
| Token 用量统计展示 | 成本可视化 |
| 内置终端（xterm.js） | 终端集成 |
| 中英文 i18n | 多语言支持 |
| 会话标题自动生成 | UX 优化 |
| 多 Tab 会话切换 | 并行会话 |

### Phase 6：测试与性能优化（第 14-15 周）

| 任务 | 交付物 |
|------|--------|
| Vitest 单元测试覆盖核心 Service | 测试覆盖率 ≥ 70% |
| Playwright E2E 测试（关键路径） | 自动化测试套件 |
| 冷启动时间优化（目标 < 2s） | 性能优化 |
| 内存占用优化（目标 < 200MB idle） | 内存优化 |
| 安全审计（IPC / CSP / keytar） | 安全报告 |
| 跨平台兼容性测试 | 兼容性报告 |

### Phase 7：发布准备（第 16 周）

| 任务 | 交付物 |
|------|--------|
| README + 用户文档 | 用户文档 |
| 企业部署指南（MDM / 内网分发） | 部署文档 |
| CHANGELOG 编写 | 版本说明 |
| v1.0.0 正式发布 | Release |

### 资源估算

| 角色 | 配置 | 备注 |
|------|------|------|
| 前端开发 | 1-2 人 | React + Electron UI |
| 后端/桥接开发 | 1 人 | 主进程 + SDK 集成 |
| UI/UX 设计 | 1 人（兼职） | 界面设计规范 |
| 测试 | 1 人（后期） | 第 14 周介入 |

---

## 9. 待确定项（Open Decisions）

以下为审查中识别的未确定项，需在开发前确认。标记 ✅ 的为用户已确认项。

| 序号 | 维度 | 待确定项 | 建议方案 | 状态 |
|------|------|----------|----------|------|
| 1 | 架构 | SDK 版本锁定 | 锁定 0.3.163，SDK 封装层隔离变化 | 待确认 |
| 2 | 架构 | SDK native binary 打包 | extraResources 放置 ASAR 外部，pathToClaudeCodeExecutable 指定路径 | 待确认 |
| 3 | 架构 | 错误处理策略 | SDK 错误分类（网络/权限/模型过载），统一错误码 + 用户友好提示 | 待确认 |
| 4 | 架构 | 日志系统 | 主进程使用 electron-log；渲染进程错误通过 IPC 转发到主进程统一落盘 | 待确认 |
| 5 | 功能 | 离线模式 | 不支持离线模式，必须有网络连接（SDK 需调用 Anthropic API） | ✅ 已确认 |
| 6 | 功能 | 窗口架构 | 初期不支持多窗口，单窗口 + 多 Tab 切换 | ✅ 已确认 |
| 7 | 功能 | 窗口状态恢复 | electron-store 持久化窗口位置/大小/最大化状态 | 待确认 |
| 8 | 功能 | 会话标题自动生成 | SDK 在首次消息后自动生成标题（基于 query 首条 user prompt） | 待确认 |
| 9 | 功能 | 会话分叉（Fork） | P2，16 周内不实现 | 待确认 |
| 10 | 运维 | 更新服务器 | 初期使用 GitHub Releases 作为更新源，后续可切换私有服务器 | ✅ 已确认 |
| 11 | 运维 | CI/CD 平台 | GitHub Actions，三平台并行构建（macOS-14 / windows-latest / ubuntu-latest） | 待确认 |
| 12 | 运维 | 数据备份恢复 | 会话数据仅存在 SQLite 中，不提供自动备份；导出功能（F032）为 P2 | 待确认 |
| 13 | 运维 | 自动更新回滚 | electron-updater 不支持自动回滚；出错后引导用户手动下载安装包 | 待确认 |
| 14 | 运维 | 用户反馈渠道 | 初期通过 GitHub Issues 收集反馈，不内置反馈入口 | 待确认 |
| 15 | 质量 | 测试数据管理 | 使用 SQLite 内存模式 + Mock SDK 进行单元测试 | 待确认 |
| 16 | 质量 | CSP 规则 | default-src 'self'; script-src 'self'; connect-src 'self' https://api.anthropic.com; style-src 'self' 'unsafe-inline' | 待确认 |
| 17 | 质量 | 性能基准 | 冷启动 < 2s，空闲内存 < 200MB，流式渲染延迟 < 50ms/消息 | 待确认 |
| 18 | 质量 | 无障碍要求 | 初期不强制 WCAG 合规，但需支持键盘导航和屏幕阅读器基本可用 | 待确认 |
| 19 | 产品 | 产品命名 | 产品名 cc-bot（已确定） | ✅ 已确认 |
| 20 | 产品 | Skill Marketplace | 预留 UI 入口，P2 实现 | 待确认 |
| 21 | 产品 | 自定义主题 | 仅支持深色/浅色/跟随系统，不支持自定义 CSS 主题 | 待确认 |

---

## 10. 风险与注意事项

### 10.1 关键风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **SDK 版本变更** | Agent SDK 仍在快速迭代，API 可能 breaking change | 锁定版本 0.3.163，建立 SDK 封装层隔离变化；持续关注 SDK Changelog |
| **binary bundling 问题** | SDK bundled binary 在 bun compile 等场景有已知 Bug | 遵循官方文档 extractFromBunfs() 方案，或单独提供 binary |
| **macOS 公证（Notarization）** | 未公证的 App 在 macOS 会被 Gatekeeper 拦截 | 提前购买 Apple Developer ID，集成 notarization 流程 |
| **API Key 安全** | 明文存储 API Key 有泄露风险 | keytar 存储 OS Keychain，永不写入磁盘明文 |
| **大上下文内存** | 长会话 token 上下文膨胀导致内存溢出 | SQLite 只存摘要，SDK 侧启用 context compaction |
| **Agent SDK 授权限制** | Anthropic 要求：不能让产品看起来像 Claude Code 本身 | 使用自有品牌 "cc-bot"，不使用 Claude 品牌 logo，避免混淆 |
| **Anthropic plan 限制** | 2026-06-15 起订阅版有 Agent SDK monthly credit 限制 | 引导用户使用 API Key 方式鉴权，非 claude.ai 账号 OAuth |

### 10.2 Anthropic 品牌合规要求

根据 Claude Agent SDK 文档：
> "Your product should maintain its own branding and not appear to be Claude Code or any Anthropic product."

- **必须**：使用独立的产品名称和 Logo（cc-bot）
- **禁止**：使用 Claude Code 或 Anthropic 官方 Logo/品牌色
- **可选**：在"Powered by Claude"的范围内标注技术来源
- **建议**：联系 Anthropic 销售团队确认品牌合规细节

### 10.3 技术注意事项

1. **Agent SDK binary 依赖**：TypeScript SDK 通过 optional dependency 捆绑 native binary（如 `@anthropic-ai/claude-agent-sdk-darwin-arm64`），打包时需通过 `extraResources` 将 binary 放在 ASAR 外部，并通过 `options.pathToClaudeCodeExecutable` 显式指定路径
2. **electron-builder + optional deps**：需在 `electron-builder.yml` 配置 `extraResources` 映射各平台 binary，同时确保 `npm install` 时 `includeOptionalDeps: true`
3. **IPC 流量**：流式 token 输出频率高，需对 IPC 事件做 debounce/batching，避免 renderer 过度重渲染
4. **SQLite 并发**：better-sqlite3 为同步 API，在主进程中使用无并发问题；若后续多窗口需注意 WAL mode
5. **xterm.js 与 Electron**：xterm.js 在渲染进程中直接使用，通过 IPC 转发终端输出，无需 PTY 直接接入

---

## 11. 参考资料

- [Claude Agent SDK TypeScript 官方文档](https://code.claude.com/docs/en/agent-sdk/typescript)
- [Claude Agent SDK Overview](https://code.claude.com/docs/en/agent-sdk/overview)
- [Claude Code Desktop 文档](https://code.claude.com/docs/en/desktop)
- [Electron 官方文档](https://www.electronjs.org/docs/latest)
- [electron-vite](https://electron-vite.org/)
- [electron-builder](https://www.electron.build/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

## 12. 竞品分析

| 产品 | 特点 | 与本产品差异 |
|------|------|-------------|
| Claude Code Desktop（官方） | 官方出品，功能全面，不可二次分发 | 本产品可企业定制、内网分发 |
| Cursor | VS Code fork，深度 IDE 集成 | 本产品轻量独立，非 IDE 扩展 |
| Windsurf | 全局 AI 工作流，非 Claude 专属 | 本产品专注 Claude Code 能力封装 |
| Continue（VS Code） | 开源，多模型支持 | 本产品深度封装 Agent SDK 工具链 |

---