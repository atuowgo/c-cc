import { useCallback, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateSessionParams } from '../../../shared/types'

const SESSIONS_KEY = ['sessions']

/**
 * Hook for session operations wrapping window.claudeAPI.session calls.
 */
export function useSession() {
  const queryClient = useQueryClient()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  // List all sessions
  const sessionsQuery = useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: () => window.claudeAPI.session.list(),
  })

  // Create session
  const createMutation = useMutation({
    mutationFn: (opts: CreateSessionParams) => window.claudeAPI.session.create(opts),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY })
      setActiveSessionId(session.id)
    },
  })

  // Delete session
  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => window.claudeAPI.session.delete(sessionId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY })
      if (activeSessionId === deletedId) {
        setActiveSessionId(null)
      }
    },
  })

  // Update session
  const updateMutation = useMutation({
    mutationFn: ({
      sessionId,
      updates,
    }: {
      sessionId: string
      updates: { title?: string; model?: string; permMode?: string }
    }) => window.claudeAPI.session.update(sessionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY })
    },
  })

  // Send message
  const sendMutation = useMutation({
    mutationFn: ({
      sessionId,
      prompt,
      attachments,
    }: {
      sessionId: string
      prompt: string
      attachments?: import('../../../shared/types').FileAttachment[]
    }) => window.claudeAPI.session.send(sessionId, prompt, attachments),
  })

  // Interrupt
  const interrupt = useCallback(
    async (sessionId: string) => {
      return window.claudeAPI.session.interrupt(sessionId)
    },
    [],
  )

  // Resume session
  const resumeSession = useCallback(async (sessionId: string) => {
    const result = await window.claudeAPI.session.resume(sessionId)
    setActiveSessionId(sessionId)
    return result
  }, [])

  // Search sessions
  const search = useCallback(async (query: string) => {
    return window.claudeAPI.session.search(query)
  }, [])

  return {
    sessions: sessionsQuery.data ?? [],
    sessionsLoading: sessionsQuery.isLoading,
    sessionsError: sessionsQuery.error,
    activeSessionId,
    setActiveSessionId,
    createSession: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteSession: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateSession: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    interrupt,
    resumeSession,
    search,
  }
}