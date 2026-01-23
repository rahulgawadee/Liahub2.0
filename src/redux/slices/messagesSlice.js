import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/apiClient'
import { mapUserPreview } from '@/lib/mappers/users'

const formatMessage = (message, currentUserId) => {
  if (!message) return null
  const safeMessage = typeof message.toJSON === 'function' ? message.toJSON() : message
  const senderId = safeMessage.sender?.id || safeMessage.sender?._id || safeMessage.sender
  const sender = mapUserPreview(safeMessage.sender)
  return {
    id: safeMessage.id,
    text: safeMessage.body || '',
    senderId,
    from: senderId?.toString() === currentUserId?.toString() ? 'me' : 'them',
    time: safeMessage.createdAt,
    sender,
    attachments: safeMessage.attachments || [],
    raw: safeMessage,
  }
}

const formatThread = (thread, currentUserId) => {
  if (!thread) return null
  const safeThread = typeof thread.toJSON === 'function' ? thread.toJSON() : thread
  const participants = (safeThread.participants || []).map(mapUserPreview)
  const peer = participants.find((participant) => participant?.id !== currentUserId) || participants[0] || null
  return {
    id: safeThread.id,
    participants,
    peer,
    lastMessageAt: safeThread.lastMessageAt,
    lastMessageId: safeThread.lastMessage?.id || safeThread.lastMessage,
    unreadCount: safeThread.unreadCount || 0,
    raw: safeThread,
  }
}

const buildErrorMessage = (error) => error?.response?.data?.message || error?.message || 'Something went wrong'

export const fetchThreads = createAsyncThunk('messages/fetchThreads', async (_, { rejectWithValue, getState }) => {
  try {
    const { data } = await api.get('/messages/threads')
    const currentUserId = getState()?.auth?.user?.id || null
    return { threads: data, currentUserId }
  } catch (error) {
    return rejectWithValue(buildErrorMessage(error))
  }
})

export const fetchThreadMessages = createAsyncThunk(
  'messages/fetchThreadMessages',
  async ({ threadId }, { rejectWithValue, getState }) => {
    try {
      const { data } = await api.get(`/messages/threads/${threadId}/messages`)
      const currentUserId = getState()?.auth?.user?.id || null
      return { threadId, messages: data, currentUserId }
    } catch (error) {
      return rejectWithValue(buildErrorMessage(error))
    }
  },
)

