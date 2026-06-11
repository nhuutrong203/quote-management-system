export const MOCK_USERS = [
  {
    id: "u1",
    name: "Siow",
    email: "siow@amb.com.sg",
    role: "Sales/SC",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=siow"
  },
  {
    id: "u2",
    name: "HOD Singapore",
    email: "hod@amb.com.sg",
    role: "HOD",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=singhod"
  },
  {
    id: "u3",
    name: "SC Head Singapore",
    email: "schead@amb.com.sg",
    role: "SC Head",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=schead"
  },
  {
    id: "u4",
    name: "GM Singapore",
    email: "gm@amb.com.sg",
    role: "GM",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=singgm"
  }
];

export const MOCK_CUSTOMERS = [
  {
    id: "c1",
    companyName: "AMB Packaging Logistics",
    contactName: "Mr. Chen Wei",
    email: "wei.chen@ambpack.com",
    phone: "+65 6789 0123",
    address: "22 Penjuru Rd, Singapore 609142",
    taxCode: "S1234567A"
  },
  {
    id: "c2",
    companyName: "Singapore Food Industry Ltd",
    contactName: "Ms. Linda Tan",
    email: "linda.tan@sfi.com.sg",
    phone: "+65 6123 4567",
    address: "5 Wan Lee Rd, Jurong, Singapore 627937",
    taxCode: "S7654321B"
  },
  {
    id: "c3",
    companyName: "Changi Electronics Hub",
    contactName: "Mr. David Lim",
    email: "david.lim@changihub.com",
    phone: "+65 6234 5678",
    address: "15 Changi North Rise, Singapore 498755",
    taxCode: "S3456789C"
  }
];

export const MOCK_QUOTE_SETUP = {
  customerType: "Enterprise",
  currency: "S$",
  paymentTerm: "Net 30",
  discountRate: 5, // 5%
  taxRate: 10 // 10%
};

