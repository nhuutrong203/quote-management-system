const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../app");
const notificationService = require("../src/modules/notifications/notification.service");
const userService = require("../src/modules/users/user.service");

const scHeadUserId = "507f191e810c19729de860ed";
const originalGetNotificationsForUser = notificationService.getNotificationsForUser;
const originalGetUserById = userService.getUserById;

let server;
let baseUrl;
let capturedPayload = null;

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  const json = await response.json();
  return { response, json };
};

before(async () => {
  userService.getUserById = async (userId) => {
    if (String(userId) === scHeadUserId) {
      return {
        _id: scHeadUserId,
        name: "SC Head Singapore",
        email: "schead@amb.com.sg",
        role: "SC_HEAD",
        isActive: true,
      };
    }

    return null;
  };

  notificationService.getNotificationsForUser = async (payload) => {
    capturedPayload = payload;
    return [
      {
        id: "notification-1",
        quoteNumber: "#12345",
        message: "Quote #12345 was approved by HOD",
        targetRoles: ["SC_HEAD"],
        isRead: false,
      },
    ];
  };

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  notificationService.getNotificationsForUser = originalGetNotificationsForUser;
  userService.getUserById = originalGetUserById;

  if (server) {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test("GET /api/notifications requires authentication", async () => {
  const { response, json } = await requestJson("/api/notifications");

  assert.equal(response.status, 401);
  assert.equal(json.message, "Authentication token is required");
});

test("GET /api/notifications returns notifications for authenticated role", async () => {
  const { response, json } = await requestJson("/api/notifications", {
    headers: {
      Authorization: `Bearer mock-token-${scHeadUserId}`,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(json.status, "OK");
  assert.equal(json.data[0].message, "Quote #12345 was approved by HOD");
  assert.equal(capturedPayload.role, "SC_HEAD");
  assert.equal(capturedPayload.userId, scHeadUserId);
});
