export const MOOD_VALUES = ['challenging', 'landed', 'training', 'showcase', 'first_time'] as const
export type MoodType = typeof MOOD_VALUES[number]

export const TRICK_CATEGORY_VALUES = ['flip', 'twist', 'combo', 'original', 'other'] as const
export type TrickCategory = typeof TRICK_CATEGORY_VALUES[number]

export type TrickStatus = 'landed' | 'challenging'

export type ReportReason =
  | 'inappropriate'
  | 'spam'
  | 'harassment'
  | 'impersonation'
  | 'other'

export type ReportTargetType = 'clip' | 'comment' | 'user'

export type UserStatus = 'active' | 'suspended' | 'deleted'

export type ClipStatus = 'published' | 'deleted' | 'reported'

export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

export interface User {
  readonly id: string
  readonly username: string
  readonly display_name: string
  readonly avatar_url: string | null
  readonly bio: string | null
  readonly hometown: string | null
  readonly country_code: string | null
  readonly facility_tag: string | null
  readonly team: string | null
  readonly username_change_count: number
  readonly locale: string
  readonly status: UserStatus
  readonly created_at: string
  readonly updated_at: string
  readonly last_login_at: string | null
}

export interface Trick {
  readonly id: string
  readonly name_original: string
  readonly name_en: string | null
  readonly name_ja: string | null
  readonly aliases: string[] | null
  readonly category: TrickCategory
  readonly created_by: string | null
  readonly clip_count: number
  readonly challenger_count: number
  readonly created_at: string
  readonly updated_at: string
}

export interface Clip {
  readonly id: string
  readonly user_id: string
  readonly video_url: string
  readonly thumbnail_url: string
  readonly video_duration: number
  readonly video_size: number
  readonly caption: string | null
  readonly mood: MoodType
  readonly facility_tag: string | null
  readonly status: ClipStatus
  readonly created_at: string
  readonly updated_at: string
}

export interface BestPlay {
  readonly id: string
  readonly user_id: string
  readonly video_url: string
  readonly thumbnail_url: string
  readonly video_duration: number
  readonly video_size: number
  readonly title: string | null
  readonly mood: MoodType | null
  readonly facility_tag: string | null
  readonly sort_order: number
  readonly created_at: string
  readonly updated_at: string
}

export interface Clap {
  readonly id: string
  readonly clip_id: string
  readonly user_id: string
  readonly count: number
  readonly created_at: string
  readonly updated_at: string
}

export interface ClipCounters {
  readonly clip_id: string
  readonly clap_count: number
  readonly clap_total: number
  readonly comment_count: number
  readonly updated_at: string
}

export interface UserTrick {
  readonly user_id: string
  readonly trick_id: string
  readonly status: TrickStatus
  readonly first_landed_at: string | null
  readonly created_at: string
  readonly updated_at: string
}

export type TrickSummary = Pick<Trick, 'id' | 'name_original' | 'name_en' | 'name_ja'>

export interface BestPlayWithTricks extends BestPlay {
  readonly tricks: readonly TrickSummary[]
}

export interface FeedClip extends Clip {
  readonly user: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>
  readonly counters: ClipCounters
  readonly tricks: TrickSummary[]
  readonly user_clap: Pick<Clap, 'count'> | null
}
