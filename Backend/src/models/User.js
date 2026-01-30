const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const ROLES = require("../constants/roles");

const { Schema } = mongoose;

const nameSchema = new Schema(
  {
    first: { type: String, trim: true },
    last: { type: String, trim: true },
  },
  { _id: false }
);

const contactSchema = new Schema(
  {
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    location: { type: String, trim: true },
  },
  { _id: false }
);

const mediaSchema = new Schema(
  {
    avatar: { type: String, trim: true },
    cover: { type: String, trim: true },
  },
  { _id: false }
);

const socialSchema = new Schema(
  {
    handle: { type: String, trim: true },
    bio: { type: String, trim: true },
    about: { type: String, trim: true },
    highlights: [{ type: String, trim: true }],
  },
  { _id: false }
);

const experienceSchema = new Schema(
  {
    title: String,
    company: String,
    location: String,
    startDate: Date,
    endDate: Date,
    description: String,
  },
  { _id: true, timestamps: true }
);

const educationSchema = new Schema(
  {
    organization: String,
    program: String,
    startYear: Number,
    endYear: Number,
    notes: String,
  },
  { _id: true, timestamps: true }
);

const studentProfileSchema = new Schema(
  {
    resumeUrl: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    specializations: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    applicationLetter: { type: String, trim: true },
    experiences: [experienceSchema],
    education: [educationSchema],
  },
  { _id: false }
);

const staffProfileSchema = new Schema(
  {
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    programme: { type: String, trim: true },
    programmes: [{ type: String, trim: true }],
  },
  { _id: false }
);

const companyProfileSchema = new Schema(
  {
    companyName: { type: String, trim: true },
    aboutCompany: { type: String, trim: true },
    companyDomain: { type: String, trim: true },
    headcount: Number,
    industries: [{ type: String, trim: true }],
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    contactPerson: { type: String, trim: true }, // Employer name from registration
    roles: [{ type: String, trim: true }], // Multiple roles allowed
    companyEmail: { type: String, trim: true },
    companyPhone: { type: String, trim: true },
    companyRegNo: { type: String, trim: true }, // Company Org/Reg No
    foundedYear: Number,
    website: { type: String, trim: true },
  },
  { _id: false }
);

const schoolProfileSchema = new Schema(
  {
    schoolName: { type: String, trim: true },
    aboutSchool: { type: String, trim: true },
    schoolType: { type: String, trim: true }, // e.g., "University", "College", "School"
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    contactPerson: { type: String, trim: true }, // Admin/Representative name from registration
    schoolEmail: { type: String, trim: true },
    schoolPhone: { type: String, trim: true },
    website: { type: String, trim: true },
    studentsCount: Number,
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    username: { type: String, unique: true, required: true, lowercase: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    roles: {
      type: [
        {
          type: String,
          enum: Object.values(ROLES),
        },
      ],
      default: [ROLES.STUDENT],
    },
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "invited"],
      default: "pending",
    },
    organization: { type: Schema.Types.ObjectId, ref: "Organization" },
    name: nameSchema,
    contact: contactSchema,
    media: mediaSchema,
    social: socialSchema,
    studentProfile: studentProfileSchema,
    staffProfile: staffProfileSchema,
    companyProfile: companyProfileSchema,
    schoolProfile: schoolProfileSchema,
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    lastLoginAt: Date,
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
    invitationToken: { type: String, select: false },
    invitationExpiresAt: Date,
    isPasswordTemporary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ roles: 1 });

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password) return false;
  console.log('=== PASSWORD COMPARISON DEBUG ===');
  console.log('Plain password received:', candidate);
  console.log('Plain password length:', candidate?.length);
  console.log('Stored hash:', this.password);
  console.log('Stored hash length:', this.password?.length);
  const result = await bcrypt.compare(candidate, this.password);
  console.log('Comparison result:', result);
  console.log('=================================');
  return result;
};

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.invitationToken;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
