const mongoose = require("mongoose");

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    attachments: [
      {
        filename: String,
        url: String,
        type: String, // 'image', 'pdf', 'document'
      },
    ],
  },
  { timestamps: true }
);

const reactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like"], default: "like" },
  },
  { timestamps: true }
);

const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, trim: true },
    media: [
      {
        url: String,
        filename: String,
        mimeType: String,
        type: { type: String, enum: ["image", "pdf", "video", "document"], default: "image" },
        size: Number, // File size in bytes
      },
    ],
    visibility: { type: String, enum: ["connections", "followers", "public"], default: "public" },
    comments: [commentSchema],
    reactions: [reactionSchema],
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ visibility: 1 });

// Update like count when reactions change
postSchema.pre("save", function (next) {
  if (this.isModified("reactions")) {
    this.likeCount = this.reactions.length;
  }
  if (this.isModified("comments")) {
    this.commentCount = this.comments.length;
  }
  next();
});

postSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Post", postSchema);
