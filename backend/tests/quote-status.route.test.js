const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../app");
const quoteService = require("../src/modules/quotes/quote.service");
const userService = require("../src/modules/users/user.service");

const validQuoteId = "507f1f77bcf86cd799439011";
const hodUserId = "507f191e810c19729de860ea";
const salesUserId = "507f191e810c19729de860eb";
const scHeadUserId = "507f191e810c19729de860ed";
const gmUserId = "507f191e810c19729de860ef";

const originalUpdateQuoteStatus = quoteService.updateQuoteStatus;
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
    if (String(userId) === hodUserId) {
      return {
        _id: hodUserId,
        name: "HOD Singapore",
        email: "hod@amb.com.sg",
        role: "HOD",
        isActive: true,
      };
    }

    if (String(userId) === salesUserId) {
      return {
        _id: salesUserId,
        name: "Siow",
        email: "siow@amb.com.sg",
        role: "Sales",
        isActive: true,
      };
    }

    if (String(userId) === scHeadUserId) {
      return {
        _id: scHeadUserId,
        name: "SC Head Singapore",
        email: "schead@amb.com.sg",
        role: "SC_HEAD",
        isActive: true,
      };
    }

    if (String(userId) === gmUserId) {
      return {
        _id: gmUserId,
        name: "GM Singapore",
        email: "gm@amb.com.sg",
        role: "GM",
        isActive: true,
      };
    }

    return null;
  };

  quoteService.updateQuoteStatus = async (quoteId, payload) => {
    capturedPayload = { quoteId, payload };
    const status = payload.actor.role === "SC_HEAD" ? "PendingApproval" : "Processing";

    if (payload.actor.role === "GM" && payload.action === "approve") {
      return {
        quote: {
          id: quoteId,
          quoteNumber: "#12003",
          status: "Approved",
          customer: {
            id: "customer-1",
            companyName: "AMB Packaging Logistics",
          },
          clientDetails: {
            companyName: "AMB Packaging Logistics",
            companyAddress: "22 Penjuru Rd, Singapore 609142",
            contactPerson: "Mr. Chen Wei",
            phoneNumber: "+65 6789 0123",
            email: "wei.chen@ambpack.com",
            billingAddress: "22 Penjuru Rd, Singapore 609142",
            deliveryAddress: "29 Gul Circle, Singapore 629585",
          },
          items: [],
          history: [],
          approvalHistory: [],
          totalPlaceholder: 2600,
          totalDisplay: "S$2,600.00",
        },
        order: {
          id: "order-1",
          orderNumber: "ORD-12003",
          orderId: "ORD-12003",
          quoteId,
          status: "Draft",
        },
      };
    }

    return {
      id: quoteId,
      quoteNumber: "#12003",
      status,
      customer: {
        id: "customer-1",
        companyName: "AMB Packaging Logistics",
      },
      clientDetails: {
        companyName: "AMB Packaging Logistics",
        companyAddress: "22 Penjuru Rd, Singapore 609142",
        contactPerson: "Mr. Chen Wei",
        phoneNumber: "+65 6789 0123",
        email: "wei.chen@ambpack.com",
        billingAddress: "22 Penjuru Rd, Singapore 609142",
        deliveryAddress: "29 Gul Circle, Singapore 629585",
      },
      items: [
        {
          name: "Corrugated RSC carton",
          boxStyle: "Corrugated",
          type: "RSC",
          dimension: "ID 400x300x200",
          fluteType: "B",
          boardQuality: "125 GSM",
          colors: "4 colors",
          joints: "Glue",
          moq: "5000",
          quantity: 5000,
          unitPrice: 0.52,
        },
      ],
      history: [],
      approvalHistory: [],
      totalPlaceholder: 2600,
      totalDisplay: "S$2,600.00",
    };
  };

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  quoteService.updateQuoteStatus = originalUpdateQuoteStatus;
  userService.getUserById = originalGetUserById;

  if (server) {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test("PATCH /api/quotes/:id/status requires authentication", async () => {
  const { response, json } = await requestJson(`/api/quotes/${validQuoteId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "approve" }),
  });

  assert.equal(response.status, 401);
  assert.equal(json.message, "Authentication token is required");
});

test("PATCH /api/quotes/:id/status blocks non-approval roles before service call", async () => {
  capturedPayload = null;

  const { response, json } = await requestJson(`/api/quotes/${validQuoteId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer mock-token-${salesUserId}`,
    },
    body: JSON.stringify({ action: "approve" }),
  });

  assert.equal(response.status, 403);
  assert.equal(json.message, "You do not have permission to perform this action");
  assert.equal(capturedPayload, null);
});

test("PATCH /api/quotes/:id/status requires a note when sending back", async () => {
  const { response, json } = await requestJson(`/api/quotes/${validQuoteId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer mock-token-${hodUserId}`,
    },
    body: JSON.stringify({ action: "send_back" }),
  });

  assert.equal(response.status, 400);
  assert.equal(json.message, "note is required when sending back or rejecting a quote");
});

test("PATCH /api/quotes/:id/status uses authenticated HOD identity for approve flow", async () => {
  capturedPayload = null;

  const { response, json } = await requestJson(`/api/quotes/${validQuoteId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer mock-token-${hodUserId}`,
    },
    body: JSON.stringify({
      action: "approve",
      actorRole: "Sales",
      actorId: salesUserId,
      note: "Approved and routed to SC Head.",
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(json.status, "OK");
  assert.equal(json.data.status, "Processing");
  assert.equal(capturedPayload.quoteId, validQuoteId);
  assert.equal(capturedPayload.payload.actor.id, hodUserId);
  assert.equal(capturedPayload.payload.actor.role, "HOD");
  assert.equal(capturedPayload.payload.action, "approve");
});

test("PATCH /api/quotes/:id/status wires SC Head approval to the shared status service", async () => {
  capturedPayload = null;

  const { response, json } = await requestJson(`/api/quotes/${validQuoteId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer mock-token-${scHeadUserId}`,
    },
    body: JSON.stringify({
      action: "approve",
      note: "Approved and routed to GM.",
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(json.status, "OK");
  assert.equal(json.data.status, "PendingApproval");
  assert.equal(capturedPayload.quoteId, validQuoteId);
  assert.equal(capturedPayload.payload.actor.id, scHeadUserId);
  assert.equal(capturedPayload.payload.actor.role, "SC_HEAD");
  assert.equal(capturedPayload.payload.action, "approve");
});

test("PATCH /api/quotes/:id/status returns quote and order DTOs for GM final approval", async () => {
  capturedPayload = null;

  const { response, json } = await requestJson(`/api/quotes/${validQuoteId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer mock-token-${gmUserId}`,
    },
    body: JSON.stringify({
      action: "approve",
      note: "Final approved.",
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(json.status, "OK");
  assert.equal(json.message, "Quote approved and order conversion created successfully");
  assert.equal(json.data.quote.status, "Approved");
  assert.equal(json.data.order.orderNumber, "ORD-12003");
  assert.equal(capturedPayload.payload.actor.id, gmUserId);
  assert.equal(capturedPayload.payload.actor.role, "GM");
});
