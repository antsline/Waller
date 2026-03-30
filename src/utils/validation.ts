import { z } from 'zod'
import { config } from '@/constants/config'
import { MOOD_VALUES, TRICK_CATEGORY_VALUES } from '@/types/models'

export const uuidSchema = z.string().uuid()

const usernameRegex = /^[a-z0-9_]+$/

export const usernameSchema = z
  .string()
  .min(config.profile.minUsernameLength)
  .max(config.profile.maxUsernameLength)
  .regex(usernameRegex)

export const profileSetupSchema = z.object({
  username: usernameSchema,
  display_name: z.string().min(1).max(config.profile.maxDisplayNameLength),
  avatar_url: z.string().url().nullable().optional(),
  hometown: z.string().max(config.profile.maxHometownLength).nullable().optional(),
  facility_tag: z.string().max(50).nullable().optional(),
  team: z.string().max(50).nullable().optional(),
  bio: z.string().max(config.profile.maxBioLength).nullable().optional(),
})

export const profileUpdateSchema = z.object({
  display_name: z.string().min(1).max(config.profile.maxDisplayNameLength).optional(),
  avatar_url: z.string().url().nullable().optional(),
  hometown: z.string().max(config.profile.maxHometownLength).nullable().optional(),
  facility_tag: z.string().max(50).nullable().optional(),
  team: z.string().max(50).nullable().optional(),
  bio: z.string().max(config.profile.maxBioLength).nullable().optional(),
})

export const clipSchema = z.object({
  video_url: z.string().url(),
  thumbnail_url: z.string().url(),
  video_duration: z.number().min(config.clip.minDuration).max(config.clip.maxDuration),
  video_size: z.number().max(config.clip.maxSizeMB * 1024 * 1024),
  caption: z.string().max(config.clip.maxCaptionLength).nullable().optional(),
  mood: z.enum(MOOD_VALUES),
  facility_tag: z.string().nullable().optional(),
})

export const trickSchema = z.object({
  name_original: z.string().min(1).max(100),
  name_en: z.string().max(100).nullable().optional(),
  name_ja: z.string().max(100).nullable().optional(),
  category: z.enum(TRICK_CATEGORY_VALUES),
})

export const reportSchema = z.object({
  target_id: z.string().uuid(),
  target_type: z.enum(['clip', 'comment', 'user']),
  reason: z.enum(['inappropriate', 'spam', 'harassment', 'impersonation', 'other']),
  detail: z.string().max(config.report.maxDetailLength).nullable().optional(),
})

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export const videoPickerSchema = z.object({
  uri: z.string().min(1),
  duration: z.number().min(config.clip.minDuration).max(config.clip.maxDuration).nullable(),
  fileSize: z.number().max(config.clip.maxSizeMB * 1024 * 1024).nullable(),
})

export const createClipInputSchema = z.object({
  mood: z.enum(MOOD_VALUES),
  caption: z.string().max(config.clip.maxCaptionLength).nullable().optional(),
  facility_tag: z.string().max(50).nullable().optional(),
  trick_ids: z.array(z.string().uuid()).optional(),
})

export const editClipInputSchema = z.object({
  mood: z.enum(MOOD_VALUES),
  caption: z.string().max(config.clip.maxCaptionLength).nullable().optional(),
  facility_tag: z.string().max(50).nullable().optional(),
  trick_ids: z.array(z.string().uuid()).optional(),
})

export const bestPlayInputSchema = z.object({
  title: z.string().max(config.bestPlay.maxTitleLength).nullable().optional(),
  mood: z.enum(MOOD_VALUES).nullable().optional(),
  facility_tag: z.string().max(50).nullable().optional(),
  trick_ids: z.array(z.string().uuid()).optional(),
})

export type BestPlayInput = z.infer<typeof bestPlayInputSchema>
export type ClipInput = z.infer<typeof clipSchema>
export type TrickInput = z.infer<typeof trickSchema>
export type ReportInput = z.infer<typeof reportSchema>
export type VideoPickerInput = z.infer<typeof videoPickerSchema>
export type CreateClipInput = z.infer<typeof createClipInputSchema>
export type EditClipInput = z.infer<typeof editClipInputSchema>
