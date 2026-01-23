const mongoose = require("mongoose");

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    refreshToken: { type: String, required: true },
    userAgent: { type: String },
    ip: { type: String },
    workspace: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, refreshToken: 1 }, { unique: true });

sessionSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.refreshToken;
    return ret;
  },
});

module.exports = mongoose.model("Session", sessionSchema);
