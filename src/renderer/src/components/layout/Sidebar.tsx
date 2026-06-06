import { useState } from 'react'
import { Plus, Search, Trash2, Settings, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSessionStore } from '@renderer/stores/useSessionStore'
import { useUIStore } from '@renderer/stores/useUIStore'
import { cn } from '@renderer/lib/utils'
import type { Session } from '@shared/types'

const MINUTES = 60 * 1000
const HOURS = 60 * MINUTES
const DAYS = 24 * HOURS

function relativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  if (diff < MINUTES) return '刚刚'
  if (diff < HOURS) return `${Math.floor(diff / MINUTES)}分钟前`
  if (diff < 2 * HOURS) return '1小时前'
  if (diff < DAYS) return `${Math.floor(diff / HOURS)}小时前`
  if (diff < 2 * DAYS) return '昨天'
  if (diff < 7 * DAYS) return `${Math.floor(diff / DAYS)}天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

export default function Sidebar(): React.JSX.Element {
  const { sessions, activeSessionId, setActiveSession, removeSession } = useSessionStore()
  const { sidebarOpen, sidebarWidth, openSettings } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = searchQuery
    ? sessions.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessions

  const handleNewSession = async (): Promise<void> => {
    try {
      const session = await window.claudeAPI.session.create({})
      await useSessionStore.getState().fetchSessions()
      if (session?.id) {
        useSessionStore.getState().setActiveSession(session.id)
      }
    } catch {
      // error
    }
  }

  if (!sidebarOpen) return <></>

  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: sidebarWidth }}
      className="bg-[#0d1117] border-r border-[#30363d] flex flex-col flex-shrink-0 overflow-hidden"
    >
      {/* New Session Button */}
      <div className="p-3">
        <button
          onClick={handleNewSession}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#D4774C] hover:bg-[#e0895e] text-white rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          新建会话
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="搜索会话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded-md text-gray-200 text-sm outline-none focus:border-[#D4774C] placeholder-gray-600"
          />
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-1">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="text-center text-gray-600 text-sm mt-8 px-4">
              {searchQuery ? '无匹配会话' : '暂无会话，点击上方按钮创建'}
            </div>
          ) : (
            filtered.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                onClick={() => setActiveSession(session.id)}
                onDelete={() => removeSession(session.id)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-[#30363d] p-3 flex items-center justify-between">
        <button className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors text-sm">
          <User size={16} />
          <span className="truncate">用户</span>
        </button>
        <button
          onClick={openSettings}
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#161b22] rounded-md transition-colors"
        >
          <Settings size={16} />
        </button>
      </div>
    </motion.div>
  )
}

function SessionItem({
  session,
  isActive,
  onClick,
  onDelete
}: {
  session: Session
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className={cn(
        'relative mx-1 my-0.5 px-3 py-2.5 rounded-md cursor-pointer transition-colors group',
        isActive
          ? 'bg-[#1a2332] border-l-2 border-[#D4774C]'
          : 'hover:bg-[#161b22] border-l-2 border-transparent'
      )}
    >
      <div className="text-sm text-gray-200 truncate pr-6">{session.title || '新会话'}</div>
      <div className="text-xs text-gray-500 mt-0.5">
        {relativeTime(session.updatedAt)}
      </div>
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      )}
    </motion.div>
  )
}