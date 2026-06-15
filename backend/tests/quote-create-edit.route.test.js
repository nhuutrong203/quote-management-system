const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../app");
const quoteService = require("../src/modules/quotes/quote.service");
const userService = require("../src/modules/users/user.service");

const salesUserId = "507f191e810c19729de860eb";
const hodUserId = "507f191e810c19729de860ea";
const quoteId = "507f1f77bcf86cd799439011";

const originalCreateQuote = quoteService.createQuote;
const originalUpdateQuote = quoteService.updateQuote;
const originalGetUserById = userService.getUserById;

let server;
let baseUrl;
let capturedCreatePayload = null;
let capturedUpdatePayload = null;

const validClientDetails = {
  companyName: "AMB Packaging Logistics",
  companyAddress: "22 Penjuru Rd, Singapore 609142",
  contactPerson: "Mr. Chen Wei",
  phoneNumber: "+65 6789 0123",
  email: "wei.chen@ambpack.com",
  billingAddress: "22 Penjuru Rd, Singapore 609142",
  deliveryAddress: "29 Gul Circle, Singapore 629585",
};

const validItem = {
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
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  const json = await response.json();
  return { response, json };
};

before(async () => {
  userService.getUserById = async (userId) => {
    if (String(userId) === salesUserId) {
      return {
        _id: salesUserId,
        name: "Siow",
        email: "siow@amb.com.sg",
        role: "Sales",
        isActive: true,
      };
    }

    if (String(userId) === hodUserId) {
      return {
        _id: hodUserId,
        name: "HOD Singapore",
        email: "hod@amb.com.sg",
        role: "HOD",
        isActive: true,
      };
    }

    return null;
  };

  quoteService.createQuote = async (payload) => {
    capturedCreatePayload = payload;
    return {
      id: quoteId,
      quoteNumber: payload.quoteNumber,
      status: payload.status,
      customer: { id: payload.customerId, companyName: validClientDetails.companyName },
      clientDetails: payload.clientDetails,
      items: payload.items,
      history: [],
      approvalHistory: [],
      totalPlaceholder: payload.totalPlaceholder || 2600,
      totalDisplay: "S$2,600.00",
    };
  };

  quoteService.updateQuote = async (id, payload) => {
    capturedUpdatePayload = { id, payload };
    return {
      id,
      quoteNumber: "#12003",
      status: payload.status || "Draft",
      customer: { id: payload.customerId || "customer-1", companyName: validClientDetails.companyName },
      clientDetails: payload.clientDetails || validClientDetails,
      items: payload.items || [validItem],
      history: [],
      approvalHistory: [],
      totalPlaceholder: payload.totalPlaceholder || 2600,
      totalDisplay: "S$2,600.00",
    };
  };

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  quoteService.createQuote = originalCreateQuote;
  quoteService.updateQuote = originalUpdateQuote;
  userService.getUserById = originalGetUserById;

  if (server) {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test("POST /api/quotes blocks HOD from creating quotes", async () => {
  const { response, json } = await requestJson("/api/quotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer mock-token-${hodUserId}`,
    },
    body: JSON.stringify({
      quoteNumber: "#12999",
      customerId: "507f191e810c19729de860ec",
      clientDetails: validClientDetails,
      items: [validItem],
      status: "Draft",
    }),
  });

  assert.equal(response.status, 403);
  assert.equal(json.message, "You do not have permission to perform this action");
});

test("POST /api/quotes uses authenticated Sales user instead of client-supplied createdBy", async () => {
  capturedCreatePayload = null;

  const { response, json } = await requestJson("/api/quotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer mock-token-${salesUserId}`,
    },
    body: JSON.stringify({
      quoteNumber: "#12998",
      customerId: "507f191e810c19729de860ec",
      createdBy: hodUserId,
      clientDetails: validClientDetails,
      items: [validItem],
      totalPlaceholder: 2600,
      status: "Draft",
    }),
  });

  assert.equal(response.status, 201);
  assert.equal(json.status, "OK");
  assert.equal(capturedCreatePayload.createdBy, salesUserId);
});

test("PUT /api/quotes/:id blocks HOD from editing quotes", async () => {
  const { response, json } = await requestJson(`/api/quotes/${quoteId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer mock-token-${hodUserId}`,
    },
    body: JSON.stringify({
      customerId: "507f191e810c19729de860ec",
      clientDetails: validClientDetails,
      items: [validItem],
      status: "Draft",
    }),
  });

  assert.equal(response.status, 403);
  assert.equal(json.message, "You do not have permission to perform this action");
});

test("PUT /api/quotes/:id uses authenticated Sales user instead of client-supplied updatedBy", async () => {
  capturedUpdatePayload = null;

  const { response, json } = await requestJson(`/api/quotes/${quoteId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer mock-token-${salesUserId}`,
    },
    body: JSON.stringify({
      customerId: "507f191e810c19729de860ec",
      updatedBy: hodUserId,
      clientDetails: validClientDetails,
      items: [validItem],
      status: "Pending",
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(json.status, "OK");
  assert.equal(capturedUpdatePayload.payload.updatedBy, salesUserId);
});