export const INITIAL_QUOTES = [
  {
    id: "q1",
    quoteNumber: "#12345",
    customer: MOCK_CUSTOMERS[0],
    status: "Approved",
    boxStyle: "Custom RSC",
    type: "Single Wall",
    dimension: "40x30x30",
    fluteType: "B-Flute Single Wall",
    boardQuality: "K175/M/K175",
    colors: "2-Colors",
    joints: "Glued",
    moq: "5,000 Pcs",
    items: [
      { name: "Custom RSC Box Standard Production", quantity: 5000, unitPrice: 25.00 } // S$125,000.00
    ],
    createdBy: MOCK_USERS[0],
    createdAt: "2026-06-08T14:30:00.000Z",
    history: [
      { status: "Draft", updatedBy: MOCK_USERS[0], updatedAt: "2026-06-08T10:30:00.000Z", note: "Khởi tạo báo giá nháp" },
      { status: "Pending", updatedBy: MOCK_USERS[0], updatedAt: "2026-06-08T11:00:00.000Z", note: "Gửi yêu cầu phê duyệt HOD" },
      { status: "Processing", updatedBy: MOCK_USERS[1], updatedAt: "2026-06-08T13:00:00.000Z", note: "HOD approved, chuyển tiếp SC Head duyệt đơn giá" },
      { status: "PendingApproval", updatedBy: MOCK_USERS[2], updatedAt: "2026-06-08T14:00:00.000Z", note: "SC Head approved, chuyển tiếp GM ký duyệt" },
      { status: "Approved", updatedBy: MOCK_USERS[3], updatedAt: "2026-06-08T14:30:00.000Z", note: "GM ký duyệt chính thức" }
    ]
  },
  {
    id: "q2",
    quoteNumber: "#12346",
    customer: MOCK_CUSTOMERS[1],
    status: "Pending", // Chờ HOD duyệt
    boxStyle: "Die-Cut Folder",
    type: "Single Wall",
    dimension: "25x20x15",
    fluteType: "E-Flute Micro",
    boardQuality: "W150/T/K150",
    colors: "Full",
    joints: "Stitched",
    moq: "2,500 Pcs",
    items: [
      { name: "Die-Cut Folder Box Production", quantity: 2500, unitPrice: 19.50 } // S$48,750.00
    ],
    createdBy: MOCK_USERS[0],
    createdAt: "2026-06-09T09:15:00.000Z",
    history: [
      { status: "Draft", updatedBy: MOCK_USERS[0], updatedAt: "2026-06-09T08:15:00.000Z", note: "Tạo nháp" },
      { status: "Pending", updatedBy: MOCK_USERS[0], updatedAt: "2026-06-09T09:15:00.000Z", note: "Gửi yêu cầu phê duyệt HOD" }
    ]
  },
  {
    id: "q3",
    quoteNumber: "#12347",
    customer: MOCK_CUSTOMERS[2],
    status: "Approved",
    boxStyle: "Double Wall Master",
    type: "Double Wall",
    dimension: "50x40x40",
    fluteType: "BC-Flute Double",
    boardQuality: "K275/M/K275",
    colors: "2-Colors",
    joints: "Stitched",
    moq: "1,000 Pcs",
    items: [
      { name: "Double Wall Master Box Production", quantity: 1000, unitPrice: 32.20 } // S$32,200.00
    ],
    createdBy: MOCK_USERS[0],
    createdAt: "2026-06-07T16:45:00.000Z",
    history: [
      { status: "Draft", updatedBy: MOCK_USERS[0], updatedAt: "2026-06-07T14:20:00.000Z", note: "Tạo nháp" },
      { status: "Pending", updatedBy: MOCK_USERS[0], updatedAt: "2026-06-07T15:00:00.000Z", note: "Gửi duyệt HOD" },
      { status: "Processing", updatedBy: MOCK_USERS[1], updatedAt: "2026-06-07T15:30:00.000Z", note: "HOD approved" },
      { status: "PendingApproval", updatedBy: MOCK_USERS[2], updatedAt: "2026-06-07T16:00:00.000Z", note: "SC Head approved" },
      { status: "Approved", updatedBy: MOCK_USERS[3], updatedAt: "2026-06-07T16:45:00.000Z", note: "GM approved" }
    ]
  },
  {
    id: "q4",
    quoteNumber: "#12340",
    customer: MOCK_CUSTOMERS[0],
    status: "AskedForEdit",
    boxStyle: "Corrugated",
    type: "Single Wall",
    dimension: "30x20x20",
    fluteType: "B Flute",
    boardQuality: "K125/M/K125",
    colors: "1-Color",
    joints: "Glued",
    moq: "3,000 pcs",
    items: [
      { name: "Corrugated RSC Box Production", quantity: 3000, unitPrice: 10.50 }
    ],
    createdBy: MOCK_USERS[0],
    createdAt: "2026-06-05T10:00:00.000Z",
    history: [
      { status: "Draft", updatedBy: MOCK_USERS[0], updatedAt: "2026-06-05T10:00:00.000Z", note: "Tạo nháp" },
      { status: "Pending", updatedBy: MOCK_USERS[0], updatedAt: "2026-06-05T11:00:00.000Z", note: "Gửi duyệt HOD" },
      { status: "AskedForEdit", updatedBy: MOCK_USERS[1], updatedAt: "2026-06-05T12:00:00.000Z", note: "Yêu cầu sửa đổi: Cần giảm đơn giá xuống dưới S$11.00" }
    ]
  },
  {
    id: "q5",
    quoteNumber: "#12338",
    customer: MOCK_CUSTOMERS[1],
    status: "Rejected",
    boxStyle: "Poly-Lined",
    type: "Single Wall",
    dimension: "35x25x25",
    fluteType: "C Flute",
    boardQuality: "W125/T/K125",
    colors: "Full",
    joints: "Glued",
    moq: "10,000 pcs",
    items: [
      { name: "Poly-Lined Box Custom Production", quantity: 10000, unitPrice: 5.50 }
    ],
    createdBy: MOCK_USERS[0],
    createdAt: "2026-06-04T09:00:00.000Z",
    history: [
      { status: "Draft", updatedBy: MOCK_USERS[0], updatedAt: "2026-06-04T09:00:00.000Z", note: "Tạo nháp" },
      { status: "Pending", updatedBy: MOCK_USERS[0], updatedAt: "2026-06-04T10:00:00.000Z", note: "Gửi duyệt" },
      { status: "Rejected", updatedBy: MOCK_USERS[1], updatedAt: "2026-06-04T11:30:00.000Z", note: "Từ chối phê duyệt: Budget constraint (Giới hạn ngân sách khách hàng không đáp ứng được)" }
    ]
  }
];
