import React, { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import apiService from "../services/api";
import StatusBadge from "../components/StatusBadge";

const SPEC_COLUMNS = [
  { key: "boxStyle", label: "Box Style" },
  { key: "type", label: "Type" },
  { key: "dimension", label: "Dimension" },
  { key: "fluteType", label: "Flute" },
  { key: "boardQuality", label: "Board Quality" },
  { key: "colors", label: "No. Color" },
  { key: "joints", label: "Joints" },
  { key: "moq", label: "MOQ" },
];

const APPROVAL_COPY = {
  HOD: {
    title: "HOD Approval Panel",
    approveLabel: "Approve to SC Head Queue",
    sendBackLabel: "Send Back to Sales",
    helper: "Review the quote details and add a note before moving it forward or sending it back.",
  },
  SC_HEAD: {
    title: "SC Head Approval Panel",
    approveLabel: "Approve to GM Queue",
    sendBackLabel: "Send Back to Sales",
    helper: "Use the same review flow as HOD, with the destination queue updated for GM review.",
  },
  GM: {
    title: "GM Approval Panel",
    approveLabel: "Final Approve Quote",
    sendBackLabel: "Send Back to Sales",
    helper: "Final commercial sign-off. Approve to unlock order conversion, or send back with a clear reason.",
  },
};

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

  const approvalPanelCopy = APPROVAL_COPY[currentUser.role];

  const handleWorkflowAction = async (action, fallbackNote) => {
    if ((action === "send_back" || action === "reject") && !note.trim()) {
      alert("Please enter a reason before sending back or rejecting the quote.");
      return;
    }

    try {
      await apiService.updateQuoteStatus(quote.id, {
        action,
        note: note.trim() || fallbackNote,
      });
      setNote("");
      fetchQuoteDetails();
    } catch (error) {
      console.error("Error updating workflow status:", error);
    }
  };

  const handleConvertToOrder = () => {
    navigate(`/orders/preview/${quote.id}`);
  };

  const translateStatus = (status) => {
    if (status === "Pending") return "Pending HOD";
    if (status === "Processing") return "Pending SC";
    if (status === "PendingApproval") return "Pending GM";
    if (status === "AskedForEdit") return "Edit Required";
    return status;
  };

  const steps = [
    { label: "Initiated (Sales)", key: "Draft" },
    { label: "HOD Review", key: "Pending" },
    { label: "SC Head Review", key: "Processing" },
    { label: "GM Final Sign-off", key: "PendingApproval" },
    { label: "Fully Approved", key: "Approved" },
  ];

  const getStepStatus = (stepKey) => {
    const statusList = ["Draft", "Pending", "Processing", "PendingApproval", "Approved"];
    const currentStatusIdx = statusList.indexOf(quote.status);
    const stepIdx = statusList.indexOf(stepKey);

    if (quote.status === "Rejected") {
      if (stepIdx < currentStatusIdx) return "completed";
      return stepKey === statusList[currentStatusIdx] ? "active rejected" : "";
    }

    if (quote.status === "AskedForEdit") {
      return stepKey === "Draft" ? "active askedforedit" : "";
    }

    if (stepIdx < currentStatusIdx) return "completed";
    if (stepIdx === currentStatusIdx) return "active";
    return "";
  };

  const subtotal = useMemo(
    () => (quote?.items || []).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [quote]
  );
  const discount = subtotal * 0.05;
  const tax = (subtotal - discount) * 0.1;
  const total = subtotal - discount + tax;

  const formatCurrency = (value) =>
    "S$" +
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const historyEntries = quote?.approvalHistory?.length
    ? quote.approvalHistory
    : quote?.history?.map((entry) => ({
        actorName: entry.updatedBy?.name || "System",
        actorRole: entry.updatedBy?.role || "Sales",
        action: translateStatus(entry.status),
        note: entry.note,
        timestamp: entry.updatedAt,
      })) || [];

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center" }}>Loading quote details...</div>;
  }

  if (!quote) return null;

  return (
    <div className="fade-in" style={{ textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h2>Quote: {quote.quoteNumber}</h2>
          <span className={`status-badge status-${quote.status}`}>{translateStatus(quote.status)}</span>
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

      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="stepper" style={{ overflowX: "auto" }}>
          {steps.map((step, idx) => {
            const stepStatus = getStepStatus(step.key);
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
                    color: isRejected || isEdit || isActive || isCompleted ? "#fff" : "",
                  }}
                >
                  {isRejected ? "x" : isEdit ? "e" : isCompleted ? "v" : idx + 1}
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

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        <div>
          <div className="card" style={{ marginBottom: "2rem" }}>
            <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
              Packaging Specifications
            </h3>
            <table className="items-table">
              <thead>
                <tr>
                  {SPEC_COLUMNS.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={item.id || `${item.name}-${index}`}>
                    {SPEC_COLUMNS.map((column) => (
                      <td key={`${column.key}-${index}`} style={{ fontWeight: column.key === "boxStyle" ? 600 : 500 }}>
                        {item[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginBottom: "2rem" }}>
            <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
              Client Details
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <p style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600, color: "var(--text-secondary)" }}>Company</p>
                <p style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1rem" }}>{quote.clientDetails.companyName}</p>

                <p style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600, color: "var(--text-secondary)" }}>Contact Person</p>
                <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>{quote.clientDetails.contactPerson}</p>

                <p style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600, color: "var(--text-secondary)" }}>Company Address</p>
                <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>{quote.clientDetails.companyAddress}</p>
              </div>

              <div>
                <p style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600, color: "var(--text-secondary)" }}>Phone / Email</p>
                <p style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: "1rem" }}>
                  {quote.clientDetails.phoneNumber} <br /> {quote.clientDetails.email}
                </p>

                <p style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600, color: "var(--text-secondary)" }}>Billing Address</p>
                <p style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: "1rem" }}>{quote.clientDetails.billingAddress}</p>

                <p style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600, color: "var(--text-secondary)" }}>Delivery Address</p>
                <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>{quote.clientDetails.deliveryAddress}</p>
              </div>
            </div>
          </div>

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

        <div>
          {canUserApprove() && approvalPanelCopy && (
            <div className="card glass-card" style={{ border: "2px solid var(--primary-border)", marginBottom: "2rem" }}>
              <h3 style={{ color: "var(--primary)", marginBottom: "0.5rem" }}>{approvalPanelCopy.title}</h3>
              <p style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>{approvalPanelCopy.helper}</p>

              <div className="form-group">
                <label className="form-label">Reason / Comments</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Enter review remarks or send-back reason..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  style={{ resize: "none", fontFamily: "var(--font-sans)", fontSize: "0.9rem" }}
                ></textarea>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button
                  onClick={() => handleWorkflowAction("approve", "Approved and routed to the next queue.")}
                  className="btn btn-primary"
                >
                  {approvalPanelCopy.approveLabel}
                </button>

                <button
                  onClick={() => handleWorkflowAction("send_back", "Revision required.")}
                  className="btn btn-warning"
                >
                  {approvalPanelCopy.sendBackLabel}
                </button>

                <button
                  onClick={() => handleWorkflowAction("reject", "Rejected by reviewer.")}
                  className="btn btn-danger"
                >
                  Reject Quote
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <h3>Approval History Log</h3>
            <div className="history-timeline">
              {historyEntries.map((log, index) => (
                <div key={index} className={`history-item ${index === historyEntries.length - 1 ? "active" : ""}`}>
                  <div className="history-dot"></div>
                  <div className="history-meta">
                    {new Date(log.timestamp).toLocaleString("en-GB")} | <strong>{log.actorName}</strong> ({log.actorRole})
                  </div>
                  <div className="history-content">
                    <span style={{ fontWeight: 600, color: "var(--primary)", marginRight: "8px" }}>
                      {log.action}
                      {log.toStatus ? ` -> ${translateStatus(log.toStatus)}` : ""}:
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
