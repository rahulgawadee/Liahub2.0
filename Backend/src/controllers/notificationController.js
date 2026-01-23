const Notification = require("../models/Notification");

const listNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(20, Number(req.query.limit) || 20); // Max 20 per page
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ recipient: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("actor", "username name media roles")
        .lean(),
      Notification.countDocuments({ recipient: req.user.id }),
    ]);

    // Ensure id is present when using lean()
    const mapped = Array.isArray(notifications)
      ? notifications.map((n) => ({ ...n, id: n.id || String(n._id) }))
      : [];

    res.json({
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, _id: { $in: req.body.notificationIds } },
      { $set: { readAt: new Date() } }
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  markRead,
};
