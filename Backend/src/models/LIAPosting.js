const mongoose = require("mongoose");

const { Schema } = mongoose;

const requirementSchema = new Schema(
  {
    label: String,
    value: String,
  },
  { _id: false }
);

const liaPostingSchema = new Schema(
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
    deadline: Date,
    location: { type: String, trim: true },
    locationType: { type: String, trim: true }, // Remote, On-site, Hybrid
    openings: { type: Number, default: 1 },
    requirements: [requirementSchema],
    responsibilities: [String],
    learningGoals: [String], // What students will learn
    support: [String], // Support provided during LIA
    tags: [{ type: String, trim: true }],
    duration: { type: String, trim: true }, // e.g., "6 months", "3 months"
    mentor: { type: String, trim: true }, // Mentor name
    supervisor: { type: String, trim: true }, // Supervisor name
    hiringStatus: { type: String, trim: true }, // e.g., "Actively hiring"
    postedOn: { type: Date, default: Date.now },
    wishlisted: [{ type: Schema.Types.ObjectId, ref: "User" }], // Users who saved this LIA
  },
  { timestamps: true }
);

liaPostingSchema.index({ organization: 1, status: 1 });
liaPostingSchema.index({ title: 'text', description: 'text', tags: 'text' });

liaPostingSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("LIAPosting", liaPostingSchema);
