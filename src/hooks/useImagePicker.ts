import { useState, useCallback } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { config } from '@/constants/config'

interface UseImagePickerResult {
  readonly imageUri: string | null
  readonly error: string | null
  readonly loading: boolean
  readonly pickImage: () => Promise<void>
  readonly clearImage: () => void
}

export function useImagePicker(): UseImagePickerResult {
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const pickImage = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (result.canceled) {
        return
      }

      const asset = result.assets[0]

      const maxBytes = config.profile.maxAvatarSizeMB * 1024 * 1024
      if (!asset.fileSize || asset.fileSize > maxBytes) {
        setError('avatar_too_large')
        return
      }

      setImageUri(asset.uri)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pick image'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearImage = useCallback(() => {
    setImageUri(null)
    setError(null)
  }, [])

  return { imageUri, error, loading, pickImage, clearImage }
}
