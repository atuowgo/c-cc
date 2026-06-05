import { useState, useEffect, useCallback } from 'react'

interface UseIPCState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * Generic IPC call hook with loading/error state.
 * Invokes the provided async function and tracks loading/error states.
 */
export function useIPC<T>(
  fn: () => Promise<T>,
  immediate = true,
): UseIPCState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseIPCState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const result = await fn()
      setState({ data: result, loading: false, error: null })
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error })
    }
  }, [fn])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return { ...state, refetch: execute }
}

/**
 * Simple IPC mutation hook. Returns a mutate function and loading/error state.
 */
export function useIPCMutation<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
): {
  mutate: (...args: Args) => Promise<T>
  loading: boolean
  error: Error | null
  reset: () => void
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (...args: Args): Promise<T> => {
      setLoading(true)
      setError(null)
      try {
        return await fn(...args)
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [fn],
  )

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
  }, [])

  return { mutate, loading, error, reset }
}