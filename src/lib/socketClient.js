import { io } from 'socket.io-client'

let socketInstance = null

const deriveSocketUrl = () => {
  // Use VITE_API_URL for deployment (Vercel → Render)
  const explicitUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL
  if (explicitUrl) return explicitUrl.replace(/\/$/, '')

  // Fallback to localhost in development
  if (import.meta.env.DEV) {
    return 'http://localhost:5000'
  }

  // Fallback to deriving from API base
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  try {
    const url = new URL(apiBase)
    url.pathname = '/'
    url.hash = ''
    url.search = ''
    return url.toString().replace(/\/$/, '')
  } catch (error) {
    console.warn('Failed to derive socket URL from API base', error)
    return ''
  }
}

export const connectSocket = (token) => {
  if (!token) {
    return null
  }

  const baseUrl = deriveSocketUrl()

  if (socketInstance) {
    const currentToken = socketInstance.__authToken
    if (currentToken === token) {
      return socketInstance
    }
    socketInstance.disconnect()
    socketInstance = null
  }

  socketInstance = io(baseUrl, {
    autoConnect: true,
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  socketInstance.__authToken = token

  return socketInstance
}

export const getSocket = () => socketInstance

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}
