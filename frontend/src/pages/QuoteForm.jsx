import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import apiService from "../services/api";

const PARAMETER_KEYS = [
  "boxStyle",
  "type",
  "dimension",
  "fluteType",
  "boardQuality",
  "colors",
  "joints",
  "moq",
];

const PRICE_ADJUSTMENTS = {
  boxStyle: {
    Corrugated: 0,
    Offset: 0.08,
    "Offset laminated": 0.16,
  },
  type: {
    RSC: 0,
    FOL: 0.03,
    "Two-piece": 0.07,
    Tray: 0.05,
    Sleeve: 0.06,
  },
  dimension: {
    "ID (L x W x H mm)": 0,
    "OD (L x W x H mm)": 0.02,
  },
  fluteType: {
    B: 0.04,
    C: 0.06,
    E: 0.03,
    F: 0.02,
    BC: 0.11,
    BE: 0.09,
  },
  boardQuality: {
    "125 GSM": 0,
    "150 GSM": 0.04,
    "200 GSM": 0.08,
    "250 GSM": 0.14,
    "300 GSM": 0.2,
  },
  colors: {
    "1": 0,
    "2": 0.05,
    "Up to 4": 0.12,
    "4 + varnish": 0.18,
  },
  joints: {
    Glue: 0,
    Stitch: 0.04,
  },
};

const MOQ_DISCOUNT_MULTIPLIERS = {
  "Based on enquiry": 1,
  "1k": 1,
  "3k": 0.98,
  "5k": 0.96,
  "10k": 0.93,
};

const MOQ_QUANTITY_MAP = {
  "Based on enquiry": 1000,
  "1k": 1000,
  "3k": 3000,
  "5k": 5000,
  "10k": 10000,
};

const buildDefaultParameterValues = (defaults = {}, fields = []) => {
  const fieldDefaults = fields.reduce((accumulator, field) => {
    accumulator[field.key] = field.defaultValue || field.options?.[0]?.value || "";
    return accumulator;
  }, {});

  return PARAMETER_KEYS.reduce((accumulator, key) => {
    accumulator[key] = defaults[key] || fieldDefaults[key] || "";
    return accumulator;
  }, {});
};

const buildQuoteParameterValues = (quote, defaults) => ({
  ...defaults,
  boxStyle: quote?.boxStyle || defaults.boxStyle,
  type: quote?.type || defaults.type,
  dimension: quote?.dimension || defaults.dimension,
  fluteType: quote?.fluteType || defaults.fluteType,
  boardQuality: quote?.boardQuality || defaults.boardQuality,
  colors: quote?.colors || defaults.colors,
  joints: quote?.joints || defaults.joints,
  moq: quote?.moq || defaults.moq,
});

const mergeFieldsWithSelectedValues = (fields, values) =>
  fields.map((field) => {
    const selectedValue = values[field.key];

    if (!selectedValue || field.options?.some((option) => option.value === selectedValue)) {
      return field;
    }

    return {
      ...field,
      options: [{ value: selectedValue, label: selectedValue }, ...(field.options || [])],
    };
  });

const getMoqQuantity = (moqValue) => {
  if (MOQ_QUANTITY_MAP[moqValue]) {
    return MOQ_QUANTITY_MAP[moqValue];
  }

  const normalizedValue = String(moqValue || "").toLowerCase().replace(/,/g, "").trim();

  if (normalizedValue.endsWith("k")) {
    const parsedThousands = Number(normalizedValue.replace(/[^0-9.]/g, ""));
    if (parsedThousands > 0) {
      return parsedThousands * 1000;
    }
  }

  const parsedDigits = Number(normalizedValue.replace(/[^0-9.]/g, ""));
  return parsedDigits > 0 ? parsedDigits : 1000;
};

const getCalculatedUnitPrice = (parameterValues) => {
  let price = 0.42;

  price += PRICE_ADJUSTMENTS.boxStyle[parameterValues.boxStyle] || 0;
  price += PRICE_ADJUSTMENTS.type[parameterValues.type] || 0;
  price += PRICE_ADJUSTMENTS.dimension[parameterValues.dimension] || 0;
  price += PRICE_ADJUSTMENTS.fluteType[parameterValues.fluteType] || 0;
  price += PRICE_ADJUSTMENTS.boardQuality[parameterValues.boardQuality] || 0;
  price += PRICE_ADJUSTMENTS.colors[parameterValues.colors] || 0;
  price += PRICE_ADJUSTMENTS.joints[parameterValues.joints] || 0;

  const multiplier = MOQ_DISCOUNT_MULTIPLIERS[parameterValues.moq] || 1;
  return Number(Math.max(price * multiplier, 0.12).toFixed(2));
};

