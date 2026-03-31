interface TrickLike {
  readonly name_original: string
  readonly name_en?: string | null
  readonly name_ja?: string | null
}

export function getLocalizedTrickName(
  trick: TrickLike,
  locale: string,
): string {
  if (locale === 'ja' && trick.name_ja) {
    return trick.name_ja
  }
  if (locale === 'en' && trick.name_en) {
    return trick.name_en
  }
  return trick.name_original
}
