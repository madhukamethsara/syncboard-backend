const Notification = require("../models/Notification");

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    })
      .sort({
        createdAt: -1,
      })
      .limit(100)
      .populate("relatedTeam", "name")
      .populate("relatedBoard", "name")
      .populate("relatedTask", "title");

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load notifications",
    });
  }
};

const markNotificationAsRead = async (
  req,
  res
) => {
  try {
    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: req.params.notificationId,
          user: req.user._id,
        },
        {
          read: true,
        },
        {
          new: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

const markAllNotificationsAsRead = async (
  req,
  res
) => {
  try {
    await Notification.updateMany(
      {
        user: req.user._id,
        read: false,
      },
      {
        read: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error(
      "Mark all notifications read error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update notifications",
    });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};