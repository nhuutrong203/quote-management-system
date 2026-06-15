import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiService from "../services/api";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrderPreview = async () => {
      setLoading(true);

      try {
        const response = await apiService.getOrderFormPreview(quoteId);
        setOrderPreview(response.data);
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
          <button className="btn btn-primary" type="button">
            Print Shell
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
          <span className="status-badge status-Draft">{orderPreview.status}</span>
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
              <span className="order-preview-customer-value">{orderPreview.customer.companyName}</span>
            </div>
            <div className="order-preview-customer-card">
              <span className="order-preview-customer-label">Contact Person</span>
              <span className="order-preview-customer-value">{orderPreview.customer.contactName}</span>
            </div>
            <div className="order-preview-customer-card">
              <span className="order-preview-customer-label">Email</span>
              <span className="order-preview-customer-value">{orderPreview.customer.email}</span>
            </div>
            <div className="order-preview-customer-card">
              <span className="order-preview-customer-label">Phone</span>
              <span className="order-preview-customer-value">{orderPreview.customer.phone}</span>
            </div>
            <div className="order-preview-customer-card order-preview-customer-card-wide">
              <span className="order-preview-customer-label">Billing Address</span>
              <span className="order-preview-customer-value">{orderPreview.customer.billingAddress}</span>
            </div>
            <div className="order-preview-customer-card order-preview-customer-card-wide">
              <span className="order-preview-customer-label">Delivery Address</span>
              <span className="order-preview-customer-value">{orderPreview.customer.deliveryAddress}</span>
            </div>
          </div>
        </div>

        <div className="order-preview-footer-note">SC print view prep shell. Layout only, ready for downstream print/PDF work.</div>
      </div>
    </div>
  );
};

export default OrderFormPreview;
