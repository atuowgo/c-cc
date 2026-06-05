import { useState, useEffect } from 'react'
import { useConfigStore } from '@renderer/stores/useConfigStore'
import { cn } from '@renderer/lib/utils'
import * as Tabs from '@radix-ui/react-tabs'
import * as Select from '@radix-ui/react-select'
import * as Switch from '@radix-ui/react-switch'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronDown,
  Check,
  Globe,
  Key,
  Cpu,
  Puzzle,
  Server,
  Shield,
  RefreshCw,
  Wrench,
  AlertTriangle
} from 'lucide-react'
import SkillList from './SkillList'
import MCPServerList from './MCPServerList'

const TABS = [
  { id: 'general', label: '通用', icon: Globe },
  { id: 'api', label: 'API', icon: Key },
  { id: 'model', label: '模型', icon: Cpu },
  { id: 'skill', label: 'Skill', icon: Puzzle },
  { id: 'mcp', label: 'MCP', icon: Server },
  { id: 'permissions', label: '权限', icon: Shield },
  { id: 'updates', label: '更新', icon: RefreshCw },
  { id: 'advanced', label: '高级', icon: Wrench }
] as const

type TabId = (typeof TABS)[number]['id']

interface SettingsPageProps {
  onClose: () => void
}

// --- Reusable layout primitives ---

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-white/[0.03] rounded-lg transition-colors">
      <div className="flex-1 min-w-0 mr-4">
        <label className="text-sm text-[#e6edf3] font-medium">{label}</label>
        {description && <p className="text-xs text-[#8b949e] mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-[#e6edf3] mb-2 mt-6 first:mt-0">{children}</h3>
}

function SmallButton({
  variant = 'default',
  onClick,
  children,
  className
}: {
  variant?: 'default' | 'danger'
  onClick?: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-xs rounded-md transition-colors',
        variant === 'danger'
          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
          : 'bg-[#D4774C] text-white hover:bg-[#E08D6A]',
        className
      )}
    >
      {children}
    </button>
  )
}

// --- Select component for consistent styling ---

function StyledSelect({
  value,
  onChange,
  options,
  placeholder = '请选择...'
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="inline-flex items-center justify-between w-[200px] px-3 py-1.5 text-sm rounded-md bg-[#161b22] border border-[#30363d] text-[#e6edf3] hover:border-[#484f58] focus:border-[#D4774C] focus:outline-none transition-colors">
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown size={14} className="text-[#8b949e]" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-50 min-w-[200px] bg-[#161b22] border border-[#30363d] rounded-md shadow-lg overflow-hidden"
        >
          <Select.Viewport>
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="flex items-center px-3 py-2 text-sm text-[#e6edf3] hover:bg-white/[0.06] cursor-pointer outline-none data-[highlighted]:bg-white/[0.06]"
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator className="ml-auto">
                  <Check size={14} className="text-[#D4774C]" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

// --- Toggle / Switch ---

function StyledSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      className={cn(
        'relative w-9 h-5 rounded-full transition-colors',
        checked ? 'bg-[#D4774C]' : 'bg-[#30363d]'
      )}
    >
      <Switch.Thumb
        className={cn(
          'block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5',
          checked && 'translate-x-[18px]'
        )}
      />
    </Switch.Root>
  )
}

// --- Tab content components ---

function GeneralTab() {
  const config = useConfigStore((s) => s.config)
  const updateConfig = useConfigStore((s) => s.updateConfig)
  if (!config) return null

  return (
    <div className="space-y-2">
      <SectionTitle>外观</SectionTitle>

      <SettingRow label="主题" description="深色 / 浅色 / 跟随系统">
        <div className="flex gap-1 bg-[#0d1117] rounded-md p-0.5 border border-[#30363d]">
          {(['dark', 'light', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateConfig({ theme: t })}
              className={cn(
                'px-3 py-1 text-xs rounded transition-colors',
                config.theme === t
                  ? 'bg-[#D4774C] text-white'
                  : 'text-[#8b949e] hover:text-[#e6edf3]'
              )}
            >
              {t === 'dark' ? '深色' : t === 'light' ? '浅色' : '系统'}
            </button>
          ))}
        </div>
      </SettingRow>

      <SectionTitle>语言</SectionTitle>

      <SettingRow label="界面语言">
        <StyledSelect
          value={config.language}
          onChange={(v) => updateConfig({ language: v as 'zh-CN' | 'en-US' })}
          options={[
            { value: 'zh-CN', label: '中文' },
            { value: 'en-US', label: 'English' }
          ]}
        />
      </SettingRow>

      <SectionTitle>字体</SectionTitle>

      <SettingRow label={`字号: ${config.fontSize}px`} description="12px - 24px">
        <input
          type="range"
          min={12}
          max={24}
          step={1}
          value={config.fontSize}
          onChange={(e) => updateConfig({ fontSize: Number(e.target.value) })}
          className="w-[160px] h-1.5 bg-[#30363d] rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D4774C] [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </SettingRow>

      <SectionTitle>行为</SectionTitle>

      <SettingRow label="开机自启动" description="系统启动时自动运行 cc-bot">
        <StyledSwitch
          checked={false}
          onChange={() => {
            /* startup register to be implemented */
          }}
        />
      </SettingRow>
    </div>
  )
}

