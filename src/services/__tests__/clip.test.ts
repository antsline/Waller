jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: '00000000-0000-0000-0000-000000000001',
          user_id: 'user-1',
          video_url: 'https://example.com/video.mp4',
          thumbnail_url: 'https://example.com/thumb.jpg',
          video_duration: 5,
          video_size: 1000,
          caption: 'test',
          mood: 'landed',
          facility_tag: null,
          status: 'published',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          user: {
            id: 'user-1',
            username: 'testuser',
            display_name: 'Test User',
            avatar_url: null,
          },
          counters: {
            clip_id: '00000000-0000-0000-0000-000000000001',
            clap_count: 0,
            clap_total: 0,
            comment_count: 0,
            updated_at: '2026-01-01T00:00:00Z',
          },
          tricks: [
            { trick: { id: 'trick-1', name_original: 'Backflip', name_en: 'Backflip', name_ja: null } },
          ],
        },
        error: null,
      }),
    })),
  },
}))

import { fetchClipDetail } from '../clip'

describe('fetchClipDetail', () => {
  it('validates clipId as UUID', async () => {
    await expect(fetchClipDetail('not-a-uuid')).rejects.toThrow()
  })

  it('returns FeedClip with correct shape', async () => {
    const result = await fetchClipDetail('00000000-0000-0000-0000-000000000001')

    expect(result).toMatchObject({
      id: '00000000-0000-0000-0000-000000000001',
      mood: 'landed',
      user: { username: 'testuser' },
    })
    expect(result.tricks).toHaveLength(1)
    expect(result.tricks[0]).toMatchObject({ name_original: 'Backflip' })
  })

  it('returns null user_clap when no userId provided', async () => {
    const result = await fetchClipDetail('00000000-0000-0000-0000-000000000001')
    expect(result.user_clap).toBeNull()
  })
})
