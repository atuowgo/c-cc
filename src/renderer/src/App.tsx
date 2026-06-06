import { useEffect } from 'react'
import { useUIStore } from '@renderer/stores/useUIStore'
import { useSessionStore } from '@renderer/stores/useSessionStore'
import { useConfigStore } from '@renderer/stores/useConfigStore'
import { useChatStore } from '@renderer/stores/useChatStore'
import TitleBar from '@renderer/components/layout/TitleBar'
import Sidebar from '@renderer/components/layout/Sidebar'
import StatusBar from '@renderer/components/layout/StatusBar'
import ChatArea from '@renderer/components/chat/ChatArea'
import InputArea from '@renderer/components/chat/InputArea'
import PermissionModal from '@renderer/components/chat/PermissionModal'
import SettingsPage from '@renderer/components/settings/SettingsPage'

function App(): React.JSX.Element {
  const { settingsOpen, closeSettings } = useUIStore()
  const { activeSessionId, fetchSessions } = useSessionStore()
  const { fetchConfig } = useConfigStore()

  // Load initial data
  useEffect(() => {
    fetchSessions()
    fetchConfig()
  }, [])

  // Load messages when active session changes
  useEffect(() => {
    if (!activeSessionId) return
    window.claudeAPI.session.resume(activeSessionId)
      .then(({ messages }) => {
        useChatStore.getState().setMessages(activeSessionId, messages)
      })
      .catch(() => {})
  }, [activeSessionId])

  // Wire IPC stream events → useChatStore
  useEffect(() => {
    const unsubChunk = window.claudeAPI.onStreamChunk((chunk) => {
      console.log('[App] onStreamChunk', chunk.sessionId, chunk.type, JSON.stringify(chunk).slice(0, 80))
      if (chunk.type === 'text' && typeof chunk.data?.text === 'string') {
        useChatStore.getState().appendStreamContent(chunk.sessionId, chunk.data.text)
      }
    })

    const unsubToolUse = window.claudeAPI.onToolUse((data) => {
      useChatStore.getState().addToolCall(data.sessionId, {
        id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        messageId: '',
        toolName: data.toolName,
        toolInput: JSON.stringify(data.toolInput),
        toolResult: '{}',
        status: 'pending',
        createdAt: Date.now()
      })
    })

    const unsubToolResult = window.claudeAPI.onToolResult((data) => {
      const store = useChatStore.getState()
      const toolCalls = store.toolCalls[data.sessionId] ?? []
      const last = [...toolCalls].reverse().find((tc) => tc.status === 'pending')
      if (last) {
        store.updateToolCall(data.sessionId, last.id, {
          toolResult: data.content,
          status: data.isError ? 'error' : 'success'
        })
      }
    })

    const unsubComplete = window.claudeAPI.onStreamComplete((data) => {
      console.log('[App] onStreamComplete', data.sessionId)
      const store = useChatStore.getState()
      const content = store.streamingContent[data.sessionId]
      if (content) {
        store.addMessage(data.sessionId, {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sessionId: data.sessionId,
          role: 'assistant',
          content: { text: content },
          createdAt: Date.now()
        })
        store.setStreamContent(data.sessionId, '')
      }
      store.setIsStreaming(data.sessionId, false)
      fetchSessions()
    })

    const unsubError = window.claudeAPI.onStreamError((data) => {
      console.error('[App] onStreamError', data.sessionId, data.error)
      useChatStore.getState().setIsStreaming(data.sessionId, false)
    })

    return () => {
      unsubChunk()
      unsubToolUse()
      unsubToolResult()
      unsubComplete()
      unsubError()
    }
  }, [fetchSessions])

  return (
    <div className="h-screen flex flex-col bg-[#0d1117] text-gray-100 overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {settingsOpen ? (
            <SettingsPage onClose={closeSettings} />
          ) : activeSessionId ? (
            <>
              <div className="flex-1 overflow-hidden">
                <ChatArea sessionId={activeSessionId} />
              </div>
              <InputArea sessionId={activeSessionId} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#D4774C]/20 flex items-center justify-center">
                  <span className="text-3xl">🤖</span>
                </div>
                <h1 className="text-2xl font-semibold mb-2">cc-bot</h1>
                <p className="text-gray-400">
                  开始新对话，或从左侧选择会话
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
      <StatusBar />
      <PermissionModal />
    </div>
  )
}

export default App