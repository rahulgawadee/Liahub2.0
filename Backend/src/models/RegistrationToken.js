const mongoose = require("mongoose");

const { Schema } = mongoose;

const registrationTokenSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    entity: { type: String, required: true, enum: ["student", "school", "university", "company"], index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

registrationTokenSchema.index({ email: 1, entity: 1 }, { unique: true });
registrationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

registrationTokenSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.codeHash;
    return ret;
  },
});

module.exports = mongoose.model("RegistrationToken", registrationTokenSchema);
