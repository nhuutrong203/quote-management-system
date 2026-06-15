const test = require("node:test");
const assert = require("node:assert/strict");

const {
  APPROVAL_ACTIONS,
  buildApprovalAuditEntry,
  getApprovalTransition,
  normalizeApprovalAction,
} = require("../src/modules/quotes/quoteApproval.service");

test("normalizeApprovalAction standardizes action labels", () => {
  assert.equal(normalizeApprovalAction("Send Back"), APPROVAL_ACTIONS.SEND_BACK);
  assert.equal(normalizeApprovalAction(" approve "), APPROVAL_ACTIONS.APPROVE);
});

test("HOD approval moves Pending quotes to Processing", () => {
  const transition = getApprovalTransition({
    actorRole: "HOD",
    currentStatus: "Pending",
    action: "approve",
  });

  assert.equal(transition.nextStatus, "Processing");
  assert.equal(transition.destinationLabel, "SC Head queue");
});

test("SC Head approval moves Processing quotes to PendingApproval", () => {
  const transition = getApprovalTransition({
    actorRole: "SC_HEAD",
    currentStatus: "Processing",
    action: "approve",
  });

  assert.equal(transition.nextStatus, "PendingApproval");
  assert.equal(transition.destinationLabel, "GM queue");
});

test("invalid role transition throws a permission error", () => {
  assert.throws(
    () =>
      getApprovalTransition({
        actorRole: "Sales",
        currentStatus: "Pending",
        action: "approve",
      }),
    (error) => {
      assert.equal(error.statusCode, 403);
      return true;
    }
  );
});

test("approval audit entry captures actor, action, note, and timestamp", () => {
  const timestamp = new Date("2026-06-15T08:00:00.000Z");
  const entry = buildApprovalAuditEntry({
    actor: {
      id: "user-1",
      name: "HOD Singapore",
      email: "hod@amb.com.sg",
      role: "HOD",
    },
    action: "Approved",
    fromStatus: "Pending",
    toStatus: "Processing",
    note: "Moved to SC queue.",
    timestamp,
  });

  assert.equal(entry.actorName, "HOD Singapore");
  assert.equal(entry.actorRole, "HOD");
  assert.equal(entry.action, "Approved");
  assert.equal(entry.note, "Moved to SC queue.");
  assert.equal(entry.timestamp, timestamp);
});