export const sendDirectMessage = createAsyncThunk(
  'messages/sendDirectMessage',
  async ({ recipientIds, body, files }, { rejectWithValue, getState }) => {
    try {
      const recipientArray = Array.isArray(recipientIds)
        ? recipientIds.filter(Boolean)
        : [recipientIds].filter(Boolean)

      if (!recipientArray.length) {
        throw new Error('Recipient missing')
      }

      const hasText = body && body.trim()
      const hasFiles = files && files.length > 0

      if (!hasText && !hasFiles) {
        throw new Error('Message must contain text or files')
      }

      const formData = new FormData()
      
      // Add recipient IDs
      recipientArray.forEach((id) => {
        formData.append('recipientIds[]', id)
      })

      // Add message body if provided
      if (hasText) {
        formData.append('body', body)
      }

      // Add files if provided
      if (hasFiles) {
        files.forEach((file) => {
          formData.append('files', file)
        })
      }

      const { data } = await api.post('/messages/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      const currentUserId = getState()?.auth?.user?.id || null
      return { ...data, currentUserId }
    } catch (error) {
      return rejectWithValue(buildErrorMessage(error))
    }
  },
)

export const markThreadRead = createAsyncThunk(
  'messages/markThreadRead',
  async ({ threadId }, { rejectWithValue }) => {
    try {
      await api.post(`/messages/threads/${threadId}/read`, { threadId })
      return threadId
    } catch (error) {
      return rejectWithValue(buildErrorMessage(error))
    }
  },
)

const initialState = {
  activePeerId: null,
  activeThreadId: null,
  threads: [],
  threadsLoading: false,
  threadsError: null,
  messagesByThread: {},
  messagesLoading: {},
  messagesError: {},
  sending: false,
}

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setActiveChat(state, { payload }) {
      if (!payload) {
        state.activePeerId = null
        state.activeThreadId = null
        return
      }

      if (typeof payload === 'string') {
        state.activePeerId = payload
        const match = state.threads.find((thread) => thread.peer?.id === payload)
        state.activeThreadId = match ? match.id : null
        return
      }

      state.activePeerId = payload.peerId ?? state.activePeerId
      state.activeThreadId = payload.threadId ?? state.activeThreadId
    },
    receiveRealtimeMessage(state, { payload }) {
      const { message, thread } = payload || {}
      if (!thread || !message) return
      const threadId = thread.id || thread._id
      const formattedThread = formatThread(thread, payload.currentUserId)
      if (formattedThread) {
        const index = state.threads.findIndex((item) => item.id === formattedThread.id)
        if (index >= 0) {
          state.threads[index] = formattedThread
          // Increment unread count if message is not from current user and thread is not active
          const formattedMessage = formatMessage(message, payload.currentUserId)
          if (formattedMessage?.from === 'them' && state.activeThreadId !== threadId) {
            state.threads[index].unreadCount = (state.threads[index].unreadCount || 0) + 1
          }
        } else {
          // New thread - set unread count to 1 if message is from others
          const formattedMessage = formatMessage(message, payload.currentUserId)
          if (formattedMessage?.from === 'them') {
            formattedThread.unreadCount = 1
          }
          state.threads.unshift(formattedThread)
        }
      }
      const formattedMessage = formatMessage(message, payload.currentUserId)
      if (!formattedMessage) return
      const existing = state.messagesByThread[threadId] || []
      state.messagesByThread[threadId] = [...existing, formattedMessage]
    },
    clearConversation(state, { payload }) {
      if (!payload) return
      state.threads = state.threads.filter((thread) => thread.id !== payload)
      delete state.messagesByThread[payload]
      if (state.activeThreadId === payload) {
        state.activeThreadId = null
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThreads.pending, (state) => {
        state.threadsLoading = true
        state.threadsError = null
      })
      .addCase(fetchThreads.fulfilled, (state, { payload }) => {
        state.threadsLoading = false
        state.threads = Array.isArray(payload?.threads)
          ? payload.threads.map((thread) => formatThread(thread, payload.currentUserId)).filter(Boolean)
          : []
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.threadsLoading = false
        state.threadsError = action.payload || action.error?.message || 'Failed to load conversations'
      })
      .addCase(fetchThreadMessages.pending, (state, { meta }) => {
        if (meta?.arg?.threadId) {
          state.messagesLoading[meta.arg.threadId] = true
          state.messagesError[meta.arg.threadId] = null
        }
      })
      .addCase(fetchThreadMessages.fulfilled, (state, { payload }) => {
        state.messagesLoading[payload.threadId] = false
        state.messagesByThread[payload.threadId] = Array.isArray(payload.messages)
          ? payload.messages.map((message) => formatMessage(message, payload.currentUserId)).filter(Boolean)
          : []
      })
      .addCase(fetchThreadMessages.rejected, (state, action) => {
        const threadId = action.meta?.arg?.threadId
        if (threadId) {
          state.messagesLoading[threadId] = false
          state.messagesError[threadId] = action.payload || action.error?.message || 'Failed to load messages'
        }
      })
      .addCase(sendDirectMessage.pending, (state) => {
        state.sending = true
      })
      .addCase(sendDirectMessage.fulfilled, (state, { payload }) => {
        state.sending = false
        const formattedThread = formatThread(payload.thread, payload.currentUserId)
        if (formattedThread) {
          const index = state.threads.findIndex((thread) => thread.id === formattedThread.id)
          if (index >= 0) {
            state.threads[index] = formattedThread
          } else {
            state.threads.unshift(formattedThread)
          }
          state.activeThreadId = formattedThread.id
          state.activePeerId = formattedThread.peer?.id || state.activePeerId
        }

        const formattedMessage = formatMessage(payload.message, payload.currentUserId)
        if (formattedMessage && state.activeThreadId) {
          const messages = state.messagesByThread[state.activeThreadId] || []
          state.messagesByThread[state.activeThreadId] = [...messages, formattedMessage]
        }
      })
      .addCase(sendDirectMessage.rejected, (state) => {
        state.sending = false
      })
      .addCase(markThreadRead.fulfilled, (state, { payload }) => {
        if (!payload) return
        const threadId = payload
        state.messagesError[threadId] = null
        // Reset unread count for this thread
        const thread = state.threads.find((t) => t.id === threadId)
        if (thread) {
          thread.unreadCount = 0
        }
      })
  },
})

export const { setActiveChat, receiveRealtimeMessage, clearConversation } = messagesSlice.actions

// Selector to get total unread message count
export const selectTotalUnreadMessages = (state) => {
  const threads = state?.messages?.threads || []
  return threads.reduce((total, thread) => total + (thread.unreadCount || 0), 0)
}

export default messagesSlice.reducer
