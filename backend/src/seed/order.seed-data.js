const DEFAULT_ORDER_TOTAL_LABEL = "S$125,000";

const DEFAULT_ORDER_DETAIL_ROWS = [
  {
    boxStyle: "Corrugated",
    type: "RSC",
    dimension: "ID 400x300x200",
    fluteType: "B",
    boardQuality: "125 GSM",
    colors: "4 colors",
    joints: "Glue",
    moq: "5000",
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
  },
];

const mockOrderPreviews = [
  {
    id: "mock-order-1",
    orderId: "ORD-12345",
    quoteNumber: "#12345",
    status: "Draft",
    quoteTotalLabel: DEFAULT_ORDER_TOTAL_LABEL,
    customer: {
      companyName: "Customer Name Placeholder",
      contactName: "Contact Placeholder",
      email: "customer@example.com",
      phone: "+65 6000 0000",
      address: "Customer address placeholder",
      billingAddress: "Billing address placeholder",
      deliveryAddress: "Delivery address placeholder",
    },
    orderDetailsRows: DEFAULT_ORDER_DETAIL_ROWS,
  },
  {
    id: "mock-order-2",
    orderId: "ORD-12346",
    quoteNumber: "#12346",
    status: "Draft",
    quoteTotalLabel: DEFAULT_ORDER_TOTAL_LABEL,
    customer: {
      companyName: "AMB Packaging Logistics",
      contactName: "Mr. Chen Wei",
      email: "wei.chen@ambpack.com",
      phone: "+65 6789 0123",
      address: "22 Penjuru Rd, Singapore 609142",
      billingAddress: "22 Penjuru Rd, Singapore 609142",
      deliveryAddress: "29 Gul Circle, Singapore 629585",
    },
    orderDetailsRows: DEFAULT_ORDER_DETAIL_ROWS,
  },
];

module.exports = {
  DEFAULT_ORDER_TOTAL_LABEL,
  DEFAULT_ORDER_DETAIL_ROWS,
  mockOrderPreviews,
};
