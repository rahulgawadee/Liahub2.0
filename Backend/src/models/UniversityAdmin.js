const mongoose = require('mongoose');
const UserBaseSchema = require('./base/UserBase');

const UniversityAdminSchema = new mongoose.Schema({
  staffProfile: {
    designation: String,
    // add more university admin-specific fields here
  },
  // add more admin-only fields if needed
});

module.exports = mongoose.model('UniversityAdmin', UniversityAdminSchema.add(UserBaseSchema));
