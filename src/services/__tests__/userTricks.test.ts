const mockFrom = jest.fn()

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

import { reevaluateUserTricksForClip } from '../userTricks'

describe('reevaluateUserTricksForClip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('skips re-evaluation for non-landed moods', async () => {
    await reevaluateUserTricksForClip('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', ['00000000-0000-0000-0000-000000000003'], 'challenging')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('skips re-evaluation when no trick ids provided', async () => {
    await reevaluateUserTricksForClip('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', [], 'landed')
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('downgrades user_tricks when no other landed clips exist', async () => {
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'clip_tricks') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              neq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      }
      if (table === 'user_tricks') {
        return { update: updateMock }
      }
      return {}
    })

    await reevaluateUserTricksForClip('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', ['00000000-0000-0000-0000-000000000003'], 'landed')

    expect(updateMock).toHaveBeenCalledWith({
      status: 'challenging',
      first_landed_at: null,
    })
  })

  it('does not downgrade when other landed clips exist for the trick', async () => {
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    })

    let inCallCount = 0
    const clipsChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockImplementation(function (this: unknown) {
        inCallCount++
        if (inCallCount >= 2) {
          return Promise.resolve({
            data: [{ id: '00000000-0000-0000-0000-000000000004' }],
            error: null,
          })
        }
        return clipsChain
      }),
    }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'clip_tricks') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              neq: jest.fn().mockResolvedValue({
                data: [{ trick_id: '00000000-0000-0000-0000-000000000003', clip_id: '00000000-0000-0000-0000-000000000004' }],
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'clips') {
        return clipsChain
      }
      if (table === 'user_tricks') {
        return { update: updateMock }
      }
      return {}
    })

    await reevaluateUserTricksForClip('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', ['00000000-0000-0000-0000-000000000003'], 'landed')

    expect(updateMock).not.toHaveBeenCalled()
  })

  it('processes showcase mood same as landed', async () => {
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'clip_tricks') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              neq: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      }
      if (table === 'user_tricks') {
        return { update: updateMock }
      }
      return {}
    })

    await reevaluateUserTricksForClip('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', ['00000000-0000-0000-0000-000000000003'], 'showcase')

    expect(updateMock).toHaveBeenCalledWith({
      status: 'challenging',
      first_landed_at: null,
    })
  })
})
