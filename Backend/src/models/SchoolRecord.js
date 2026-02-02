const mongoose = require("mongoose");

const { Schema } = mongoose;

const schoolRecordSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    type: {
      type: String,
      enum: [
        "student",
        "all_student",
        "my_student",
        "teacher",
        "lead_company",
        "company",
        "education_manager",
        "admin",
        "liahub_company",
      ],
      required: true,
    },
    data: {
      type: Map,
      of: String,
      default: {},
    },
    notes: { type: String },
    status: { type: String, default: "active" },
    quality: { type: String, enum: ['good', 'future', 'bad', ''], default: '' },
    studentUser: { type: Schema.Types.ObjectId, ref: "User" },
    passwordGenerated: { type: Boolean, default: false },
    assignedCompanyId: { type: Schema.Types.ObjectId, ref: "SchoolRecord" },
    assignedCompanyName: { type: String },
  },
  { timestamps: true }
);

schoolRecordSchema.index({ organization: 1, type: 1, createdAt: -1 });

schoolRecordSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("SchoolRecord", schoolRecordSchema);
