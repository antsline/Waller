import * as Network from 'expo-network'
import { useEffect, useState } from 'react'

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    let mounted = true

    async function check() {
      try {
        const state = await Network.getNetworkStateAsync()
        if (mounted) {
          setIsOffline(state.isConnected === false)
        }
      } catch {
        // Network check failed, assume online
      }
    }

    check()
    const interval = setInterval(check, 5000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return { isOffline } as const
}
