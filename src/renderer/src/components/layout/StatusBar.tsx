import { useEffect, useState } from 'react'
import { useConfigStore } from '@renderer/stores/useConfigStore'
import { useSessionStore } from '@renderer/stores/useSessionStore'

export default function StatusBar(): React.JSX.Element {
  const { config } = useConfigStore()
  const { activeSessionId } = useSessionStore()
  const [usage, setUsage] = useState({ costUsd: 0, inputTokens: 0, outputTokens: 0 })

  useEffect(() => {
    if (!activeSessionId) {
      setUsage({ costUsd: 0, inputTokens: 0, outputTokens: 0 })
      return
    }
    let cancelled = false
    window.claudeAPI.user.usage(activeSessionId).then((u) => {
      if (!cancelled) setUsage(u)
    })
    return () => { cancelled = true }
  }, [activeSessionId])

  const modelName = config?.defaultModel || 'claude-sonnet-4-6'
  const permMode = config?.defaultPermMode || 'default'

  return (
    <div className="flex items-center h-6 bg-[#161b22] border-t border-[#30363d] px-3 text-xs text-gray-500 flex-shrink-0 select-none">
      <span className="mr-4">{modelName}</span>
      <span className="flex-1 text-center">{permMode}</span>
      <span>
        {usage.inputTokens + usage.outputTokens > 0
          ? `${usage.inputTokens + usage.outputTokens} tokens / $${usage.costUsd.toFixed(4)}`
          : ''}
      </span>
    </div>
  )
}