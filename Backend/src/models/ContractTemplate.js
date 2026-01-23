const mongoose = require("mongoose");

const { Schema } = mongoose;

const contractTemplateSchema = new Schema(
  {
    school: { type: Schema.Types.ObjectId, ref: "Organization", required: true }, // Which school this template belongs to
    contractType: { 
      type: String, 
      enum: ["text", "pdf"], 
      default: "text" 
    },
    contractContent: { type: String }, // For text contracts
    contractFileUrl: { type: String }, // For PDF contracts
    
    title: { type: String, default: "Company Partnership Agreement" },
    description: { type: String },
    
    // Pre-signed by education manager
    schoolSignature: { type: String, required: true }, // Base64 signature image
    schoolSignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolSignedAt: { type: Date, default: Date.now },
    
    isActive: { type: Boolean, default: true }, // Only one active template per school
    version: { type: Number, default: 1 },
    
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

contractTemplateSchema.index({ school: 1, isActive: 1 });

contractTemplateSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("ContractTemplate", contractTemplateSchema);
