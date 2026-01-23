const mongoose = require('mongoose');

const UserBaseSchema = new mongoose.Schema({
  name: {
    first: { type: String, required: true },
    last: { type: String, required: true },
  },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contact: {
    phone: String,
    location: String,
    email: String,
    website: String,
  },
  media: {
    avatar: String,
    cover: String,
  },
  social: {
    handle: String,
    bio: String,
    about: String,
  },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { discriminatorKey: 'userType', timestamps: true });

module.exports = UserBaseSchema;
