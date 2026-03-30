import { config } from '@/constants/config'

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

jest.mock('@/services/storage', () => ({
  deleteStorageFile: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/services/userTricks', () => ({
  reevaluateUserTricksForClip: jest.fn().mockResolvedValue(undefined),
}))

import { useDeleteClip } from '../useDeleteClip'

function setupMockChain(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, jest.Mock> = {}

  chain.select = jest.fn().mockReturnValue(chain)
  chain.insert = jest.fn().mockResolvedValue({ error: null })
  chain.update = jest.fn().mockReturnValue(chain)
  chain.delete = jest.fn().mockReturnValue(chain)
  chain.eq = jest.fn().mockReturnValue(chain)
  chain.neq = jest.fn().mockReturnValue(chain)
  chain.gte = jest.fn().mockReturnValue(chain)
  chain.in = jest.fn().mockReturnValue(chain)
  chain.limit = jest.fn().mockReturnValue(chain)
  chain.single = jest.fn().mockResolvedValue({
    data: {
      id: 'clip-1',
      user_id: 'user-1',
      video_url: 'https://example.com/video.mp4',
      thumbnail_url: 'https://example.com/thumb.jpg',
      created_at: new Date().toISOString(),
      mood: 'landed',
      ...overrides,
    },
    error: null,
  })

  return chain
}

describe('useDeleteClip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws on invalid clipId (non-UUID)', async () => {
    const hook = useDeleteClip()
    await expect(hook.mutateAsync({ clipId: 'not-a-uuid' })).rejects.toThrow()
  })

  it('throws when clip is not found', async () => {
    const chain = setupMockChain()
    chain.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })

    mockFrom.mockReturnValue(chain)

    const hook = useDeleteClip()
    await expect(
      hook.mutateAsync({ clipId: '00000000-0000-0000-0000-000000000001' }),
    ).rejects.toThrow('Clip not found')
  })

  it('allows deletion within free window without rate limit check', async () => {
    const recentDate = new Date(Date.now() - 60_000).toISOString() // 1 minute ago
    const chain = setupMockChain({ created_at: recentDate })

    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      callCount++
      if (table === 'clips' && callCount === 1) {
        return {
          ...chain,
          single: jest.fn().mockResolvedValue({
            data: {
              id: '00000000-0000-0000-0000-000000000001',
              user_id: 'user-1',
              video_url: 'v',
              thumbnail_url: 't',
              created_at: recentDate,
              mood: 'landed',
            },
            error: null,
          }),
        }
      }
      if (table === 'clip_tricks') {
        return {
          ...chain,
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      return chain
    })

    const hook = useDeleteClip()
    await expect(
      hook.mutateAsync({ clipId: '00000000-0000-0000-0000-000000000001' }),
    ).resolves.toBeUndefined()
  })

  it('throws delete_limit_reached when daily limit exceeded', async () => {
    const oldDate = new Date(
      Date.now() - (config.deletion.freeWindowMinutes + 1) * 60_000,
    ).toISOString()

    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      callCount++
      if (table === 'clips' && callCount === 1) {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: '00000000-0000-0000-0000-000000000001',
                      user_id: 'user-1',
                      video_url: 'v',
                      thumbnail_url: 't',
                      created_at: oldDate,
                      mood: 'training',
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'clip_tricks') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      if (table === 'deletion_logs') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockResolvedValue({
                count: config.deletion.maxDailyDeletes,
                error: null,
              }),
            }),
          }),
        }
      }
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }
    })

    const hook = useDeleteClip()
    await expect(
      hook.mutateAsync({ clipId: '00000000-0000-0000-0000-000000000001' }),
    ).rejects.toThrow('delete_limit_reached')
  })
})
