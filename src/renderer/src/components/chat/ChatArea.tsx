import { useEffect, useRef } from 'react'
import { Bot } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '@renderer/stores/useChatStore'
import { cn } from '@renderer/lib/utils'
import MessageBubble from './MessageBubble'
import ToolCallCard from './ToolCallCard'
import type { Message, ToolCall } from '@shared/types'

const EMPTY_MESSAGES: Message[] = []
const EMPTY_TOOL_CALLS: ToolCall[] = []

interface ChatAreaProps {
  sessionId: string
}

function groupMessages(messages: Message[]): Message[] {
  const grouped: Message[] = []
  for (const msg of messages) {
    const last = grouped[grouped.length - 1]
    if (last && last.role === msg.role && msg.role === 'assistant') {
      // Merge consecutive assistant text content
      if (last.content.text && msg.content.text) {
        grouped[grouped.length - 1] = {
          ...last,
          content: { ...last.content, text: (last.content.text || '') + (msg.content.text || '') }
        }
        continue
      }
    }
    grouped.push(msg)
  }
  return grouped
}

export default function ChatArea({ sessionId }: ChatAreaProps): React.JSX.Element {
  const messages = useChatStore((s) => s.messages[sessionId] ?? EMPTY_MESSAGES)
  const streamingContent = useChatStore((s) => s.streamingContent[sessionId] ?? '')
  const isStreaming = useChatStore((s) => s.isStreaming[sessionId] ?? false)
  const toolCalls = useChatStore((s) => s.toolCalls[sessionId] ?? EMPTY_TOOL_CALLS)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, toolCalls])

  const groupedMessages = groupMessages(messages)
  const hasContent = groupedMessages.length > 0 || streamingContent || toolCalls.length > 0

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6"
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {!hasContent && !isStreaming ? (
          <EmptyState />
        ) : (
          <AnimatePresence>
            {hasContent ? (
              groupedMessages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                >
                  <MessageBubble
                    role={msg.role}
                    content={msg.content.text || ''}
                    timestamp={msg.createdAt}
                  />
                </motion.div>
              ))
            ) : (
              <LoadingState />
            )}

            {/* Tool calls */}
            {toolCalls.map((tc) => (
              <motion.div
                key={tc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ToolCallCard
                  toolName={tc.toolName}
                  toolInput={tc.toolInput}
                  toolResult={tc.toolResult}
                  status={tc.status}
                  isStreaming={isStreaming}
                />
              </motion.div>
            ))}

            {/* Streaming assistant message */}
            {streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <MessageBubble
                  role="assistant"
                  content={streamingContent}
                  isStreaming={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function EmptyState(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4774C]/20 to-[#D4774C]/5 flex items-center justify-center mb-6 ring-1 ring-[#D4774C]/10">
        <Bot size={40} className="text-[#D4774C]" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">cc-bot</h1>
      <p className="text-gray-500 text-sm">
        开始新对话，或从左侧选择会话
      </p>
    </div>
  )
}

function LoadingState(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4 px-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            'flex gap-3',
            i === 2 && 'justify-end'
          )}
        >
          {i !== 2 && (
            <div className="w-8 h-8 rounded-full bg-[#161b22] animate-pulse shrink-0" />
          )}
          <div
            className={cn(
              'rounded-2xl bg-[#161b22] animate-pulse',
              i === 2 ? 'max-w-[60%] h-10 w-48 rounded-br-sm' : 'w-full max-w-[80%] h-24'
            )}
          />
        </div>
      ))}
    </div>
  )
}