export const QuoteForm = () => {
  const { currentUser } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [formTab, setFormTab] = useState("parameters");
  const [setup, setSetup] = useState({ discountRate: 5, taxRate: 10 });
  const [parameterFields, setParameterFields] = useState([]);
  const [parameterValues, setParameterValues] = useState({});
  const [isLoadingForm, setIsLoadingForm] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingForm(true);

      try {
        const [customerResponse, setupResponse, optionResponse] = await Promise.all([
          apiService.getCustomers(),
          apiService.getQuoteSetup(),
          apiService.getQuoteParameterOptions(),
        ]);

        const nextCustomers = customerResponse.data || [];
        const nextFields = optionResponse.data?.fields || [];
        const defaultParameters = buildDefaultParameterValues(
          optionResponse.data?.defaults,
          nextFields
        );

        setCustomers(nextCustomers);
        setSetup(setupResponse.data || { discountRate: 5, taxRate: 10 });
        setParameterFields(nextFields);

        if (id) {
          const quoteResponse = await apiService.getQuoteById(id);
          const quote = quoteResponse.data;

          if (!quote) {
            navigate("/quotes");
            return;
          }

          setQuoteNumber(quote.quoteNumber);
          setSelectedCustomerId(quote.customer?.id || nextCustomers[0]?.id || "");
          setParameterValues(buildQuoteParameterValues(quote, defaultParameters));
        } else {
          const quoteResponse = await apiService.getQuotes();
          const nextQuoteCount = (quoteResponse.data || []).length + 1;

          setQuoteNumber(`#12${String(nextQuoteCount).padStart(3, "0")}`);
          setSelectedCustomerId((currentValue) => currentValue || nextCustomers[0]?.id || "");
          setParameterValues(defaultParameters);
        }
      } catch (error) {
        console.error("Error loading form data:", error);
      } finally {
        setIsLoadingForm(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const effectiveParameterFields = useMemo(
    () => mergeFieldsWithSelectedValues(parameterFields, parameterValues),
    [parameterFields, parameterValues]
  );

  const parameterOptionsByKey = useMemo(
    () =>
      effectiveParameterFields.reduce((accumulator, field) => {
        accumulator[field.key] = field.options || [];
        return accumulator;
      }, {}),
    [effectiveParameterFields]
  );

  const getParameterDisplayValue = (key) => {
    const currentValue = parameterValues[key];
    const matchedOption = parameterOptionsByKey[key]?.find((option) => option.value === currentValue);
    return matchedOption?.label || currentValue || "N/A";
  };

  const updateParameterValue = (key, value) => {
    setParameterValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  };

  const unitPrice = getCalculatedUnitPrice(parameterValues);
  const moqQuantity = getMoqQuantity(parameterValues.moq);
  const subtotal = moqQuantity * unitPrice;
  const discountAmount = subtotal * (setup.discountRate / 100);
  const taxAmount = (subtotal - discountAmount) * (setup.taxRate / 100);
  const grandTotal = subtotal - discountAmount + taxAmount;

  const formatCurrency = (value) =>
    "S$" +
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const handleSave = async (status) => {
    if (!selectedCustomerId) {
      alert("Please select a customer.");
      return;
    }

    const items = [
      {
        name: `${getParameterDisplayValue("boxStyle")} Box Production (${getParameterDisplayValue(
          "type"
        )}, ${getParameterDisplayValue("fluteType")})`,
        quantity: moqQuantity,
        unitPrice,
      },
    ];

    const payload = {
      quoteNumber,
      customerId: selectedCustomerId,
      boxStyle: parameterValues.boxStyle,
      type: parameterValues.type,
      dimension: parameterValues.dimension,
      fluteType: parameterValues.fluteType,
      boardQuality: parameterValues.boardQuality,
      colors: parameterValues.colors,
      joints: parameterValues.joints,
      moq: parameterValues.moq,
      items,
      status,
      createdBy: currentUser.id,
    };

    try {
      if (id) {
        await apiService.updateQuote(id, {
          ...payload,
          updatedBy: currentUser,
          note:
            status === "Pending"
              ? "Sales updated specifications and submitted for HOD approval"
              : "Sales updated draft specifications",
        });
      } else {
        await apiService.createQuote(payload);
      }

      navigate("/quotes");
    } catch (error) {
      console.error("Error saving quote:", error);
    }
  };

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const headerTitle = id ? "Edit Quote" : "New Quote";
  const previewStatusLabel = id ? "EDIT PREVIEW" : "DRAFT PREVIEW";

  return (
    <div className="fade-in" style={{ textAlign: "left" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
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
            AMB Order Workspace
          </span>
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--primary)",
              margin: "4px 0 0 0",
            }}
          >
            {headerTitle}
          </h2>
        </div>
      </div>

      <div className="new-quote-split-container">
        <div className="quote-preview-area">
          <div className="a4-paper">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: "1.5rem",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "var(--primary)",
                    margin: 0,
                  }}
                >
                  ORDER FORM: {quoteNumber || "Generating..."}
                </h3>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    marginTop: "4px",
                    display: "inline-block",
                  }}
                >
                  Date Issued:{" "}
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <h4
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "var(--primary)",
                    margin: 0,
                  }}
                >
                  AMB Packaging
                </h4>
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Partnering for Success
                </span>
              </div>
            </div>

            <div className="preview-highlight-banner">
              <div>
                <div className="preview-banner-label">Quote Total</div>
                <div className="preview-banner-value">{formatCurrency(grandTotal)}</div>
              </div>
              <div>
                <div className="preview-banner-label" style={{ textAlign: "right" }}>
                  Status
                </div>
                <div className="preview-status-badge">{previewStatusLabel}</div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h4
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.75rem",
                }}
              >
                Technical Specification
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid var(--primary)",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <th style={{ padding: "0.5rem 0.25rem" }}>Box Style</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Type</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Dimensions</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Flute</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Board</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Colors</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Joints</th>
                    <th style={{ padding: "0.5rem 0.25rem", textAlign: "right" }}>MOQ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    <td style={{ padding: "1rem 0.25rem" }}>{getParameterDisplayValue("boxStyle")}</td>
                    <td style={{ padding: "1rem 0.25rem" }}>{getParameterDisplayValue("type")}</td>
                    <td style={{ padding: "1rem 0.25rem" }}>{getParameterDisplayValue("dimension")}</td>
                    <td style={{ padding: "1rem 0.25rem" }}>{getParameterDisplayValue("fluteType")}</td>
                    <td style={{ padding: "1rem 0.25rem" }}>{getParameterDisplayValue("boardQuality")}</td>
                    <td style={{ padding: "1rem 0.25rem" }}>{getParameterDisplayValue("colors")}</td>
                    <td style={{ padding: "1rem 0.25rem" }}>{getParameterDisplayValue("joints")}</td>
                    <td style={{ padding: "1rem 0.25rem", textAlign: "right" }}>{getParameterDisplayValue("moq")}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    width: "240px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    fontSize: "0.8rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Unit Price:</span>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(unitPrice)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Base Quantity:</span>
                    <span style={{ fontWeight: 700 }}>{new Intl.NumberFormat("en-US").format(moqQuantity)}</span>
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: "1px solid var(--border-color)",
                      paddingTop: "0.5rem",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      color: "var(--primary)",
                    }}
                  >
                    <span>Grand Total:</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
              <h4
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.75rem",
                }}
              >
                Customer Details
              </h4>
              {selectedCustomer ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "0.75rem",
                    fontSize: "0.8rem",
                  }}
                >
                  <div>
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.65rem",
                        textTransform: "uppercase",
                        display: "block",
                      }}
                    >
                      Company Name
                    </span>
                    <span style={{ fontWeight: 700 }}>{selectedCustomer.companyName}</span>
                  </div>
                  <div>
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.65rem",
                        textTransform: "uppercase",
                        display: "block",
                      }}
                    >
                      Contact Person
                    </span>
                    <span style={{ fontWeight: 700 }}>{selectedCustomer.contactName}</span>
                  </div>
                  <div>
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.65rem",
                        textTransform: "uppercase",
                        display: "block",
                      }}
                    >
                      Email Address
                    </span>
                    <span style={{ fontWeight: 600 }}>{selectedCustomer.email}</span>
                  </div>
                  <div>
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.65rem",
                        textTransform: "uppercase",
                        display: "block",
                      }}
                    >
                      Phone Number
                    </span>
                    <span style={{ fontWeight: 600 }}>{selectedCustomer.phone}</span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                  No customer details selected.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="quote-config-panel">
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
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Client / Customer</label>
                <select
                  className="form-control"
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                >
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div
                  style={{
                    backgroundColor: "var(--bg-app)",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                      }}
                    >
                      Contact Person:
                    </strong>
                    <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedCustomer.contactName}</div>
                  </div>
                  <div>
                    <strong
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                      }}
                    >
                      Email:
                    </strong>
                    <div style={{ fontWeight: 600, marginTop: "2px" }}>{selectedCustomer.email}</div>
                  </div>
                  <div>
                    <strong
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                      }}
                    >
                      Address:
                    </strong>
                    <div style={{ fontWeight: 600, marginTop: "2px", lineHeight: "1.4" }}>
                      {selectedCustomer.address}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {isLoadingForm && effectiveParameterFields.length === 0 ? (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-app)",
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                  }}
                >
                  Loading parameter options...
                </div>
              ) : (
                effectiveParameterFields.map((field) => (
                  <div className="form-group" style={{ margin: 0 }} key={field.key}>
                    <label className="form-label">{field.label}</label>
                    <select
                      className="form-control"
                      value={parameterValues[field.key] || ""}
                      onChange={(event) => updateParameterValue(field.key, event.target.value)}
                    >
                      {field.options?.map((option) => (
                        <option key={`${field.key}-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="config-footer-summary">
            <div>
              <div
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                }}
              >
                Quote Total
              </div>
              <div
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: "var(--primary)",
                  marginTop: "2px",
                }}
              >
                {formatCurrency(grandTotal)}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link to="/quotes" className="btn btn-secondary btn-sm" style={{ padding: "0.5rem 0.85rem" }}>
                Cancel
              </Link>
              <button
                onClick={() => handleSave("Draft")}
                className="btn btn-secondary btn-sm"
                style={{ padding: "0.5rem 0.85rem" }}
              >
                Draft
              </button>
              <button
                onClick={() => handleSave("Pending")}
                className="btn btn-primary btn-sm"
                style={{ padding: "0.5rem 0.85rem" }}
              >
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
