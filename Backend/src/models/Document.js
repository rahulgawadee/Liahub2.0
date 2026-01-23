const mongoose = require("mongoose");

const { Schema } = mongoose;

const documentSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    storagePath: { type: String, required: true },
    visibility: { type: String, enum: ["private", "connections", "public"], default: "private" },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

documentSchema.index({ owner: 1, createdAt: -1 });

documentSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Document", documentSchema);
