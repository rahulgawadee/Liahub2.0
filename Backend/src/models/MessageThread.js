const mongoose = require("mongoose");

const { Schema } = mongoose;

const threadSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessageAt: Date,
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, trim: true },
  },
  { timestamps: true }
);

threadSchema.index({ participants: 1 });
threadSchema.index({ lastMessageAt: -1 });

threadSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("MessageThread", threadSchema);
