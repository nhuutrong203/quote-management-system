import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import apiService from "../services/api";
import StatusBadge from "../components/StatusBadge";

export const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  const fetchQuoteDetails = async () => {
    setLoading(true);
    try {
      const response = await apiService.getQuoteById(id);
      if (response.data) {
        setQuote(response.data);
      } else {
        navigate("/quotes");
      }
    } catch (error) {
      console.error("Error fetching quote details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuoteDetails();
  }, [id]);

  const canUserApprove = () => {
    if (!quote) return false;
    const role = currentUser.role;
    const status = quote.status;

    if (role === "HOD" && status === "Pending") return true;
    if (role === "SC_HEAD" && status === "Processing") return true;
    if (role === "GM" && status === "PendingApproval") return true;

    return false;
  };

  const handleWorkflowAction = async (nextStatus, noteText) => {
    if (!noteText.trim()) {
      alert("Please enter a note for this action.");
      return;
    }

    try {
      await apiService.updateQuote(quote.id, {
        status: nextStatus,
        updatedBy: currentUser,
        note: noteText
      });
      setNote("");
      fetchQuoteDetails(); // reload data
    } catch (error) {
      console.error("Error updating workflow status:", error);
    }
  };

  const handleConvertToOrder = () => {
    navigate(`/orders/preview/${quote.id}`);
  };

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center" }}>Loading quote details...</div>;
  }

  if (!quote) return null;

  // Pricing calculations
  const subtotal = quote.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discount = subtotal * 0.05;
  const tax = (subtotal - discount) * 0.1;
  const total = subtotal - discount + tax;

  const formatCurrency = (value) => {
    return "S$" + new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Define steps for stepper
  const steps = [
    { label: "Initiated (Sales)", key: "Draft" },
    { label: "HOD Review", key: "Pending" },
    { label: "SC Head Review", key: "Processing" },
    { label: "GM Final Sign-off", key: "PendingApproval" },
    { label: "Fully Approved", key: "Approved" }
  ];

  // Helper to determine stepper class
  const getStepStatus = (stepKey, index) => {
    const statusList = ["Draft", "Pending", "Processing", "PendingApproval", "Approved"];
    const currentStatusIdx = statusList.indexOf(quote.status);
    const stepIdx = statusList.indexOf(stepKey);

    if (quote.status === "Rejected") {
      if (stepIdx < currentStatusIdx) return "completed";
      if (stepKey === statusList[currentStatusIdx]) return "active rejected";
      return "";
    }

    if (quote.status === "AskedForEdit") {
      if (stepKey === "Draft") return "active askedforedit";
      return "";
    }

    if (stepIdx < currentStatusIdx) return "completed";
    if (stepIdx === currentStatusIdx) return "active";
    return "";
  };

  const translateStatus = (status) => {
    if (status === "Pending") return "Pending HOD";
    if (status === "Processing") return "Pending SC";
    if (status === "PendingApproval") return "Pending GM";
    if (status === "AskedForEdit") return "Edit Required";
    return status;
  };

  return (
    <div className="fade-in" style={{ textAlign: "left" }}>
      {/* Header Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h2>Quote: {quote.quoteNumber}</h2>
          <StatusBadge status={quote.status} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link to="/quotes" className="btn btn-secondary">Back</Link>
          {currentUser.role === "Sales" && (quote.status === "Draft" || quote.status === "AskedForEdit") && (
            <Link to={`/quotes/edit/${quote.id}`} className="btn btn-primary">Edit</Link>
          )}
          {currentUser.role === "Sales" && quote.status === "Approved" && (
            <button onClick={handleConvertToOrder} className="btn btn-success">Convert to Order</button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="stepper" style={{ overflowX: "auto" }}>
          {steps.map((step, idx) => {
            const stepStatus = getStepStatus(step.key, idx);
            const isActive = stepStatus.includes("active");
            const isCompleted = stepStatus === "completed";
            const isRejected = stepStatus.includes("rejected");
            const isEdit = stepStatus.includes("askedforedit");

            return (
              <div key={idx} className={`step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`} style={{ minWidth: "120px" }}>
                <div
                  className="step-bubble"
                  style={{
                    backgroundColor: isRejected ? "var(--danger)" : isEdit ? "#db2777" : "",
                    borderColor: isRejected ? "var(--danger)" : isEdit ? "#db2777" : "",
                    color: isRejected || isEdit || isActive || isCompleted ? "#fff" : ""
                  }}
                >
                  {isRejected ? "✕" : isEdit ? "✎" : isCompleted ? "✓" : idx + 1}
                </div>
                <div className="step-label" style={{ color: isRejected ? "var(--danger)" : isEdit ? "#db2777" : "" }}>
                  {step.label}
                  {isRejected && " (Rejected)"}
                  {isEdit && " (Edit Req)"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Packaging Specifications */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
          Packaging Specifications
        </h3>
        <div className="specs-panel">
          <div className="spec-badge-box">
            <span className="spec-badge-label">Box Style</span>
            <span className="spec-badge-value">{quote.boxStyle || "Corrugated"}</span>
          </div>
          <div className="spec-badge-box">
            <span className="spec-badge-label">Type</span>
            <span className="spec-badge-value">{quote.type || "RSC"}</span>
          </div>
          <div className="spec-badge-box">
            <span className="spec-badge-label">Dimension</span>
            <span className="spec-badge-value" style={{ fontFamily: "monospace" }}>{quote.dimension || "ID (L x W x H mm)"}</span>
          </div>
          <div className="spec-badge-box">
            <span className="spec-badge-label">Flute Type</span>
            <span className="spec-badge-value">{quote.fluteType || "B"}</span>
          </div>
          <div className="spec-badge-box">
            <span className="spec-badge-label">Board Quality</span>
            <span className="spec-badge-value">{quote.boardQuality || "150 GSM"}</span>
          </div>
          <div className="spec-badge-box">
            <span className="spec-badge-label">Colors</span>
            <span className="spec-badge-value">{quote.colors || "2"}</span>
          </div>
          <div className="spec-badge-box">
            <span className="spec-badge-label">Joints</span>
            <span className="spec-badge-value">{quote.joints || "Glue"}</span>
          </div>
          <div className="spec-badge-box">
            <span className="spec-badge-label">MOQ</span>
            <span className="spec-badge-value">{quote.moq || "5k"}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        {/* Left column: customer info and items */}
        <div>
          {/* Customer Info Card */}
          <div className="card" style={{ marginBottom: "2rem" }}>
            <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
              Customer Details
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <p style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600, color: "var(--text-secondary)" }}>Company</p>
                <p style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>{quote.customer.companyName}</p>
                
                <p style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600, color: "var(--text-secondary)" }}>Contact Person</p>
                <p style={{ fontWeight: 600, fontSize: "1.025", color: "var(--text-primary)" }}>{quote.customer.contactName}</p>
              </div>
              
              <div>
                <p style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600, color: "var(--text-secondary)" }}>Phone / Email</p>
                <p style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: "1.025rem" }}>
                  {quote.customer.phone} <br /> {quote.customer.email}
                </p>
                
                <p style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600, color: "var(--text-secondary)" }}>Billing Address</p>
                <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>{quote.customer.address}</p>
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="card">
            <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
              Itemized Quote Details
            </h3>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Product / Service</th>
                  <th style={{ width: "80px", textAlign: "right" }}>Qty</th>
                  <th style={{ width: "160px", textAlign: "right" }}>Unit Price (S$)</th>
                  <th style={{ width: "160px", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td style={{ textAlign: "right" }}>{new Intl.NumberFormat("en-US").format(item.quantity)}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="totals-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="summary-row" style={{ color: "var(--danger)" }}>
                <span>Bulk Discount (5%):</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
              <div className="summary-row" style={{ color: "var(--success)" }}>
                <span>GST / Tax (10%):</span>
                <span>+{formatCurrency(tax)}</span>
              </div>
              <div className="summary-row grand-total">
                <span>Quote Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: approval panel and history log */}
        <div>
          {/* Approval Action Panel */}
          {canUserApprove() && (
            <div className="card glass-card" style={{ border: "2px solid var(--primary-border)", marginBottom: "2rem" }}>
              <h3 style={{ color: "var(--primary)", marginBottom: "0.5rem" }}>Approval Panel ({currentUser.role})</h3>
              <p style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
                Please carefully review the pricing, discount, and board configurations before deciding.
              </p>
              
              <div className="form-group">
                <label className="form-label">Comments / Reason for Rejection</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Enter remarks or change request details..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ resize: "none", fontFamily: "var(--font-sans)", fontSize: "0.9rem" }}
                ></textarea>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button
                  onClick={() => {
                    const nextMap = { Pending: "Processing", Processing: "PendingApproval", PendingApproval: "Approved" };
                    handleWorkflowAction(nextMap[quote.status], note || "Approved.");
                  }}
                  className="btn btn-primary"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Approve Quote
                </button>
                
                <button
                  onClick={() => handleWorkflowAction("AskedForEdit", note || "Revision required.")}
                  className="btn btn-warning"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                  </svg>
                  Request Changes
                </button>

                <button
                  onClick={() => handleWorkflowAction("Rejected", note || "Quote rejected.")}
                  className="btn btn-danger"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Reject Quote
                </button>
              </div>
            </div>
          )}

          {/* History log card */}
          <div className="card">
            <h3>Workflow History Log</h3>
            <div className="history-timeline">
              {quote.history.map((log, index) => (
                <div key={index} className={`history-item ${index === quote.history.length - 1 ? "active" : ""}`}>
                  <div className="history-dot"></div>
                  <div className="history-meta">
                    {new Date(log.updatedAt).toLocaleString("en-GB")} | <strong>{log.updatedBy.name}</strong> ({log.updatedBy.role})
                  </div>
                  <div className="history-content">
                    <span style={{ fontWeight: 600, color: "var(--primary)", marginRight: "8px" }}>
                      {translateStatus(log.status) === "Approved" ? "Approved" : translateStatus(log.status)}:
                    </span>
                    {log.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetail;
