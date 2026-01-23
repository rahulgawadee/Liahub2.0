const mongoose = require("mongoose");

const { Schema } = mongoose;

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["school", "university", "company"], required: true },
    description: { type: String, trim: true },
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
    contact: {
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    tags: [{ type: String, trim: true }],
    active: { type: Boolean, default: true },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

organizationSchema.index({ name: 1, type: 1 }, { unique: true });

// Virtual field to check if organization is verified (contract signed)
organizationSchema.virtual('verified').get(function() {
  return this.metadata?.contractSigned === true;
});

organizationSchema.set("toJSON", {
  virtuals: true,
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Organization", organizationSchema);
