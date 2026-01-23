const mongoose = require("mongoose");
const MessageThread = require("../models/MessageThread");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const { getIO } = require("../config/socket");

const ensureThread = async ({ participantIds }) => {
  const existing = await MessageThread.findOne({
    participants: { $all: participantIds, $size: participantIds.length },
    isGroup: participantIds.length > 2 ? true : { $in: [false, null] },
  });
  if (existing) {
    await existing.populate("participants", "username name media roles");
    return existing;
  }

  const thread = await MessageThread.create({ participants: participantIds, lastMessageAt: new Date() });
  await thread.populate("participants", "username name media roles");
  return thread;
};

const listThreads = async ({ userId }) => {
  const threads = await MessageThread.find({ participants: userId })
    .populate("participants", "username name media roles")
    .sort({ lastMessageAt: -1 })
    .limit(50);

  // Calculate unread count for each thread
  const threadsWithUnread = await Promise.all(
    threads.map(async (thread) => {
      const unreadCount = await Message.countDocuments({
        thread: thread._id,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      });
      const threadObj = thread.toJSON();
      threadObj.unreadCount = unreadCount;
      return threadObj;
    })
  );

  return threadsWithUnread;
};

const listMessages = async ({ threadId, userId, page = 1, limit = 30 }) => {
  const thread = await MessageThread.findOne({ _id: threadId, participants: userId });
  if (!thread) {
    throw Object.assign(new Error("Thread not found"), { status: 404 });
  }

  const messages = await Message.find({ thread: threadId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("sender", "username name media roles");

  return messages.reverse();
};

const sendMessage = async ({ senderId, recipientIds, body, attachments = [] }) => {
  const toObjectId = (value) => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    try {
      return new mongoose.Types.ObjectId(value);
    } catch (error) {
      return null;
    }
  };

  const participantIds = Array.from(new Set([senderId, ...recipientIds]))
    .map(toObjectId)
    .filter(Boolean);

  if (participantIds.length < 2) {
    throw Object.assign(new Error("Recipients not found"), { status: 400 });
  }

  // Validate that either body or attachments are provided
  if ((!body || !body.trim()) && (!attachments || attachments.length === 0)) {
    throw Object.assign(new Error("Message must contain text or attachments"), { status: 400 });
  }

  const thread = await ensureThread({ participantIds });

  const message = await Message.create({
    thread: thread.id,
    sender: senderId,
    body: body || "",
    attachments,
  });

  thread.lastMessageAt = message.createdAt;
  thread.lastMessage = message.id;
  await thread.save();

  await Promise.all([
    thread.populate("participants", "username name media roles"),
    message.populate("sender", "username name media roles"),
  ]);

  const io = getIO();
  participantIds.forEach((participantId) => {
    if (participantId.toString() !== senderId.toString()) {
      Notification.create({
        recipient: participantId,
        actor: senderId,
        type: "message",
        entity: { kind: "Message", id: message.id },
        payload: { threadId: thread.id },
      }).catch(() => {});
      io.to(participantId.toString()).emit("message:new", {
        threadId: thread.id,
        thread,
        message,
      });
    }
  });

  return { thread, message };
};

const markThreadRead = async ({ threadId, userId }) => {
  await Message.updateMany({ thread: threadId, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } });
};

module.exports = {
  listThreads,
  listMessages,
  sendMessage,
  markThreadRead,
};
