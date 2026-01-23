const { body, param, query } = require("express-validator");
const Post = require("../models/Post");
const Follow = require("../models/Follow");
const Connection = require("../models/Connection");
const Notification = require("../models/Notification");
const User = require("../models/User");

const populateFields = "username name media roles social companyProfile schoolProfile";

const listFeed = async (req, res, next) => {
  try {
    console.log('\n📥 [listFeed] REQUEST from user:', req.user.id);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find users that the current user is following
    const following = await Follow.find({ follower: req.user.id }).select("following");
    const followingIds = following.map((f) => f.following);
    
    // Find users that the current user is connected with (accepted connections)
    const connections = await Connection.find({
      status: 'accepted',
      $or: [
        { requester: req.user.id },
        { recipient: req.user.id }
      ]
    });
    
    const connectionIds = connections.map(c => 
      c.requester.toString() === req.user.id.toString() ? c.recipient : c.requester
    );
    
    console.log('👥 Following:', followingIds.length, 'users');
    console.log('🔗 Connected:', connectionIds.length, 'users');

    // Query for feed posts - ONLY from connected/following users + own posts:
    // 1. User's own posts (all visibility levels)
    // 2. Posts from connections with visibility: connections or public
    // 3. Posts from following with visibility: followers or public
    // NOTE: Does NOT include random public posts from non-connected users
    const query = {
      $or: [
        { author: req.user.id }, // User's own posts (all visibility)
        { author: { $in: connectionIds }, visibility: { $in: ["connections", "public"] } }, // Connection posts
        { author: { $in: followingIds }, visibility: { $in: ["followers", "public"] } }, // Following posts
      ]
    };

    console.log('📊 Feed Query: Only showing posts from connected/following users + own posts');

    const posts = await Post.find(query)
      .populate("author", populateFields)
      .populate("comments.author", populateFields)
      .populate("reactions.user", "username name media")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    console.log('📝 Found posts:', posts.length);

    // Transform posts to match frontend format and check if current user liked
    const transformedPosts = posts.map(post => {
      const isLiked = post.reactions?.some(r => {
        const userId = r.user?._id || r.user;
        return userId.toString() === req.user.id.toString();
      });
      
      return {
        _id: post._id.toString(),
        content: post.body || '',
        media: post.media || [],
        visibility: post.visibility || 'public',
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        // Properly format author data for frontend
        author: {
          _id: post.author._id || post.author,
          username: post.author.username || 'user',
          name: {
            first: post.author.name?.first || '',
            last: post.author.name?.last || ''
          },
          media: post.author.media || {},
          roles: post.author.roles || [],
          social: post.author.social || {},
          companyProfile: post.author.companyProfile || null,
          schoolProfile: post.author.schoolProfile || null
        },
        reactions: post.reactions || [],
        comments: post.comments || [],
        likeCount: post.likeCount || post.reactions?.length || 0,
        commentCount: post.commentCount || post.comments?.length || 0,
        shareCount: post.shareCount || 0,
        isLiked
      };
    });

    console.log('✅ Sending', transformedPosts.length, 'transformed posts');
    res.json(transformedPosts);
  } catch (error) {
    console.error('❌ Feed error:', error);
    next(error);
  }
};

