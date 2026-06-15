import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import apiService from "../services/api";

export const QuoteList = () => {
  const { currentUser } = useContext(AuthContext);
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("quotes"); // "quotes" is active by default as in Figma

  const fetchQuotes = async () => {
    try {
      const response = await apiService.getQuotes();
      setQuotes(response.data);
      setFilteredQuotes(response.data);
    } catch (error) {
      console.error("Error fetching quotes list:", error);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  // Filter & Search Logic
  useEffect(() => {
    let result = [...quotes];

    // Search query filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();

      result = result.filter((q) => {
        const quoteNumber = String(q.quoteNumber || "").toLowerCase();

        const companyName = String(
          q.companyName || q.customer?.companyName || ""
        ).toLowerCase();

        const contactName = String(
          q.contactName || q.customer?.contactName || ""
        ).toLowerCase();

        return (
          quoteNumber.includes(query) ||
          companyName.includes(query) ||
          contactName.includes(query)
        );
      });
    }

    // Tab filter
    if (activeTab === "active_orders") {
      result = result.filter(
        (q) =>
          q.status === "Pending" ||
          q.status === "Processing" ||
          q.status === "PendingApproval"
      );
    } else if (activeTab === "quotes") {
      // In Figma "Quotes" tab shows active/approved orders, excluding rejected/edit required which are at the bottom
      result = result.filter(
        (q) =>
          q.status !== "Rejected" &&
          q.status !== "AskedForEdit"
      );
    } else if (activeTab === "upcoming") {
      result = [];
    } else if (activeTab === "on_hold") {
      result = [];
    } else if (activeTab === "cancelled") {
      result = [];
    }

    setFilteredQuotes(result);
  }, [searchQuery, activeTab, quotes]);

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

  // Separate active/approved quotes from rejected/edit-required quotes
  const activeQuotesList = filteredQuotes.filter(
    (q) => q.status !== "Rejected" && q.status !== "AskedForEdit"
  );
  
  const rejectedAndEditQuotes = quotes.filter(
    (q) => q.status === "Rejected" || q.status === "AskedForEdit"
  );

  return (
    <div className="fade-in">
      {/* Navigation Header (Trang Documents) - Figma horizontal tab layout */}
      <div className="tabs-nav" style={{ 
        display: "flex", 
        gap: "2rem", 
        borderBottom: "1px solid var(--border-color)", 
        marginBottom: "2rem",
        overflowX: "auto"
      }}>
        <button
          className={`tab-btn ${activeTab === "active_orders" ? "active" : ""}`}
          onClick={() => setActiveTab("active_orders")}
          style={{ whiteSpace: "nowrap" }}
        >
          Active Orders
        </button>
        <button
          className={`tab-btn ${activeTab === "quotes" ? "active" : ""}`}
          onClick={() => setActiveTab("quotes")}
          style={{ whiteSpace: "nowrap" }}
        >
          Quotes
        </button>
        <button
          className={`tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
          style={{ whiteSpace: "nowrap" }}
        >
          Upcoming
        </button>
        <button
          className={`tab-btn ${activeTab === "on_hold" ? "active" : ""}`}
          onClick={() => setActiveTab("on_hold")}
          style={{ whiteSpace: "nowrap" }}
        >
          On Hold
        </button>
        <button
          className={`tab-btn ${activeTab === "cancelled" ? "active" : ""}`}
          onClick={() => setActiveTab("cancelled")}
          style={{ whiteSpace: "nowrap" }}
        >
          Cancelled
        </button>
      </div>

      {/* Action Bar */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "2rem" 
      }} className="action-bar-wrapper">
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Quotes List
        </h2>
        
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {/* Search Input */}
          <div style={{ position: "relative", width: "240px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search quotes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "2.5rem", height: "38px" }}
            />
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-secondary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)" }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          {/* Filter Button */}
          <button className="btn btn-secondary" style={{ height: "38px", padding: "0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filter
          </button>

          {/* New Quote Button */}
          <Link to="/quotes/new" className="btn btn-primary" style={{ height: "38px", padding: "0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Quote
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredQuotes.length === 0 ? (
        <div className="card" style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
          No quotes found matching the active filters.
        </div>
      ) : (
        <>
          {/* Desktop Cards Grid View */}
          <div className="desktop-quotes-grid">
            {activeQuotesList.map((q) => {
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
                    <div className="desktop-quote-card-id">{q.quoteNumber}</div>
                    <div className="desktop-quote-card-customer">{q.customer.companyName}</div>
                  </div>

                  <div className="desktop-quote-card-specs">
                    <div className="desktop-quote-card-spec-item">
                      <span className="desktop-quote-card-spec-label">Box Style</span>
                      <span className="desktop-quote-card-spec-value">{q.boxStyle || "Corrugated"}</span>
                    </div>
                    <div className="desktop-quote-card-spec-item">
                      <span className="desktop-quote-card-spec-label">Flute</span>
                      <span className="desktop-quote-card-spec-value" style={{ fontSize: "0.75rem" }}>{q.fluteType || "B"}</span>
                    </div>
                    <div className="desktop-quote-card-spec-item">
                      <span className="desktop-quote-card-spec-label">MOQ</span>
                      <span className="desktop-quote-card-spec-value">{q.moq || "5k"}</span>
                    </div>
                  </div>

                  <div className="desktop-quote-card-footer">
                    <div className="desktop-quote-card-total-group">
                      <span className="desktop-quote-card-total-label">Total Quote:</span>
                      <span className="desktop-quote-card-total-value">{formatCurrency(total)}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link to={`/quotes/${q.id}`} className="btn btn-secondary btn-sm" style={{ padding: "0.45rem 1rem" }}>
                        View Details
                      </Link>
                      {currentUser.role === "Sales" && (q.status === "Draft" || q.status === "AskedForEdit") && (
                        <Link to={`/quotes/edit/${q.id}`} className="btn btn-primary btn-sm" style={{ padding: "0.45rem 1rem" }}>
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Stacked Card View */}
          <div className="mobile-quotes-list">
            {filteredQuotes.map((q) => {
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
                       q.status === "Approved" ? "Active" : 
                       q.status === "AskedForEdit" ? "Edit Req" : q.status}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div className="mobile-quote-card-id">{formatMobileQuoteNumber(q.quoteNumber)}</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>{q.customer.companyName}</div>
                  </div>

                  <div className="mobile-quote-card-specs">
                    <div className="mobile-quote-card-spec-row">
                      <span className="mobile-quote-card-spec-label">Box Style</span>
                      <span className="mobile-quote-card-spec-value">{q.boxStyle || "Corrugated"}</span>
                    </div>
                    <div className="mobile-quote-card-spec-row">
                      <span className="mobile-quote-card-spec-label">Flute Type</span>
                      <span className="mobile-quote-card-spec-value">{q.fluteType || "B"}</span>
                    </div>
                    <div className="mobile-quote-card-spec-row">
                      <span className="mobile-quote-card-spec-label">MOQ</span>
                      <span className="mobile-quote-card-spec-value">{q.moq || "5k"}</span>
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
                    {currentUser.role === "Sales" && (q.status === "Draft" || q.status === "AskedForEdit") && (
                      <Link to={`/quotes/edit/${q.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Rejected Quotes Section */}
      <div style={{ marginTop: "3.5rem", textAlign: "left" }} className="rejected-section-wrapper">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Rejected Quotes
          </h3>
          <a 
            href="#" 
            onClick={(e) => e.preventDefault()} 
            style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}
          >
            View Archive
          </a>
        </div>

        {rejectedAndEditQuotes.length === 0 ? (
          <div className="card" style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
            No rejected or changes-requested quotes in the archive queue.
          </div>
        ) : (
          <div className="rejected-quotes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
            {rejectedAndEditQuotes.map((q) => {
              const latestLog = q.history[q.history.length - 1];
              const isEdit = q.status === "AskedForEdit";
              
              return (
                <div key={q.id} className="desktop-quote-card fade-in" style={{ borderTop: isEdit ? "4px solid var(--warning)" : "4px solid var(--danger)", padding: "1.25rem" }}>
                  <div className="desktop-quote-card-header">
                    <span>Date: {new Date(q.createdAt).toLocaleDateString("en-GB")} | ID: {q.quoteNumber}</span>
                    <span className={`status-badge status-${q.status}`}>
                      {isEdit ? "Edit Required" : "Rejected"}
                    </span>
                  </div>

                  <div className="desktop-quote-card-title-row">
                    <div className="desktop-quote-card-id" style={{ fontSize: "1.1rem" }}>
                      {isEdit ? "Asked for edit" : latestLog?.note || "Budget Constraint"}
                    </div>
                  </div>

                  {/* Horizontal Border Tags */}
                  <div style={{ 
                    display: "flex", 
                    flexWrap: "wrap", 
                    gap: "0.5rem", 
                    padding: "0.75rem 0", 
                    borderTop: "1px solid var(--border-color)", 
                    borderBottom: "1px solid var(--border-color)", 
                    margin: "0.5rem 0" 
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "var(--bg-app)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 700 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      </svg>
                      {q.boxStyle || "Corrugated"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "var(--bg-app)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 700 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      </svg>
                      {q.type || "RSC"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "var(--bg-app)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 700 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="4" y1="9" x2="20" y2="9"></line>
                        <line x1="4" y1="15" x2="20" y2="15"></line>
                        <line x1="10" y1="3" x2="8" y2="21"></line>
                        <line x1="16" y1="3" x2="14" y2="21"></line>
                      </svg>
                      {q.fluteType || "B"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "var(--bg-app)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 700 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      {q.moq || "3k"}
                    </div>
                  </div>

                  {latestLog?.note && (
                    <p style={{ fontSize: "0.8rem", fontStyle: "italic", margin: "0.5rem 0 1rem 0", color: "var(--text-secondary)" }}>
                      "{latestLog.note}"
                    </p>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "auto" }}>
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

export default QuoteList;
