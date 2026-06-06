import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowUp, Square, Paperclip, AtSign, X } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useChatStore } from '@renderer/stores/useChatStore'
import type { FileAttachment } from '@shared/types'
import type { Message } from '@shared/types'

interface InputAreaProps {
  sessionId: string
}

export default function InputArea({ sessionId }: InputAreaProps): React.JSX.Element {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isStreaming = useChatStore((s) => s.isStreaming[sessionId] || false)

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = 24
    const minHeight = lineHeight * 2 + 16 // 2 rows + padding
    const maxHeight = lineHeight * 8 + 16 // 8 rows + padding
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [text, adjustHeight])

  const handleSend = async (): Promise<void> => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

    const now = Date.now()
    const userMsg: Message = {
      id: `msg-${now}-${Math.random().toString(36).slice(2, 7)}`,
      sessionId,
      role: 'user',
      content: { text: trimmed },
      createdAt: now
    }
    useChatStore.getState().addMessage(sessionId, userMsg)
    useChatStore.getState().setIsStreaming(sessionId, true)

    const pendingAttachments = attachments.length > 0 ? attachments : undefined
    setText('')
    setAttachments([])

    console.log('[InputArea] calling session.send', { sessionId, prompt: trimmed.slice(0, 60) })
    try {
      const result = await window.claudeAPI.session.send(sessionId, trimmed, pendingAttachments)
      console.log('[InputArea] session.send resolved', result)
    } catch (err) {
      console.error('[InputArea] session.send error', err)
      useChatStore.getState().setIsStreaming(sessionId, false)
    }
  }

  const handleInterrupt = async (): Promise<void> => {
    try {
      await window.claudeAPI.session.interrupt(sessionId)
    } catch {
      // Handle error
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape' && isStreaming) {
      e.preventDefault()
      handleInterrupt()
    }
  }

  const handleFilePick = async (): Promise<void> => {
    try {
      const files = await window.claudeAPI.file.pickFiles()
      if (files && files.length > 0) {
        setAttachments((prev) => [...prev, ...files])
      }
    } catch {
      // User cancelled
    }
  }

  const removeAttachment = (index: number): void => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const hasText = text.trim().length > 0

  return (
    <div className="flex-shrink-0 border-t border-[#30363d] bg-[#0d1117]">
      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-2">
          {attachments.map((att, i) => (
            <div
              key={`${att.path}-${i}`}
              className="flex items-center gap-1 px-2 py-1 bg-[#161b22] border border-[#30363d] rounded-md text-xs text-gray-300"
            >
              <Paperclip size={10} className="text-gray-500" />
              <span className="max-w-32 truncate">{att.name}</span>
              <button
                onClick={() => removeAttachment(i)}
                className="ml-0.5 p-0.5 hover:bg-[#30363d] rounded transition-colors"
              >
                <X size={10} className="text-gray-500 hover:text-gray-300" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-4 py-3">
        {/* Left buttons */}
        <div className="flex items-center gap-1 pb-1">
          <button
            onClick={handleFilePick}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-[#161b22] rounded-md transition-colors"
            title="附件"
          >
            <Paperclip size={16} />
          </button>
          <button
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-[#161b22] rounded-md transition-colors"
            title="@文件引用"
          >
            <AtSign size={16} />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行, Esc 中断)"
          rows={2}
          disabled={isStreaming}
          className={cn(
            'flex-1 resize-none bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-gray-200',
            'outline-none focus:border-[#D4774C] placeholder-gray-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'scrollbar-thin'
          )}
        />

        {/* Send / Stop button */}
        {isStreaming ? (
          <button
            onClick={handleInterrupt}
            className="flex items-center justify-center w-9 h-9 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shrink-0"
            title="中断 (Esc)"
          >
            <Square size={16} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!hasText}
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0',
              hasText
                ? 'bg-[#D4774C] hover:bg-[#e0895e] text-white'
                : 'bg-[#21262d] text-gray-600 cursor-not-allowed'
            )}
            title="发送 (Ctrl+Enter)"
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>
    </div>
  )
}