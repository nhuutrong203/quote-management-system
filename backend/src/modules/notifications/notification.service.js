const mongoose = require("mongoose");
const Notification = require("./notification.model");

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const roleLabels = {
  SC_HEAD: "SC Head",
};

const getRoleLabel = (role) => roleLabels[role] || role || "Reviewer";

const getTargetRoles = (toStatus, action) => {
  if (action === "send_back" || action === "reject") {
    return ["Sales"];
  }

  if (toStatus === "Processing") return ["SC_HEAD"];
  if (toStatus === "PendingApproval") return ["GM"];
  if (toStatus === "Approved") return ["Sales", "Planning"];
  if (toStatus === "Rejected") return ["Sales"];

  return ["Sales"];
};

const buildNotificationMessage = ({ quoteNumber, transition, actor, note }) => {
  const actorLabel = getRoleLabel(actor?.role || transition.actorRole);

  if (transition.action === "send_back") {
    return `Quote ${quoteNumber} was sent back — reason: ${note}`;
  }

  if (transition.action === "reject") {
    return `Quote ${quoteNumber} was rejected by ${actorLabel} — reason: ${note}`;
  }

  return `Quote ${quoteNumber} was approved by ${actorLabel}`;
};

const mapNotificationToDTO = (notification, userId = "") => ({
  id: String(notification._id || notification.id || ""),
  quoteId: String(notification.quoteId?._id || notification.quoteId || ""),
  quoteNumber: notification.quoteNumber,
  type: notification.type,
  targetRoles: notification.targetRoles || [],
  actorName: notification.actorName || "",
  actorRole: notification.actorRole || "",
  action: notification.action,
  fromStatus: notification.fromStatus || "",
  toStatus: notification.toStatus || "",
  reason: notification.reason || "",
  message: notification.message,
  isRead: Boolean(
    notification.readBy?.some((entry) => String(entry.userId) === String(userId))
  ),
  createdAt: notification.createdAt,
});

const createApprovalStatusNotification = async ({
  quote,
  transition,
  actor,
  fromStatus,
  toStatus,
  note,
  session,
}) => {
  if (!isDatabaseConnected()) {
    return null;
  }

  const reason = String(note || "").trim();
  const payload = {
    quoteId: quote._id,
    quoteNumber: quote.quoteNumber,
    targetRoles: getTargetRoles(toStatus, transition.action),
    actorName: actor?.name || "",
    actorRole: actor?.role || transition.actorRole || "",
    action: transition.action,
    fromStatus,
    toStatus,
    reason,
    message: buildNotificationMessage({
      quoteNumber: quote.quoteNumber,
      transition,
      actor,
      note: reason || "No reason provided.",
    }),
  };

  const created = await Notification.create([payload], session ? { session } : undefined);
  return mapNotificationToDTO(created[0]);
};

const getNotificationsForUser = async ({ role, userId, limit = 10 }) => {
  if (!isDatabaseConnected()) {
    return [];
  }

  const notifications = await Notification.find({ targetRoles: role })
    .sort({ createdAt: -1 })
    .limit(Number(limit) || 10)
    .lean();

  return notifications.map((notification) => mapNotificationToDTO(notification, userId));
};

module.exports = {
  buildNotificationMessage,
  createApprovalStatusNotification,
  getNotificationsForUser,
  getTargetRoles,
};
