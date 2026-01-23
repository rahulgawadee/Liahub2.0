const mongoose = require('mongoose');
const UserBaseSchema = require('./base/UserBase');

const CompanyHiringManagerSchema = new mongoose.Schema({
  companyProfile: {
    companyName: String,
    industries: [String],
    headquarters: String,
    // add more hiring manager-specific fields here
  },
  // add more hiring manager-only fields if needed
});

module.exports = mongoose.model('CompanyHiringManager', CompanyHiringManagerSchema.add(UserBaseSchema));
