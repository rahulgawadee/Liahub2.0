const mongoose = require("mongoose");

const { Schema } = mongoose;

const timelineSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["applied", "under_review", "interview", "selected", "offer_sent", "offer_accepted", "hired", "rejected", "withdrawn"],
      required: true,
    },
    comment: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const jobApplicationSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: "JobPosting", required: true },
    applicant: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    resumeUrl: String,
    coverLetter: String,
    status: {
      type: String,
      enum: ["applied", "under_review", "interview", "selected", "offer_sent", "offer_accepted", "hired", "rejected", "withdrawn"],
      default: "applied",
    },
    stage: { type: String, trim: true }, // Human-readable stage description
    profileScore: { type: Number, min: 0, max: 100 }, // Auto-calculated match score
    notes: String, // Internal notes for hiring team
    offerLetter: {
      sentOn: Date,
      startDate: Date,
      compensation: String,
      note: String,
      emailSent: { type: Boolean, default: false },
      acceptedOn: Date,
      pdfUrl: String, // ⭐ NEW: URL to uploaded offer letter PDF
    },
    timeline: [timelineSchema],
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
jobApplicationSchema.index({ applicant: 1, status: 1 });

jobApplicationSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
