import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar'
import { Button } from '@/Components/ui/button'
import { Card, CardContent } from '@/Components/ui/card'
import { Textarea } from '@/Components/ui/textarea'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'
import { Heart, MessageCircle, Share2, FileText, Globe, Send } from 'lucide-react'
import { getImageUrl } from '@/lib/imageUtils'

// Time formatting utility
const formatTimeAgo = (date) => {
  const now = new Date()
  const postDate = new Date(date)
  const diffInSeconds = Math.floor((now - postDate) / 1000)
  
  if (diffInSeconds < 60) return `${diffInSeconds}s`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
  
  return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function PostCard({ post, onToggleLike, onShare, onAddComment }) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState(post.comments || [])
  const [commentError, setCommentError] = useState(null)
  const [submittingComment, setSubmittingComment] = useState(false)

  const { displayName, subtitle } = React.useMemo(() => {
    return getDisplayNameWithSubtitle(post.author)
  }, [post.author])

  const handleAddComment = async () => {
    const trimmed = newComment.trim()
    if (!trimmed || submittingComment) return

    setCommentError(null)
    setSubmittingComment(true)

    const optimisticComment = {
      _id: Date.now().toString(),
      body: trimmed,
      createdAt: new Date().toISOString(),
      author: { name: { first: 'You' } }
    }

    setComments((prev) => [...prev, optimisticComment])
    setNewComment('')
    setShowComments(true)

    try {
      if (onAddComment) {
        const savedComment = await onAddComment(post._id, trimmed)
        if (savedComment) {
          setComments((prev) =>
            prev.map((comment) =>
              comment._id === optimisticComment._id ? savedComment : comment
            )
          )
        }
      }
    } catch (error) {
      setComments((prev) =>
        prev.filter((existing) => existing._id !== optimisticComment._id)
      )
      setCommentError(error.message || 'Unable to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  return (
    <Card className="mb-6 overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-primary/10">
            <AvatarImage src={getImageUrl(post.author?.media?.avatar)} />
            <AvatarFallback />
          </Avatar>

          {/* Post Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="font-bold text-base hover:underline cursor-pointer">
                {displayName}
              </span>
              {subtitle && (
                <span className="text-muted-foreground text-sm">
                  {subtitle}
                </span>
              )}
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <span className="text-muted-foreground text-sm">
                {formatTimeAgo(post.createdAt)}
              </span>
              {post.visibility === 'public' && (
                <>
                  <span className="text-muted-foreground hidden sm:inline">·</span>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </>
              )}
            </div>

            {/* Post Text */}
            {post.content && (
              <div className="mb-4">
                <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
                  {post.content}
                </p>
              </div>
            )}

            {/* Post Media */}
            {post.media && post.media.length > 0 && (
              <div className="mb-4 space-y-3">
                {post.media.map((file, idx) => (
                  file.type === 'image' ? (
                    <div key={idx} className="rounded-xl overflow-hidden shadow-md bg-muted/30">
                      <img
                        src={file.url}
                        alt={file.filename || "Post image"}
                        className="w-full max-h-[500px] object-cover"
                      />
                    </div>
                  ) : file.type === 'pdf' ? (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4 rounded-xl hover:shadow-md transition-all border-l-4 border-red-500"
                    >
                      <FileText className="h-10 w-10 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{file.filename || 'Document.pdf'}</p>
                        <p className="text-xs text-muted-foreground">PDF Document · Click to view</p>
                      </div>
                    </a>
                  ) : null
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center gap-1 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments((prev) => !prev)}
                className="gap-2 hover:text-blue-500 hover:bg-blue-500/10 rounded-full flex-1 sm:flex-initial"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{comments.length || post.commentCount || ''}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleLike(post._id)
                }}
                className={`gap-2 rounded-full flex-1 sm:flex-initial transition-all ${
                  post.isLiked 
                    ? 'text-red-500 hover:text-red-600 hover:bg-red-500/10' 
                    : 'hover:text-red-500 hover:bg-red-500/10'
                }`}
              >
                <Heart
                  className={`h-5 w-5 transition-all ${
                    post.isLiked ? 'fill-red-500 scale-110' : ''
                  }`}
                />
                <span className="text-sm font-medium">{post.likeCount > 0 ? post.likeCount : ''}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onShare(post)
                }}
                className="gap-2 hover:text-green-500 hover:bg-green-500/10 rounded-full flex-1 sm:flex-initial"
              >
                <Share2 className="h-5 w-5" />
                <span className="text-sm font-medium hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

            {showComments && (
              <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-inner">
                <div className="flex flex-col gap-3">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value)
                      if (commentError) {
                        setCommentError(null)
                      }
                    }}
                    rows={1}
                    className="resize-none"
                  />
                  {commentError && (
                    <p className="text-sm text-destructive/90">
                      {commentError}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || submittingComment}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>{submittingComment ? 'Posting…' : 'Post comment'}</span>
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
                  ) : (
                    comments.map((comment) => {
                      const commenterName = [
                        comment.author?.name?.first,
                        comment.author?.name?.last,
                      ]
                        .filter(Boolean)
                        .join(' ') || 'You'
                      const initial = commenterName?.[0] || 'U'
                      return (
                        <div key={comment._id} className="flex gap-3 rounded-xl bg-muted/10 p-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={getImageUrl(comment.author?.media?.avatar)} />
                            <AvatarFallback>{initial}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold text-foreground/90">
                                {commenterName}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {formatTimeAgo(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground/90">
                              {comment.body}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
    </Card>
  )
}
