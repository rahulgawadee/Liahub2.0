import React, { useState } from 'react'
import { UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'

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
      className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-300', className)}
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
 * AvatarFallback Component - Professional fallback icon display with theme support
 * Shows UserCircle icon when no profile image is uploaded (like Facebook/LinkedIn)
 * NO initials, text, or background - icon only for consistency
 */
export const AvatarFallback = ({ className = '' }) => {
  const { imageLoaded, imageError, hasImage } = React.useContext(AvatarContext)
  const { isDark } = useTheme()

  // Show fallback only if there's no image or if image failed to load
  if (hasImage && imageLoaded && !imageError) {
    return null
  }

  // Display professional user icon with theme-aware background
  return (
    <div className={cn(`absolute inset-0 flex items-center justify-center transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-blue-900 to-blue-950' : 'bg-gradient-to-br from-blue-100 to-blue-200'}`, className)}>
      <UserCircle 
        className={`transition-colors duration-300 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}
        strokeWidth={1.2}
        style={{ width: '70%', height: '70%' }} 
      />
    </div>
  )
}
