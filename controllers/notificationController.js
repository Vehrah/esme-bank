const Notification = require("../models/Notification");

// Get all notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({
      message: "Unable to load notifications.",
    });
  }
};

// Mark one notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    notification.isRead = true;

    await notification.save();

    res.json(notification);
  } catch (err) {
    res.status(500).json({
      message: "Unable to update notification.",
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        user: req.user.id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.json({
      message: "All notifications marked as read.",
    });
  } catch (err) {
    res.status(500).json({
      message: "Unable to update notifications.",
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    res.json({
      message: "Notification deleted.",
    });
  } catch (err) {
    res.status(500).json({
      message: "Unable to delete notification.",
    });
  }
};