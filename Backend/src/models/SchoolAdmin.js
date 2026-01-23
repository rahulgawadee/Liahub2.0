const mongoose = require('mongoose');
const UserBaseSchema = require('./base/UserBase');

const SchoolAdminSchema = new mongoose.Schema({
  staffProfile: {
    designation: String,
    // add more admin-specific fields here
  },
  // add more admin-only fields if needed
});

module.exports = mongoose.model('SchoolAdmin', SchoolAdminSchema.add(UserBaseSchema));
