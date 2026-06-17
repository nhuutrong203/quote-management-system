const notificationService = require("./notification.service");

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotificationsForUser({
      role: req.user.role,
      userId: req.user.id,
      limit: req.query.limit,
    });

    res.status(200).json({
      status: "OK",
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
};
