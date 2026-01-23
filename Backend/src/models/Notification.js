const mongoose = require("mongoose");

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "connection_request",
        "connection_accept",
        "message",
        "job_posted",
        "lia_posted",
        "job_application",
        "job_status_update",
        "job_offer",
        "job_hiring_stopped",
        "offer_accepted",
        "lia_application",
        "lia_status_update",
        "lia_offer",
        "lia_offer_accepted",
        "lia_offer_rejected",
        "post_created",
        "post_liked",
        "post_commented",
        "post_shared",
        "follower_update",
        "document_shared",
        "student_assigned",
        "student_assignment_confirmed",
        "student_assignment_rejected",
        "contract_created",
        "contract_signed",
      ],
      required: true,
    },
    entity: {
      kind: String,
      id: { type: Schema.Types.ObjectId },
    },
    payload: Schema.Types.Mixed,
    readAt: Date,
    archivedAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

notificationSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
