const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/liahub')
  .then(async () => {
    console.log('Connected to database');
    const User = require('./src/models/User');
    
    // Find users with media
    const users = await User.find({ 
      $or: [
        { 'media.avatar': { $exists: true, $ne: null } },
        { 'media.cover': { $exists: true, $ne: null } }
      ]
    }).limit(3).select('username email media');
    
    console.log('\n=== Users with media ===');
    users.forEach(user => {
      console.log(`\nUser: ${user.username}`);
      console.log('Media:', JSON.stringify(user.media, null, 2));
    });
    
    // Find all users and check media field
    const allUsers = await User.find({}).limit(5).select('username media');
    console.log('\n=== First 5 users media field ===');
    allUsers.forEach(user => {
      console.log(`${user.username}: ${JSON.stringify(user.media || {})}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
