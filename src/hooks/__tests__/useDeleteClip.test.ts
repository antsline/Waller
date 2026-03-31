const mockRpc = jest.fn()

jest.mock('@/lib/supabase', () => ({
  supabase: {
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

jest.mock('@/services/storage', () => ({
  deleteStorageFile: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/services/userTricks', () => ({
  reevaluateUserTricksForClip: jest.fn().mockResolvedValue(undefined),
}))

import { useDeleteClip } from '../useDeleteClip'
import { reevaluateUserTricksForClip } from '@/services/userTricks'

describe('useDeleteClip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws on invalid clipId (non-UUID)', async () => {
    const hook = useDeleteClip()
    await expect(hook.mutateAsync({ clipId: 'not-a-uuid' })).rejects.toThrow()
  })

  it('calls RPC and succeeds when clip is deleted', async () => {
    mockRpc.mockResolvedValue({
      data: { status: 'deleted', trick_ids: [], mood: 'landed' },
      error: null,
    })

    const hook = useDeleteClip()
    await expect(
      hook.mutateAsync({ clipId: '00000000-0000-0000-0000-000000000001' }),
    ).resolves.toBeUndefined()

    expect(mockRpc).toHaveBeenCalledWith('check_and_delete_clip', {
      p_clip_id: '00000000-0000-0000-0000-000000000001',
    })
  })

  it('throws clip_not_found when RPC returns error', async () => {
    mockRpc.mockResolvedValue({
      data: { status: 'error', code: 'clip_not_found' },
      error: null,
    })

    const hook = useDeleteClip()
    await expect(
      hook.mutateAsync({ clipId: '00000000-0000-0000-0000-000000000001' }),
    ).rejects.toThrow('clip_not_found')
  })

  it('throws delete_limit_reached when daily limit exceeded', async () => {
    mockRpc.mockResolvedValue({
      data: { status: 'error', code: 'delete_limit_reached' },
      error: null,
    })

    const hook = useDeleteClip()
    await expect(
      hook.mutateAsync({ clipId: '00000000-0000-0000-0000-000000000001' }),
    ).rejects.toThrow('delete_limit_reached')
  })

  it('throws not_owner when user does not own clip', async () => {
    mockRpc.mockResolvedValue({
      data: { status: 'error', code: 'not_owner' },
      error: null,
    })

    const hook = useDeleteClip()
    await expect(
      hook.mutateAsync({ clipId: '00000000-0000-0000-0000-000000000001' }),
    ).rejects.toThrow('not_owner')
  })

  it('calls reevaluateUserTricksForClip when trick_ids are returned', async () => {
    const trickIds = ['00000000-0000-0000-0000-000000000010']
    mockRpc.mockResolvedValue({
      data: { status: 'deleted', trick_ids: trickIds, mood: 'landed' },
      error: null,
    })

    const hook = useDeleteClip()
    await hook.mutateAsync({ clipId: '00000000-0000-0000-0000-000000000001' })

    expect(reevaluateUserTricksForClip).toHaveBeenCalledWith(
      'user-1',
      '00000000-0000-0000-0000-000000000001',
      trickIds,
      'landed',
    )
  })

  it('throws when RPC call itself fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'server error' },
    })

    const hook = useDeleteClip()
    await expect(
      hook.mutateAsync({ clipId: '00000000-0000-0000-0000-000000000001' }),
    ).rejects.toThrow('Failed to delete clip')
  })
})
