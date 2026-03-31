import { getLocalizedTrickName } from '../trickName'

describe('getLocalizedTrickName', () => {
  const trick = {
    name_original: 'Backflip',
    name_en: 'Backflip',
    name_ja: 'バク転',
  }

  it('returns name_ja when locale is ja and name_ja exists', () => {
    expect(getLocalizedTrickName(trick, 'ja')).toBe('バク転')
  })

  it('returns name_en when locale is en and name_en exists', () => {
    expect(getLocalizedTrickName(trick, 'en')).toBe('Backflip')
  })

  it('falls back to name_original when locale name is null', () => {
    const trickNoJa = { ...trick, name_ja: null }
    expect(getLocalizedTrickName(trickNoJa, 'ja')).toBe('Backflip')
  })

  it('falls back to name_original for unknown locale', () => {
    expect(getLocalizedTrickName(trick, 'fr')).toBe('Backflip')
  })

  it('returns name_original when both translations are null', () => {
    const trickNoTrans = { name_original: 'Wall Spin', name_en: null, name_ja: null }
    expect(getLocalizedTrickName(trickNoTrans, 'ja')).toBe('Wall Spin')
  })
})
