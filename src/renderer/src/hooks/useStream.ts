import { useState, useEffect, useCallback, useRef } from 'react'
import type { StreamChunk, Message } from '../../../shared/types'

export interface StreamState {
  messages: Message[]
  isStreaming: boolean
  error: string | null
  toolCalls: Map<string, { name: string; input: Record<string, unknown>; status: string }>
}

/**
 * Hook for subscribing to stream events from the main process.
 * Manages message accumulation for streaming display.
 */
export function useStream(sessionId: string | null) {
  const [state, setState] = useState<StreamState>({
    messages: [],
    isStreaming: false,
    error: null,
    toolCalls: new Map(),
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const addMessage = useCallback((message: Message) => {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }))
  }, [])

  const updateLastMessage = useCallback((updater: (msg: Message) => Message) => {
    setState((prev) => {
      const messages = [...prev.messages]
      if (messages.length > 0) {
        messages[messages.length - 1] = updater(messages[messages.length - 1])
      }
      return { ...prev, messages }
    })
  }, [])

  useEffect(() => {
    if (!sessionId) return

    const unsubChunk = window.claudeAPI.onStreamChunk((chunk: StreamChunk) => {
      if (chunk.sessionId !== sessionId) return

      setState((prev) => {
        const lastMsg = prev.messages[prev.messages.length - 1]
        if (lastMsg && lastMsg.role === 'assistant' && chunk.type === 'text') {
          const updated = { ...lastMsg }
          const text = chunk.data.text as string | undefined
          if (text) {
            updated.content = {
              ...updated.content,
              text: (updated.content.text || '') + text,
            }
          }
          return {
            ...prev,
            isStreaming: true,
            messages: [...prev.messages.slice(0, -1), updated],
          }
        }
        return { ...prev, isStreaming: true }
      })
    })

    const unsubToolUse = window.claudeAPI.onToolUse((data) => {
      if (data.sessionId !== sessionId) return
      setState((prev) => {
        const next = new Map(prev.toolCalls)
        next.set(data.toolName, { name: data.toolName, input: data.toolInput, status: 'pending' })
        return { ...prev, toolCalls: next }
      })
    })

    const unsubToolResult = window.claudeAPI.onToolResult((data) => {
      if (data.sessionId !== sessionId) return
      setState((prev) => {
        const next = new Map(prev.toolCalls)
        const existing = next.get('unknown')
        if (existing) {
          next.set(data.toolCallId, {
            ...existing,
            status: data.isError ? 'error' : 'success',
          })
        }
        return { ...prev, toolCalls: next }
      })
    })

    const unsubComplete = window.claudeAPI.onStreamComplete((data) => {
      if (data.sessionId !== sessionId) return
      setState((prev) => ({ ...prev, isStreaming: false }))
    })

    const unsubError = window.claudeAPI.onStreamError((data) => {
      if (data.sessionId !== sessionId) return
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        error: data.error,
      }))
    })

    return () => {
      unsubChunk()
      unsubToolUse()
      unsubToolResult()
      unsubComplete()
      unsubError()
    }
  }, [sessionId])

  const reset = useCallback(() => {
    setState({
      messages: [],
      isStreaming: false,
      error: null,
      toolCalls: new Map(),
    })
  }, [])

  return { ...state, addMessage, updateLastMessage, reset }
}