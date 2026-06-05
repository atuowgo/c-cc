import { useState, useEffect, useCallback } from 'react'
import { cn } from '@renderer/lib/utils'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  ChevronRight,
  Server,
  Wrench,
  AlertTriangle,
  XCircle,
  Loader2
} from 'lucide-react'
import type { MCPServerConfig, MCPServerStatus } from '@shared/types'

// --- Empty state ---
function EmptyServers() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
        <Server size={24} className="text-[#484f58]" />
      </div>
      <p className="text-sm text-[#8b949e]">暂无 MCP 服务器</p>
      <p className="text-xs text-[#484f58] mt-1 max-w-[280px]">
        添加 MCP 服务器以扩展 Claude 的工具能力
      </p>
    </div>
  )
}

// --- Loading skeleton ---
function ServerItemSkeleton() {
  return (
    <div className="border border-[#30363d] rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#30363d]" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-28 bg-[#30363d] rounded" />
          <div className="h-3 w-40 bg-[#30363d] rounded" />
        </div>
        <div className="w-14 h-5 bg-[#30363d] rounded-full" />
      </div>
    </div>
  )
}

// --- Transport badge ---
function TransportBadge({ transport }: { transport: string }) {
  const colors: Record<string, string> = {
    stdio: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    sse: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    http: 'bg-green-500/10 text-green-400 border-green-500/20'
  }
  return (
    <span
      className={cn(
        'px-2 py-0.5 text-[10px] font-medium rounded-full border',
        colors[transport] || 'bg-white/[0.04] text-[#8b949e] border-[#30363d]'
      )}
    >
      {transport.toUpperCase()}
    </span>
  )
}

// --- Status indicator ---
function StatusDot({ status }: { status: MCPServerStatus['status'] }) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          status === 'online' && 'bg-green-400',
          status === 'error' && 'bg-red-400',
          status === 'offline' && 'bg-yellow-400'
        )}
      />
      <span className="text-[#8b949e]">
        {status === 'online'
          ? '在线'
          : status === 'error'
            ? '错误'
            : '离线'}
      </span>
    </span>
  )
}

