import React, { memo, useMemo } from 'react'
import type { FeedClip } from '@/types/models'
import { ClipCard } from '@/components/ClipCard'

type PlayerMode = 'active' | 'ready' | 'thumbnail'

interface FeedClipItemProps {
  readonly clip: FeedClip
  readonly index: number
  readonly visibleIndex: number
  readonly onPressUser: (userId: string) => void
  readonly onPressClip: (clipId: string) => void
  readonly onPressMenu?: (clipId: string) => void
}

function getPlayerMode(index: number, visibleIndex: number): PlayerMode {
  const distance = Math.abs(index - visibleIndex)
  if (distance === 0) return 'active'
  if (distance === 1) return 'ready'
  return 'thumbnail'
}

export const FeedClipItem = memo(function FeedClipItem({
  clip,
  index,
  visibleIndex,
  onPressUser,
  onPressClip,
  onPressMenu,
}: FeedClipItemProps) {
  const playerMode = useMemo(
    () => getPlayerMode(index, visibleIndex),
    [index, visibleIndex],
  )

  return (
    <ClipCard
      clip={clip}
      isVisible={playerMode === 'active'}
      playerMode={playerMode}
      onPressUser={onPressUser}
      onPressClip={onPressClip}
      onPressMenu={onPressMenu}
    />
  )
})
