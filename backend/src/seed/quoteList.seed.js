const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDatabase = require("../config/database");

const User = require("../modules/users/user.model");
const Customer = require("../modules/customers/customer.model");
const Quote = require("../modules/quotes/quote.model");
const Order = require("../modules/orders/order.model");
const { DEFAULT_ORDER_TOTAL_LABEL } = require("./order.seed-data");

const quoteSpecs = [
  {
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
  {
    boxStyle: "Corrugated",
    type: "FOL",
    dimension: "OD 600x400x300",
    fluteType: "C",
    boardQuality: "150 GSM",
    colors: "2 colors",
    joints: "Stitch",
    moq: "3000",
    quantity: 3000,
    unitPrice: 0.68,
  },
  {
    boxStyle: "Offset",
    type: "Offset",
    dimension: "ID 250x180x120",
    fluteType: "N-A",
    boardQuality: "250 GSM",
    colors: "4 + varnish",
    joints: "Glue",
    moq: "10000",
    quantity: 10000,
    unitPrice: 0.95,
  },
  {
    boxStyle: "Offset laminated",
    type: "Two-piece",
    dimension: "ID 520x310x210",
    fluteType: "BE",
    boardQuality: "300 GSM",
    colors: "Up to 4",
    joints: "Glue",
    moq: "1000",
    quantity: 1000,
    unitPrice: 1.24,
  },
];

const buildItemName = (spec) =>
  `${spec.boxStyle} ${spec.type} carton (${spec.dimension}, ${spec.fluteType})`;

const buildQuoteItem = (spec, overrides = {}) => ({
  name: buildItemName(spec),
  boxStyle: spec.boxStyle,
  type: spec.type,
  dimension: spec.dimension,
  fluteType: spec.fluteType,
  boardQuality: spec.boardQuality,
  colors: spec.colors,
  joints: spec.joints,
  moq: spec.moq,
  quantity: spec.quantity,
  unitPrice: spec.unitPrice,
  ...overrides,
});

const buildClientDetails = (customer, overrides = {}) => ({
  companyName: customer.companyName,
  companyAddress: customer.address,
  contactPerson: customer.contactName,
  phoneNumber: customer.phone,
  email: customer.email,
  billingAddress: overrides.billingAddress || customer.address,
  deliveryAddress: overrides.deliveryAddress || customer.address,
});

const quoteBlueprints = [
  { quoteNumber: "#12001", status: "Draft", customerIndex: 0, itemIndexes: [0], note: "Draft quote saved by Sales." },
  { quoteNumber: "#12002", status: "Draft", customerIndex: 1, itemIndexes: [1, 2], note: "Draft quote with two SKU rows." },
  { quoteNumber: "#12003", status: "Pending", customerIndex: 2, itemIndexes: [0], note: "Submitted to HOD for review." },
  { quoteNumber: "#12004", status: "Pending", customerIndex: 3, itemIndexes: [2], note: "Waiting in HOD approval queue." },
  { quoteNumber: "#12005", status: "Processing", customerIndex: 0, itemIndexes: [1], note: "HOD approved and routed to SC Head." },
  { quoteNumber: "#12006", status: "Processing", customerIndex: 1, itemIndexes: [3, 0], note: "SC pricing review in progress." },
  { quoteNumber: "#12007", status: "PendingApproval", customerIndex: 2, itemIndexes: [2], note: "SC Head approved and routed to GM." },
  { quoteNumber: "#12008", status: "PendingApproval", customerIndex: 3, itemIndexes: [0, 1], note: "Pending GM sign-off." },
  { quoteNumber: "#12009", status: "Approved", customerIndex: 0, itemIndexes: [0], note: "GM approved the quote." },
  { quoteNumber: "#12010", status: "Approved", customerIndex: 1, itemIndexes: [1, 2, 3], note: "Approved quote ready for order conversion." },
  { quoteNumber: "#12011", status: "AskedForEdit", customerIndex: 2, itemIndexes: [3], note: "SC Head asked Sales to revise board quality." },
  { quoteNumber: "#12012", status: "AskedForEdit", customerIndex: 3, itemIndexes: [1, 0], note: "HOD sent back for MOQ clarification." },
  { quoteNumber: "#12013", status: "Rejected", customerIndex: 0, itemIndexes: [2], note: "Rejected due to unsupported print treatment." },
  { quoteNumber: "#12014", status: "Rejected", customerIndex: 1, itemIndexes: [0], note: "Rejected after commercial review." },
];

const buildHistory = ({ status, salesUserId, hodUserId, scHeadUserId, gmUserId, createdAt, note }) => {
  const history = [
    {
      status: "Draft",
      updatedBy: salesUserId,
      updatedAt: createdAt,
      note: "Quote created by Sales.",
    },
  ];

  const approvalHistory = [
    {
      actorId: salesUserId,
      actorName: "Siow",
      actorEmail: "siow@amb.com.sg",
      actorRole: "Sales",
      action: status === "Pending" ? "Submitted" : "Created",
      fromStatus: status === "Pending" ? "Draft" : "",
      toStatus: status === "Pending" ? "Pending" : "Draft",
      note: status === "Pending" ? "Submitted to HOD queue." : "Draft quote created.",
      timestamp: createdAt,
    },
  ];

  if (["Pending", "Processing", "PendingApproval", "Approved", "AskedForEdit", "Rejected"].includes(status)) {
    history.push({
      status: "Pending",
      updatedBy: salesUserId,
      updatedAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
      note: "Submitted to HOD for approval.",
    });
  }

  if (["Processing", "PendingApproval", "Approved", "AskedForEdit", "Rejected"].includes(status)) {
    history.push({
      status: status === "AskedForEdit" ? "AskedForEdit" : "Processing",
      updatedBy: hodUserId,
      updatedAt: new Date(createdAt.getTime() + 90 * 60 * 1000),
      note:
        status === "AskedForEdit"
          ? "HOD sent back for revision."
          : "HOD approved and moved to SC Head queue.",
    });

    approvalHistory.push({
      actorId: hodUserId,
      actorName: "HOD Singapore",
      actorEmail: "hod@amb.com.sg",
      actorRole: "HOD",
      action: status === "AskedForEdit" ? "Sent Back" : "Approved",
      fromStatus: "Pending",
      toStatus: status === "AskedForEdit" ? "AskedForEdit" : "Processing",
      note:
        status === "AskedForEdit"
          ? "Please revise MOQ assumptions."
          : "Moved to SC Head queue.",
      timestamp: new Date(createdAt.getTime() + 90 * 60 * 1000),
    });
  }

  if (["PendingApproval", "Approved", "Rejected"].includes(status)) {
    history.push({
      status: "PendingApproval",
      updatedBy: scHeadUserId,
      updatedAt: new Date(createdAt.getTime() + 150 * 60 * 1000),
      note: "SC Head approved and routed to GM.",
    });

    approvalHistory.push({
      actorId: scHeadUserId,
      actorName: "SC Head Singapore",
      actorEmail: "schead@amb.com.sg",
      actorRole: "SC_HEAD",
      action: "Approved",
      fromStatus: "Processing",
      toStatus: "PendingApproval",
      note: "Moved to GM queue.",
      timestamp: new Date(createdAt.getTime() + 150 * 60 * 1000),
    });
  }

  if (["Approved", "Rejected"].includes(status)) {
    history.push({
      status,
      updatedBy: gmUserId,
      updatedAt: new Date(createdAt.getTime() + 210 * 60 * 1000),
      note,
    });

    approvalHistory.push({
      actorId: gmUserId,
      actorName: "GM Singapore",
      actorEmail: "gm@amb.com.sg",
      actorRole: "GM",
      action: status === "Approved" ? "Approved" : "Sent Back",
      fromStatus: "PendingApproval",
      toStatus: status,
      note,
      timestamp: new Date(createdAt.getTime() + 210 * 60 * 1000),
    });
  }

  return { history, approvalHistory };
};

const seedQuoteListData = async () => {
  try {
    await connectDatabase();

    const mockUserEmails = ["siow@amb.com.sg", "hod@amb.com.sg", "schead@amb.com.sg", "gm@amb.com.sg", "planning@amb.com.sg"];
    const mockCustomerNames = [
      "AMB Packaging Logistics",
      "Singapore Food Industry Ltd",
      "Changi Electronics Hub",
      "Jurong Fresh Produce Pte Ltd",
    ];
    const mockQuoteNumbers = quoteBlueprints.map((entry) => entry.quoteNumber);
    const mockOrderNumbers = quoteBlueprints.map((entry) => `ORD-${entry.quoteNumber.replace(/^#/, "")}`);

    await User.deleteMany({ email: { $in: mockUserEmails } });
    await Customer.deleteMany({ companyName: { $in: mockCustomerNames } });
    await Quote.deleteMany({ quoteNumber: { $in: mockQuoteNumbers } });
    await Order.deleteMany({ orderNumber: { $in: mockOrderNumbers } });

    const users = await User.insertMany([
      { name: "Siow", email: "siow@amb.com.sg", password: "demo1234", role: "Sales" },
      { name: "HOD Singapore", email: "hod@amb.com.sg", password: "demo1234", role: "HOD" },
      { name: "SC Head Singapore", email: "schead@amb.com.sg", password: "demo1234", role: "SC_HEAD" },
      { name: "GM Singapore", email: "gm@amb.com.sg", password: "demo1234", role: "GM" },
      { name: "Planning Singapore", email: "planning@amb.com.sg", password: "demo1234", role: "Planning" },
    ]);

    const customers = await Customer.insertMany([
      {
        companyName: "AMB Packaging Logistics",
        contactName: "Mr. Chen Wei",
        email: "wei.chen@ambpack.com",
        phone: "+65 6789 0123",
        address: "22 Penjuru Rd, Singapore 609142",
        taxCode: "S1234567A",
      },
      {
        companyName: "Singapore Food Industry Ltd",
        contactName: "Ms. Linda Tan",
        email: "linda.tan@sfi.com.sg",
        phone: "+65 6123 4567",
        address: "5 Wan Lee Rd, Jurong, Singapore 627937",
        taxCode: "S7654321B",
      },
      {
        companyName: "Changi Electronics Hub",
        contactName: "Mr. David Lim",
        email: "david.lim@changihub.com",
        phone: "+65 6234 5678",
        address: "15 Changi North Rise, Singapore 498755",
        taxCode: "S3456789C",
      },
      {
        companyName: "Jurong Fresh Produce Pte Ltd",
        contactName: "Ms. Sarah Goh",
        email: "sarah.goh@jurongfresh.sg",
        phone: "+65 6345 7788",
        address: "88 Benoi Sector, Singapore 629855",
        taxCode: "S9988776D",
      },
    ]);

    const salesUser = users.find((user) => user.role === "Sales");
    const hodUser = users.find((user) => user.role === "HOD");
    const scHeadUser = users.find((user) => user.role === "SC_HEAD");
    const gmUser = users.find((user) => user.role === "GM");

    const quotesPayload = quoteBlueprints.map((blueprint, index) => {
      const createdAt = new Date(`2026-06-${String(1 + index).padStart(2, "0")}T09:00:00.000Z`);
      const customer = customers[blueprint.customerIndex];
      const items = blueprint.itemIndexes.map((itemIndex, itemOffset) =>
        buildQuoteItem(quoteSpecs[itemIndex], {
          name: `${buildItemName(quoteSpecs[itemIndex])} SKU-${itemOffset + 1}`,
        })
      );
      const totalPlaceholder = items.reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0
      );
      const leadItem = items[0];
      const clientDetails = buildClientDetails(customer, {
        deliveryAddress:
          blueprint.customerIndex % 2 === 0
            ? `${customer.address} - Warehouse Bay ${blueprint.customerIndex + 1}`
            : customer.address,
      });
      const { history, approvalHistory } = buildHistory({
        status: blueprint.status,
        salesUserId: salesUser._id,
        hodUserId: hodUser._id,
        scHeadUserId: scHeadUser._id,
        gmUserId: gmUser._id,
        createdAt,
        note: blueprint.note,
      });

      return {
        quoteNumber: blueprint.quoteNumber,
        customerId: customer._id,
        clientDetails,
        status: blueprint.status,
        parameters: {
          boxStyle: leadItem.boxStyle,
          flute: leadItem.fluteType,
          moq: leadItem.moq,
        },
        type: leadItem.type,
        dimension: leadItem.dimension,
        boardQuality: leadItem.boardQuality,
        colors: leadItem.colors,
        joints: leadItem.joints,
        items,
        totalPlaceholder,
        createdBy: salesUser._id,
        history,
        approvalHistory,
        createdAt,
        updatedAt: history[history.length - 1].updatedAt,
      };
    });

    const quotes = await Quote.insertMany(quotesPayload);

    const approvedQuotes = quotes.filter((quote) => quote.status === "Approved");

    if (approvedQuotes.length > 0) {
      const orderPayload = approvedQuotes.map((quote) => ({
        orderNumber: `ORD-${quote.quoteNumber.replace(/^#/, "")}`,
        quoteId: quote._id,
        customerId: quote.customerId,
        status: "Draft",
        orderDetails: {
          boxStyle: quote.items[0].boxStyle,
          type: quote.items[0].type,
          dimension: quote.items[0].dimension,
          fluteType: quote.items[0].fluteType,
          boardQuality: quote.items[0].boardQuality,
          colors: quote.items[0].colors,
          joints: quote.items[0].joints,
          moq: quote.items[0].moq,
        },
        orderDetailsRows: quote.items.map((item) => ({
          boxStyle: item.boxStyle,
          type: item.type,
          dimension: item.dimension,
          fluteType: item.fluteType,
          boardQuality: item.boardQuality,
          colors: item.colors,
          joints: item.joints,
          moq: item.moq,
        })),
        quoteTotalLabel: DEFAULT_ORDER_TOTAL_LABEL,
        customerSnapshot: {
          companyName: quote.clientDetails.companyName,
          contactName: quote.clientDetails.contactPerson,
          email: quote.clientDetails.email,
          phone: quote.clientDetails.phoneNumber,
          address: quote.clientDetails.companyAddress,
          billingAddress: quote.clientDetails.billingAddress,
          deliveryAddress: quote.clientDetails.deliveryAddress,
        },
      }));

      await Order.insertMany(orderPayload);
    }

    console.log(`Seeded ${users.length} users, ${customers.length} customers, ${quotes.length} quotes.`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding quote list data:", error);
    process.exit(1);
  }
};

seedQuoteListData();
