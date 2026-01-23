const Post = require("../models/Post");
const User = require("../models/User");
const Follow = require("../models/Follow");

const populateAuthor = "username name media roles social";

const createPost = async ({ authorId, body, media = [], visibility = "followers" }) => {
  const post = await Post.create({
    author: authorId,
    body,
    media,
    visibility,
  });

  await post.populate("author", populateAuthor);
  return post;
};

const updatePost = async ({ postId, authorId, body, media, visibility }) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw Object.assign(new Error("Post not found"), { status: 404 });
  }

  if (post.author.toString() !== authorId.toString()) {
    throw Object.assign(new Error("Not authorized to update this post"), { status: 403 });
  }

  if (body !== undefined) post.body = body;
  if (media !== undefined) post.media = media;
  if (visibility !== undefined) post.visibility = visibility;

  await post.save();
  await post.populate("author", populateAuthor);

  return post;
};

const deletePost = async ({ postId, authorId }) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw Object.assign(new Error("Post not found"), { status: 404 });
  }

  if (post.author.toString() !== authorId.toString()) {
    throw Object.assign(new Error("Not authorized to delete this post"), { status: 403 });
  }

  await post.deleteOne();
  return { success: true };
};

const getUserPosts = async ({ userId, page = 1, limit = 20, viewerId }) => {
  const skip = (page - 1) * limit;

  let query = { author: userId };

  // If viewer is not the author, filter by visibility
  if (viewerId !== userId.toString()) {
    const isFollowing = await Follow.exists({ follower: viewerId, following: userId });
    
    if (isFollowing) {
      query.visibility = { $in: ["followers", "public"] };
    } else {
      query.visibility = "public";
    }
  }

  const [posts, total] = await Promise.all([
    Post.find(query)
      .populate("author", populateAuthor)
      .populate("comments.author", populateAuthor)
      .populate("reactions.user", "username name media")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments(query),
  ]);

  return {
    posts,
    total,
    page,
    pages: Math.ceil(total / limit),
    hasMore: page < Math.ceil(total / limit),
  };
};

const getFeedPosts = async ({ userId, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  // Get users that the current user follows
  const following = await Follow.find({ follower: userId }).select("following");
  const followingIds = following.map((f) => f.following);

  // Include own posts
  followingIds.push(userId);

  const query = {
    author: { $in: followingIds },
    visibility: { $in: ["followers", "public"] },
  };

  const [posts, total] = await Promise.all([
    Post.find(query)
      .populate("author", populateAuthor)
      .populate("comments.author", populateAuthor)
      .populate("reactions.user", "username name media")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments(query),
  ]);

  return {
    posts,
    total,
    page,
    pages: Math.ceil(total / limit),
    hasMore: page < Math.ceil(total / limit),
  };
};

const addComment = async ({ postId, authorId, body, attachments = [] }) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw Object.assign(new Error("Post not found"), { status: 404 });
  }

  post.comments.push({ author: authorId, body, attachments });
  await post.save();
  await post.populate("comments.author", populateAuthor);

  return post.comments[post.comments.length - 1];
};

const deleteComment = async ({ postId, commentId, userId }) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw Object.assign(new Error("Post not found"), { status: 404 });
  }

  const comment = post.comments.id(commentId);

  if (!comment) {
    throw Object.assign(new Error("Comment not found"), { status: 404 });
  }

  if (comment.author.toString() !== userId.toString() && post.author.toString() !== userId.toString()) {
    throw Object.assign(new Error("Not authorized"), { status: 403 });
  }

  comment.deleteOne();
  await post.save();

  return { success: true };
};

const addReaction = async ({ postId, userId, type = "like" }) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw Object.assign(new Error("Post not found"), { status: 404 });
  }

  // Remove existing reaction from this user
  post.reactions = post.reactions.filter((r) => r.user.toString() !== userId.toString());

  // Add new reaction
  post.reactions.push({ user: userId, type });
  await post.save();

  return { success: true, type };
};

const removeReaction = async ({ postId, userId }) => {
  const post = await Post.findById(postId);

  if (!post) {
    throw Object.assign(new Error("Post not found"), { status: 404 });
  }

  post.reactions = post.reactions.filter((r) => r.user.toString() !== userId.toString());
  await post.save();

  return { success: true };
};

module.exports = {
  createPost,
  updatePost,
  deletePost,
  getUserPosts,
  getFeedPosts,
  addComment,
  deleteComment,
  addReaction,
  removeReaction,
};
