const mongoose = require('mongoose');
const UserBaseSchema = require('./base/UserBase');

const CompanyFounderSchema = new mongoose.Schema({
  companyProfile: {
    companyName: String,
    industries: [String],
    headquarters: String,
    // add more founder-specific fields here
  },
  // add more founder-only fields if needed
});

module.exports = mongoose.model('CompanyFounder', CompanyFounderSchema.add(UserBaseSchema));
