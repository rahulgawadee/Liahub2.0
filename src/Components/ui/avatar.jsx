import React, { useState } from 'react'
import { UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const AvatarContext = React.createContext()

/**
 * Avatar Component - Professional user avatar display with automatic fallback
 * Displays user profile images with graceful fallback to icon when no image is available
 * Usage: Wrap AvatarImage and AvatarFallback components within Avatar
 */
export const Avatar = ({ className = '', children }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [hasImage, setHasImage] = useState(false)

  return (
    <AvatarContext.Provider value={{ imageLoaded, setImageLoaded, imageError, setImageError, hasImage, setHasImage }}>
      <div className={cn('relative inline-flex items-center justify-center rounded-full overflow-hidden', className)}>
        {children}
      </div>
    </AvatarContext.Provider>
  )
}

/**
 * AvatarImage Component - Handles profile image display with loading states
 * Automatically triggers fallback on load failure or missing src
 */
export const AvatarImage = ({ src, alt = 'User avatar', className = '' }) => {
  const { setImageLoaded, setImageError, setHasImage } = React.useContext(AvatarContext)

  React.useEffect(() => {
    // Reset states when src changes
    setHasImage(!!src)
    setImageLoaded(false)
    if (!src) {
      setImageError(true)
    } else {
      setImageError(false)
    }
  }, [src, setHasImage, setImageError, setImageLoaded])

  if (!src) {
    return null
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('absolute inset-0 h-full w-full object-cover', className)}
      onLoad={() => {
        setImageLoaded(true)
        setImageError(false)
      }}
      onError={() => {
        setImageError(true)
        setImageLoaded(false)
      }}
    />
  )
}

/**
 * AvatarFallback Component - Professional fallback icon display
 * Shows UserCircle icon when no profile image is uploaded (like Facebook/LinkedIn)
 * NO initials, text, or background - icon only for consistency
 */
export const AvatarFallback = ({ className = '' }) => {
  const { imageLoaded, imageError, hasImage } = React.useContext(AvatarContext)

  // Show fallback only if there's no image or if image failed to load
  if (hasImage && imageLoaded && !imageError) {
    return null
  }

  // Display professional user icon with subtle background gradient
  return (
    <div className={cn('absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800', className)}>
      <UserCircle 
        className="text-slate-500 dark:text-slate-400" 
        strokeWidth={1.2}
        style={{ width: '70%', height: '70%' }} 
      />
    </div>
  )
}
