const mongoose = require("mongoose");

const { Schema } = mongoose;

const connectionSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
    message: { type: String, trim: true },
    attachments: [
      {
        filename: String,
        url: String,
      },
    ],
    acceptedAt: Date,
    rejectedAt: Date,
  },
  { timestamps: true }
);

connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

connectionSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Connection", connectionSchema);
