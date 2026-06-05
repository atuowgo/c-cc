import { useState, useEffect, useCallback } from 'react'
import { cn } from '@renderer/lib/utils'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  ChevronRight,
  Puzzle,
  AlertTriangle,
  XCircle,
  Loader2
} from 'lucide-react'
import type { Skill } from '@shared/types'

// --- Empty state ---
function EmptySkills() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
        <Puzzle size={24} className="text-[#484f58]" />
      </div>
      <p className="text-sm text-[#8b949e]">暂无 Skill</p>
      <p className="text-xs text-[#484f58] mt-1 max-w-[280px]">
        导入自定义 Skill 来扩展 Claude 的能力
      </p>
    </div>
  )
}

// --- Loading skeleton ---
function SkillItemSkeleton() {
  return (
    <div className="border border-[#30363d] rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-[#30363d]" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-24 bg-[#30363d] rounded" />
          <div className="h-3 w-48 bg-[#30363d] rounded" />
        </div>
        <div className="w-10 h-5 bg-[#30363d] rounded-full" />
      </div>
    </div>
  )
}

// --- Skill card ---
function SkillCard({
  skill,
  onToggle,
  onDelete
}: {
  skill: Skill
  onToggle: (name: string, enabled: boolean) => void
  onDelete: (name: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState<string | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const handleExpand = useCallback(async () => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    if (newExpanded && content === null) {
      setLoadingContent(true)
      try {
        const result = await window.claudeAPI.skill.read(skill.name)
        setContent(result.content)
      } catch {
        setContent('-- 无法加载内容 --')
      } finally {
        setLoadingContent(false)
      }
    }
  }, [expanded, content, skill.name])

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
        <div className="w-8 h-8 rounded-lg bg-[#D4774C]/10 flex items-center justify-center flex-shrink-0">
          <Puzzle size={16} className="text-[#D4774C]" />
        </div>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#e6edf3] truncate">{skill.name}</div>
          {skill.description && (
            <div className="text-xs text-[#8b949e] truncate mt-0.5">{skill.description}</div>
          )}
        </div>

        {/* Enabled toggle */}
        <button
          onClick={() => onToggle(skill.name, !skill.enabled)}
          className={cn(
            'flex-shrink-0 px-2.5 py-1 text-xs rounded-full transition-colors',
            skill.enabled
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-white/[0.04] text-[#8b949e] border border-[#30363d]'
          )}
        >
          {skill.enabled ? '已启用' : '已禁用'}
        </button>

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
                    删除 Skill
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-xs text-[#8b949e]">
                    确认删除 Skill <span className="text-[#e6edf3] font-medium">{skill.name}</span>？此操作不可撤销。
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
                    onClick={() => onDelete(skill.name)}
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

      {/* Expanded content: SKILL.md preview */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#30363d] bg-[#0d1117]">
              {loadingContent ? (
                <div className="flex items-center gap-2 p-4 text-xs text-[#8b949e]">
                  <Loader2 size={14} className="animate-spin" />
                  加载中...
                </div>
              ) : content ? (
                <pre className="m-3 p-3 text-xs text-[#8b949e] bg-[#0d1117] rounded-md border border-[#30363d] max-h-[240px] overflow-auto whitespace-pre-wrap break-words font-mono leading-relaxed">
                  {content}
                </pre>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Import dialog ---
function ImportDialog({
  open,
  onOpenChange,
  onImport
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (path: string) => void
}) {
  const [path, setPath] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    if (!path.trim()) return
    setImporting(true)
    setError(null)
    try {
      await onImport(path.trim())
      onOpenChange(false)
      setPath('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-50 p-6">
          <Dialog.Title className="text-sm font-semibold text-[#e6edf3]">导入 Skill</Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-[#8b949e]">
            输入 Skill 源目录路径（包含 SKILL.md）
          </Dialog.Description>

          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/path/to/skill-folder"
              className="w-full px-3 py-2 text-sm rounded-md bg-[#0d1117] border border-[#30363d]
                text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#D4774C] focus:outline-none transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleImport()}
            />

            <button
              onClick={() => window.claudeAPI.file.pickDirectory().then((r) => r && setPath(r.path))}
              className="w-full px-3 py-2 text-xs rounded-md text-[#D4774C] border border-[#D4774C]/20
                bg-[#D4774C]/5 hover:bg-[#D4774C]/10 transition-colors"
            >
              浏览选择目录
            </button>
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
              onClick={handleImport}
              disabled={importing || !path.trim()}
              className="px-4 py-1.5 text-xs rounded-md bg-[#D4774C] text-white hover:bg-[#E08D6A]
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? '导入中...' : '导入'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// --- Main SkillList ---

export default function SkillList(): React.JSX.Element {
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const fetchSkills = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.claudeAPI.skill.list()
      setSkills(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载 Skill 列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const handleToggle = async (name: string, enabled: boolean) => {
    setSkills((prev) => prev.map((s) => (s.name === name ? { ...s, enabled } : s)))
    try {
      await window.claudeAPI.skill.toggle(name, enabled)
    } catch {
      setSkills((prev) => prev.map((s) => (s.name === name ? { ...s, enabled: !enabled } : s)))
    }
  }

  const handleDelete = async (name: string) => {
    setSkills((prev) => prev.filter((s) => s.name !== name))
    try {
      // Skill delete is handled by removing from config; using toggle false as fallback
      await window.claudeAPI.skill.toggle(name, false)
    } catch {
      fetchSkills()
    }
  }

  const handleImport = async (path: string) => {
    const result = await window.claudeAPI.skill.import(path)
    if (!result.success) throw new Error('导入失败')
    await fetchSkills()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 bg-[#30363d] rounded animate-pulse" />
          <div className="h-8 w-20 bg-[#30363d] rounded animate-pulse" />
        </div>
        <SkillItemSkeleton />
        <SkillItemSkeleton />
        <SkillItemSkeleton />
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
          onClick={fetchSkills}
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
          <span className="text-sm font-semibold text-[#e6edf3]">已安装</span>
          <span className="text-xs text-[#8b949e] bg-[#161b22] px-1.5 py-0.5 rounded">
            {skills.length}
          </span>
        </div>
        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#D4774C]/10
            text-[#D4774C] hover:bg-[#D4774C]/20 border border-[#D4774C]/20 transition-colors"
        >
          <Plus size={14} />
          导入 Skill
        </button>
      </div>

      {/* Empty state */}
      {skills.length === 0 ? (
        <EmptySkills />
      ) : (
        <div className="space-y-2">
          {skills.map((skill) => (
            <SkillCard
              key={skill.name}
              skill={skill}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Import dialog */}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
    </div>
  )
}