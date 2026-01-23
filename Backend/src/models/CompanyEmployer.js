const mongoose = require('mongoose');
const UserBaseSchema = require('./base/UserBase');

const CompanyEmployerSchema = new mongoose.Schema({
  companyProfile: {
    companyName: String,
    industries: [String],
    headquarters: String,
    // add more employer-specific fields here
  },
  // add more employer-only fields if needed
});

module.exports = mongoose.model('CompanyEmployer', CompanyEmployerSchema.add(UserBaseSchema));
