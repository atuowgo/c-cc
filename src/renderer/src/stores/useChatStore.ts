import { create } from 'zustand'
import type { Message, ToolCall } from '@shared/types'

interface ChatState {
  messages: Record<string, Message[]>
  streamingContent: Record<string, string>
  isStreaming: Record<string, boolean>
  toolCalls: Record<string, ToolCall[]>

  addMessage: (sessionId: string, message: Message) => void
  appendStreamContent: (sessionId: string, chunk: string) => void
  setStreamContent: (sessionId: string, content: string) => void
  setIsStreaming: (sessionId: string, bool: boolean) => void
  clearMessages: (sessionId: string) => void
  setMessages: (sessionId: string, messages: Message[]) => void
  addToolCall: (sessionId: string, toolCall: ToolCall) => void
  updateToolCall: (sessionId: string, toolCallId: string, updates: Partial<ToolCall>) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  streamingContent: {},
  isStreaming: {},
  toolCalls: {},

  addMessage: (sessionId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), message]
      }
    })),

  appendStreamContent: (sessionId, chunk) =>
    set((state) => ({
      streamingContent: {
        ...state.streamingContent,
        [sessionId]: (state.streamingContent[sessionId] || '') + chunk
      }
    })),

  setStreamContent: (sessionId, content) =>
    set((state) => ({
      streamingContent: {
        ...state.streamingContent,
        [sessionId]: content
      }
    })),

  setIsStreaming: (sessionId, bool) =>
    set((state) => ({
      isStreaming: { ...state.isStreaming, [sessionId]: bool }
    })),

  clearMessages: (sessionId) =>
    set((state) => {
      const { [sessionId]: _, ...rest } = state.streamingContent
      const { [sessionId]: __, ...restIs } = state.isStreaming
      return {
        messages: { ...state.messages, [sessionId]: [] },
        streamingContent: rest,
        isStreaming: restIs
      }
    }),

  setMessages: (sessionId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [sessionId]: messages }
    })),

  addToolCall: (sessionId, toolCall) =>
    set((state) => ({
      toolCalls: {
        ...state.toolCalls,
        [sessionId]: [...(state.toolCalls[sessionId] || []), toolCall]
      }
    })),

  updateToolCall: (sessionId, toolCallId, updates) =>
    set((state) => ({
      toolCalls: {
        ...state.toolCalls,
        [sessionId]: (state.toolCalls[sessionId] || []).map((tc) =>
          tc.id === toolCallId ? { ...tc, ...updates } : tc
        )
      }
    }))
}))