const mockFrom = jest.fn()
const mockRpc = jest.fn()

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
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

function makeUpdateChain() {
  return {
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
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
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
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
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('calls replace_clip_tricks RPC when trick_ids change', async () => {
    let clipsCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'clips') {
        clipsCallCount++
        if (clipsCallCount === 1) return makeOwnershipCheckChain()
        return makeUpdateChain()
      }
      return {}
    })

    mockRpc.mockResolvedValue({
      data: { status: 'replaced' },
      error: null,
    })

    const hook = useEditClip()

    await hook.mutateAsync({
      clipId: '00000000-0000-0000-0000-000000000001',
      mood: 'landed',
      oldMood: 'landed',
      oldTrickIds: ['00000000-0000-0000-0000-000000000010'],
      trick_ids: ['00000000-0000-0000-0000-000000000020'],
    })

    expect(mockRpc).toHaveBeenCalledWith('replace_clip_tricks', {
      p_clip_id: '00000000-0000-0000-0000-000000000001',
      p_trick_ids: ['00000000-0000-0000-0000-000000000020'],
    })
  })

  it('throws when replace_clip_tricks RPC returns error status', async () => {
    let clipsCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'clips') {
        clipsCallCount++
        if (clipsCallCount === 1) return makeOwnershipCheckChain()
        return makeUpdateChain()
      }
      return {}
    })

    mockRpc.mockResolvedValue({
      data: { status: 'error', code: 'not_owner' },
      error: null,
    })

    const hook = useEditClip()
    await expect(
      hook.mutateAsync({
        clipId: '00000000-0000-0000-0000-000000000001',
        mood: 'landed',
        oldMood: 'landed',
        oldTrickIds: ['00000000-0000-0000-0000-000000000010'],
        trick_ids: ['00000000-0000-0000-0000-000000000020'],
      }),
    ).rejects.toThrow('not_owner')
  })

  it('calls reevaluateUserTricksForClip when mood changes from landed', async () => {
    let clipsCallCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'clips') {
        clipsCallCount++
        if (clipsCallCount === 1) return makeOwnershipCheckChain()
        return makeUpdateChain()
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
        return makeUpdateChain()
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
