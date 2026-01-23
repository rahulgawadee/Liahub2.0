import React, { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import PostCard from '@/Components/social/PostCard'
import apiClient from '@/lib/apiClient'

/**
 * Reusable component to display a user's posts
 * Used in ProfileView and other profile-related pages
 */
export default function UserPosts({ userId, userName = 'User', hideEmpty = false }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch user's posts
  useEffect(() => {
    if (!userId) return

    const fetchUserPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('═══════════════════════════════════════════');
        console.log('📝 [UserPosts] FETCHING POSTS');
        console.log('═══════════════════════════════════════════');
        console.log('👤 User ID:', userId);
        console.log('📍 Endpoint: /posts/user/' + userId);

        // Add cache-busting timestamp to force fresh data
        const timestamp = Date.now()
        const response = await apiClient.get(`/posts/user/${userId}?_t=${timestamp}`)
        
        console.log('📦 [UserPosts] Raw Response:');
        console.log('  - Status:', response.status);
        console.log('  - Data type:', typeof response.data);
        console.log('  - Data:', response.data);

        let fetchedPosts = []

        // Handle different response formats
        if (Array.isArray(response.data)) {
          fetchedPosts = response.data
          console.log('✅ Response was an array with', fetchedPosts.length, 'posts');
        } else if (response.data?.posts && Array.isArray(response.data.posts)) {
          fetchedPosts = response.data.posts
          console.log('✅ Response had .posts array with', fetchedPosts.length, 'posts');
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          fetchedPosts = response.data.data
          console.log('✅ Response had .data array with', fetchedPosts.length, 'posts');
        } else {
          console.warn('⚠️ Unexpected response format:', response.data);
        }

        console.log('📊 [UserPosts] Fetched Posts Count:', fetchedPosts.length);

        // Map backend field names to frontend expectations
        const mappedPosts = fetchedPosts.map((post) => {
          // Ensure author has avatarUrl for PostCard
          const authorWithAvatarUrl = {
            ...post.author,
            avatarUrl: post.author?.media?.avatar || null,
          }

          return {
            ...post,
            content: post.body || post.content, // Backend uses 'body'
            author: authorWithAvatarUrl,
            id: post._id || post.id,
          }
        })

        console.log('✅ [UserPosts] Mapped', mappedPosts.length, 'posts for display');
        console.log('📊 [UserPosts] Sample mapped post:', mappedPosts[0]);
        console.log('🔄 [UserPosts] Setting posts state...');
        console.log('═══════════════════════════════════════════');
        
        setPosts(mappedPosts)
        
        console.log('✅ [UserPosts] State updated with', mappedPosts.length, 'posts');
      } catch (err) {
        console.error('❌ [UserPosts] Failed to fetch user posts:', err);
        console.log('📊 [UserPosts] Error Details:');
        console.log('  - Status:', err.response?.status);
        console.log('  - Message:', err.response?.data?.message || err.message);
        console.log('═══════════════════════════════════════════');
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load posts'
        setError(errorMessage)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserPosts()
  }, [userId])

  // Handle like toggle
  const handleToggleLike = (postId) => {
    console.log('❤️ [UserPosts] Toggling like for post:', postId)
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post._id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
          }
        }
        return post
      })
    )
  }

  // Handle share
  const handleShare = (post) => {
    console.log('📤 [UserPosts] Sharing post:', post._id)
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.author?.name?.first}`,
        text: post.content,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  // Handle comment
  const handleAddComment = (postId, content) => {
    console.log('💬 [UserPosts] Adding comment to post:', postId)
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === postId ? { ...post, commentCount: (post.commentCount || 0) + 1 } : post
      )
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Loading posts...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-destructive">Failed to load posts</p>
          <p className="text-sm text-destructive/80 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (posts.length === 0) {
    console.log('⚠️ [UserPosts] RENDERING EMPTY STATE - posts.length:', posts.length);
    if (hideEmpty) return null

    return (
      <div className="rounded-lg border-2 border-dashed bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground font-medium">No posts yet</p>
        <p className="text-sm text-muted-foreground mt-1">{userName} hasn't posted anything yet</p>
      </div>
    )
  }

  // Posts list
  console.log('✅ [UserPosts] RENDERING POSTS - Count:', posts.length);
  return (
    <div className="space-y-0">
      {posts.map((post, index) => {
        console.log(`  📝 Rendering post ${index + 1}/${posts.length}:`, post._id, post.content?.substring(0, 30));
        return (
          <PostCard
            key={post._id}
            post={post}
            onToggleLike={handleToggleLike}
            onShare={handleShare}
            onAddComment={handleAddComment}
          />
        );
      })}
    </div>
  )
}
