import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectAuth } from '@/redux/store'
import { Button } from '@/Components/ui/button'
import { Card } from '@/Components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog'
import { Textarea } from '@/Components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Heart, MessageCircle, Share2, Pencil, Trash2, Image as ImageIcon } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { getImageUrl } from '@/lib/imageUtils'
import { getDisplayNameWithSubtitle } from '@/lib/displayNameUtils'

export default function Posts() {
  const { user } = useSelector(selectAuth)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editPost, setEditPost] = useState(null)
  const [formData, setFormData] = useState({
    content: '',
    visibility: 'connections',
    mediaUrl: ''
  })
  const [likesViewer, setLikesViewer] = useState({ open: false, post: null })
  const [commentsViewer, setCommentsViewer] = useState({ open: false, post: null })

  useEffect(() => {
    fetchPosts()
  }, [user])

  const fetchPosts = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const response = await apiClient.get(`/posts/user/${user.id}`)
      // Check if response has posts array (paginated) or is direct array
      const postsData = response.data.posts || response.data
      setPosts(Array.isArray(postsData) ? postsData : [])
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.content.trim()) return
    
    try {
      const payload = {
        content: formData.content,
        visibility: formData.visibility
      }
      
      if (formData.mediaUrl) {
        payload.media = [{ url: formData.mediaUrl, type: 'image' }]
      }

      const response = await apiClient.post('/posts', payload)
      setPosts([response.data, ...posts])
      setCreateOpen(false)
      setFormData({ content: '', visibility: 'connections', mediaUrl: '' })
    } catch (error) {
      console.error('Failed to create post:', error)
      alert('Failed to create post')
    }
  }

  const handleUpdate = async () => {
    if (!editPost || !formData.content.trim()) return
    
    try {
      const payload = {
        content: formData.content,
        visibility: formData.visibility
      }
      
      if (formData.mediaUrl) {
        payload.media = [{ url: formData.mediaUrl, type: 'image' }]
      }

      const response = await apiClient.put(`/posts/${editPost._id}`, payload)
      setPosts(posts.map(p => p._id === editPost._id ? response.data : p))
      setEditPost(null)
      setFormData({ content: '', visibility: 'connections', mediaUrl: '' })
    } catch (error) {
      console.error('Failed to update post:', error)
      alert('Failed to update post')
    }
  }

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return
    
    try {
      await apiClient.delete(`/posts/${postId}`)
      setPosts(posts.filter(p => p._id !== postId))
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('Failed to delete post')
    }
  }

  const handleEdit = (post) => {
    setEditPost(post)
    setFormData({
      content: post.content,
      visibility: post.visibility,
      mediaUrl: post.media?.[0]?.url || ''
    })
  }

  const handleToggleReaction = async (postId, reactionType = 'like') => {
    try {
      await apiClient.post(`/posts/${postId}/reactions/${reactionType}`)
      fetchPosts() // Refresh to get updated reactions
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
    }
  }

  const openLikes = (post) => {
    setLikesViewer({ open: true, post })
  }

  const openComments = (post) => {
    setCommentsViewer({ open: true, post })
  }

  const closeDialog = () => {
    setCreateOpen(false)
    setEditPost(null)
    setFormData({ content: '', visibility: 'connections', mediaUrl: '' })
  }

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading posts...</div>
  }

  return (
    <div className="space-y-4">
      {/* Create post button */}
      <Button onClick={() => setCreateOpen(true)} className="w-full">
        Create New Post
      </Button>

      {/* Posts list */}
      {posts.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No posts yet. Create your first post!
        </Card>
      ) : (
        posts.map(post => (
          <Card key={post._id} className="p-4 space-y-3">
            {/* Post header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={getImageUrl(user?.media?.avatar)} />
                  <AvatarFallback />
                </Avatar>
                <div>
                  <div className="font-semibold text-sm">You</div>
                  <div className="text-xs text-muted-foreground">
                    Posted by You • {new Date(post.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} • {post.visibility}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(post)} className="gap-1">
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(post._id)} className="gap-1 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>

            {/* Post content */}
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>

            {/* Post media */}
            {post.media && post.media.length > 0 && (
              <div className="space-y-2">
                {post.media.map((file, idx) => (
                  file.type === 'image' ? (
                    <img 
                      key={idx}
                      src={file.url} 
                      alt={file.filename || "Post media"}
                      className="w-full rounded-lg max-h-96 object-cover"
                    />
                  ) : file.type === 'pdf' ? (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-muted p-3 rounded-lg hover:bg-muted/80"
                    >
                      <ImageIcon className="h-8 w-8 text-red-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{file.filename || 'Document.pdf'}</p>
                        <p className="text-xs text-muted-foreground">PDF Document</p>
                      </div>
                    </a>
                  ) : null
                ))}
              </div>
            )}

            {/* Post actions */}
            <div className="flex items-center gap-6 pt-2 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleToggleReaction(post._id)}
                className={`gap-2 ${post.isLiked ? 'text-red-500' : ''}`}
                title="Like / Unlike"
              >
                <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span
                  className="text-sm font-medium underline-offset-2 hover:underline"
                  onClick={(e) => { e.stopPropagation(); openLikes(post) }}
                >
                  {post.likeCount || 0}
                </span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => openComments(post)}
                title="View comments"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm">{post.commentCount || 0}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        ))
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen || !!editPost} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg bg-background border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle>{editPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Content</Label>
              <Textarea
                placeholder="What's on your mind?"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="resize-none"
              />
            </div>

            <div>
              <Label>Image URL (optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                />
                <Button variant="outline" size="icon">
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Visibility</Label>
              <Select 
                value={formData.visibility} 
                onValueChange={(val) => setFormData({ ...formData, visibility: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="connections">Connections</SelectItem>
                  <SelectItem value="followers">Followers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={editPost ? handleUpdate : handleCreate}>
              {editPost ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Likes Viewer */}
      <Dialog open={likesViewer.open} onOpenChange={() => setLikesViewer({ open: false, post: null })}>
        <DialogContent className="max-w-md bg-background border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle>Liked by</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {Array.isArray(likesViewer.post?.reactions) && likesViewer.post.reactions.length > 0 ? (
              likesViewer.post.reactions.map((r) => {
                const user = r.user
                const name = [user?.name?.first, user?.name?.last].filter(Boolean).join(' ') || user?.username || 'User'
                const avatar = getImageUrl(user?.media?.avatar)
                return (
                  <div key={user?._id || name} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatar} />
                      <AvatarFallback>{name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{name}</div>
                      <div className="text-xs text-muted-foreground">{r.type || 'like'}</div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-sm text-muted-foreground">No likes yet</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLikesViewer({ open: false, post: null })}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Viewer */}
      <Dialog open={commentsViewer.open} onOpenChange={() => setCommentsViewer({ open: false, post: null })}>
        <DialogContent className="max-w-md bg-background border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {Array.isArray(commentsViewer.post?.comments) && commentsViewer.post.comments.length > 0 ? (
              commentsViewer.post.comments.map((c) => {
                const user = c.author
                const name = [user?.name?.first, user?.name?.last].filter(Boolean).join(' ') || user?.username || 'User'
                const avatar = getImageUrl(user?.media?.avatar)
                return (
                  <div key={c._id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 mt-0.5">
                      <AvatarImage src={avatar} />
                      <AvatarFallback>{name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm"><span className="font-medium">{name}</span> <span className="text-muted-foreground text-xs">• {new Date(c.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
                      <div className="text-sm text-foreground/90 whitespace-pre-wrap">{c.body}</div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-sm text-muted-foreground">No comments yet</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentsViewer({ open: false, post: null })}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
