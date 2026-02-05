import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectAuth } from '@/redux/store'
import { Loader2, Sparkles } from 'lucide-react'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import PostCard from '@/Components/social/PostCard'
import CreatePostCard from '@/Components/social/CreatePostCard'
import { Button } from '@/Components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog'
import apiClient from '@/lib/apiClient'
import { useTheme } from '@/hooks/useTheme'

export default function Feed() {
  const { user } = useSelector(selectAuth)
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [successModalOpen, setSuccessModalOpen] = useState(false)

  // Fetch feed posts from backend (ONLY other people's posts, not own)
  const fetchFeedPosts = async () => {
    try {
      setLoading(true)
      console.log('🔄 Fetching feed posts...')
      const response = await apiClient.get('/posts/feed')
      console.log('📦 Feed response:', response.data)
      
      if (response.data) {
        let allPosts = []
        if (Array.isArray(response.data)) {
          allPosts = response.data
        } else if (response.data.posts && Array.isArray(response.data.posts)) {
          allPosts = response.data.posts
        }
        
        // Filter out current user's posts - only show OTHER people's posts in feed
        const otherPosts = allPosts.filter(post => 
          post.author?._id !== user?.id && post.author?._id?.toString() !== user?.id?.toString()
        )
        
        setPosts(otherPosts)
        console.log(`✅ Loaded ${otherPosts.length} posts from others (filtered from ${allPosts.length} total)`)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error('❌ Failed to fetch feed posts:', error)
      console.error('Error details:', error.response?.data || error.message)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchFeedPosts()
    }
  }, [user?.id])

  // Handle file upload
  const handleFileUpload = async (files) => {
    try {
      console.log('📤 Uploading', files.length, 'file(s)...')
      
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await apiClient.post('/posts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('✅ Upload response:', response.data)
      if (response.data && response.data.files) {
        return response.data.files
      }
      return []
    } catch (error) {
      console.error('❌ Failed to upload files:', error)
      alert(`Failed to upload files: ${error.response?.data?.message || error.message}`)
      throw error
    }
  }

  // Create new post
  const handleCreatePost = async (content, media) => {
    try {
      console.log('📝 Creating post...')
      
      const postData = {
        content,
        visibility: 'public',
        media
      }

      const response = await apiClient.post('/posts', postData)
      console.log('✅ Post created:', response.data)
      
      if (response.data) {
        setSuccessModalOpen(true)
      }
    } catch (error) {
      console.error('❌ Failed to create post:', error)
      alert(`Failed to create post: ${error.response?.data?.message || error.message}`)
      throw error
    }
  }

  // Toggle like on post
  const handleToggleLike = async (postId) => {
    try {
      // Optimistic update
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const newIsLiked = !post.isLiked
          const newLikeCount = newIsLiked ? post.likeCount + 1 : post.likeCount - 1
          return { ...post, isLiked: newIsLiked, likeCount: newLikeCount }
        }
        return post
      }))

      const response = await apiClient.post(`/posts/${postId}/reactions`)

      if (response.data) {
        setPosts(posts.map(post => 
          post._id === postId 
            ? { ...post, likeCount: response.data.likeCount, isLiked: response.data.isLiked }
            : post
        ))
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
      // Revert optimistic update on error
      fetchFeedPosts()
    }
  }

  // Share post
  const handleShare = async (post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.author?.name?.first} ${post.author?.name?.last}`,
          text: post.content,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Failed to share:', error)
    }
  }

  const handleViewProfile = () => {
    setSuccessModalOpen(false)
    navigate('/profile')
  }

  // Add comment to post
  const handleAddComment = async (postId, content) => {
    try {
      console.log('💬 Adding comment to post:', postId)
      const response = await apiClient.post(`/posts/${postId}/comments`, { body: content })
      console.log('✅ Comment added:', response.data)
      
      // Update local post with new comment count
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, commentCount: (post.commentCount || 0) + 1 }
          : post
      ))
      return response.data
    } catch (error) {
      console.error('❌ Failed to add comment:', error)
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Unable to add comment'
      throw new Error(message)
    }
  }

  return (
    <>
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-auto">
            {/* Modern Feed Container with max-width for better readability */}
            <div className="w-full min-h-screen bg-background">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b px-4 sm:px-6 py-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h1 className="text-2xl sm:text-3xl font-bold">Feed</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Stay updated with your network</p>
            </div>

            {/* Feed Content - Full Width */}
              <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
              {/* Create Post Card */}
              <CreatePostCard 
                user={user}
                onCreatePost={handleCreatePost}
                onFileUpload={handleFileUpload}
              />

              {/* Posts Feed */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground font-medium">Loading your feed...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="px-4 py-20 text-center">
                  <div className="max-w-md mx-auto">
                    <p className="text-2xl font-bold mb-3">Welcome to your feed!</p>
                    <p className="text-lg text-muted-foreground">
                      Connect with colleagues and follow people to see their posts here
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onToggleLike={handleToggleLike}
                      onShare={handleShare}
                      onAddComment={handleAddComment}
                    />
                  ))}
                </div>
              )}
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="w-full max-w-sm rounded-2xl space-y-6 text-center px-6 py-8">
          <DialogHeader className="flex flex-col items-center gap-1 border-b-0 pb-0">
            <DialogTitle className="text-2xl">Post created</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-sm text-muted-foreground">
            Post created successfully! View it in your profile to see your latest update.
          </DialogDescription>
          <DialogFooter className="flex flex-col gap-2 pt-4 border-t border-border/50 text-center sm:flex-row sm:justify-center">
            <Button className="w-full sm:w-auto" onClick={handleViewProfile}>
              View profile
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSuccessModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
