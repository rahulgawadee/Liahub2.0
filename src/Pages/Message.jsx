import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Card, CardContent } from '@/Components/ui/card'
import { Button } from '../Components/ui/button'
import { Input } from '../Components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../Components/ui/avatar'
import { Badge } from '../Components/ui/badge'
import { Separator } from '../Components/ui/separator'
import { Send, Paperclip, X, File, Image as ImageIcon, FileText, Upload, Trash2, MessageSquare, Search, Clock, CheckCheck } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { selectConnections, selectMessages } from '@/redux/store'
import {
  fetchThreads,
  fetchThreadMessages,
  sendDirectMessage,
  setActiveChat,
  markThreadRead,
} from '@/redux/slices/messagesSlice'
import { mapUserPreview } from '@/lib/mappers/users'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'
import { fetchConnections } from '@/redux/slices/connectionsSlice'
import { getImageUrl } from '@/lib/imageUtils'
import BackButton from '../Components/ui/backButton'
import { pushNotification } from '@/redux/slices/notificationsSlice'
import MessageAttachment from '../Components/shared/MessageAttachment'

export default function Message(){
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const conns = useSelector(selectConnections)
  const msg = useSelector(selectMessages)
  const [search, setSearch] = useState('')
  const [text, setText] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    dispatch(fetchConnections())
    dispatch(fetchThreads())
  }, [dispatch])

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const normalizePreview = useCallback((maybePreview) => {
    if (!maybePreview || typeof maybePreview === 'string') return null
    if (maybePreview.raw) return mapUserPreview(maybePreview.raw)
    return mapUserPreview(maybePreview)
  }, [])

  const networkPeers = useMemo(() => {
    const store = new Map()
    ;(conns.network || []).forEach((entry) => {
      if (!entry?.peer?.id) return
      const preview = normalizePreview(entry.peer)
      if (preview?.id) store.set(preview.id, preview)
    })
    return Array.from(store.values())
  }, [conns.network, normalizePreview])

  const directory = useMemo(() => {
    const map = new Map()
    networkPeers.forEach((peer) => {
      map.set(peer.id, {
        user: peer,
        threadId: null,
        lastMessageAt: null,
      })
    })
    ;(msg.threads || []).forEach((thread) => {
  const peer = normalizePreview(thread?.peer)
      if (!peer?.id) return
      const entry = map.get(peer.id) || { user: peer }
      entry.threadId = thread.id
      entry.lastMessageAt = thread.lastMessageAt
      map.set(peer.id, entry)
    })
    const list = Array.from(map.values())
    return list
      .filter((entry) => !search.trim() || entry.user.name.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => {
        const left = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
        const right = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
        return right - left
      })
  }, [networkPeers, msg.threads, msg.messagesByThread, search, normalizePreview])

  const activePeerId = msg.activePeerId
  const activeThreadId = msg.activeThreadId
  const activeEntry = useMemo(
    () => directory.find((item) => item.user.id === activePeerId) || null,
    [directory, activePeerId],
  )

  const activeUser = useMemo(() => {
    if (activeEntry?.user) return activeEntry.user
    if (!activePeerId) return null
    const fromNetwork = (conns.network || []).find((entry) => entry?.peer?.id === activePeerId)
    if (fromNetwork?.peer) return normalizePreview(fromNetwork.peer)
    const fromThreads = (msg.threads || []).find((thread) => thread?.peer?.id === activePeerId)
    if (fromThreads?.peer) return normalizePreview(fromThreads.peer)
    return null
  }, [activeEntry?.user, activePeerId, conns.network, msg.threads, normalizePreview])
  const conversationMessages = activeThreadId ? msg.messagesByThread[activeThreadId] || [] : []

  // Scroll to bottom when messages change or conversation opens
  useEffect(() => {
    scrollToBottom()
  }, [conversationMessages, activeThreadId])

  // Scroll to bottom when new message is sent
  useEffect(() => {
    if (!msg.sending && conversationMessages.length > 0) {
      scrollToBottom()
    }
  }, [msg.sending, conversationMessages.length])

  useEffect(() => {
    if (activeThreadId && !msg.messagesByThread[activeThreadId] && !msg.messagesLoading[activeThreadId]) {
      dispatch(fetchThreadMessages({ threadId: activeThreadId }))
    }
  }, [activeThreadId, dispatch, msg.messagesByThread, msg.messagesLoading])

  const openChat = (entry) => {
    if (!entry?.user?.id) return
    dispatch(setActiveChat({ peerId: entry.user.id, threadId: entry.threadId }))
    if (entry.threadId) {
      if (!msg.messagesByThread[entry.threadId] && !msg.messagesLoading[entry.threadId]) {
        dispatch(fetchThreadMessages({ threadId: entry.threadId }))
      }
      dispatch(markThreadRead({ threadId: entry.threadId }))
    }
  }
  const goBack = () => dispatch(setActiveChat(null))

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = []
    let currentDate = null
    let currentGroup = []

    messages.forEach((message) => {
      const messageDate = new Date(message.time || message.raw?.createdAt || Date.now())
      const dateString = messageDate.toDateString()

      if (dateString !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup })
        }
        currentDate = dateString
        currentGroup = [message]
      } else {
        currentGroup.push(message)
      }
    })

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup })
    }

    return groups
  }

  const getDateLabel = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      // Format as "Jan 15, 2026" or "December 31, 2025"
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const groupedMessages = useMemo(
    () => groupMessagesByDate(conversationMessages),
    [conversationMessages]
  )

  const onSend = (e) => {
    e?.preventDefault?.()
    if (!activePeerId) {
      dispatch(pushNotification({ type: 'error', text: 'Select a contact to message' }))
      return
    }
    
    const hasText = text.trim()
    const hasFiles = selectedFiles.length > 0

    if (!hasText && !hasFiles) {
      dispatch(pushNotification({ type: 'error', text: 'Please enter a message or attach files' }))
      return
    }

    dispatch(sendDirectMessage({ 
      recipientIds: activePeerId, 
      body: text,
      files: selectedFiles 
    }))
      .unwrap()
      .then(() => {
        setText('')
        setSelectedFiles([])
        dispatch(fetchThreads())
      })
      .catch((error) => {
        dispatch(pushNotification({ type: 'error', text: error || 'Unable to send message' }))
      })
  }

  const handleAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check total files count (max 5)
    if (selectedFiles.length + files.length > 5) {
      dispatch(pushNotification({ 
        type: 'error', 
        text: 'You can only attach up to 5 files per message' 
      }))
      return
    }

    // Check file sizes (max 50MB per file)
    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      dispatch(pushNotification({ 
        type: 'error', 
        text: 'Each file must be smaller than 50MB' 
      }))
      return
    }

    setSelectedFiles(prev => [...prev, ...files])
    
    // Show success feedback
    dispatch(pushNotification({ 
      type: 'success', 
      text: `${files.length} file${files.length > 1 ? 's' : ''} attached` 
    }))
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file) => {
    if (!file) return <File className="h-4 w-4" />
    
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    } else if (
      file.type.includes('pdf') ||
      file.type.includes('document') ||
      file.type.includes('text')
    ) {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  return (
    <SidebarProvider className="flex flex-col h-screen">
      <SiteHeader />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Messages Container */}
            <div className="flex-1 flex overflow-hidden bg-background">
              {/* Conversations List */}
              <div className={`w-full sm:w-80 md:w-96 lg:w-[400px] flex-col ${activePeerId ? 'hidden sm:flex' : 'flex'}`}>
                {/* Search Header */}
                <div className="p-4 sm:p-6" style={{ backgroundColor: '#121212' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">Messages</h2>
                      <p className="text-xs text-muted-foreground">
                        {directory.length} conversation{directory.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search conversations..." 
                      value={search} 
                      onChange={(e)=>setSearch(e.target.value)}
                      className="pl-9 h-10 bg-background/60 focus:bg-background transition-colors"
                    />
                  </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ backgroundColor: '#121212' }}>
                  {directory.length===0 ? (
                    <div className="flex items-center justify-center h-full p-6">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <MessageSquare className="h-8 w-8 text-primary" />
                          </div>
                          <p className="font-semibold mb-1">No conversations yet</p>
                          <p className="text-sm text-muted-foreground">
                            Connect with someone first to start messaging
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : null}
                  {directory.map((entry)=>{
                    const lastThreadMessages = entry.threadId ? msg.messagesByThread[entry.threadId] : []
                    const last = lastThreadMessages?.[lastThreadMessages.length - 1]
                    const isActive = activePeerId===entry.user.id
                    const thread = msg.threads.find((t) => t.id === entry.threadId)
                    const unreadCount = thread?.unreadCount || 0
                    
                    const { displayName, subtitle } = getDisplayNameWithSubtitle(entry.user)
                    
                    return (
                      <div 
                        key={entry.user.id} 
                        className={`group relative px-3 sm:px-4 py-3.5 cursor-pointer transition-all duration-200 ${
                          isActive 
                            ? 'bg-primary/15 shadow-sm' 
                            : 'hover:bg-muted/20'
                        }`}
                        onClick={()=>openChat(entry)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-12 w-12 shadow-md">
                              <AvatarImage src={entry.user.avatarUrl ? getImageUrl(entry.user.avatarUrl) : undefined} alt={entry.user.name} />
                              <AvatarFallback />
                            </Avatar>
                            {/* Online indicator (optional) */}
                            {isActive && (
                              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline gap-2 mb-1">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base truncate">{displayName}</h4>
                                {subtitle && (
                                  <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {last && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {new Date(last.time || last.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs sm:text-sm text-muted-foreground truncate flex-1">
                                {last? (
                                  last.attachments?.length > 0 ? (
                                    <span className="flex items-center gap-1.5">
                                      <Paperclip className="h-3 w-3" />
                                      <span className="font-medium">{last.attachments.length} attachment{last.attachments.length > 1 ? 's' : ''}</span>
                                    </span>
                                  ) : (
                                    <span className={unreadCount > 0 ? 'font-medium text-foreground' : ''}>
                                      {last.text}
                                    </span>
                                  )
                                ) : (
                                  <span className="italic opacity-60">Start a conversation</span>
                                )}
                              </p>
                              {unreadCount > 0 && (
                                <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-xs font-bold rounded-full">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Chat Area */}
              <div className={`flex-1 flex flex-col ${activePeerId ? 'flex' : 'hidden sm:flex'} min-w-0 bg-gradient-to-br from-background to-background/50`}>
                {/* Chat Header */}
                <div className="px-4 sm:px-6 py-3.5 bg-card/80 backdrop-blur-md shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="sm:hidden">
                      {activeUser && <BackButton onClick={goBack} />}
                    </div>
                    {activeUser ? (
                      <>
                        <Avatar className="h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0 shadow-md">
                          <AvatarImage src={activeUser.avatarUrl ? getImageUrl(activeUser.avatarUrl) : undefined} alt={activeUser.name} />
                          <AvatarFallback />
                        </Avatar>
                        <div 
                          onClick={()=>navigate(`/view/profile/${activeUser.id}`)} 
                          className="cursor-pointer flex-1 min-w-0 hover:opacity-80 transition-opacity"
                        >
                          {(() => {
                            const { displayName, subtitle } = getDisplayNameWithSubtitle(activeUser)
                            return (
                              <>
                                <h4 className="font-bold text-sm sm:text-lg truncate">{displayName}</h4>
                                {subtitle ? (
                                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                    {subtitle}
                                  </p>
                                ) : (
                                  <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1.5">
                                    <CheckCheck className="h-3 w-3" />
                                    {activeUser.title || 'Click to view profile'}
                                  </p>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center py-4">
                        <div className="text-center">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                          <p className="text-sm font-medium text-muted-foreground">Select a conversation to start messaging</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-4 space-y-3 sm:space-y-4">
                  {conversationMessages.length === 0 && activeUser ? (
                    <div className="flex items-center justify-center h-full">
                      <Card className="max-w-md">
                        <CardContent className="pt-6 text-center">
                          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Send className="h-8 w-8 text-primary" />
                          </div>
                          <p className="font-semibold mb-1">No messages yet</p>
                          <p className="text-sm text-muted-foreground">
                            Send a message to start the conversation with {activeUser.name.split(' ')[0]}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : null}
                  {groupedMessages.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-3 sm:space-y-4">
                      {/* Date Divider */}
                      <div className="flex items-center justify-center py-2">
                        <div className="px-3 py-1.5 rounded-full bg-muted/60 backdrop-blur-sm">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getDateLabel(group.date)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Messages for this date */}
                      {group.messages.map((message) => (
                        <div key={message.id} className={`flex items-end gap-2 ${message.from==='me'? 'justify-end':'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                          {message.from==='them' ? (
                            <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 shadow-sm">
                              <AvatarImage src={activeUser?.avatarUrl ? getImageUrl(activeUser.avatarUrl) : undefined} alt={activeUser?.name} />
                              <AvatarFallback />
                            </Avatar>
                          ) : null}
                          <div className={`group relative ${
                            message.from==='me'
                              ? 'bg-gray-200 text-slate-900 rounded-br-sm shadow-md'
                              : 'rounded-bl-sm shadow-md text-slate-100'
                            } rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 max-w-[85%] sm:max-w-md lg:max-w-lg transition-all hover:shadow-xl`} style={message.from==='them' ? { backgroundColor: '#181818' } : undefined}>
                            {message.text && <p className="text-sm sm:text-base break-words leading-relaxed">{message.text}</p>}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className={`space-y-2 ${message.text ? 'mt-2 pt-2' : ''}`}>
                                {message.attachments.map((attachment, idx) => (
                                  <MessageAttachment key={idx} attachment={attachment} />
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                              <span className="text-[10px] sm:text-xs opacity-70">
                                {new Date(message.time || message.raw?.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              {message.from === 'me' && (
                                <CheckCheck className="h-3 w-3 opacity-70" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {activeUser && (
                  <form onSubmit={onSend} className="px-3 sm:px-6 py-3 sm:py-4 bg-card/60 backdrop-blur-md">
                    {/* Selected Files Preview */}
                    {selectedFiles.length > 0 && (
                      <Card className="mb-3 bg-gradient-to-br from-primary/5 to-primary/10">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-primary/20">
                                <Upload className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <span className="text-sm font-bold">Ready to send</span>
                                <p className="text-xs text-muted-foreground">
                                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} attached
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedFiles([])}
                              className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive gap-1.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Clear all
                            </Button>
                          </div>
                          <Separator className="mb-3" />
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {selectedFiles.map((file, idx) => (
                              <div 
                                key={idx} 
                                className="group flex items-center gap-3 p-2.5 bg-background/80 hover:bg-background rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
                              >
                                <div className="flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                                  {getFileIcon(file)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate font-medium">{file.name}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <File className="h-3 w-3" />
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all rounded-full"
                                  onClick={() => removeFile(idx)}
                                >
                                  <X className="h-4 w-4" />
                                  <span className="sr-only">Remove</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex items-end gap-2">
                      <div className="relative group">
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="outline" 
                          className="h-11 w-11 flex-shrink-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 shadow-sm" 
                          onClick={handleAttach}
                        >
                          <Paperclip className="h-5 w-5" />
                          <span className="sr-only">Attach file</span>
                        </Button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          Attach files (max 5)
                        </div>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
                      />
                      <div className="flex-1 relative">
                        <Input 
                          placeholder="Type your message..." 
                          className="pr-14 rounded-xl h-11 bg-background focus:bg-background transition-all shadow-sm" 
                          value={text} 
                          onChange={(e)=>setText(e.target.value)}
                        />
                        <Button 
                          type="submit" 
                          size="icon" 
                          className="absolute top-1/2 right-1.5 -translate-y-1/2 h-8 w-8 rounded-lg transition-all duration-200 hover:scale-110 shadow-md"
                          disabled={!text.trim() && selectedFiles.length === 0}
                        >
                          <Send className="h-4 w-4" />
                          <span className="sr-only">Send</span>
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