const listPostsByUser = async (req, res, next) => {
  try {
    console.log('\n\n═══════════════════════════════════════════');
    console.log('🚀 [listPostsByUser] REQUEST RECEIVED');
    console.log('═══════════════════════════════════════════');
    console.log('📍 Route: GET /api/v1/posts/user/:userId');
    console.log('🔑 Headers:', req.headers.authorization ? 'Bearer token present' : 'NO AUTH TOKEN');
    console.log('👤 req.user:', req.user ? { id: req.user.id, username: req.user.username } : 'NO USER');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const userId = req.params.userId;
    const viewerId = req.user?.id || req.user?._id;

    console.log('👤 Target User ID (from URL):', userId);
    console.log('👁️  Viewer ID (from token):', viewerId);
    console.log('🔍 Types: viewerId type:', typeof viewerId, 'userId type:', typeof userId);

    if (!viewerId) {
      console.error('❌ ERROR: No viewer ID found in request!');
      return res.status(401).json({ message: 'Authentication required' });
    }

    let query = { author: userId };

    // Properly compare IDs as strings - ensure both are strings before comparison
    const userIdStr = userId.toString();
    const viewerIdStr = viewerId.toString();
    const isAuthor = userIdStr === viewerIdStr;
    
    console.log('📊 ID Comparison:');
    console.log('  - viewerId (string):', viewerIdStr);
    console.log('  - userId (string):', userIdStr);
    console.log('  - Match:', isAuthor);
    console.log('  - Strict equality:', userIdStr === viewerIdStr);

    // If viewer is not the author, filter by visibility
    if (!isAuthor) {
      console.log('⚠️  Viewer is NOT the author - applying visibility filters');
      
      // Check if they are connected (Connection model - accepted status)
      const isConnected = await Connection.exists({ 
        status: 'accepted',
        $or: [
          { requester: viewerId, recipient: userId },
          { requester: userId, recipient: viewerId }
        ]
      });
      
      // Check if viewer is following the user
      const isFollowing = await Follow.exists({ follower: viewerId, following: userId });
      
      console.log('🔗 Connection check:', isConnected ? 'CONNECTED' : 'NOT CONNECTED');
      console.log('👥 Following check:', isFollowing ? 'FOLLOWING' : 'NOT FOLLOWING');
      
      // Build visibility filter based on relationship
      const allowedVisibilities = ['public'];
      
      if (isConnected) {
        allowedVisibilities.push('connections');
        console.log('✅ Viewer is CONNECTED - can see: public + connections');
      }
      
      if (isFollowing) {
        allowedVisibilities.push('followers');
        console.log('✅ Viewer is FOLLOWING - can see: public + followers');
      }
      
      if (isConnected && isFollowing) {
        console.log('✅ Viewer is BOTH CONNECTED and FOLLOWING - can see: public + connections + followers');
      }
      
      if (!isConnected && !isFollowing) {
        console.log('⚠️  Viewer has NO relationship - can only see: public posts');
      }
      
      query.visibility = { $in: allowedVisibilities };
    } else {
      console.log('✅ Viewer IS the author - showing ALL posts (no visibility filter)');
    }

    console.log('🔎 Query:', JSON.stringify(query, null, 2));

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate("author", populateFields)
        .populate("comments.author", populateFields)
        .populate("reactions.user", "username name media")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(query),
    ]);

    console.log('✅ Query Results:');
    console.log('  - Posts found: ', posts.length);
    console.log('  - Total matching: ', total);
    console.log('  - Page: ', page);
    console.log('  - Per page: ', limit);

    if (posts.length === 0) {
      console.log('⚠️  WARNING: No posts found with current filters!');
      console.log('   - Checking all posts in database...');
      const allPosts = await Post.countDocuments({});
      const userPosts = await Post.countDocuments({ author: userId });
      console.log('   - Total posts in DB: ', allPosts);
      console.log('   - Posts by this user: ', userPosts);
      
      if (userPosts > 0) {
        const sample = await Post.findOne({ author: userId }).lean();
        console.log('   - Sample post:', {
          _id: sample._id,
          author: sample.author,
          body: sample.body?.substring(0, 50),
          visibility: sample.visibility
        });
        
        // Check all visibility settings for this user's posts
        const visibilityCounts = await Post.aggregate([
          { $match: { author: userId } },
          { $group: { _id: '$visibility', count: { $sum: 1 } } }
        ]);
        console.log('   - Posts by visibility:', visibilityCounts);
        
        console.log('\n💡 SOLUTION:');
        if (!isAuthor) {
          console.log('   You are viewing someone else\'s profile.');
          console.log('   Their posts have visibility: "connections"');
          console.log('   To see them, you need to:');
          console.log('   1. Create a connection request with this user, OR');
          console.log('   2. Ask them to set post visibility to "public"');
        } else {
          console.log('   ❌ BUG: You should see your own posts!');
          console.log('   This means the isAuthor check failed.');
          console.log('   Debug: isAuthor=' + isAuthor + ', viewerId=' + viewerIdStr + ', userId=' + userIdStr);
        }
      }
    }

    // Transform posts and add isLiked flag
    const transformedPosts = posts.map(post => {
      const isLiked = post.reactions?.some(r => r.user._id.toString() === viewerId);
      
      return {
        _id: post._id,
        content: post.body,
        body: post.body, // Include both for compatibility
        media: post.media,
        visibility: post.visibility,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        // Properly format author data for frontend
        author: {
          _id: post.author._id || post.author,
          username: post.author.username || 'user',
          name: {
            first: post.author.name?.first || '',
            last: post.author.name?.last || ''
          },
          media: post.author.media || {},
          roles: post.author.roles || [],
          social: post.author.social || {},
          companyProfile: post.author.companyProfile || null,
          schoolProfile: post.author.schoolProfile || null
        },
        reactions: post.reactions || [],
        comments: post.comments || [],
        likeCount: post.likeCount || post.reactions?.length || 0,
        commentCount: post.commentCount || post.comments?.length || 0,
        shareCount: post.shareCount || 0,
        isLiked
      };
    });

    const responseData = {
      posts: transformedPosts,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    };

    console.log('✅ [listPostsByUser] Sending response:');
    console.log('  - Posts count:', transformedPosts.length);
    console.log('  - Total:', total);
    console.log('  - Response structure:', Object.keys(responseData));
    if (transformedPosts.length > 0) {
      console.log('  - Sample post structure:', Object.keys(transformedPosts[0]));
      console.log('  - Sample post content:', transformedPosts[0].content?.substring(0, 50));
      console.log('  - Sample post author:', transformedPosts[0].author?.name);
    }
    console.log('═══════════════════════════════════════════');
    
    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

