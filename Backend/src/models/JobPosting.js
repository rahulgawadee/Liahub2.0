const mongoose = require("mongoose");

const { Schema } = mongoose;

const requirementSchema = new Schema(
  {
    label: String,
    value: String,
  },
  { _id: false }
);

const jobPostingSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["draft", "open", "paused", "closed", "hiring_stopped"],
      default: "open",
    },
    type: { type: String, enum: ["job", "internship", "lia"], default: "job" },
    deadline: Date,
    location: { type: String, trim: true },
    employmentType: { type: String, trim: true }, // Full-time, Part-time, Contract
    locationType: { type: String, trim: true }, // Remote, On-site, Hybrid
    salary: { type: String, trim: true },
    openings: { type: Number, default: 1 },
    requirements: [requirementSchema],
    responsibilities: [String],
    benefits: [String],
    learningGoals: [String], // For LIA
    support: [String], // For LIA
    tags: [{ type: String, trim: true }],
    seniority: { type: String, trim: true }, // Junior, Mid, Senior
    duration: { type: String, trim: true }, // For LIA/Internship
    mentor: { type: String, trim: true }, // For LIA
    supervisor: { type: String, trim: true }, // For LIA
    hiringStatus: { type: String, trim: true }, // e.g., "Actively hiring"
    postedOn: { type: Date, default: Date.now },
    wishlisted: [{ type: Schema.Types.ObjectId, ref: "User" }], // Users who saved this job
  },
  { timestamps: true }
);

jobPostingSchema.index({ organization: 1, status: 1 });
jobPostingSchema.index({ title: 'text', description: 'text', tags: 'text' });

jobPostingSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("JobPosting", jobPostingSchema);
