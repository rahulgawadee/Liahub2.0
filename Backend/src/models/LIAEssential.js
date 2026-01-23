const mongoose = require("mongoose");

const { Schema } = mongoose;

// Schema for individual requirement items
const requirementItemSchema = new Schema({
  text: { type: String, required: true }
}, { _id: false });

// Schema for requirement sections
const requirementSectionSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  icon: { type: String, required: true }, // Icon name from lucide-react
  color: { type: String, required: true }, // Color variant (blue, green, amber, purple)
  summary: { type: String, required: true },
  items: [requirementItemSchema]
}, { _id: false });

// Schema for PDF resources
const pdfResourceSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  url: { type: String, required: true },
  fileName: { type: String }
}, { _id: false });

const liaEssentialSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true, unique: true },
    title: { type: String, default: "Internship Collaboration Requirements" },
    description: { type: String, default: "A shared framework to guarantee meaningful placements. Review the expectations to keep interns supported, ensure compliance and deliver the workplace experience LiaHub stands behind." },
    lastUpdated: { type: String, default: "October 2025" },
    requirementSections: [requirementSectionSchema],
    pdfResources: [pdfResourceSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    visibility: { type: String, enum: ["school", "company", "public"], default: "company" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

liaEssentialSchema.index({ organization: 1, active: 1 });

liaEssentialSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("LiaEssential", liaEssentialSchema);
