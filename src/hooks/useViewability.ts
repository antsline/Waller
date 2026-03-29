import { useState, useRef, useCallback } from 'react'
import type { ViewabilityConfig, ViewToken } from 'react-native'

interface UseViewabilityResult {
  readonly viewabilityConfig: ViewabilityConfig
  readonly onViewableItemsChanged: React.MutableRefObject<
    (info: { viewableItems: ViewToken[] }) => void
  >
  readonly visibleIndex: number
}

export function useViewability(): UseViewabilityResult {
  const [visibleIndex, setVisibleIndex] = useState(0)

  const viewabilityConfig = useRef<ViewabilityConfig>({
    itemVisiblePercentThreshold: 70,
  }).current

  const onViewableItemsChanged = useRef(
    (info: { viewableItems: ViewToken[] }) => {
      if (info.viewableItems.length > 0) {
        const firstVisible = info.viewableItems[0]
        if (firstVisible.index != null) {
          setVisibleIndex(firstVisible.index)
        }
      }
    },
  )

  return {
    viewabilityConfig,
    onViewableItemsChanged,
    visibleIndex,
  }
}