function ApiTab() {
  const config = useConfigStore((s) => s.config)
  const updateConfig = useConfigStore((s) => s.updateConfig)
  const [showKey, setShowKey] = useState(false)
  if (!config) return null

  const showBedrock = config.apiProvider === 'bedrock'
  const showVertex = config.apiProvider === 'vertex'
  const showAzure = config.apiProvider === 'azure'

  return (
    <div className="space-y-2">
      <SectionTitle>API 连接</SectionTitle>

      <SettingRow label="API Key">
        <div className="flex items-center gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={config.apiKey || ''}
            onChange={(e) => updateConfig({ apiKey: e.target.value })}
            placeholder="sk-ant-..."
            className="w-[240px] px-3 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
              text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#D4774C] focus:outline-none transition-colors"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="p-1.5 text-[#8b949e] hover:text-[#e6edf3] transition-colors text-xs"
          >
            {showKey ? '隐藏' : '显示'}
          </button>
        </div>
      </SettingRow>

      <SettingRow label="Provider">
        <StyledSelect
          value={config.apiProvider}
          onChange={(v) => updateConfig({ apiProvider: v as AppConfig['apiProvider'] })}
          options={[
            { value: 'anthropic', label: 'Anthropic' },
            { value: 'bedrock', label: 'AWS Bedrock' },
            { value: 'vertex', label: 'Google Vertex AI' },
            { value: 'azure', label: 'Azure AI' }
          ]}
        />
      </SettingRow>

      <SettingRow label="代理 URL" description="HTTP/SOCKS 代理地址">
        <input
          type="text"
          value={config.proxy || ''}
          onChange={(e) => updateConfig({ proxy: e.target.value })}
          placeholder="http://127.0.0.1:7890"
          className="w-[240px] px-3 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
            text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#D4774C] focus:outline-none transition-colors"
        />
      </SettingRow>

      <AnimatePresence>
        {showBedrock && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <SectionTitle>Bedrock 配置</SectionTitle>
            <SettingRow label="Access Key ID">
              <input
                type="password"
                value={config.bedrockAccessKeyId || ''}
                onChange={(e) => updateConfig({ bedrockAccessKeyId: e.target.value })}
                className="w-[240px] px-3 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
                  text-[#e6edf3] focus:border-[#D4774C] focus:outline-none transition-colors"
              />
            </SettingRow>
            <SettingRow label="Secret Access Key">
              <input
                type="password"
                value={config.bedrockSecretAccessKey || ''}
                onChange={(e) => updateConfig({ bedrockSecretAccessKey: e.target.value })}
                className="w-[240px] px-3 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
                  text-[#e6edf3] focus:border-[#D4774C] focus:outline-none transition-colors"
              />
            </SettingRow>
            <SettingRow label="Region">
              <input
                type="text"
                value={config.bedrockRegion || ''}
                onChange={(e) => updateConfig({ bedrockRegion: e.target.value })}
                placeholder="us-east-1"
                className="w-[240px] px-3 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
                  text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#D4774C] focus:outline-none transition-colors"
              />
            </SettingRow>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVertex && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <SectionTitle>Vertex AI 配置</SectionTitle>
            <SettingRow label="Project ID">
              <input
                type="text"
                value={config.vertexProjectId || ''}
                onChange={(e) => updateConfig({ vertexProjectId: e.target.value })}
                className="w-[240px] px-3 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
                  text-[#e6edf3] focus:border-[#D4774C] focus:outline-none transition-colors"
              />
            </SettingRow>
            <SettingRow label="Region">
              <input
                type="text"
                value={config.vertexRegion || ''}
                onChange={(e) => updateConfig({ vertexRegion: e.target.value })}
                placeholder="us-central1"
                className="w-[240px] px-3 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
                  text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#D4774C] focus:outline-none transition-colors"
              />
            </SettingRow>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAzure && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <SectionTitle>Azure AI 配置</SectionTitle>
            <SettingRow label="Endpoint">
              <input
                type="text"
                value={config.azureEndpoint || ''}
                onChange={(e) => updateConfig({ azureEndpoint: e.target.value })}
                className="w-[240px] px-3 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
                  text-[#e6edf3] focus:border-[#D4774C] focus:outline-none transition-colors"
              />
            </SettingRow>
            <SettingRow label="API Version">
              <input
                type="text"
                value={config.azureApiVersion || ''}
                onChange={(e) => updateConfig({ azureApiVersion: e.target.value })}
                placeholder="2024-08-01-preview"
                className="w-[240px] px-3 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
                  text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#D4774C] focus:outline-none transition-colors"
              />
            </SettingRow>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ModelTab() {
  const config = useConfigStore((s) => s.config)
  const updateConfig = useConfigStore((s) => s.updateConfig)
  if (!config) return null

  return (
    <div className="space-y-2">
      <SectionTitle>模型选择</SectionTitle>

      <SettingRow label="默认模型">
        <StyledSelect
          value={config.defaultModel}
          onChange={(v) => updateConfig({ defaultModel: v })}
          options={[
            { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
            { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
            { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' }
          ]}
        />
      </SettingRow>

      <SettingRow label="上下文窗口" description="模型支持的最大 token 数">
        <span className="text-sm text-[#8b949e] tabular-nums">
          {config.defaultModel.includes('opus') ? '200K' : config.defaultModel.includes('haiku') ? '128K' : '200K'}
        </span>
      </SettingRow>

      <SectionTitle>生成参数</SectionTitle>

      <SettingRow label={`Temperature: ${0.7}`} description="0 - 1，越高越随机">
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={0.7}
          readOnly
          className="w-[160px] h-1.5 bg-[#30363d] rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D4774C] [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </SettingRow>
    </div>
  )
}

function PermissionsTab() {
  const config = useConfigStore((s) => s.config)
  const updateConfig = useConfigStore((s) => s.updateConfig)
  if (!config) return null

  return (
    <div className="space-y-2">
      <SectionTitle>默认权限模式</SectionTitle>

      <SettingRow label="模式" description="控制 Claude 执行工具调用时是否需要确认">
        <StyledSelect
          value={config.defaultPermMode}
          onChange={(v) => updateConfig({ defaultPermMode: v as AppConfig['defaultPermMode'] })}
          options={[
            { value: 'default', label: '默认 - 每次询问' },
            { value: 'acceptEdits', label: '接受编辑 - 自动接受文件编辑' },
            { value: 'plan', label: '计划模式 - 仅分析，不执行' },
            { value: 'auto', label: '自动 - 全部自动执行' },
            { value: 'bypassPermissions', label: '绕过权限 - 无限制' }
          ]}
        />
      </SettingRow>

      <SectionTitle>工具类别控制</SectionTitle>

      <SettingRow label="文件读取 (Read)" description="允许读取文件系统中的文件">
        <StyledSwitch checked={true} onChange={() => {}} />
      </SettingRow>
      <SettingRow label="文件写入 (Write/Edit)" description="允许创建和修改文件">
        <StyledSwitch checked={true} onChange={() => {}} />
      </SettingRow>
      <SettingRow label="Bash 命令" description="允许执行 Shell 命令">
        <StyledSwitch checked={true} onChange={() => {}} />
      </SettingRow>
      <SettingRow label="网络请求 (WebFetch/Search)" description="允许访问互联网">
        <StyledSwitch checked={false} onChange={() => {}} />
      </SettingRow>
      <SettingRow label="MCP 工具" description="允许调用 MCP 服务器提供的工具">
        <StyledSwitch checked={true} onChange={() => {}} />
      </SettingRow>
    </div>
  )
}

function UpdatesTab() {
  const [checking, setChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState<{ available: boolean; version?: string } | null>(null)

  const handleCheck = async () => {
    setChecking(true)
    try {
      const result = await window.claudeAPI.update.check()
      setUpdateAvailable(result)
    } catch {
      setUpdateAvailable({ available: false })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-2">
      <SectionTitle>版本信息</SectionTitle>

      <SettingRow label="当前版本">
        <span className="text-sm text-[#8b949e] tabular-nums">1.0.0</span>
      </SettingRow>

      <SettingRow label="检查更新">
        <SmallButton onClick={handleCheck}>
          {checking ? '检查中...' : '检查更新'}
        </SmallButton>
      </SettingRow>

      {updateAvailable && (
        <SettingRow label="更新状态">
          <span
            className={cn(
              'text-sm',
              updateAvailable.available ? 'text-green-400' : 'text-[#8b949e]'
            )}
          >
            {updateAvailable.available ? `发现新版本 v${updateAvailable.version}` : '已是最新版本'}
          </span>
        </SettingRow>
      )}

      <SettingRow label="自动更新" description="下载更新后自动安装">
        <StyledSwitch checked={false} onChange={() => {}} />
      </SettingRow>

      <SectionTitle>更新日志</SectionTitle>
      <div className="px-4">
        <a
          href="#"
          className="text-sm text-[#D4774C] hover:text-[#E08D6A] hover:underline transition-colors"
          onClick={(e) => { e.preventDefault() }}
        >
          查看完整更新日志 -{'>'}
        </a>
      </div>
    </div>
  )
}

function AdvancedTab() {
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExportData = async () => {
    setExporting(true)
    // Data export would trigger a native save dialog in production
    await new Promise((r) => setTimeout(r, 500))
    setExporting(false)
  }

  return (
    <div className="space-y-2">
      <SectionTitle>日志</SectionTitle>

      <SettingRow label="日志级别">
        <StyledSelect
          value="info"
          onChange={() => {}}
          options={[
            { value: 'debug', label: 'Debug' },
            { value: 'info', label: 'Info' },
            { value: 'warn', label: 'Warn' },
            { value: 'error', label: 'Error' }
          ]}
        />
      </SettingRow>

      <SectionTitle>数据</SectionTitle>

      <SettingRow label="数据目录">
        <span className="text-sm text-[#8b949e] font-mono max-w-[240px] truncate">
          ~/.cc-bot
        </span>
      </SettingRow>

      <SettingRow label="导出数据" description="将会话和配置导出为 JSON 文件">
        <SmallButton onClick={handleExportData}>
          {exporting ? '导出中...' : '导出数据'}
        </SmallButton>
      </SettingRow>

      <SectionTitle>危险操作</SectionTitle>

      <Dialog.Root open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <Dialog.Trigger asChild>
          <button className="px-4 py-1.5 text-xs rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors">
            重置所有设置
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <div className="flex-1">
                <Dialog.Title className="text-sm font-semibold text-[#e6edf3]">
                  确认重置
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-xs text-[#8b949e] leading-relaxed">
                  此操作将清除所有设置（API Key、偏好设置等）并恢复为默认值。此操作不可撤销。
                </Dialog.Description>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Dialog.Close asChild>
                <button className="px-3 py-1.5 text-xs rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/[0.05] transition-colors">
                  取消
                </button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <button className="px-3 py-1.5 text-xs rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors">
                  确认重置
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

// --- Main SettingsPage ---

export default function SettingsPage({ onClose }: SettingsPageProps): React.JSX.Element {
  const { config, isLoading, fetchConfig } = useConfigStore()
  const [activeTab, setActiveTab] = useState<TabId>('general')

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#D4774C] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[#8b949e]">加载设置...</span>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d1117]">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle size={32} className="text-red-400" />
          <span className="text-sm text-[#8b949e]">无法加载设置</span>
          <SmallButton onClick={fetchConfig}>重试</SmallButton>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between h-11 px-4 border-b border-[#30363d] flex-shrink-0">
        <h1 className="text-sm font-semibold text-[#e6edf3]">设置</h1>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/[0.06] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs layout */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
        className="flex flex-1 overflow-hidden"
      >
        {/* Left tab list */}
        <Tabs.List className="w-[180px] flex-shrink-0 border-r border-[#30363d] py-2 flex flex-col gap-0.5 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 mx-1.5 text-sm rounded-md transition-colors text-left',
                  'data-[state=active]:bg-[#D4774C]/10 data-[state=active]:text-[#D4774C]',
                  'text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/[0.04]'
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </Tabs.Trigger>
            )
          })}
        </Tabs.List>

        {/* Right content area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="p-6"
            >
              <Tabs.Content value="general" className="focus:outline-none">
                <GeneralTab />
              </Tabs.Content>
              <Tabs.Content value="api" className="focus:outline-none">
                <ApiTab />
              </Tabs.Content>
              <Tabs.Content value="model" className="focus:outline-none">
                <ModelTab />
              </Tabs.Content>
              <Tabs.Content value="skill" className="focus:outline-none">
                <SkillList />
              </Tabs.Content>
              <Tabs.Content value="mcp" className="focus:outline-none">
                <MCPServerList />
              </Tabs.Content>
              <Tabs.Content value="permissions" className="focus:outline-none">
                <PermissionsTab />
              </Tabs.Content>
              <Tabs.Content value="updates" className="focus:outline-none">
                <UpdatesTab />
              </Tabs.Content>
              <Tabs.Content value="advanced" className="focus:outline-none">
                <AdvancedTab />
              </Tabs.Content>
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs.Root>
    </div>
  )
}

// Re-export the AppConfig type usage
import type { AppConfig } from '@shared/types'