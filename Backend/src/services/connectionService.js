const Connection = require("../models/Connection");
const Follow = require("../models/Follow");
const Notification = require("../models/Notification");
const { recalcFollowStats } = require("./userService");

const populateFields =
  "username name media roles contact social studentProfile staffProfile companyProfile followerCount followingCount";

const populateConnection = async (connectionDoc) => {
  if (!connectionDoc) return null;
  await connectionDoc.populate("requester", populateFields);
  await connectionDoc.populate("recipient", populateFields);
  return connectionDoc;
};

const requestConnection = async ({ requesterId, recipientId, message, attachments = [] }) => {
  if (requesterId.toString() === recipientId.toString()) {
    throw Object.assign(new Error("Cannot connect with yourself"), { status: 400 });
  }

  try {
    const connection = await Connection.create({
      requester: requesterId,
      recipient: recipientId,
      message,
      attachments,
    });

    await Notification.create({
      recipient: recipientId,
      actor: requesterId,
      type: "connection_request",
      entity: { kind: "Connection", id: connection.id },
    });

    await populateConnection(connection);
    return connection;
  } catch (error) {
    if (error.code === 11000) {
      throw Object.assign(new Error("Connection already requested"), { status: 409 });
    }
    throw error;
  }
};

const respondConnection = async ({ connectionId, recipientId, action }) => {
  const connection = await Connection.findById(connectionId);
  if (!connection) {
    throw Object.assign(new Error("Connection not found"), { status: 404 });
  }
  if (connection.recipient.toString() !== recipientId.toString()) {
    throw Object.assign(new Error("Not authorized"), { status: 403 });
  }

  if (connection.status !== "pending") {
    throw Object.assign(new Error("Connection already processed"), { status: 400 });
  }

  if (action === "accept") {
    connection.status = "accepted";
    connection.acceptedAt = new Date();

    const upsertFollow = (follower, following) =>
      Follow.updateOne(
        { follower, following },
        { $setOnInsert: { follower, following } },
        { upsert: true, setDefaultsOnInsert: true }
      );

    await connection.save();
    await Promise.all([
      upsertFollow(connection.requester, connection.recipient),
      upsertFollow(connection.recipient, connection.requester),
    ]);

    await recalcFollowStats([connection.requester, connection.recipient]);

    await Notification.create({
      recipient: connection.requester,
      actor: connection.recipient,
      type: "connection_accept",
      entity: { kind: "Connection", id: connection.id },
    });
  } else if (action === "reject") {
    connection.status = "rejected";
    connection.rejectedAt = new Date();
    await connection.save();
  } else if (action === "withdraw") {
    connection.status = "withdrawn";
    await connection.save();
  } else {
    throw Object.assign(new Error("Invalid action"), { status: 400 });
  }

  await populateConnection(connection);
  return connection;
};

const serializeUser = (user) => {
  if (!user) return null;
  if (typeof user.toJSON === "function") {
    return user.toJSON();
  }
  return user;
};

const buildConnectionEntry = (connectionDoc, currentUserId, statusLabel) => {
  const connection = connectionDoc.toJSON();
  const requesterId = connection.requester?.id || connection.requester?._id?.toString();
  const recipientId = connection.recipient?.id || connection.recipient?._id?.toString();
  const isRequester = requesterId === currentUserId;

  return {
    id: connection.id,
    status: connection.status,
    direction: statusLabel || (isRequester ? "outgoing" : "incoming"),
    peer: serializeUser(isRequester ? connection.recipient : connection.requester),
    requester: serializeUser(connection.requester),
    recipient: serializeUser(connection.recipient),
    message: connection.message,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
    acceptedAt: connection.acceptedAt,
    rejectedAt: connection.rejectedAt,
  };
};

const listNetwork = async ({ userId }) => {
  const idString = userId.toString();

  const [accepted, incoming, outgoing, followersDocs, followingDocs] = await Promise.all([
    Connection.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }],
    })
      .populate("requester", populateFields)
      .populate("recipient", populateFields)
      .sort({ updatedAt: -1 }),
    Connection.find({ recipient: userId, status: "pending" })
      .populate("requester", populateFields)
      .populate("recipient", populateFields)
      .sort({ createdAt: -1 }),
    Connection.find({ requester: userId, status: "pending" })
      .populate("requester", populateFields)
      .populate("recipient", populateFields)
      .sort({ createdAt: -1 }),
    Follow.find({ following: userId }).populate("follower", populateFields),
    Follow.find({ follower: userId }).populate("following", populateFields),
  ]);

  return {
    network: accepted.map((connection) => buildConnectionEntry(connection, idString, "connected")),
    incoming: incoming.map((connection) => buildConnectionEntry(connection, idString, "incoming")),
    outgoing: outgoing.map((connection) => buildConnectionEntry(connection, idString, "outgoing")),
    followers: followersDocs
      .map((doc) => serializeUser(doc.follower))
      .filter(Boolean),
    following: followingDocs
      .map((doc) => serializeUser(doc.following))
      .filter(Boolean),
    totals: {
      network: accepted.length,
      incoming: incoming.length,
      outgoing: outgoing.length,
      followers: followersDocs.length,
      following: followingDocs.length,
    },
  };
};

module.exports = {
  requestConnection,
  respondConnection,
  listNetwork,
};
