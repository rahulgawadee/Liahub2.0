const mongoose = require('mongoose');
const UserBaseSchema = require('./base/UserBase');

const EducationManagerSchema = new mongoose.Schema({
  staffProfile: {
    designation: String,
    // add more manager-specific fields here
  },
  // add more manager-only fields if needed
});

module.exports = mongoose.model('EducationManager', EducationManagerSchema.add(UserBaseSchema));
