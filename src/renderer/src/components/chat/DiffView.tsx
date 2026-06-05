import { useMemo } from 'react'
import { Check, X, FileText } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

interface DiffViewProps {
  fileName: string
  oldContent: string
  newContent: string
  onAccept: () => void
  onReject: () => void
}

interface DiffLine {
  type: 'add' | 'remove' | 'context'
  lineNumber: number
  content: string
}

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const result: DiffLine[] = []

  // Simple LCS-based diff
  const m = oldLines.length
  const n = newLines.length

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack
  const hunks: Array<{ type: 'add' | 'remove' | 'context'; oldLine?: number; newLine?: number; content: string }> = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      hunks.unshift({ type: 'context', oldLine: i, newLine: j, content: oldLines[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      hunks.unshift({ type: 'add', newLine: j, content: newLines[j - 1] })
      j--
    } else {
      hunks.unshift({ type: 'remove', oldLine: i, content: oldLines[i - 1] })
      i--
    }
  }

  // Compact: show context around changes
  let contextCounter = 0
  const compacted: typeof hunks = []

  for (const h of hunks) {
    if (h.type === 'context') {
      contextCounter++
      if (contextCounter <= 3 || contextCounter === 0) {
        compacted.push(h)
      } else if (contextCounter === 4) {
        compacted.push({ type: 'context', content: '...' })
      }
    } else {
      contextCounter = 0
      compacted.push(h)
    }
  }

  // Build final result
  let lineNum = 0
  for (const h of compacted) {
    lineNum++
    result.push({
      type: h.type,
      lineNumber: lineNum,
      content: h.content
    })
  }

  return result
}

export default function DiffView({
  fileName,
  oldContent,
  newContent,
  onAccept,
  onReject
}: DiffViewProps): React.JSX.Element {
  const diffLines = useMemo(() => computeDiff(oldContent, newContent), [oldContent, newContent])

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#30363d]">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <FileText size={14} className="text-gray-500" />
          <span className="font-mono text-xs">{fileName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onAccept}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-md transition-colors"
          >
            <Check size={12} />
            接受
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-md transition-colors"
          >
            <X size={12} />
            拒绝
          </button>
        </div>
      </div>

      {/* Diff content */}
      <div className="max-h-80 overflow-y-auto">
        <div className="font-mono text-xs leading-6">
          {diffLines.map((line, idx) => (
            <div
              key={idx}
              className={cn(
                'flex px-3',
                line.type === 'add' && 'bg-green-500/10',
                line.type === 'remove' && 'bg-red-500/10',
                line.type === 'context' && line.content === '...' && 'text-gray-600 bg-transparent'
              )}
            >
              <span
                className={cn(
                  'w-6 text-right mr-2 select-none shrink-0',
                  line.type === 'add' ? 'text-green-500' : line.type === 'remove' ? 'text-red-500' : 'text-gray-600'
                )}
              >
                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
              </span>
              <span
                className={cn(
                  'whitespace-pre-wrap break-all',
                  line.type === 'add' && 'text-green-300',
                  line.type === 'remove' && 'text-red-300',
                  line.type === 'context' && line.content === '...' && 'text-gray-600 italic',
                  line.type === 'context' && line.content !== '...' && 'text-gray-400'
                )}
              >
                {line.content}
              </span>
            </div>
          ))}
          {diffLines.length === 0 && (
            <div className="px-3 py-4 text-center text-gray-600 text-xs">无变更</div>
          )}
        </div>
      </div>
    </div>
  )
}