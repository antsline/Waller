import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const uuidSchema = z.string().uuid()

function validateId(id: string, label: string): string {
  const result = uuidSchema.safeParse(id)
  if (!result.success) {
    throw new Error(`Invalid ${label}: must be a valid UUID`)
  }
  return result.data
}

function buildPath(folder: string, fileName: string): string {
  return `${folder}/${fileName}`
}

const MAX_UPLOAD_SIZE = 100 * 1024 * 1024

async function uploadFile(
  bucket: string,
  path: string,
  uri: string,
  contentType: string,
): Promise<string> {
  const response = await fetch(uri)
  const blob = await response.blob()

  if (blob.size > MAX_UPLOAD_SIZE) {
    throw new Error('File too large')
  }

  // Client-side MIME check is best-effort; blob.type is unreliable for local file URIs on mobile.
  // Server-side enforcement via Supabase storage bucket allowed_mime_types is authoritative.
  if (blob.type && blob.type !== contentType && blob.type !== 'application/octet-stream') {
    throw new Error(`Invalid file type: expected ${contentType}, got ${blob.type}`)
  }

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType,
    upsert: true,
  })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return `${urlData.publicUrl}?t=${Date.now()}`
}

export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const uid = validateId(userId, 'userId')
  const path = buildPath(uid, 'avatar.jpg')
  return uploadFile('avatars', path, uri, 'image/jpeg')
}

export async function uploadClipVideo(userId: string, clipId: string, uri: string): Promise<string> {
  const uid = validateId(userId, 'userId')
  const cid = validateId(clipId, 'clipId')
  const path = buildPath(`${uid}/${cid}`, 'video.mp4')
  return uploadFile('clips', path, uri, 'video/mp4')
}

export async function uploadThumbnail(userId: string, clipId: string, uri: string): Promise<string> {
  const uid = validateId(userId, 'userId')
  const cid = validateId(clipId, 'clipId')
  const path = buildPath(`${uid}/${cid}`, 'thumbnail.jpg')
  return uploadFile('clips', path, uri, 'image/jpeg')
}

export async function uploadBestPlay(userId: string, bestPlayId: string, uri: string): Promise<string> {
  const uid = validateId(userId, 'userId')
  const bid = validateId(bestPlayId, 'bestPlayId')
  const path = buildPath(`${uid}/${bid}`, 'video.mp4')
  return uploadFile('best-plays', path, uri, 'video/mp4')
}

export async function uploadBestPlayThumbnail(userId: string, bestPlayId: string, uri: string): Promise<string> {
  const uid = validateId(userId, 'userId')
  const bid = validateId(bestPlayId, 'bestPlayId')
  const path = buildPath(`${uid}/${bid}`, 'thumbnail.jpg')
  return uploadFile('best-plays', path, uri, 'image/jpeg')
}

export async function deleteStorageFile(bucket: string, userId: string, path: string): Promise<void> {
  const uid = validateId(userId, 'userId')

  if (!path.startsWith(`${uid}/`)) {
    throw new Error('Cannot delete files outside own folder')
  }

  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}