const validateCreatePost = () => [
  body("content").optional().isString(),
  body("visibility").optional().isIn(["connections", "followers", "public"]),
  body("media").optional().isArray()
];

const createPost = async (req, res, next) => {
  try {
    console.log('📝 Creating post:', { 
      author: req.user.id, 
      content: req.body.content?.substring(0, 50),
      mediaCount: req.body.media?.length || 0,
      visibility: req.body.visibility || "public"
    });
    
    const post = await Post.create({
      author: req.user.id,
      body: req.body.content,
      media: req.body.media || [],
      visibility: req.body.visibility || "public",
    });
    
    console.log('✅ Post created with ID:', post._id, 'by author:', post.author);
    
    const populated = await post.populate("author", "username name media roles social companyProfile schoolProfile");
    
    console.log('✅ Post populated. Author name:', populated.author.name);
    
    // Create notifications for all followers
    const followers = await Follow.find({ following: req.user.id }).select("follower");
    
    console.log('👥 Notifying', followers.length, 'followers');
    
    if (followers.length > 0) {
      const notifications = followers.map(f => ({
        recipient: f.follower,
        actor: req.user.id,
        type: "post_created",
        entity: {
          kind: "Post",
          id: post._id
        },
        payload: {
          postContent: post.body?.substring(0, 100),
          authorName: `${populated.author.name?.first || ''} ${populated.author.name?.last || ''}`.trim()
        }
      }));
      
      await Notification.insertMany(notifications);
      console.log('✅ Notifications created');
    }
    
    // Transform to match frontend format
    const transformedPost = {
      _id: populated._id,
      content: populated.body,
      media: populated.media,
      visibility: populated.visibility,
      createdAt: populated.createdAt,
      updatedAt: populated.updatedAt,
      author: {
        _id: populated.author._id || populated.author,
        username: populated.author.username || 'user',
        name: {
          first: populated.author.name?.first || '',
          last: populated.author.name?.last || ''
        },
        media: populated.author.media || {},
        roles: populated.author.roles || [],
        social: populated.author.social || {},
        companyProfile: populated.author.companyProfile || null,
        schoolProfile: populated.author.schoolProfile || null
      },
      reactions: populated.reactions || [],
      comments: populated.comments || [],
      likeCount: populated.likeCount || 0,
      commentCount: populated.commentCount || 0,
      shareCount: populated.shareCount || 0,
      isLiked: false
    };
    
    res.status(201).json(transformedPost);
  } catch (error) {
    next(error);
  }
};

