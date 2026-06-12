const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDatabase = require("../config/database");

const User = require("../modules/users/user.model");
const Customer = require("../modules/customers/customer.model");
const Quote = require("../modules/quotes/quote.model");

const seedQuoteListData = async () => {
  try {
    await connectDatabase();

    const mockUserEmails = [
      "siow@amb.com.sg",
      "hod@amb.com.sg",
      "schead@amb.com.sg",
      "gm@amb.com.sg",
    ];

    const mockCustomerNames = [
      "ABC Corporation",
      "Green Retail Pte Ltd",
      "Ocean Foods Asia",
    ];

    const mockQuoteNumbers = [
      "Q-12345",
      "Q-12346",
      "Q-12347",
      "Q-12348",
      "Q-12349",
      "Q-12350",
      "Q-12351",
    ];

    await User.deleteMany({ email: { $in: mockUserEmails } });
    await Customer.deleteMany({ companyName: { $in: mockCustomerNames } });
    await Quote.deleteMany({ quoteNumber: { $in: mockQuoteNumbers } });

    const users = await User.insertMany([
      {
        name: "Sales User",
        email: "siow@amb.com.sg",
        password: "demo1234",
        role: "Sales",
      },
      {
        name: "HOD User",
        email: "hod@amb.com.sg",
        password: "demo1234",
        role: "HOD",
      },
      {
        name: "SC Head User",
        email: "schead@amb.com.sg",
        password: "demo1234",
        role: "SC_HEAD",
      },
      {
        name: "GM User",
        email: "gm@amb.com.sg",
        password: "demo1234",
        role: "GM",
      },
    ]);

    const customers = await Customer.insertMany([
      {
        companyName: "ABC Corporation",
        contactName: "John Tan",
        email: "john.tan@abc.com",
        phone: "+65 9123 4567",
        address: "Singapore",
        taxCode: "TAX-ABC-001",
      },
      {
        companyName: "Green Retail Pte Ltd",
        contactName: "Mary Lim",
        email: "mary.lim@greenretail.com",
        phone: "+65 9234 5678",
        address: "Singapore",
        taxCode: "TAX-GR-002",
      },
      {
        companyName: "Ocean Foods Asia",
        contactName: "David Wong",
        email: "david.wong@oceanfoods.com",
        phone: "+65 9345 6789",
        address: "Singapore",
        taxCode: "TAX-OF-003",
      },
    ]);

    const salesUser = users.find((user) => user.role === "Sales");

    await Quote.insertMany([
      {
        quoteNumber: "Q-12345",
        customerId: customers[0]._id,
        status: "Draft",
        parameters: {
          boxStyle: "Corrugated / RSC",
          flute: "B Flute",
          moq: "5000",
        },
        totalPlaceholder: 125000,
        createdBy: salesUser._id,
      },
      {
        quoteNumber: "Q-12346",
        customerId: customers[1]._id,
        status: "Pending",
        parameters: {
          boxStyle: "Corrugated / FOL",
          flute: "C Flute",
          moq: "3000",
        },
        totalPlaceholder: 125000,
        createdBy: salesUser._id,
      },
      {
        quoteNumber: "Q-12347",
        customerId: customers[2]._id,
        status: "Processing",
        parameters: {
          boxStyle: "Offset / Tray",
          flute: "N/A",
          moq: "10000",
        },
        totalPlaceholder: 125000,
        createdBy: salesUser._id,
      },
      {
        quoteNumber: "Q-12348",
        customerId: customers[0]._id,
        status: "PendingApproval",
        parameters: {
          boxStyle: "Corrugated / Two-piece",
          flute: "BE Flute",
          moq: "5000",
        },
        totalPlaceholder: 125000,
        createdBy: salesUser._id,
      },
      {
        quoteNumber: "Q-12349",
        customerId: customers[1]._id,
        status: "Approved",
        parameters: {
          boxStyle: "Offset Laminated / Sleeve",
          flute: "E Flute",
          moq: "3000",
        },
        totalPlaceholder: 125000,
        createdBy: salesUser._id,
      },
      {
        quoteNumber: "Q-12350",
        customerId: customers[2]._id,
        status: "Rejected",
        parameters: {
          boxStyle: "Corrugated / RSC",
          flute: "BC Flute",
          moq: "10000",
        },
        totalPlaceholder: 125000,
        createdBy: salesUser._id,
      },
      {
        quoteNumber: "Q-12351",
        customerId: customers[0]._id,
        status: "AskedForEdit",
        parameters: {
          boxStyle: "Offset / Tray",
          flute: "F Flute",
          moq: "Based on enquiry",
        },
        totalPlaceholder: 125000,
        createdBy: salesUser._id,
      },
    ]);

    console.log("Quote list seed data inserted successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seedQuoteListData();