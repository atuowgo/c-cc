import { useState, useEffect } from 'react'
import {
  Terminal,
  FileText,
  Save,
  Pencil,
  Search,
  FolderSearch,
  ChevronDown,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldAlert
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@renderer/lib/utils'

interface ToolCallCardProps {
  toolName: string
  toolInput: string
  toolResult: string
  status: 'pending' | 'success' | 'error' | 'blocked'
  isStreaming: boolean
}

const TOOL_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Bash: Terminal,
  Read: FileText,
  Write: Save,
  Edit: Pencil,
  Grep: Search,
  Glob: FolderSearch
}

function getToolIcon(toolName: string): React.ComponentType<{ size?: number; className?: string }> {
  return TOOL_ICON_MAP[toolName] || Terminal
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  pending: { label: '执行中', className: 'text-yellow-400', icon: Loader2 },
  success: { label: '成功', className: 'text-green-400', icon: CheckCircle2 },
  error: { label: '失败', className: 'text-red-400', icon: XCircle },
  blocked: { label: '已阻止', className: 'text-gray-500', icon: ShieldAlert }
}

function formatJson(raw: string): string {
  try {
    const parsed = JSON.parse(raw)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return raw
  }
}

export default function ToolCallCard({
  toolName,
  toolInput,
  toolResult,
  status,
  isStreaming
}: ToolCallCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(isStreaming)

  useEffect(() => {
    if (isStreaming && status === 'pending') {
      setExpanded(true)
    }
  }, [isStreaming, status])

  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon
  const ToolIcon = getToolIcon(toolName)

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#21262d] transition-colors text-left"
      >
        <ToolIcon size={16} className="text-gray-400 shrink-0" />
        <span className="text-sm font-medium text-gray-200">{toolName}</span>
        <span className={cn('flex items-center gap-1 text-xs', statusCfg.className)}>
          {status === 'pending' ? (
            <StatusIcon size={12} className="animate-spin" />
          ) : (
            <StatusIcon size={12} />
          )}
          {statusCfg.label}
        </span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="ml-auto"
        >
          <ChevronDown size={14} className="text-gray-500" />
        </motion.div>
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#30363d]">
              {/* Input */}
              <div className="px-3 py-2">
                <div className="text-xs text-gray-500 mb-1 font-medium">输入</div>
                <pre className="bg-[#0d1117] rounded-md p-3 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto font-mono leading-relaxed">
                  {formatJson(toolInput)}
                </pre>
              </div>

              {/* Output */}
              {toolResult && (
                <div className="px-3 pb-2">
                  <div className="text-xs text-gray-500 mb-1 font-medium">输出</div>
                  <pre
                    className={cn(
                      'rounded-md p-3 text-xs overflow-x-auto max-h-64 overflow-y-auto font-mono leading-relaxed',
                      status === 'error' ? 'bg-red-500/5 text-red-300' : 'bg-[#0d1117] text-gray-300'
                    )}
                  >
                    {formatJson(toolResult)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}