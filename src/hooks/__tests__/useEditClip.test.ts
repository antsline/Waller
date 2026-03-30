const mockFrom = jest.fn()

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn((selector) =>
    selector({
      session: { user: { id: 'user-1' } },
    }),
  ),
}))

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn((opts) => ({
    mutateAsync: (params: unknown) => opts.mutationFn(params),
    isPending: false,
  })),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}))

jest.mock('@/services/userTricks', () => ({
  reevaluateUserTricksForClip: jest.fn().mockResolvedValue(undefined),
}))

import { useEditClip } from '../useEditClip'
import { reevaluateUserTricksForClip } from '@/services/userTricks'

function makeOwnershipCheckChain() {
  return {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: '00000000-0000-0000-0000-000000000001' },
              error: null,
            }),
          }),
        }),
      }),
    }),
  }
}

describe('useEditClip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws on invalid clipId (non-UUID)', async () => {
    const hook = useEditClip()
    await expect(
      hook.mutateAsync({
        clipId: 'bad-id',
        mood: 'landed',
        oldMood: 'landed',
        oldTrickIds: [],
      }),
    ).rejects.toThrow()
  })

  it('updates clip without touching tricks when unchanged', async () => {
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    })

    let clipsCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'clips') {
        clipsCallCount++
        if (clipsCallCount === 1) return makeOwnershipCheckChain()
        return { update: updateMock }
      }
      return {}
    })

    const hook = useEditClip()
    const trickIds = ['00000000-0000-0000-0000-000000000010']

    await hook.mutateAsync({
      clipId: '00000000-0000-0000-0000-000000000001',
      mood: 'landed',
      caption: 'test',
      oldMood: 'landed',
      oldTrickIds: trickIds,
      trick_ids: trickIds,
    })

    expect(updateMock).toHaveBeenCalledWith({
      mood: 'landed',
      caption: 'test',
      facility_tag: null,
    })
  })

  it('replaces clip_tricks when trick_ids change', async () => {
    const deleteMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    })
    const insertMock = jest.fn().mockResolvedValue({ error: null })

    let clipsCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'clips') {
        clipsCallCount++
        if (clipsCallCount === 1) return makeOwnershipCheckChain()
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }
      }
      if (table === 'clip_tricks') {
        return { delete: deleteMock, insert: insertMock }
      }
      return {}
    })

    const hook = useEditClip()

    await hook.mutateAsync({
      clipId: '00000000-0000-0000-0000-000000000001',
      mood: 'landed',
      oldMood: 'landed',
      oldTrickIds: ['00000000-0000-0000-0000-000000000010'],
      trick_ids: ['00000000-0000-0000-0000-000000000020'],
    })

    expect(deleteMock).toHaveBeenCalled()
    expect(insertMock).toHaveBeenCalledWith([
      {
        clip_id: '00000000-0000-0000-0000-000000000001',
        trick_id: '00000000-0000-0000-0000-000000000020',
      },
    ])
  })

  it('calls reevaluateUserTricksForClip when mood changes from landed', async () => {
    let clipsCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'clips') {
        clipsCallCount++
        if (clipsCallCount === 1) return makeOwnershipCheckChain()
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const hook = useEditClip()
    const oldTrickIds = ['00000000-0000-0000-0000-000000000010']

    await hook.mutateAsync({
      clipId: '00000000-0000-0000-0000-000000000001',
      mood: 'challenging',
      oldMood: 'landed',
      oldTrickIds,
      trick_ids: oldTrickIds,
    })

    expect(reevaluateUserTricksForClip).toHaveBeenCalledWith(
      'user-1',
      '00000000-0000-0000-0000-000000000001',
      oldTrickIds,
      'landed',
    )
  })

  it('does not call reevaluateUserTricksForClip when mood stays the same', async () => {
    let clipsCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'clips') {
        clipsCallCount++
        if (clipsCallCount === 1) return makeOwnershipCheckChain()
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const hook = useEditClip()
    const trickIds = ['00000000-0000-0000-0000-000000000010']

    await hook.mutateAsync({
      clipId: '00000000-0000-0000-0000-000000000001',
      mood: 'landed',
      oldMood: 'landed',
      oldTrickIds: trickIds,
      trick_ids: trickIds,
    })

    expect(reevaluateUserTricksForClip).not.toHaveBeenCalled()
  })
})
