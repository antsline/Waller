import { validateVideo } from '../video'

describe('validateVideo', () => {
  describe('clip mode', () => {
    it('accepts valid video within limits', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 10000, fileSize: 10 * 1024 * 1024 },
        { mode: 'clip' },
      )
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects video shorter than 1 second', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 500, fileSize: 1024 },
        { mode: 'clip' },
      )
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('video_duration_short')
    })

    it('rejects video longer than 15 seconds', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 16000, fileSize: 1024 },
        { mode: 'clip' },
      )
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('video_duration_long')
    })

    it('accepts video at exactly 15 seconds', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 15000, fileSize: 1024 },
        { mode: 'clip' },
      )
      expect(result.valid).toBe(true)
    })

    it('accepts video at exactly 1 second', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 1000, fileSize: 1024 },
        { mode: 'clip' },
      )
      expect(result.valid).toBe(true)
    })

    it('rejects video larger than 50MB', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 5000, fileSize: 51 * 1024 * 1024 },
        { mode: 'clip' },
      )
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('video_too_large')
    })

    it('accepts video at exactly 50MB', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 5000, fileSize: 50 * 1024 * 1024 },
        { mode: 'clip' },
      )
      expect(result.valid).toBe(true)
    })

    it('accepts video with null duration', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: null, fileSize: 1024 },
        { mode: 'clip' },
      )
      expect(result.valid).toBe(true)
    })

    it('accepts video with null fileSize', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 5000, fileSize: null },
        { mode: 'clip' },
      )
      expect(result.valid).toBe(true)
    })

    it('rejects video with empty uri', () => {
      const result = validateVideo(
        { uri: '', duration: 5000, fileSize: 1024 },
        { mode: 'clip' },
      )
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('video_no_uri')
    })

    it('returns multiple errors when both duration and size are invalid', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 20000, fileSize: 60 * 1024 * 1024 },
        { mode: 'clip' },
      )
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('video_duration_long')
      expect(result.errors).toContain('video_too_large')
    })
  })

  describe('bestPlay mode', () => {
    it('accepts video up to 60 seconds', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 60000, fileSize: 1024 },
        { mode: 'bestPlay' },
      )
      expect(result.valid).toBe(true)
    })

    it('rejects video longer than 60 seconds', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 61000, fileSize: 1024 },
        { mode: 'bestPlay' },
      )
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('video_duration_long')
    })

    it('accepts video up to 100MB', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 30000, fileSize: 100 * 1024 * 1024 },
        { mode: 'bestPlay' },
      )
      expect(result.valid).toBe(true)
    })

    it('rejects video larger than 100MB', () => {
      const result = validateVideo(
        { uri: 'file:///video.mp4', duration: 30000, fileSize: 101 * 1024 * 1024 },
        { mode: 'bestPlay' },
      )
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('video_too_large')
    })
  })

  describe('default options', () => {
    it('defaults to clip mode', () => {
      const result = validateVideo({
        uri: 'file:///video.mp4',
        duration: 16000,
        fileSize: 1024,
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('video_duration_long')
    })
  })
})
