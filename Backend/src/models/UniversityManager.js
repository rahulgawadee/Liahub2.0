const mongoose = require('mongoose');
const UserBaseSchema = require('./base/UserBase');

const UniversityManagerSchema = new mongoose.Schema({
  staffProfile: {
    designation: String,
    // add more university manager-specific fields here
  },
  // add more manager-only fields if needed
});

module.exports = mongoose.model('UniversityManager', UniversityManagerSchema.add(UserBaseSchema));