const validateUpdatePost = () => [param("postId").isMongoId()];

const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate({ _id: req.params.postId, author: req.user.id }, req.body, {
      new: true,
    }).populate("author", "username name media roles");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.json(post);
  } catch (error) {
    return next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.postId, author: req.user.id });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const validateAddComment = () => [
  param("postId").isMongoId(),
  body("body").isString().trim().notEmpty(),
];

const addComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({
      author: req.user.id,
      body: req.body.body,
      attachments: req.body.attachments || [],
    });

    await post.save();
    await post.populate("comments.author", populateFields);

    const newComment = post.comments[post.comments.length - 1];
    return res.status(201).json(newComment);
  } catch (error) {
    return next(error);
  }
};

const validateDeleteComment = () => [
  param("postId").isMongoId(),
  param("commentId").isMongoId(),
];

const deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Allow post author or comment author to delete
    if (comment.author.toString() !== req.user.id && post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.deleteOne();
    await post.save();

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const validateReaction = () => [
  param("postId").isMongoId(),
  body("type").optional().isIn(["like", "celebrate", "support", "love"]),
];

const addReaction = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId).populate("author", "username name");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user already reacted
    const existingReactionIndex = post.reactions.findIndex((r) => r.user.toString() === req.user.id);
    
    let isLiked = false;
    
    if (existingReactionIndex > -1) {
      // Remove existing reaction (toggle off)
      post.reactions.splice(existingReactionIndex, 1);
      isLiked = false;
    } else {
      // Add new reaction
      post.reactions.push({
        user: req.user.id,
        type: "like",
      });
      isLiked = true;
      
      // Create notification for post author (but not if they liked their own post)
      if (post.author._id.toString() !== req.user.id) {
        const liker = await User.findById(req.user.id).select("name username");
        
        await Notification.create({
          recipient: post.author._id,
          actor: req.user.id,
          type: "post_liked",
          entity: {
            kind: "Post",
            id: post._id
          },
          payload: {
            likerName: `${liker.name?.first || ''} ${liker.name?.last || ''}`.trim() || liker.username,
            postContent: post.body?.substring(0, 100)
          }
        });
      }
    }

    await post.save();
    
    return res.json({ 
      success: true, 
      reactions: post.reactions,
      likeCount: post.likeCount,
      isLiked
    });
  } catch (error) {
    return next(error);
  }
};

const removeReaction = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.reactions = post.reactions.filter((r) => r.user.toString() !== req.user.id);
    await post.save();

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedFiles = req.files.map(file => {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const fileType = file.mimetype.startsWith('image/') ? 'image' 
                     : file.mimetype === 'application/pdf' ? 'pdf'
                     : file.mimetype.startsWith('video/') ? 'video'
                     : 'document';

      return {
        url: `${baseUrl}/uploads/posts/${file.filename}`,
        filename: file.originalname,
        mimeType: file.mimetype,
        type: fileType,
        size: file.size
      };
    });

    res.json({ files: uploadedFiles });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listFeed,
  listPostsByUser,
  validateCreatePost,
  createPost,
  uploadFiles,
  validateUpdatePost,
  updatePost,
  deletePost,
  validateAddComment,
  addComment,
  validateDeleteComment,
  deleteComment,
  validateReaction,
  addReaction,
  removeReaction,
};
