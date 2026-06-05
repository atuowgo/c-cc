import { useState, useEffect, useCallback } from 'react'
import { Shield, Clock, Check, Ban, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@renderer/lib/utils'
import { useUIStore } from '@renderer/stores/useUIStore'

const COUNTDOWN_SECONDS = 60

export default function PermissionModal(): React.JSX.Element {
  const permissionModal = useUIStore((s) => s.permissionModal)
  const hidePermissionModal = useUIStore((s) => s.hidePermissionModal)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [remember, setRemember] = useState(false)

  useEffect(() => {
    if (!permissionModal) {
      setCountdown(COUNTDOWN_SECONDS)
      setRemember(false)
      return
    }

    setCountdown(COUNTDOWN_SECONDS)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleDeny()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [permissionModal])

  const handleResponse = useCallback(
    async (allowed: boolean): Promise<void> => {
      if (!permissionModal) return
      try {
        await window.claudeAPI.permission.respond(
          permissionModal.sessionId,
          permissionModal.toolCallId,
          allowed
        )
      } catch {
        // Handle error
      }
      hidePermissionModal()
    },
    [permissionModal, hidePermissionModal]
  )

  const handleDeny = useCallback(async (): Promise<void> => {
    await handleResponse(false)
  }, [handleResponse])

  const handleAllowOnce = useCallback(async (): Promise<void> => {
    await handleResponse(true)
  }, [handleResponse])

  const handleAllowAlways = useCallback(async (): Promise<void> => {
    if (!permissionModal) return
    try {
      await window.claudeAPI.permission.respond(
        permissionModal.sessionId,
        permissionModal.toolCallId,
        true
      )
    } catch {
      // Handle error
    }
    hidePermissionModal()
  }, [permissionModal, hidePermissionModal])

  const formatInput = (input: Record<string, unknown>): string => {
    try {
      return JSON.stringify(input, null, 2)
    } catch {
      return String(input)
    }
  }

  const open = !!permissionModal

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && hidePermissionModal()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40"
              />
            </Dialog.Overlay>

            {/* Content */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-w-[90vw] bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[#30363d]">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Shield size={20} className="text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Dialog.Title className="text-sm font-semibold text-gray-200">
                      权限确认
                    </Dialog.Title>
                    <Dialog.Description className="text-xs text-gray-500 mt-0.5">
                      Claude 请求执行工具: <span className="text-[#D4774C] font-mono">{permissionModal?.toolName}</span>
                    </Dialog.Description>
                  </div>
                  {/* Countdown */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock size={12} />
                    <span className={cn(countdown <= 10 && 'text-red-400')}>
                      {countdown}s
                    </span>
                  </div>
                </div>

                {/* Input preview */}
                <div className="px-5 py-3">
                  <div className="text-xs text-gray-500 mb-1.5 font-medium">工具输入</div>
                  <pre className="bg-[#0d1117] rounded-lg p-3 text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto font-mono leading-relaxed border border-[#30363d]">
                    {permissionModal ? formatInput(permissionModal.toolInput) : ''}
                  </pre>
                </div>

                {/* Remember checkbox */}
                <div className="px-5 pb-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#30363d] bg-[#0d1117] accent-[#D4774C]"
                    />
                    <span className="text-xs text-gray-500">记住此选择</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-5 pb-4">
                  <button
                    onClick={handleAllowOnce}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#D4774C] hover:bg-[#e0895e] text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Check size={14} />
                    本次允许
                  </button>
                  <button
                    onClick={handleAllowAlways}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1a2332] hover:bg-[#212d3d] text-[#D4774C] text-sm font-medium rounded-lg border border-[#D4774C]/30 transition-colors"
                  >
                    <ShieldCheck size={14} />
                    始终允许
                  </button>
                  <button
                    onClick={handleDeny}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-transparent hover:bg-red-500/10 text-red-400 text-sm font-medium rounded-lg border border-red-500/30 hover:border-red-500/50 transition-colors"
                  >
                    <Ban size={14} />
                    拒绝
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}