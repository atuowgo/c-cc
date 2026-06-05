import { useEffect } from 'react'
import { useUIStore } from '@renderer/stores/useUIStore'
import { useSessionStore } from '@renderer/stores/useSessionStore'
import { useConfigStore } from '@renderer/stores/useConfigStore'
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