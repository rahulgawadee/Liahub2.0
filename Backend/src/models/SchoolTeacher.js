const mongoose = require('mongoose');
const UserBaseSchema = require('./base/UserBase');

const SchoolTeacherSchema = new mongoose.Schema({
  staffProfile: {
    designation: String,
    // add more teacher-specific fields here
  },
  // add more teacher-only fields if needed
});

module.exports = mongoose.model('SchoolTeacher', SchoolTeacherSchema.add(UserBaseSchema));
