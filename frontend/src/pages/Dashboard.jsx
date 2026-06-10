import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import apiService from "../services/api";

export const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pendingAction: 0,
    approved: 0,
    rejected: 0,
    value: 0
  });

  const fetchQuotes = async () => {
    try {
      const response = await apiService.getQuotes();
      const allQuotes = response.data;
      setQuotes(allQuotes);

      // Compute statistics based on user roles
      let actionCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;
      let totalValue = 0;

      allQuotes.forEach((q) => {
        // Calculate total price of all items in quote
        const subtotal = q.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const discount = subtotal * 0.05; // 5%
        const tax = (subtotal - discount) * 0.1; // 10%
        const total = subtotal - discount + tax;
        totalValue += total;

        if (q.status === "Approved") approvedCount++;
        if (q.status === "Rejected") rejectedCount++;

        // Determine if this quote requires action from the current logged-in role
        if (currentUser.role === "Sales" && q.status === "AskedForEdit") {
          actionCount++;
        } else if (currentUser.role === "HOD" && q.status === "Pending") {
          actionCount++;
        } else if (currentUser.role === "SC_HEAD" && q.status === "Processing") {
          actionCount++;
        } else if (currentUser.role === "GM" && q.status === "PendingApproval") {
          actionCount++;
        }
      });

      setStats({
        total: allQuotes.length,
        pendingAction: actionCount,
        approved: approvedCount,
        rejected: rejectedCount,
        value: totalValue
      });
    } catch (error) {
      console.error("Error fetching quotes for dashboard:", error);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [currentUser]);

  // Format currency in Singapore Dollars (S$)
  const formatCurrency = (value) => {
    return "S$" + new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatMobileQuoteNumber = (num) => {
    return num.replace("#", "#QT-");
  };

  const translateStatus = (status) => {
    if (status === "Pending") return "Pending HOD";
    if (status === "Processing") return "Pending SC";
    if (status === "PendingApproval") return "Pending GM";
    if (status === "AskedForEdit") return "Edit Required";
    return status;
  };

  const activeQuotes = quotes.filter(q => q.status !== "Rejected" && q.status !== "AskedForEdit");
  const rejectedAndEditQuotes = quotes.filter(q => q.status === "Rejected" || q.status === "AskedForEdit");

  return (
    <div className="fade-in">
      {/* Banner chào mừng theo Figma */}
      <div
        className="card"
        style={{
          background: "linear-gradient(90deg, rgba(0, 51, 102, 0.06) 0%, rgba(121, 157, 214, 0.06) 100%)",
          borderColor: "var(--border-color)",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.75rem 2rem"
        }}
      >
        <div style={{ textAlign: "left" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>AMB Packaging System</span>
          <h2 style={{ color: "var(--primary)", fontSize: "1.5rem", fontWeight: 800, margin: "4px 0" }}>
            Good Morning, {currentUser.name}
          </h2>
          <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {currentUser.role === "Sales" && "Start creating packaging quotes or manage resubmissions."}
            {currentUser.role === "HOD" && `You have ${stats.pendingAction} quotes pending Head of Department approval.`}
            {currentUser.role === "SC_HEAD" && `You have ${stats.pendingAction} quotes pending Supply Chain Head unit price review.`}
            {currentUser.role === "GM" && `You have ${stats.pendingAction} quotes pending General Manager final approval.`}
          </p>
        </div>
        {currentUser.role === "Sales" && (
          <Link to="/quotes/new" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Quote
          </Link>
        )}
      </div>

      {/* Grid Stats */}
      <div className="card-grid">
        <div className="card">
          <div className="card-title">Total Quotes</div>
          <div className="card-value">{stats.total}</div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--warning)" }}>
          <div className="card-title" style={{ color: "var(--warning)" }}>Pending Review ({currentUser.role})</div>
          <div className="card-value" style={{ color: "var(--warning)" }}>{stats.pendingAction}</div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--success)" }}>
          <div className="card-title" style={{ color: "var(--success)" }}>Fully Approved</div>
          <div className="card-value" style={{ color: "var(--success)" }}>{stats.approved}</div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div className="card-title" style={{ color: "var(--primary)" }}>Total Pipeline Value</div>
          <div className="card-value" style={{ color: "var(--primary)", fontSize: "1.5rem", marginTop: "4px" }}>
            {formatCurrency(stats.value)}
          </div>
        </div>
      </div>

      {/* Active Quotes Layout */}
      <div style={{ textAlign: "left", marginBottom: "3rem" }}>
        <div style={{ display: "flex", justifyContext: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2>Quotes List</h2>
          <Link to="/quotes" className="btn btn-secondary btn-sm">View All</Link>
        </div>

        {activeQuotes.length === 0 ? (
          <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
            <p>No active quotes in progress.</p>
          </div>
        ) : (
          <>
            {/* Desktop Cards Grid View - 100% Figma matching for node 34-2 */}
            <div className="desktop-quotes-grid data-table-wrapper">
              {activeQuotes.slice(0, 6).map((q) => {
                const subtotal = q.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                const discount = subtotal * 0.05;
                const tax = (subtotal - discount) * 0.1;
                const total = subtotal - discount + tax;

                return (
                  <div key={q.id} className="desktop-quote-card fade-in">
                    <div className="desktop-quote-card-header">
                      <span>{new Date(q.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                      <span className={`status-badge status-${q.status}`}>
                        {translateStatus(q.status)}
                      </span>
                    </div>

                    <div className="desktop-quote-card-title-row">
                      <div className="desktop-quote-card-id">Quote ID: {q.quoteNumber}</div>
                      <div className="desktop-quote-card-customer">{q.customer.companyName}</div>
                    </div>

                    <div className="desktop-quote-card-specs">
                      <div className="desktop-quote-card-spec-item">
                        <span className="desktop-quote-card-spec-label">Box Style</span>
                        <span className="desktop-quote-card-spec-value">{q.boxStyle || "Custom RSC"}</span>
                      </div>
                      <div className="desktop-quote-card-spec-item">
                        <span className="desktop-quote-card-spec-label">Flute</span>
                        <span className="desktop-quote-card-spec-value" style={{ fontSize: "0.75rem" }}>{q.fluteType || "B-Flute Single"}</span>
                      </div>
                      <div className="desktop-quote-card-spec-item">
                        <span className="desktop-quote-card-spec-label">MOQ</span>
                        <span className="desktop-quote-card-spec-value">{q.moq || "5,000 Pcs"}</span>
                      </div>
                    </div>

                    <div className="desktop-quote-card-footer">
                      <div className="desktop-quote-card-total-group">
                        <span className="desktop-quote-card-total-label">Total Quote:</span>
                        <span className="desktop-quote-card-total-value">{formatCurrency(total)}</span>
                      </div>
                      <Link to={`/quotes/${q.id}`} className="btn btn-secondary btn-sm" style={{ padding: "0.45rem 1rem" }}>
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Stacked Card View - 100% Figma matching */}
            <div className="mobile-quotes-list">
              {activeQuotes.slice(0, 5).map((q) => {
                const subtotal = q.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                const discount = subtotal * 0.05;
                const tax = (subtotal - discount) * 0.1;
                const total = subtotal - discount + tax;

                return (
                  <div key={q.id} className="mobile-quote-card fade-in">
                    <div className="mobile-quote-card-header">
                      <span>{new Date(q.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
                      <span className={`status-badge status-${q.status}`}>
                        {q.status === "Pending" ? "Pending" : 
                         q.status === "Processing" ? "Active" :
                         q.status === "PendingApproval" ? "Active" : 
                         q.status === "Approved" ? "Active" : q.status}
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div className="mobile-quote-card-id">{formatMobileQuoteNumber(q.quoteNumber)}</div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>{q.customer.companyName}</div>
                    </div>

                    <div className="mobile-quote-card-specs">
                      <div className="mobile-quote-card-spec-row">
                        <span className="mobile-quote-card-spec-label">Box Style</span>
                        <span className="mobile-quote-card-spec-value">{q.boxStyle || "RSC (Standard)"}</span>
                      </div>
                      <div className="mobile-quote-card-spec-row">
                        <span className="mobile-quote-card-spec-label">Flute Type</span>
                        <span className="mobile-quote-card-spec-value">{q.fluteType || "B-Flute Single Wall"}</span>
                      </div>
                      <div className="mobile-quote-card-spec-row">
                        <span className="mobile-quote-card-spec-label">MOQ</span>
                        <span className="mobile-quote-card-spec-value">{q.moq || "5,000 Units"}</span>
                      </div>
                    </div>

                    <div className="mobile-quote-card-footer">
                      <span className="mobile-quote-card-total-label">TOTAL QUOTE</span>
                      <span className="mobile-quote-card-total-value">{formatCurrency(total)}</span>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                      <Link to={`/quotes/${q.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Rejected & Asked for Edit Queue */}
      <div style={{ textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2>Rejected & Resubmit Queue</h2>
          <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>View Archive</a>
        </div>

        {rejectedAndEditQuotes.length === 0 ? (
          <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
            No rejected or changes-requested quotes in the archive queue.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {rejectedAndEditQuotes.map((q) => {
              const latestLog = q.history[q.history.length - 1];
              const isEdit = q.status === "AskedForEdit";
              
              return (
                <div key={q.id} className="card" style={{ borderTop: isEdit ? "4px solid var(--warning)" : "4px solid var(--danger)", padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                        Date: {new Date(q.createdAt).toLocaleDateString("en-GB")} | ID: {formatMobileQuoteNumber(q.quoteNumber)}
                      </span>
                      <h3 style={{ margin: "4px 0 0 0", fontSize: "1.1rem" }}>
                        {isEdit ? "Asked for edit" : latestLog?.note || "Budget Constraint"}
                      </h3>
                    </div>
                    <span className={`status-badge status-${q.status}`}>
                      {isEdit ? "Edit Required" : "Rejected"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "1.5rem", padding: "0.75rem", backgroundColor: "var(--bg-app)", borderRadius: "var(--radius-sm)", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>Style</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{q.boxStyle || "Corrugated"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>Flute</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{q.fluteType || "B Flute"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>MOQ</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{q.moq || "3,000 Pcs"}</div>
                    </div>
                  </div>

                  {latestLog?.note && (
                    <p style={{ fontSize: "0.8rem", fontStyle: "italic", marginBottom: "1rem", color: "var(--text-secondary)" }}>
                      "{latestLog.note}"
                    </p>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                    <Link to={`/quotes/${q.id}`} className="btn btn-secondary btn-sm">Details</Link>
                    {currentUser.role === "Sales" && (
                      <Link to={`/quotes/edit/${q.id}`} className="btn btn-primary btn-sm">Resubmit</Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
