const mongoose = require("mongoose");

const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    filename: String,
    url: String,
    mimeType: String,
    size: Number,
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    thread: { type: Schema.Types.ObjectId, ref: "MessageThread", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, trim: true },
    attachments: [attachmentSchema],
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

messageSchema.index({ thread: 1, createdAt: 1 });

messageSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Message", messageSchema);
