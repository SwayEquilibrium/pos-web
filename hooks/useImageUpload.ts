'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface OptimizedImage {
  id: string
  original_url: string
  large_url?: string
  medium_url?: string
  small_url?: string
  thumbnail_url: string
  file_hash: string
  width: number
  height: number
}

// Client-side image optimization utilities
class ImageOptimizer {
  static async compressImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate dimensions maintaining aspect ratio
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/webp', // Use WebP for better compression
          quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  static async generateHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => reject(new Error('Failed to load image dimensions'))
      img.src = URL.createObjectURL(file)
    })
  }
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadOptimizedImage = async (file: File): Promise<OptimizedImage> => {
    setIsUploading(true)
    setProgress(0)

    try {
      // 1. Generate file hash for deduplication
      const fileHash = await ImageOptimizer.generateHash(file)
      setProgress(10)

      // 2. Check if image already exists in database
      const { data: existingImage } = await supabase
        .from('optimized_images')
        .select('*')
        .eq('file_hash', fileHash)
        .single()

      if (existingImage) {
        // Image already exists, increment usage count and return
        await supabase.rpc('increment_image_usage', { image_id: existingImage.id })
        setProgress(100)
        return existingImage
      }

      setProgress(20)

      // 3. Get original dimensions
      const dimensions = await ImageOptimizer.getImageDimensions(file)
      setProgress(30)

      // 4. Create optimized versions
      const originalBlob = await ImageOptimizer.compressImage(file, 1200, 1200, 0.9)
      const largeBlob = await ImageOptimizer.compressImage(file, 800, 600, 0.85)
      const mediumBlob = await ImageOptimizer.compressImage(file, 400, 300, 0.8)
      const smallBlob = await ImageOptimizer.compressImage(file, 200, 150, 0.75)
      const thumbnailBlob = await ImageOptimizer.compressImage(file, 100, 100, 0.7)
      setProgress(60)

      // 5. Upload all versions to Supabase Storage
      const timestamp = Date.now()
      const baseFileName = `${fileHash}_${timestamp}`
      
      const uploads = await Promise.all([
        supabase.storage.from('images').upload(`original/${baseFileName}.webp`, originalBlob),
        supabase.storage.from('images').upload(`large/${baseFileName}.webp`, largeBlob),
        supabase.storage.from('images').upload(`medium/${baseFileName}.webp`, mediumBlob),
        supabase.storage.from('images').upload(`small/${baseFileName}.webp`, smallBlob),
        supabase.storage.from('images').upload(`thumbnails/${baseFileName}.webp`, thumbnailBlob),
      ])

      // Check for upload errors
      uploads.forEach((upload, index) => {
        if (upload.error) {
          throw new Error(`Upload failed for size ${index}: ${upload.error.message}`)
        }
      })

      setProgress(80)

      // 6. Get public URLs
      const { data: { publicUrl: originalUrl } } = supabase.storage.from('images').getPublicUrl(`original/${baseFileName}.webp`)
      const { data: { publicUrl: largeUrl } } = supabase.storage.from('images').getPublicUrl(`large/${baseFileName}.webp`)
      const { data: { publicUrl: mediumUrl } } = supabase.storage.from('images').getPublicUrl(`medium/${baseFileName}.webp`)
      const { data: { publicUrl: smallUrl } } = supabase.storage.from('images').getPublicUrl(`small/${baseFileName}.webp`)
      const { data: { publicUrl: thumbnailUrl } } = supabase.storage.from('images').getPublicUrl(`thumbnails/${baseFileName}.webp`)

      setProgress(90)

      // 7. Create database record
      const { data: imageRecord, error: dbError } = await supabase
        .rpc('get_or_create_optimized_image', {
          p_file_hash: fileHash,
          p_original_filename: file.name,
          p_file_size_bytes: file.size,
          p_mime_type: 'image/webp',
          p_width: dimensions.width,
          p_height: dimensions.height,
          p_original_url: originalUrl,
          p_large_url: largeUrl,
          p_medium_url: mediumUrl,
          p_small_url: smallUrl,
          p_thumbnail_url: thumbnailUrl
        })

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      setProgress(100)

      // 8. Fetch and return the created record
      const { data: newImage, error: fetchError } = await supabase
        .from('optimized_images')
        .select('*')
        .eq('id', imageRecord)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch created image: ${fetchError.message}`)
      }

      return newImage

    } catch (error) {
      console.error('Image upload error:', error)
      throw error
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  const deleteImage = async (imageId: string): Promise<void> => {
    try {
      // Get image info first
      const { data: image, error: fetchError } = await supabase
        .from('optimized_images')
        .select('*')
        .eq('id', imageId)
        .single()

      if (fetchError || !image) {
        throw new Error('Image not found')
      }

      // Delete from storage
      const baseFileName = image.original_url.split('/').pop()?.replace('.webp', '') || ''
      
      await Promise.all([
        supabase.storage.from('images').remove([`original/${baseFileName}.webp`]),
        supabase.storage.from('images').remove([`large/${baseFileName}.webp`]),
        supabase.storage.from('images').remove([`medium/${baseFileName}.webp`]),
        supabase.storage.from('images').remove([`small/${baseFileName}.webp`]),
        supabase.storage.from('images').remove([`thumbnails/${baseFileName}.webp`]),
      ])

      // Delete from database
      const { error: deleteError } = await supabase
        .from('optimized_images')
        .delete()
        .eq('id', imageId)

      if (deleteError) {
        throw new Error(`Failed to delete image record: ${deleteError.message}`)
      }

    } catch (error) {
      console.error('Image deletion error:', error)
      throw error
    }
  }

  return {
    uploadOptimizedImage,
    deleteImage,
    isUploading,
    progress
  }
}

// Hook for cleanup (admin use)
export function useImageCleanup() {
  const [isCleaning, setIsCleaning] = useState(false)

  const cleanupUnusedImages = async (): Promise<number> => {
    setIsCleaning(true)
    try {
      const { data: deletedCount, error } = await supabase
        .rpc('cleanup_unused_images')

      if (error) {
        throw new Error(`Cleanup failed: ${error.message}`)
      }

      return deletedCount || 0
    } catch (error) {
      console.error('Image cleanup error:', error)
      throw error
    } finally {
      setIsCleaning(false)
    }
  }

  return {
    cleanupUnusedImages,
    isCleaning
  }
}
