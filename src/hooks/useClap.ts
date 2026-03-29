import { useState, useRef, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { config } from '@/constants/config'

const clapCountSchema = z.number().int().min(1).max(config.clap.maxCount)

interface UseClapOptions {
  readonly clipId: string
  readonly initialUserClap: number
  readonly initialTotalClaps: number
}

interface UseClapResult {
  readonly userClapCount: number
  readonly totalClaps: number
  readonly isClapped: boolean
  readonly handleClap: () => void
  readonly triggerCount: number
}

export function useClap({
  clipId,
  initialUserClap,
  initialTotalClaps,
}: UseClapOptions): UseClapResult {
  const [userClapCount, setUserClapCount] = useState(initialUserClap)
  const [totalClaps, setTotalClaps] = useState(initialTotalClaps)
  const [triggerCount, setTriggerCount] = useState(0)

  const lastTapTimeRef = useRef(0)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingCountRef = useRef(initialUserClap)
  const previousTotalRef = useRef(initialTotalClaps)

  const session = useAuthStore((s) => s.session)
  const queryClient = useQueryClient()

  // Sync refs when props change (e.g. after query invalidation)
  useEffect(() => {
    previousTotalRef.current = initialTotalClaps
    pendingCountRef.current = initialUserClap
    setUserClapCount(initialUserClap)
    setTotalClaps(initialTotalClaps)
  }, [initialTotalClaps, initialUserClap])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const syncToServer = useCallback(
    async (count: number) => {
      const userId = session?.user?.id
      if (!userId) return

      try {
        if (count === 0) {
          await supabase
            .from('claps')
            .delete()
            .eq('clip_id', clipId)
            .eq('user_id', userId)
        } else {
          const validatedCount = clapCountSchema.parse(count)
          await supabase.from('claps').upsert(
            {
              clip_id: clipId,
              user_id: userId,
              count: validatedCount,
            },
            { onConflict: 'clip_id,user_id' },
          )
        }
        queryClient.invalidateQueries({ queryKey: ['clips'] })
      } catch {
        // Rollback optimistic update
        setUserClapCount(initialUserClap)
        setTotalClaps(initialTotalClaps)
        pendingCountRef.current = initialUserClap
      }
    },
    [clipId, session, queryClient, initialUserClap, initialTotalClaps],
  )

  const scheduleSync = useCallback(
    (count: number) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        syncToServer(count)
      }, config.clap.debounceMs)
    },
    [syncToServer],
  )

  const handleClap = useCallback(() => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapTimeRef.current
    lastTapTimeRef.current = now

    const currentCount = pendingCountRef.current
    const isRapidTap = timeSinceLastTap < config.clap.debounceMs

    let newCount: number

    if (currentCount === 0) {
      // First tap: create clap
      newCount = 1
    } else if (isRapidTap && currentCount < config.clap.maxCount) {
      // Rapid tap: increment
      newCount = currentCount + 1
    } else if (!isRapidTap && currentCount > 0) {
      // Deliberate re-tap after pause: cancel
      newCount = 0
    } else {
      // At max, rapid tap: stay at max
      newCount = currentCount
    }

    const diff = newCount - currentCount
    pendingCountRef.current = newCount
    previousTotalRef.current = previousTotalRef.current + diff

    setUserClapCount(newCount)
    setTotalClaps(previousTotalRef.current)
    setTriggerCount((prev) => prev + 1)
    scheduleSync(newCount)
  }, [scheduleSync])

  return {
    userClapCount,
    totalClaps,
    isClapped: userClapCount > 0,
    handleClap,
    triggerCount,
  }
}
