import { renderHook, act } from '@testing-library/react-native'
import { useClap } from '../useClap'

jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn((selector) =>
    selector({
      session: { user: { id: 'test-user-id' } },
    }),
  ),
}))

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null }),
        })),
      })),
    })),
  },
}))

describe('useClap', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const defaultOptions = {
    clipId: 'clip-1',
    initialUserClap: 0,
    initialTotalClaps: 5,
  }

  it('initializes with provided values', () => {
    const { result } = renderHook(() => useClap(defaultOptions))

    expect(result.current.userClapCount).toBe(0)
    expect(result.current.totalClaps).toBe(5)
    expect(result.current.isClapped).toBe(false)
  })

  it('creates clap with count=1 on first tap', () => {
    const { result } = renderHook(() => useClap(defaultOptions))

    act(() => {
      result.current.handleClap()
    })

    expect(result.current.userClapCount).toBe(1)
    expect(result.current.totalClaps).toBe(6)
    expect(result.current.isClapped).toBe(true)
  })

  it('increments count on rapid taps up to max 10', () => {
    const { result } = renderHook(() => useClap(defaultOptions))

    for (let i = 0; i < 12; i++) {
      act(() => {
        result.current.handleClap()
      })
    }

    expect(result.current.userClapCount).toBe(10)
    expect(result.current.isClapped).toBe(true)
  })

  it('cancels clap on deliberate re-tap after pause', () => {
    const { result } = renderHook(() => useClap(defaultOptions))

    // First tap
    act(() => {
      result.current.handleClap()
    })
    expect(result.current.userClapCount).toBe(1)

    // Wait for debounce to expire
    act(() => {
      jest.advanceTimersByTime(600)
    })

    // Re-tap after pause = cancel
    act(() => {
      result.current.handleClap()
    })
    expect(result.current.userClapCount).toBe(0)
    expect(result.current.isClapped).toBe(false)
  })

  it('stays at max count on rapid tap at limit', () => {
    const { result } = renderHook(() => useClap(defaultOptions))

    // Tap 10 times rapidly
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.handleClap()
      })
    }
    expect(result.current.userClapCount).toBe(10)

    // 11th rapid tap should stay at 10
    act(() => {
      result.current.handleClap()
    })
    expect(result.current.userClapCount).toBe(10)
  })

  it('increments triggerCount on each tap', () => {
    const { result } = renderHook(() => useClap(defaultOptions))

    act(() => {
      result.current.handleClap()
    })
    expect(result.current.triggerCount).toBe(1)

    act(() => {
      result.current.handleClap()
    })
    expect(result.current.triggerCount).toBe(2)
  })

  it('initializes with existing clap state', () => {
    const { result } = renderHook(() =>
      useClap({
        clipId: 'clip-1',
        initialUserClap: 3,
        initialTotalClaps: 10,
      }),
    )

    expect(result.current.userClapCount).toBe(3)
    expect(result.current.totalClaps).toBe(10)
    expect(result.current.isClapped).toBe(true)
  })
})
