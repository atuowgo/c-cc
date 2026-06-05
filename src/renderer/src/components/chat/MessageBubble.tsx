import { useState } from 'react'
import { User, Bot } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { cn } from '@renderer/lib/utils'
import type { MessageRole } from '@shared/types'

interface MessageBubbleProps {
  role: MessageRole
  content: string
  isStreaming?: boolean
  timestamp?: number
}

export default function MessageBubble({
  role,
  content,
  isStreaming = false,
  timestamp
}: MessageBubbleProps): React.JSX.Element {
  const [showTimestamp, setShowTimestamp] = useState(false)
  const isUser = role === 'user'

  if (!content && !isStreaming) return <></>

  return (
    <div
      className={cn('flex gap-3 group', isUser && 'justify-end')}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      {/* Avatar - assistant only */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#D4774C]/10 ring-1 ring-[#D4774C]/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={16} className="text-[#D4774C]" />
        </div>
      )}

      <div
        className={cn(
          'relative',
          isUser ? 'max-w-[80%]' : 'flex-1 min-w-0'
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            'px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-[#21262d] text-gray-200 rounded-2xl rounded-br-sm'
              : 'text-gray-200'
          )}
        >
          <MarkdownRenderer content={content} />

          {/* Streaming cursor */}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-[#D4774C] ml-0.5 align-text-bottom animate-pulse rounded-sm" />
          )}
        </div>

        {/* Timestamp on hover */}
        {timestamp && showTimestamp && (
          <div
            className={cn(
              'absolute -bottom-5 text-xs text-gray-600 whitespace-nowrap',
              isUser ? 'right-0' : 'left-0'
            )}
          >
            {new Date(timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>

      {/* Avatar - user only */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-[#21262d] ring-1 ring-[#30363d] flex items-center justify-center shrink-0 mt-0.5">
          <User size={16} className="text-gray-400" />
        </div>
      )}
    </div>
  )
}

function MarkdownRenderer({ content }: { content: string }): React.JSX.Element {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      components={{
        pre({ children }) {
          return (
            <pre className="bg-[#1a1a2e] rounded-lg p-4 overflow-x-auto my-2 text-sm border border-[#30363d]">
              {children}
            </pre>
          )
        },
        code({ className, children, ...props }) {
          const isInline = !className
          if (isInline) {
            return (
              <code
                className="bg-[#1a1a2e] text-[#e6edf3] px-1.5 py-0.5 rounded text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            )
          }
          return (
            <code className={cn('font-mono text-sm', className)} {...props}>
              {children}
            </code>
          )
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D4774C] hover:underline"
            >
              {children}
            </a>
          )
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-[#30363d] text-sm">
                {children}
              </table>
            </div>
          )
        },
        th({ children }) {
          return (
            <th className="border border-[#30363d] px-3 py-1.5 bg-[#161b22] text-left font-semibold">
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td className="border border-[#30363d] px-3 py-1.5">{children}</td>
          )
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-[#D4774C] pl-3 my-2 text-gray-400 italic">
              {children}
            </blockquote>
          )
        },
        ul({ children }) {
          return <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>
        },
        hr() {
          return <hr className="my-4 border-[#30363d]" />
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}