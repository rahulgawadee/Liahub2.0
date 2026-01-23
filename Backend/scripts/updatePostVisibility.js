/**
 * Script to update all posts visibility to 'public'
 * Run this to make all posts visible to everyone
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../src/models/Post');

async function updatePostVisibility() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count posts before update
    const totalPosts = await Post.countDocuments({});
    const connectionsOnly = await Post.countDocuments({ visibility: 'connections' });
    const followersOnly = await Post.countDocuments({ visibility: 'followers' });
    
    console.log('\n📊 Current Statistics:');
    console.log(`  - Total posts: ${totalPosts}`);
    console.log(`  - Connections only: ${connectionsOnly}`);
    console.log(`  - Followers only: ${followersOnly}`);
    console.log(`  - Public: ${totalPosts - connectionsOnly - followersOnly}`);

    // Update all non-public posts to public
    const result = await Post.updateMany(
      { visibility: { $ne: 'public' } },
      { $set: { visibility: 'public' } }
    );

    console.log('\n✅ Update Complete:');
    console.log(`  - Modified ${result.modifiedCount} posts`);
    console.log('  - All posts are now public');

    // Verify
    const publicPosts = await Post.countDocuments({ visibility: 'public' });
    console.log(`\n✅ Verification: ${publicPosts}/${totalPosts} posts are now public`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updatePostVisibility();
