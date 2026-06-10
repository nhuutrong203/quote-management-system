import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import apiService from "../services/api";

export const QuoteForm = () => {
  const { currentUser } = useContext(AuthContext);
  const { id } = useParams(); // exists in edit mode
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [formTab, setFormTab] = useState("parameters"); // "parameters" or "client"
  
  // Packaging Parameters
  const [boxStyle, setBoxStyle] = useState("RSC Standard");
  const [type, setType] = useState("Single Wall");
  const [dimension, setDimension] = useState("40x30x30");
  const [fluteType, setFluteType] = useState("B-Flute Single Wall");
  const [boardQuality, setBoardQuality] = useState("K175/M/K175");
  const [colors, setColors] = useState("2-Colors");
  const [joints, setJoints] = useState("Glued");
  const [moq, setMoq] = useState(5000);
  
  const [setup, setSetup] = useState({ discountRate: 5, taxRate: 10 });

  // Load initial configurations, customers, and quote (if edit mode)
  useEffect(() => {
    const loadData = async () => {
      try {
        const custRes = await apiService.getCustomers();
        setCustomers(custRes.data);
        if (custRes.data.length > 0) {
          setSelectedCustomerId(custRes.data[0].id);
        }

        const setupRes = await apiService.getQuoteSetup();
        setSetup(setupRes.data);

        if (id) {
          // Edit Mode
          const quoteRes = await apiService.getQuoteById(id);
          const q = quoteRes.data;
          if (q) {
            setQuoteNumber(q.quoteNumber);
            setSelectedCustomerId(q.customer.id);
            setBoxStyle(q.boxStyle || "RSC Standard");
            setType(q.type || "Single Wall");
            setDimension(q.dimension || "40x30x30");
            setFluteType(q.fluteType || "B-Flute Single Wall");
            setBoardQuality(q.boardQuality || "K175/M/K175");
            setColors(q.colors || "2-Colors");
            setJoints(q.joints || "Glued");
            setMoq(parseInt(q.moq?.replace(/[^0-9]/g, "")) || 5000);
          } else {
            navigate("/quotes");
          }
        } else {
          // Create Mode
          const quotesRes = await apiService.getQuotes();
          const count = quotesRes.data.length + 1;
          setQuoteNumber(`#12${String(count).padStart(3, "0")}`);
        }
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };
    loadData();
  }, [id, navigate]);

  // Dynamically calculate unit price based on parameters
  const getCalculatedUnitPrice = () => {
    let price = 10.00; // Base Price

    if (type === "Double Wall") price += 5.00;
    if (fluteType.includes("BC-Flute") || fluteType.includes("Double")) price += 3.50;
    if (colors === "Full") price += 2.50;
    if (joints === "Stitched") price += 1.00;
    if (boxStyle === "Custom RSC" || boxStyle === "Die-Cut") price += 4.00;
    if (boardQuality.includes("K275")) price += 2.00;

    // Bulk discount on MOQ
    if (moq >= 10000) price *= 0.85; // 15% off
    else if (moq >= 5000) price *= 0.92; // 8% off

    return parseFloat(price.toFixed(2));
  };

  const unitPrice = getCalculatedUnitPrice();
  const subtotal = moq * unitPrice;
  const discountAmount = subtotal * (setup.discountRate / 100);
  const taxAmount = (subtotal - discountAmount) * (setup.taxRate / 100);
  const grandTotal = subtotal - discountAmount + taxAmount;

  const handleSave = async (status) => {
    if (!selectedCustomerId) {
      alert("Please select a customer.");
      return;
    }

    const items = [
      {
        name: `${boxStyle} Box Production (${type}, ${fluteType})`,
        quantity: moq,
        unitPrice: unitPrice
      }
    ];

    const payload = {
      quoteNumber,
      customerId: selectedCustomerId,
      boxStyle,
      type,
      dimension,
      fluteType,
      boardQuality,
      colors,
      joints,
      moq: new Intl.NumberFormat("en-US").format(moq) + " Pcs",
      items,
      status, // "Draft" or "Pending"
      createdBy: currentUser.id
    };

    try {
      if (id) {
        // Edit mode
        await apiService.updateQuote(id, {
          customer: customers.find((c) => c.id === selectedCustomerId),
          boxStyle,
          type,
          dimension,
          fluteType,
          boardQuality,
          colors,
          joints,
          moq: new Intl.NumberFormat("en-US").format(moq) + " Pcs",
          items,
          status,
          updatedBy: currentUser,
          note: status === "Pending" ? "Sales updated specifications and submitted for HOD approval" : "Sales updated draft specifications"
        });
      } else {
        // Create mode
        await apiService.createQuote(payload);
      }
      navigate("/quotes");
    } catch (error) {
      console.error("Error saving quote:", error);
    }
  };

  const formatCurrency = (value) => {
    return "S$" + new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="fade-in" style={{ textAlign: "left" }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>AMB Order Workspace</span>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)", margin: "4px 0 0 0" }}>
            New Quote
          </h2>
        </div>
      </div>

      <div className="new-quote-split-container">
        {/* Center Preview Area: Quotation Paper (A4 Invoice style) */}
        <div className="quote-preview-area">
          <div className="a4-paper">
            {/* Header info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: "1.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)", margin: 0 }}>
                  ORDER FORM: {quoteNumber}
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px", display: "inline-block" }}>
                  Date Issued: {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)", margin: 0 }}>AMB Packaging</h4>
                <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Partnering for Success</span>
              </div>
            </div>

            {/* Total banner box */}
            <div className="preview-highlight-banner">
              <div>
                <div className="preview-banner-label">QUOTE TOTAL</div>
                <div className="preview-banner-value">{formatCurrency(grandTotal)}</div>
              </div>
              <div>
                <div className="preview-banner-label" style={{ textAlign: "right" }}>STATUS</div>
                <div className="preview-status-badge">DRAFT PREVIEW</div>
              </div>
            </div>

            {/* Technical Parameters Table */}
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                Technical Specification
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--primary)", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Box Style</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Type</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Dimension</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Flute</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Board</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Color</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Joints</th>
                    <th style={{ padding: "0.5rem 0.25rem", textAlign: "right" }}>MOQ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    <td style={{ padding: "1rem 0.25rem" }}>{boxStyle}</td>
                    <td style={{ padding: "1rem 0.25rem" }}>{type}</td>
                    <td style={{ padding: "1rem 0.25rem" }}>{dimension}</td>
                    <td style={{ padding: "1rem 0.25rem" }}>{fluteType.split(" ")[0]}</td>
                    <td style={{ padding: "1rem 0.25rem" }}>{boardQuality}</td>
                    <td style={{ padding: "1rem 0.25rem" }}>{colors}</td>
                    <td style={{ padding: "1rem 0.25rem" }}>{joints}</td>
                    <td style={{ padding: "1rem 0.25rem", textAlign: "right" }}>{new Intl.NumberFormat("en-US").format(moq)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Pricing Breakdowns */}
              <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Unit Price:</span>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(unitPrice)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Subtotal:</span>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--danger)" }}>
                    <span>Discount ({setup.discountRate}%):</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)" }}>
                    <span>GST ({setup.taxRate}%):</span>
                    <span>+{formatCurrency(taxAmount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem", fontWeight: 800, fontSize: "0.9rem", color: "var(--primary)" }}>
                    <span>Grand Total:</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details inside A4 */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
              <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                Customer Details
              </h4>
              {selectedCustomer ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", fontSize: "0.8rem" }}>
                  <div>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", display: "block" }}>Company Name</span>
                    <span style={{ fontWeight: 700 }}>{selectedCustomer.companyName}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", display: "block" }}>Contact Person</span>
                    <span style={{ fontWeight: 700 }}>{selectedCustomer.contactName}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", display: "block" }}>Email Address</span>
                    <span style={{ fontWeight: 600 }}>{selectedCustomer.email}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", display: "block" }}>Phone Number</span>
                    <span style={{ fontWeight: 600 }}>{selectedCustomer.phone}</span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>No customer details selected.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Configuration Panel */}
        <div className="quote-config-panel">
          {/* Config Tabs */}
          <div className="config-tabs">
            <button 
              className={`config-tab-btn ${formTab === "parameters" ? "active" : ""}`}
              onClick={() => setFormTab("parameters")}
            >
              Parameters
            </button>
            <button 
              className={`config-tab-btn ${formTab === "client" ? "active" : ""}`}
              onClick={() => setFormTab("client")}
            >
              Client Details
            </button>
          </div>

          {formTab === "client" ? (
            /* Client Details form elements */
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Client / Customer</label>
                <select
                  className="form-control"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div style={{ backgroundColor: "var(--bg-app)", padding: "1rem", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <div>
                    <strong style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Contact Person:</strong>
                    <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedCustomer.contactName}</div>
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Email:</strong>
                    <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedCustomer.email}</div>
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Address:</strong>
                    <div style={{ fontWeight: 600, marginTop: "2px", lineHeight: "1.4" }}>{selectedCustomer.address}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Packaging Specification Parameters form elements */
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Box Style</label>
                <select className="form-control" value={boxStyle} onChange={(e) => setBoxStyle(e.target.value)}>
                  <option value="RSC Standard">RSC Standard</option>
                  <option value="Die-Cut">Die-Cut</option>
                  <option value="Custom RSC">Custom RSC</option>
                  <option value="Double Wall Master">Double Wall Master</option>
                  <option value="Corrugated">Corrugated</option>
                  <option value="Poly-Lined">Poly-Lined</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Type</label>
                <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Single Wall">Single Wall</option>
                  <option value="Double Wall">Double Wall</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Dimensions (LxWxH)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Length x Width x Height (e.g. 40x30x30)"
                  value={dimension}
                  onChange={(e) => setDimension(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Flute Type</label>
                <select className="form-control" value={fluteType} onChange={(e) => setFluteType(e.target.value)}>
                  <option value="B-Flute Single Wall">B-Flute Single Wall</option>
                  <option value="E-Flute Micro">E-Flute Micro</option>
                  <option value="BC-Flute Double">BC-Flute Double</option>
                  <option value="B Flute">B Flute</option>
                  <option value="C Flute">C Flute</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Board Quality</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Linner(GSM), e.g. K175/M/K175"
                  value={boardQuality}
                  onChange={(e) => setBoardQuality(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Number Of Colors</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 2-Colors"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Joints</label>
                <select className="form-control" value={joints} onChange={(e) => setJoints(e.target.value)}>
                  <option value="Glued">Glued</option>
                  <option value="Stitched">Stitched</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Minimum Order Qty (MOQ)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={moq}
                  onChange={(e) => setMoq(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {/* Config Footer Summary & Actions */}
          <div className="config-footer-summary">
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>QUOTE TOTAL</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--primary)", marginTop: "2px" }}>{formatCurrency(grandTotal)}</div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link to="/quotes" className="btn btn-secondary btn-sm" style={{ padding: "0.5rem 0.85rem" }}>
                Cancel
              </Link>
              <button onClick={() => handleSave("Draft")} className="btn btn-secondary btn-sm" style={{ padding: "0.5rem 0.85rem" }}>
                Draft
              </button>
              <button onClick={() => handleSave("Pending")} className="btn btn-primary btn-sm" style={{ padding: "0.5rem 0.85rem" }}>
                Save Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteForm;
