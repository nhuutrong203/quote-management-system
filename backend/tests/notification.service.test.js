const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Notification = require("../src/modules/notifications/notification.model");
const notificationService = require("../src/modules/notifications/notification.service");

const originalReadyState = mongoose.connection.readyState;
const originalNotificationCreate = Notification.create;

const restoreMocks = () => {
  Object.defineProperty(mongoose.connection, "readyState", {
    value: originalReadyState,
    configurable: true,
  });
  Notification.create = originalNotificationCreate;
};

test("notification trigger creates sent-back banner with reason for Sales", async () => {
  let capturedPayload = null;
  const session = { id: "session-1" };

  Object.defineProperty(mongoose.connection, "readyState", {
    value: 1,
    configurable: true,
  });

  Notification.create = async (payload, options) => {
    capturedPayload = { payload: payload[0], options };
    return [
      {
        _id: "notification-1",
        ...payload[0],
        createdAt: new Date("2026-06-17T08:00:00.000Z"),
        readBy: [],
      },
    ];
  };

  try {
    const notification = await notificationService.createApprovalStatusNotification({
      quote: {
        _id: "507f1f77bcf86cd799439011",
        quoteNumber: "#12345",
      },
      transition: {
        actorRole: "HOD",
        action: "send_back",
      },
      actor: {
        name: "HOD Singapore",
        role: "HOD",
      },
      fromStatus: "Pending",
      toStatus: "AskedForEdit",
      note: "Need revised MOQ.",
      session,
    });

    assert.equal(capturedPayload.payload.quoteNumber, "#12345");
    assert.deepEqual(capturedPayload.payload.targetRoles, ["Sales"]);
    assert.equal(
      capturedPayload.payload.message,
      "Quote #12345 was sent back — reason: Need revised MOQ."
    );
    assert.equal(capturedPayload.options.session, session);
    assert.equal(notification.message, capturedPayload.payload.message);
  } finally {
    restoreMocks();
  }
});

test("notification trigger routes HOD approvals to SC Head", () => {
  assert.deepEqual(notificationService.getTargetRoles("Processing", "approve"), ["SC_HEAD"]);
});
