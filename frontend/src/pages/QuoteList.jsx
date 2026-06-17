import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import apiService from "../services/api";
import StatusBadge from "../components/StatusBadge";

const STATUS_FILTER_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Pending", label: "Pending HOD" },
  { value: "Processing", label: "Pending SC" },
  { value: "PendingApproval", label: "Pending GM" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "AskedForEdit", label: "Edit Required" },
];

export const QuoteList = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [draftStatuses, setDraftStatuses] = useState([]);
  const [activeTab, setActiveTab] = useState("quotes"); // "quotes" is active by default as in Figma
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const availableStatuses = [
    { value: "Draft", label: "Draft" },
    { value: "Pending", label: "Pending HOD" },
    { value: "Processing", label: "Pending SC" },
    { value: "PendingApproval", label: "Pending GM" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
    { value: "AskedForEdit", label: "Edit Required" }
  ];

  const handleStatusToggle = (statusVal) => {
    if (selectedStatuses.includes(statusVal)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== statusVal));
    } else {
      setSelectedStatuses([...selectedStatuses, statusVal]);
    }
  };

  const fetchQuotes = async () => {
    try {
      const response = await apiService.getQuotes();
      setQuotes(response.data);
      setFilteredQuotes(response.data);
    } catch (error) {
      console.error("Error fetching quotes list:", error);
    }
  };

  const toggleDraftStatus = (status) => {
    setDraftStatuses((currentStatuses) =>
      currentStatuses.includes(status)
        ? currentStatuses.filter((item) => item !== status)
        : [...currentStatuses, status]
    );
  };

  const openFilterPanel = () => {
    setDraftStatuses(selectedStatuses);
    setIsFilterOpen((currentValue) => !currentValue);
  };

  const applyStatusFilter = () => {
    setSelectedStatuses(draftStatuses);
    setIsFilterOpen(false);
  };

  const resetStatusFilter = () => {
    setDraftStatuses([]);
    setSelectedStatuses([]);
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

    // Status checkbox filter
    if (selectedStatuses.length > 0) {
      result = result.filter((q) => selectedStatuses.includes(q.status));
    }

    // Tab filter
    // If status filter is active, status filter takes priority so Rejected/Edit Required can still appear.
    if (selectedStatuses.length === 0) {
      if (activeTab === "active_orders") {
        result = result.filter(
          (q) =>
            q.status === "Pending" ||
            q.status === "Processing" ||
            q.status === "PendingApproval"
        );
      } else if (activeTab === "quotes") {
        // In Figma "Quotes" tab shows active/approved quotes, excluding rejected/edit required which are at the bottom
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
    }

    // Additional status checklist filters
    if (selectedStatuses.length > 0) {
      result = result.filter((q) => selectedStatuses.includes(q.status));
    }

    setFilteredQuotes(result);
  }, [searchQuery, selectedStatuses, activeTab, quotes]);

  const formatCurrency = (value) => {
    return "S$" + new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatMobileQuoteNumber = (num) => {
    return String(num || "").replace("#", "#QT-");
  };

  const translateStatus = (status) => {
    if (status === "Pending") return "Pending HOD";
    if (status === "Processing") return "Pending SC";
    if (status === "PendingApproval") return "Pending GM";
    if (status === "AskedForEdit") return "Edit Required";
    return status;
  };

  const isStatusFilterApplied = selectedStatuses.length > 0;

  // Separate active/approved quotes from rejected/edit-required quotes
  const activeQuotesList = filteredQuotes.filter(
    (q) => q.status !== "Rejected" && q.status !== "AskedForEdit"
  );

  // Rejected section: always base on full quotes list, but apply selectedStatuses filter
  // if user has selected Rejected/AskedForEdit statuses
  const rejectedFilterStatuses = selectedStatuses.filter(
    (s) => s === "Rejected" || s === "AskedForEdit"
  );
  const rejectedAndEditQuotes = quotes.filter((q) => {
    if (q.status !== "Rejected" && q.status !== "AskedForEdit") return false;
    if (rejectedFilterStatuses.length > 0) {
      return rejectedFilterStatuses.includes(q.status);
    }
    return true;
  });

  // Auto-open archive when user filters by Rejected or AskedForEdit
  const autoShowArchive = rejectedFilterStatuses.length > 0;

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
          <button
            className={`btn ${showFilterPanel || selectedStatuses.length > 0 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            style={{ height: "38px", padding: "0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filter
            {selectedStatuses.length > 0 && (
              <span style={{ fontSize: "0.75rem", fontWeight: 800 }}>
                ({selectedStatuses.length})
              </span>
            )}
          </button>

          {/* New Quote Button */}
          {currentUser?.role === "Sales" && (
            <Link to="/quotes/new" className="btn btn-primary" style={{ height: "38px", padding: "0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Quote
            </Link>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="card fade-in filter-status-panel">
          <div style={{ textAlign: "left" }}>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Filter by Status
            </h4>
            <div className="filter-status-grid">
              {availableStatuses.map((st) => {
                const isChecked = selectedStatuses.includes(st.value);
                return (
                  <label 
                    key={st.value} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.5rem", 
                      cursor: "pointer", 
                      padding: "0.4rem 0.6rem",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: isChecked ? "rgba(0, 51, 102, 0.05)" : "transparent",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleStatusToggle(st.value)}
                      style={{ 
                        width: "16px", 
                        height: "16px", 
                        accentColor: "var(--primary)",
                        cursor: "pointer",
                        margin: 0
                      }}
                    />
                    <StatusBadge status={st.value} />
                  </label>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedStatuses([])}
                style={{ height: "38px", flex: 1, fontSize: "0.85rem" }}
                disabled={selectedStatuses.length === 0}
              >
                Reset All
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowFilterPanel(false)}
                style={{ height: "38px", flex: 1, fontSize: "0.85rem" }}
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}

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
              const items = Array.isArray(q.items) ? q.items : [];
              const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
              const discount = subtotal * 0.05;
              const tax = (subtotal - discount) * 0.1;
              const total = subtotal - discount + tax;

              return (
                <div key={q.id} className="desktop-quote-card fade-in">
                  <div className="desktop-quote-card-header">
                    <span>{new Date(q.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                    <StatusBadge status={q.status} />
                  </div>

                  <div className="desktop-quote-card-title-row">
                    <div className="desktop-quote-card-id">{q.quoteNumber}</div>
                    <div className="desktop-quote-card-customer">
                      {q.customer?.companyName || q.companyName || "N/A"}
                    </div>
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
                      {currentUser?.role === "Sales" && (q.status === "Draft" || q.status === "AskedForEdit") && (
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
              const items = Array.isArray(q.items) ? q.items : [];
              const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
              const discount = subtotal * 0.05;
              const tax = (subtotal - discount) * 0.1;
              const total = subtotal - discount + tax;

              return (
                <div key={q.id} className="mobile-quote-card fade-in">
                  <div className="mobile-quote-card-header">
                    <span>{new Date(q.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
                    <StatusBadge status={q.status}>
                      {q.status === "Pending" ? "Pending" :
                        q.status === "Processing" ? "Active" :
                          q.status === "PendingApproval" ? "Active" :
                            q.status === "Approved" ? "Active" :
                              q.status === "AskedForEdit" ? "Edit Req" : q.status}
                    </StatusBadge>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div className="mobile-quote-card-id">{formatMobileQuoteNumber(q.quoteNumber)}</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                      {q.customer?.companyName || q.companyName || "N/A"}
                    </div>
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
                    {currentUser?.role === "Sales" && (q.status === "Draft" || q.status === "AskedForEdit") && (
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
            {rejectedFilterStatuses.length > 0 && (
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginLeft: "0.5rem" }}>
                ({rejectedAndEditQuotes.length} filtered)
              </span>
            )}
          </h3>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setShowArchive(!showArchive); }}
            style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}
          >
            {(showArchive || autoShowArchive) ? "Hide Archive" : "View Archive"}
          </a>
        </div>

        {(showArchive || autoShowArchive) && (
          rejectedAndEditQuotes.length === 0 ? (
            <div className="card" style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
              No rejected or changes-requested quotes in the archive queue.
            </div>
          ) : (
            <div className="rejected-quotes-grid">
              {rejectedAndEditQuotes.map((q) => {
                const latestLog = q.history[q.history.length - 1];
                const isEdit = q.status === "AskedForEdit";
                const subtotal = q.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                const discount = subtotal * 0.05;
                const tax = (subtotal - discount) * 0.1;
                const total = subtotal - discount + tax;

                return (
                  <div key={q.id} className="desktop-quote-card fade-in" style={{ borderTop: isEdit ? "4px solid var(--warning)" : "4px solid var(--danger)" }}>
                    <div className="desktop-quote-card-header">
                      <span>{new Date(q.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                      <StatusBadge status={q.status} />
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

                    {latestLog?.note && (
                      <div style={{ fontSize: "0.8rem", fontStyle: "italic", color: "var(--text-secondary)", marginTop: "0.5rem", padding: "0.5rem", backgroundColor: "var(--bg-app)", borderRadius: "var(--radius-sm)", borderLeft: isEdit ? "3px solid var(--warning)" : "3px solid var(--danger)", textAlign: "left" }}>
                        Reason: "{latestLog.note}"
                      </div>
                    )}

                    <div className="desktop-quote-card-footer">
                      <div className="desktop-quote-card-total-group">
                        <span className="desktop-quote-card-total-label">Total Quote:</span>
                        <span className="desktop-quote-card-total-value">{formatCurrency(total)}</span>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link to={`/quotes/${q.id}`} className="btn btn-secondary btn-sm" style={{ padding: "0.45rem 1rem" }}>
                          Details
                        </Link>
                        {currentUser.role === "Sales" && (
                          <Link to={`/quotes/edit/${q.id}`} className="btn btn-primary btn-sm" style={{ padding: "0.45rem 1rem" }}>
                            Resubmit
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default QuoteList;