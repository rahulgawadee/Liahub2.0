/**
 * Get the full URL for an image path from the backend
 * @param {string} path - The image path (e.g., "/uploads/images/...")
 * @returns {string|undefined} - The full URL or undefined if no path provided
 */
export const getImageUrl = (path) => {
  if (!path) return undefined
  
  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // Build the full URL with backend base
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  // Remove /api/v1 from base URL if present
  const serverUrl = baseUrl.replace('/api/v1', '')
  
  // Ensure path starts with /
  const imagePath = path.startsWith('/') ? path : `/${path}`
  
  return `${serverUrl}${imagePath}`
}
