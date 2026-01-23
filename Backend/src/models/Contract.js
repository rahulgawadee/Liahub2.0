const mongoose = require("mongoose");

const { Schema } = mongoose;

const contractSchema = new Schema(
  {
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Education manager/admin who created it
    contractType: { 
      type: String, 
      enum: ["text", "pdf"], 
      default: "text" 
    },
    contractContent: { type: String }, // For text contracts
    contractFileUrl: { type: String }, // For PDF contracts
    
    // Education Manager/Admin Signature
    schoolSignature: { type: String, required: true }, // Base64 signature image
    schoolSignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolSignedAt: { type: Date, required: true },
    
    // Company Signature
    companySignature: { type: String }, // Base64 signature image
    companySignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    companySignedAt: { type: Date },
    
    status: {
      type: String,
      enum: ["pending", "signed", "expired"],
      default: "pending"
    },
    
    version: { type: Number, default: 1 },
    expiresAt: { type: Date },
    
    metadata: {
      companyName: String,
      contractTitle: String,
      notes: String,
    }
  },
  { timestamps: true }
);

contractSchema.index({ organization: 1, status: 1 });
contractSchema.index({ createdBy: 1 });
contractSchema.index({ companySignedBy: 1 });

contractSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Contract", contractSchema);
