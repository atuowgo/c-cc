# cc-bot 编译与启动指南

## 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | >= 20 |
| npm | >= 10 |
| Windows | 10/11 (x64) |
| macOS | >= 12 (arm64/x64) |
| Linux | 内核 >= 5.x |

> **Windows 额外要求**: 安装 [windows-build-tools](https://www.npmjs.com/package/windows-build-tools) 或 Visual Studio Build Tools（编译 `better-sqlite3` 原生模块）。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 开发模式启动
npm run dev
```

## 完整命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 + 编译原生模块 |
| `npm run dev` | 开发模式（热更新） |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run start` | 预览构建产物 |
| `npm run typecheck` | 仅类型检查 |
| `npm run lint` | ESLint 检查 |
| `npm run test` | 运行测试 |
| `npm run test:watch` | 测试监听模式 |
| `npm run format` | Prettier 格式化 |

## 打包分发

```bash
# 目录打包（不生成安装包，用于调试）
npm run build:unpack

# Windows 安装包 (.exe)
npm run build:win

# macOS 安装包 (.dmg)
npm run build:mac

# Linux 安装包 (.AppImage / .snap / .deb)
npm run build:linux
```

产物输出目录：`dist/`

## 项目结构

```
c-cc/
├── src/
│   ├── main/           # 主进程 (Electron Main)
│   │   ├── index.ts
│   │   ├── windows/    # 窗口管理
│   │   ├── services/   # 核心服务 (Database, Config, SDK, Session, Skill, MCP)
│   │   └── ipc/        # IPC 处理器
│   ├── preload/        # 预加载脚本 (contextBridge)
│   ├── renderer/       # 渲染进程 (React 19)
│   │   └── src/
│   │       ├── components/  # UI 组件
│   │       ├── stores/      # Zustand 状态管理
│   │       ├── hooks/       # 自定义 hooks
│   │       └── pages/       # 页面
│   └── shared/         # 共享类型与 schemas
├── resources/          # 静态资源
├── out/                # 构建产物
│   ├── main/           # 主进程 bundle
│   ├── preload/        # 预加载 bundle
│   └── renderer/       # 渲染进程 bundle
├── dist/               # 安装包产物
├── electron-builder.yml
├── electron.vite.config.ts
├── tsconfig.json
└── package.json
```

## 常见问题

### `better-sqlite3` 编译失败

**Windows**: 以管理员身份运行 PowerShell，安装构建工具：

```powershell
npm install --global windows-build-tools
```

或安装 Visual Studio 2022 Community，勾选「使用 C++ 的桌面开发」工作负载。

**macOS**: 确保 Xcode Command Line Tools 已安装：

```bash
xcode-select --install
```

**Linux**: 安装 build-essential 和 python3：

```bash
sudo apt install build-essential python3
```

### `electron-builder` 打包失败

Windows 打包 NSIS 安装包需要 wine 环境（跨平台打包时），建议在目标平台本地打包。

### 开发模式白屏

检查控制台是否有报错，确认 `npm install` 无 error。删除 `node_modules` 和 `out/` 后重新安装：

```bash
rm -rf node_modules out
npm install
npm run dev
```

### SDK 连接失败

`@anthropic-ai/claude-agent-sdk` 需要有效的 API Key，在应用设置中配置。SDK 自带 CLI binary，首次启动会自动下载。