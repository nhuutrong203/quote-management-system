const STATUS_LABELS = {
  Draft: "Draft",
  Pending: "Pending HOD",
  Processing: "Pending SC",
  PendingApproval: "Pending GM",
  Approved: "Approved",
  Rejected: "Rejected",
  AskedForEdit: "Asked For Edit",
};

const APPROVAL_ACTIONS = {
  APPROVE: "approve",
  SEND_BACK: "send_back",
  REJECT: "reject",
};

const APPROVAL_TRANSITIONS = [
  {
    actorRole: "HOD",
    currentStatus: "Pending",
    action: APPROVAL_ACTIONS.APPROVE,
    nextStatus: "Processing",
    actionLabel: "Approved",
    destinationLabel: "SC Head queue",
  },
  {
    actorRole: "HOD",
    currentStatus: "Pending",
    action: APPROVAL_ACTIONS.SEND_BACK,
    nextStatus: "AskedForEdit",
    actionLabel: "Sent Back",
    destinationLabel: "Sales edit queue",
  },
  {
    actorRole: "HOD",
    currentStatus: "Pending",
    action: APPROVAL_ACTIONS.REJECT,
    nextStatus: "Rejected",
    actionLabel: "Rejected",
    destinationLabel: "Rejected quotes archive",
  },
  {
    actorRole: "SC_HEAD",
    currentStatus: "Processing",
    action: APPROVAL_ACTIONS.APPROVE,
    nextStatus: "PendingApproval",
    actionLabel: "Approved",
    destinationLabel: "GM queue",
  },
  {
    actorRole: "SC_HEAD",
    currentStatus: "Processing",
    action: APPROVAL_ACTIONS.SEND_BACK,
    nextStatus: "AskedForEdit",
    actionLabel: "Sent Back",
    destinationLabel: "Sales edit queue",
  },
  {
    actorRole: "SC_HEAD",
    currentStatus: "Processing",
    action: APPROVAL_ACTIONS.REJECT,
    nextStatus: "Rejected",
    actionLabel: "Rejected",
    destinationLabel: "Rejected quotes archive",
  },
  {
    actorRole: "GM",
    currentStatus: "PendingApproval",
    action: APPROVAL_ACTIONS.APPROVE,
    nextStatus: "Approved",
    actionLabel: "Approved",
    destinationLabel: "Order conversion queue",
  },
  {
    actorRole: "GM",
    currentStatus: "PendingApproval",
    action: APPROVAL_ACTIONS.SEND_BACK,
    nextStatus: "AskedForEdit",
    actionLabel: "Sent Back",
    destinationLabel: "Sales edit queue",
  },
  {
    actorRole: "GM",
    currentStatus: "PendingApproval",
    action: APPROVAL_ACTIONS.REJECT,
    nextStatus: "Rejected",
    actionLabel: "Rejected",
    destinationLabel: "Rejected quotes archive",
  },
];

const createTransitionError = (message, statusCode = 403) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeApprovalAction = (action) =>
  String(action || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const getApprovalTransition = ({ actorRole, currentStatus, action }) => {
  const normalizedAction = normalizeApprovalAction(action);

  if (!Object.values(APPROVAL_ACTIONS).includes(normalizedAction)) {
    throw createTransitionError("Unsupported approval action", 400);
  }

  const matchedTransition = APPROVAL_TRANSITIONS.find(
    (transition) =>
      transition.actorRole === actorRole &&
      transition.currentStatus === currentStatus &&
      transition.action === normalizedAction
  );

  if (!matchedTransition) {
    throw createTransitionError(
      `${actorRole || "Unknown role"} cannot ${normalizedAction} a quote in ${currentStatus || "Unknown"} status`
    );
  }

  return matchedTransition;
};

const buildApprovalAuditEntry = ({
  actor,
  action,
  fromStatus,
  toStatus,
  note,
  timestamp = new Date(),
}) => ({
  actorId: actor?.id || actor?._id || null,
  actorName: actor?.name || "System",
  actorEmail: actor?.email || "",
  actorRole: actor?.role || "System",
  action,
  fromStatus,
  toStatus,
  note: note || "",
  timestamp,
});

module.exports = {
  APPROVAL_ACTIONS,
  STATUS_LABELS,
  normalizeApprovalAction,
  getApprovalTransition,
  buildApprovalAuditEntry,
};