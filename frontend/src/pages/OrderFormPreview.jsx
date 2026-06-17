import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiService from "../services/api";
import StatusBadge from "../components/StatusBadge";

const DETAIL_COLUMNS = [
  { key: "boxStyle", label: "Box Style" },
  { key: "type", label: "Type" },
  { key: "dimension", label: "Dimension" },
  { key: "fluteType", label: "Flute" },
  { key: "boardQuality", label: "Board Quality" },
  { key: "colors", label: "No. Color" },
  { key: "joints", label: "Joints" },
  { key: "moq", label: "MOQ" },
];

export const OrderFormPreview = () => {
  const { quoteId } = useParams();
  const [orderPreview, setOrderPreview] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    billingAddress: "",
    deliveryAddress: "",
  });

  useEffect(() => {
    const loadOrderPreview = async () => {
      setLoading(true);

      try {
        const [response, quoteResponse] = await Promise.all([
          apiService.getOrderFormPreview(quoteId),
          quoteId ? apiService.getQuoteById(quoteId).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        ]);
        setOrderPreview(response.data);
        setQuote(quoteResponse.data);
        if (response.data?.customer) {
          setCustomer({
            companyName: response.data.customer.companyName || "",
            contactName: response.data.customer.contactName || "",
            email: response.data.customer.email || "",
            phone: response.data.customer.phone || "",
            billingAddress: response.data.customer.billingAddress || response.data.customer.address || "",
            deliveryAddress: response.data.customer.deliveryAddress || response.data.customer.address || "",
          });
        }
      } catch (error) {
        console.error("Error loading order form preview:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrderPreview();
  }, [quoteId]);

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center" }}>Loading order form preview...</div>;
  }

  if (!orderPreview) {
    return (
      <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
        Unable to load order form preview.
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ textAlign: "left" }}>
      <div
        className="order-preview-actions-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
            }}
          >
            Sales Coordinator Print Preview
          </span>
          <h2
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "var(--primary)",
              margin: "0.25rem 0 0 0",
            }}
          >
            Order Form Preview
          </h2>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link to={quoteId ? `/quotes/${quoteId}` : "/quotes"} className="btn btn-secondary">
            Back
          </Link>
          <button onClick={() => window.print()} className="btn btn-primary" type="button">
            Print Order Form
          </button>
        </div>
      </div>

      <div className="order-preview-shell">
        <div className="order-preview-header">
          <div className="order-preview-brand">
            <div className="order-preview-logo">
              <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>AMB</span>
            </div>
            <div>
              <div className="order-preview-brand-title">AMB Packaging</div>
              <div className="order-preview-brand-subtitle">Logo Placeholder</div>
            </div>
          </div>
          <StatusBadge status={quote?.status || orderPreview.status} />
        </div>

        <div className="order-preview-title-row">
          <div>
            <div className="order-preview-eyebrow">Order Form</div>
            <h3 className="order-preview-order-number">ORDER FORM {orderPreview.quoteNumber}</h3>
            <div className="order-preview-quote-reference">Order ID: {orderPreview.orderId}</div>
          </div>
          <div className="order-preview-total-card">
            <span className="order-preview-total-label">Quote Total</span>
            <span className="order-preview-total-value">{orderPreview.quoteTotalLabel}</span>
          </div>
        </div>

        <div className="order-preview-section">
          <div className="order-preview-section-title">Full Quote Information</div>
          <div className="order-preview-info-grid">
            <div className="order-preview-info-cell">
              <span className="order-preview-info-label">Quote Number</span>
              <span className="order-preview-info-value">{quote?.quoteNumber || orderPreview.quoteNumber}</span>
            </div>
            <div className="order-preview-info-cell">
              <span className="order-preview-info-label">Quote Status</span>
              <span className="order-preview-info-value">{quote?.status || "Approved"}</span>
            </div>
            <div className="order-preview-info-cell">
              <span className="order-preview-info-label">Created By</span>
              <span className="order-preview-info-value">{quote?.createdBy?.name || "Sales/SC"}</span>
            </div>
            <div className="order-preview-info-cell">
              <span className="order-preview-info-label">Issue Date</span>
              <span className="order-preview-info-value">
                {quote?.createdAt ? new Date(quote.createdAt).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB")}
              </span>
            </div>
            <div className="order-preview-info-cell">
              <span className="order-preview-info-label">Box Style</span>
              <span className="order-preview-info-value">{quote?.boxStyle || orderPreview.orderDetailsRows[0]?.boxStyle || "Corrugated"}</span>
            </div>
            <div className="order-preview-info-cell">
              <span className="order-preview-info-label">Dimension</span>
              <span className="order-preview-info-value">{quote?.dimension || orderPreview.orderDetailsRows[0]?.dimension || "ID (L x W x H mm)"}</span>
            </div>
            <div className="order-preview-info-cell">
              <span className="order-preview-info-label">Flute</span>
              <span className="order-preview-info-value">{quote?.fluteType || orderPreview.orderDetailsRows[0]?.fluteType || "B"}</span>
            </div>
            <div className="order-preview-info-cell">
              <span className="order-preview-info-label">Total Amount</span>
              <span className="order-preview-info-value">{quote?.totalDisplay || orderPreview.quoteTotalLabel}</span>
            </div>
          </div>
        </div>

        <div className="order-preview-section">
          <div className="order-preview-section-title">Order Details</div>
          <div className="order-preview-table-wrap">
            <table className="order-preview-table">
              <thead>
                <tr>
                  {DETAIL_COLUMNS.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderPreview.orderDetailsRows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    {DETAIL_COLUMNS.map((column) => (
                      <td key={`${column.key}-${rowIndex}`}>{row[column.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="order-preview-section">
          <div className="order-preview-section-title">Customer Section</div>
          <div className="order-preview-customer-grid">
            <div className="order-preview-customer-card">
              <span className="order-preview-customer-label">Company Name</span>
              <input
                type="text"
                className="order-preview-customer-input"
                value={customer.companyName}
                onChange={(e) => setCustomer({ ...customer, companyName: e.target.value })}
              />
            </div>
            <div className="order-preview-customer-card">
              <span className="order-preview-customer-label">Contact Person</span>
              <input
                type="text"
                className="order-preview-customer-input"
                value={customer.contactName}
                onChange={(e) => setCustomer({ ...customer, contactName: e.target.value })}
              />
            </div>
            <div className="order-preview-customer-card">
              <span className="order-preview-customer-label">Email</span>
              <input
                type="email"
                className="order-preview-customer-input"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              />
            </div>
            <div className="order-preview-customer-card">
              <span className="order-preview-customer-label">Phone</span>
              <input
                type="text"
                className="order-preview-customer-input"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              />
            </div>
            <div className="order-preview-customer-card order-preview-customer-card-wide">
              <span className="order-preview-customer-label">Billing Address</span>
              <textarea
                className="order-preview-customer-textarea"
                value={customer.billingAddress}
                onChange={(e) => setCustomer({ ...customer, billingAddress: e.target.value })}
              />
            </div>
            <div className="order-preview-customer-card order-preview-customer-card-wide">
              <span className="order-preview-customer-label">Delivery Address</span>
              <textarea
                className="order-preview-customer-textarea"
                value={customer.deliveryAddress}
                onChange={(e) => setCustomer({ ...customer, deliveryAddress: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="order-preview-section">
          <div className="order-preview-section-title">Total Amount</div>
          <div className="order-preview-total-card" style={{ alignItems: "flex-start", maxWidth: "320px" }}>
            <span className="order-preview-total-label">Grand Total</span>
            <span className="order-preview-total-value">{quote?.totalDisplay || orderPreview.quoteTotalLabel}</span>
          </div>
        </div>

        <div className="order-preview-section">
          <div className="order-preview-section-title">Signatures</div>
          <div className="order-preview-signature-row">
            <div className="order-preview-signature-box">
              <div className="order-preview-signature-line">Prepared by Sales/SC</div>
            </div>
            <div className="order-preview-signature-box">
              <div className="order-preview-signature-line">Customer Signature</div>
            </div>
            <div className="order-preview-signature-box">
              <div className="order-preview-signature-line">Date</div>
            </div>
          </div>
        </div>

        <div className="order-preview-footer-note">In-app SC print view. Use browser print dialog to generate the physical copy.</div>
      </div>
    </div>
  );
};

export default OrderFormPreview;
