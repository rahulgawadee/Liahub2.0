const mongoose = require('mongoose');
const UserBaseSchema = require('./base/UserBase');

const StudentSchema = new mongoose.Schema({
  studentProfile: {
    specializations: [String],
    skills: [String],
    year: String,
    // add more student-specific fields here
  },
  // add more student-only fields if needed
});

module.exports = mongoose.model('Student', StudentSchema.add(UserBaseSchema));
