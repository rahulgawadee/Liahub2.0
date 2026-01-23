const mongoose = require("mongoose");

const { Schema } = mongoose;

const invitationSchema = new Schema(
  {
    email: { type: String, trim: true },
    username: { type: String, trim: true },
    organization: { type: Schema.Types.ObjectId, ref: "Organization" },
    role: { type: String, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: Date,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

invitationSchema.index({ token: 1 }, { unique: true });
invitationSchema.index({ email: 1, consumedAt: 1 });

invitationSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.token;
    return ret;
  },
});

module.exports = mongoose.model("Invitation", invitationSchema);
