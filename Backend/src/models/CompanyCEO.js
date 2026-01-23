const mongoose = require('mongoose');
const UserBaseSchema = require('./base/UserBase');

const CompanyCEOSchema = new mongoose.Schema({
  companyProfile: {
    companyName: String,
    industries: [String],
    headquarters: String,
    // add more CEO-specific fields here
  },
  // add more CEO-only fields if needed
});

module.exports = mongoose.model('CompanyCEO', CompanyCEOSchema.add(UserBaseSchema));
