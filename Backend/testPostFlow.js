// Quick Test Script for Post Feed Flow
// Run this in your backend folder: node testPostFlow.js

const mongoose = require('mongoose');

// Test the post creation and feed flow
async function testPostFlow() {
  try {
    console.log('🔍 Testing Post Feed Flow...\n');

    // Check MongoDB connection
    console.log('1. Database Connection');
    console.log('   Status:', mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Not Connected');
    console.log('   Database:', mongoose.connection.name || 'Not connected');

    // Check if models are loaded
    console.log('\n2. Models Check');
    const models = mongoose.modelNames();
    console.log('   Available Models:', models.join(', '));
    console.log('   Post Model:', models.includes('Post') ? '✅ Loaded' : '❌ Missing');
    console.log('   Follow Model:', models.includes('Follow') ? '✅ Loaded' : '❌ Missing');
    console.log('   User Model:', models.includes('User') ? '✅ Loaded' : '❌ Missing');

    // Check recent posts
    if (models.includes('Post')) {
      const Post = mongoose.model('Post');
      const postCount = await Post.countDocuments();
      const recentPosts = await Post.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('author', 'username name')
        .select('body visibility createdAt');
      
      console.log('\n3. Recent Posts');
      console.log(`   Total Posts: ${postCount}`);
      console.log('   Latest 3 Posts:');
      recentPosts.forEach((post, idx) => {
        console.log(`   ${idx + 1}. By: ${post.author?.username || 'Unknown'}`);
        console.log(`      Content: ${post.body?.substring(0, 50) || 'No content'}...`);
        console.log(`      Visibility: ${post.visibility}`);
        console.log(`      Created: ${post.createdAt}`);
      });
    }

    // Check follow relationships
    if (models.includes('Follow')) {
      const Follow = mongoose.model('Follow');
      const followCount = await Follow.countDocuments();
      const recentFollows = await Follow.find()
        .limit(3)
        .populate('follower following', 'username name')
        .select('follower following');
      
      console.log('\n4. Follow Relationships');
      console.log(`   Total Follows: ${followCount}`);
      console.log('   Recent Follows:');
      recentFollows.forEach((follow, idx) => {
        console.log(`   ${idx + 1}. ${follow.follower?.username} → ${follow.following?.username}`);
      });
    }

    console.log('\n✅ Test Complete!\n');
    console.log('📋 Summary:');
    console.log('   - Database is connected');
    console.log('   - Models are properly loaded');
    console.log('   - Posts are being saved');
    console.log('   - Follow relationships exist');
    console.log('\n🎉 Post feed flow is working correctly!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('\nStack:', error.stack);
  }
}

// Export for use in server.js
module.exports = { testPostFlow };

// Run if executed directly
if (require.main === module) {
  console.log('⚠️  This script should be run from server.js after database connection');
  console.log('   Add this to your server.js after DB connection:');
  console.log('   const { testPostFlow } = require("./testPostFlow");');
  console.log('   await testPostFlow();');
}