// --- Add/Edit dialog ---
function AddServerDialog({
  open,
  onOpenChange,
  onAdd
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (config: MCPServerConfig) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [command, setCommand] = useState('')
  const [args, setArgs] = useState('')
  const [envStr, setEnvStr] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!name.trim() || !command.trim()) return
    setAdding(true)
    setError(null)
    try {
      const env: Record<string, string> = {}
      if (envStr.trim()) {
        envStr.split('\n').forEach((line) => {
          const [k, ...v] = line.split('=')
          if (k) env[k.trim()] = v.join('=').trim()
        })
      }
      await onAdd({
        name: name.trim(),
        command: command.trim(),
        args: args.trim() ? args.split(' ').filter(Boolean) : [],
        env: Object.keys(env).length > 0 ? env : undefined,
        transport: 'stdio'
      })
      setName('')
      setCommand('')
      setArgs('')
      setEnvStr('')
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加失败')
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-50 p-6">
          <Dialog.Title className="text-sm font-semibold text-[#e6edf3]">添加 MCP 服务器</Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-[#8b949e]">
            配置 stdio 类型的 MCP 服务器
          </Dialog.Description>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs text-[#8b949e] mb-1.5">名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-mcp-server"
                className="w-full px-3 py-2 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
                  text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#D4774C] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#8b949e] mb-1.5">命令</label>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="npx -y @modelcontextprotocol/server-filesystem"
                className="w-full px-3 py-2 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
                  text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#D4774C] focus:outline-none transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-[#8b949e] mb-1.5">参数 (空格分隔)</label>
              <input
                type="text"
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                placeholder="/path/to/allowed/dir"
                className="w-full px-3 py-2 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
                  text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#D4774C] focus:outline-none transition-colors font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-[#8b949e] mb-1.5">环境变量 (每行 KEY=VALUE)</label>
              <textarea
                value={envStr}
                onChange={(e) => setEnvStr(e.target.value)}
                placeholder="API_KEY=xxx"
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
                  text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#D4774C] focus:outline-none
                  resize-none transition-colors font-mono text-xs"
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Dialog.Close asChild>
              <button className="px-3 py-1.5 text-xs rounded-md text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/[0.05] transition-colors">
                取消
              </button>
            </Dialog.Close>
            <button
              onClick={handleAdd}
              disabled={adding || !name.trim() || !command.trim()}
              className="px-4 py-1.5 text-xs rounded-md bg-[#D4774C] text-white hover:bg-[#E08D6A]
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? '添加中...' : '添加'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// --- Server card ---
function ServerCard({
  config,
  status,
  onDelete
}: {
  config: MCPServerConfig
  status: MCPServerStatus['status']
  onDelete: (name: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [tools, setTools] = useState<string[]>([])
  const [loadingTools, setLoadingTools] = useState(false)
  const [toolsError, setToolsError] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const handleExpand = useCallback(async () => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    if (newExpanded && tools.length === 0 && !toolsError) {
      setLoadingTools(true)
      try {
        const result = await window.claudeAPI.mcp.tools(config.name)
        setTools(result.tools)
      } catch (e) {
        setToolsError(e instanceof Error ? e.message : '加载工具列表失败')
      } finally {
        setLoadingTools(false)
      }
    }
  }, [expanded, tools.length, toolsError, config.name])

  return (
    <div className="border border-[#30363d] rounded-lg overflow-hidden transition-colors hover:border-[#484f58]">
      <div className="flex items-center gap-3 p-3">
        {/* Expand toggle */}
        <button
          onClick={handleExpand}
          className="flex-shrink-0 p-0.5 text-[#8b949e] hover:text-[#e6edf3] transition-colors"
        >
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight size={16} />
          </motion.div>
        </button>

        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <Server size={16} className="text-blue-400" />
        </div>

        {/* Name + transport */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#e6edf3] truncate">{config.name}</span>
            <TransportBadge transport={config.transport} />
          </div>
          <div className="text-xs text-[#8b949e] truncate mt-0.5 font-mono">
            {config.command} {config.args?.join(' ')}
          </div>
        </div>

        {/* Status */}
        <StatusDot status={status} />

        {/* Delete */}
        <Dialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <Dialog.Trigger asChild>
            <button className="flex-shrink-0 p-1.5 rounded-md text-[#484f58] hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 size={14} />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-50 p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-red-400" />
                </div>
                <div>
                  <Dialog.Title className="text-sm font-semibold text-[#e6edf3]">
                    删除 MCP 服务器
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-xs text-[#8b949e]">
                    确认删除服务器 <span className="text-[#e6edf3] font-medium">{config.name}</span>？此操作不可撤销。
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
                  <button
                    onClick={() => onDelete(config.name)}
                    className="px-3 py-1.5 text-xs rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    确认删除
                  </button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Expanded: tools list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#30363d] bg-[#0d1117] p-3">
              <div className="text-xs text-[#8b949e] font-medium mb-2 flex items-center gap-1.5">
                <Wrench size={12} />
                工具列表
                {tools.length > 0 && (
                  <span className="bg-[#30363d] px-1.5 py-0.5 rounded text-[10px]">{tools.length}</span>
                )}
              </div>

              {loadingTools ? (
                <div className="flex items-center gap-2 text-xs text-[#8b949e] py-2">
                  <Loader2 size={12} className="animate-spin" />
                  加载中...
                </div>
              ) : toolsError ? (
                <div className="flex items-center gap-2 text-xs text-red-400 py-2">
                  <XCircle size={12} />
                  {toolsError}
                </div>
              ) : tools.length === 0 ? (
                <p className="text-xs text-[#484f58] py-1">无可用工具</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-0.5 text-[11px] rounded bg-white/[0.04] text-[#8b949e]
                        border border-[#30363d] font-mono"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Main MCPServerList ---

export default function MCPServerList(): React.JSX.Element {
  const [servers, setServers] = useState<MCPServerConfig[]>([])
  const [statuses, setStatuses] = useState<MCPServerStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [srv, st] = await Promise.all([
        window.claudeAPI.mcp.list(),
        window.claudeAPI.mcp.status().catch(() => [] as MCPServerStatus[])
      ])
      setServers(srv)
      setStatuses(st)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载 MCP 列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStatus = (name: string): MCPServerStatus['status'] => {
    const s = statuses.find((st) => st.name === name)
    return s?.status || 'offline'
  }

  const handleAdd = async (config: MCPServerConfig) => {
    const result = await window.claudeAPI.mcp.add(config)
    if (!result.success) throw new Error('添加失败')
    await fetchData()
  }

  const handleDelete = async (name: string) => {
    setServers((prev) => prev.filter((s) => s.name !== name))
    try {
      await window.claudeAPI.mcp.delete(name)
    } catch {
      fetchData()
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 bg-[#30363d] rounded animate-pulse" />
          <div className="h-8 w-24 bg-[#30363d] rounded animate-pulse" />
        </div>
        <ServerItemSkeleton />
        <ServerItemSkeleton />
        <ServerItemSkeleton />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="flex items-center gap-2 text-sm text-red-400 mb-3">
          <XCircle size={18} />
          {error}
        </div>
        <button
          onClick={fetchData}
          className="px-3 py-1.5 text-xs rounded-md bg-[#D4774C] text-white hover:bg-[#E08D6A] transition-colors"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#e6edf3]">服务器</span>
          <span className="text-xs text-[#8b949e] bg-[#161b22] px-1.5 py-0.5 rounded">
            {servers.length}
          </span>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#D4774C]/10
            text-[#D4774C] hover:bg-[#D4774C]/20 border border-[#D4774C]/20 transition-colors"
        >
          <Plus size={14} />
          添加服务器
        </button>
      </div>

      {/* Empty state */}
      {servers.length === 0 ? (
        <EmptyServers />
      ) : (
        <div className="space-y-2">
          {servers.map((srv) => (
            <ServerCard
              key={srv.name}
              config={srv}
              status={getStatus(srv.name)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add dialog */}
      <AddServerDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />
    </div>
  )
}