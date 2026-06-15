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

const CLIENT_FIELDS = [
  { key: "companyName", label: "Company Name", placeholder: "Enter company name" },
  { key: "companyAddress", label: "Company Address", placeholder: "Enter company address", multiline: true },
  { key: "contactPerson", label: "Contact Person", placeholder: "Enter contact person name" },
  { key: "phoneNumber", label: "Phone Number", placeholder: "Enter phone number" },
  { key: "email", label: "Email", placeholder: "Enter email address" },
  { key: "billingAddress", label: "Billing Address", placeholder: "Enter billing address", multiline: true },
  { key: "deliveryAddress", label: "Delivery Address", placeholder: "Enter delivery address", multiline: true },
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
    Offset: 0.04,
  },
  dimension: {
    "ID (L x W x H mm)": 0,
    "OD (L x W x H mm)": 0.02,
    "ID 400x300x200": 0.05,
    "OD 600x400x300": 0.08,
    "ID 250x180x120": 0.03,
  },
  fluteType: {
    B: 0.04,
    C: 0.06,
    E: 0.03,
    F: 0.02,
    BC: 0.11,
    BE: 0.09,
    "N-A": 0,
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
    "2 colors": 0.05,
    "4 colors": 0.1,
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
  "1000": 1,
  "3000": 0.98,
  "5000": 0.96,
  "10000": 0.93,
};

const MOQ_QUANTITY_MAP = {
  "Based on enquiry": 1000,
  "1k": 1000,
  "3k": 3000,
  "5k": 5000,
  "10k": 10000,
  "1000": 1000,
  "3000": 3000,
  "5000": 5000,
  "10000": 10000,
};

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

const formatCurrency = (value) =>
  "S$" +
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const buildFieldDefaults = (defaults = {}, fields = []) =>
  PARAMETER_KEYS.reduce((accumulator, key) => {
    const field = fields.find((entry) => entry.key === key);
    accumulator[key] = defaults[key] || field?.defaultValue || field?.options?.[0]?.value || "";
    return accumulator;
  }, {});

const buildClientDetailsFromCustomer = (customer) => ({
  companyName: customer?.companyName || "",
  companyAddress: customer?.address || "",
  contactPerson: customer?.contactName || "",
  phoneNumber: customer?.phone || "",
  email: customer?.email || "",
  billingAddress: customer?.address || "",
  deliveryAddress: customer?.address || "",
});

const buildItemName = (item) =>
  `${item.boxStyle || "Corrugated"} ${item.type || "RSC"} carton (${item.dimension || "ID"}, ${item.fluteType || "B"})`;

const buildDefaultQuoteItem = (fieldDefaults) => ({
  id: `sku-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  ...fieldDefaults,
  quantity: getMoqQuantity(fieldDefaults.moq),
  name: buildItemName(fieldDefaults),
});

const getCalculatedUnitPrice = (item) => {
  let price = 0.42;

  price += PRICE_ADJUSTMENTS.boxStyle[item.boxStyle] || 0;
  price += PRICE_ADJUSTMENTS.type[item.type] || 0;
  price += PRICE_ADJUSTMENTS.dimension[item.dimension] || 0;
  price += PRICE_ADJUSTMENTS.fluteType[item.fluteType] || 0;
  price += PRICE_ADJUSTMENTS.boardQuality[item.boardQuality] || 0;
  price += PRICE_ADJUSTMENTS.colors[item.colors] || 0;
  price += PRICE_ADJUSTMENTS.joints[item.joints] || 0;

  const multiplier = MOQ_DISCOUNT_MULTIPLIERS[item.moq] || 1;
  return Number(Math.max(price * multiplier, 0.12).toFixed(2));
};

const buildEditableItems = (quote, fieldDefaults) => {
  if (Array.isArray(quote?.items) && quote.items.length > 0) {
    return quote.items.map((item, index) => ({
      id: item.id || `sku-${index + 1}`,
      boxStyle: item.boxStyle || quote.boxStyle || fieldDefaults.boxStyle,
      type: item.type || quote.type || fieldDefaults.type,
      dimension: item.dimension || quote.dimension || fieldDefaults.dimension,
      fluteType: item.fluteType || quote.fluteType || fieldDefaults.fluteType,
      boardQuality: item.boardQuality || quote.boardQuality || fieldDefaults.boardQuality,
      colors: item.colors || quote.colors || fieldDefaults.colors,
      joints: item.joints || quote.joints || fieldDefaults.joints,
      moq: item.moq || quote.moq || fieldDefaults.moq,
      quantity: Number(item.quantity || getMoqQuantity(item.moq || fieldDefaults.moq)),
      name: item.name || buildItemName(item),
    }));
  }

  return [buildDefaultQuoteItem(fieldDefaults)];
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
  const [quoteItems, setQuoteItems] = useState([]);
  const [clientDetails, setClientDetails] = useState(() => buildClientDetailsFromCustomer(null));
  const [validationErrors, setValidationErrors] = useState({ client: {}, items: [] });
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
        const fieldDefaults = buildFieldDefaults(optionResponse.data?.defaults, nextFields);

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
          setClientDetails(
            quote.clientDetails || buildClientDetailsFromCustomer(nextCustomers.find((item) => item.id === quote.customer?.id))
          );
          setQuoteItems(buildEditableItems(quote, fieldDefaults));
        } else {
          const quoteResponse = await apiService.getQuotes();
          const nextQuoteCount = (quoteResponse.data || []).length + 1;
          const defaultCustomer = nextCustomers[0] || null;

          setQuoteNumber(`#12${String(nextQuoteCount).padStart(3, "0")}`);
          setSelectedCustomerId(defaultCustomer?.id || "");
          setClientDetails(buildClientDetailsFromCustomer(defaultCustomer));
          setQuoteItems([buildDefaultQuoteItem(fieldDefaults)]);
        }
      } catch (error) {
        console.error("Error loading form data:", error);
      } finally {
        setIsLoadingForm(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const parameterFieldMap = useMemo(
    () =>
      parameterFields.reduce((accumulator, field) => {
        accumulator[field.key] = field;
        return accumulator;
      }, {}),
    [parameterFields]
  );

  const pricedItems = useMemo(
    () =>
      quoteItems.map((item) => {
        const unitPrice = getCalculatedUnitPrice(item);
        const quantity = Number(item.quantity || 0);
        return {
          ...item,
          name: item.name || buildItemName(item),
          unitPrice,
          lineTotal: Number((unitPrice * quantity).toFixed(2)),
        };
      }),
    [quoteItems]
  );

  const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = subtotal * (setup.discountRate / 100);
  const taxAmount = (subtotal - discountAmount) * (setup.taxRate / 100);
  const grandTotal = subtotal - discountAmount + taxAmount;

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const headerTitle = id ? "Edit Quote" : "New Quote";
  const previewStatusLabel = id ? "EDIT PREVIEW" : "DRAFT PREVIEW";

  const updateItem = (itemId, updater) => {
    setQuoteItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) return item;
        const nextItem = typeof updater === "function" ? updater(item) : { ...item, ...updater };
        return {
          ...nextItem,
          name: buildItemName(nextItem),
        };
      })
    );
  };

  const handleCustomerChange = (customerId) => {
    setSelectedCustomerId(customerId);
    const matchedCustomer = customers.find((customer) => customer.id === customerId);
    setClientDetails(buildClientDetailsFromCustomer(matchedCustomer));
  };

  const handleClientFieldChange = (key, value) => {
    setClientDetails((currentDetails) => ({
      ...currentDetails,
      [key]: value,
    }));
    setValidationErrors((currentErrors) => ({
      ...currentErrors,
      client: {
        ...currentErrors.client,
        [key]: false,
      },
    }));
  };

  const handleItemFieldChange = (itemId, key, value) => {
    updateItem(itemId, (currentItem) => {
      const nextItem = {
        ...currentItem,
        [key]: value,
      };

      if (key === "moq") {
        const currentMoqQuantity = getMoqQuantity(currentItem.moq);
        if (!currentItem.quantity || Number(currentItem.quantity) === currentMoqQuantity) {
          nextItem.quantity = getMoqQuantity(value);
        }
      }

      return nextItem;
    });
  };

  const addSkuRow = () => {
    const fieldDefaults = buildFieldDefaults({}, parameterFields);
    setQuoteItems((currentItems) => [...currentItems, buildDefaultQuoteItem(fieldDefaults)]);
  };

  const removeSkuRow = (itemId) => {
    setQuoteItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  };

  const validateForm = () => {
    const clientErrors = CLIENT_FIELDS.reduce((accumulator, field) => {
      accumulator[field.key] = !String(clientDetails[field.key] || "").trim();
      return accumulator;
    }, {});

    const itemErrors = quoteItems.map((item) => {
      const errors = PARAMETER_KEYS.reduce((accumulator, key) => {
        accumulator[key] = !String(item[key] || "").trim();
        return accumulator;
      }, {});
      errors.quantity = !(Number(item.quantity || 0) > 0);
      return errors;
    });

    const nextErrors = { client: clientErrors, items: itemErrors };
    setValidationErrors(nextErrors);

    const hasClientErrors = Object.values(clientErrors).some(Boolean);
    const hasItemErrors = itemErrors.some((entry) => Object.values(entry).some(Boolean));

    return {
      isValid: !(hasClientErrors || hasItemErrors || !selectedCustomerId),
      hasClientErrors,
    };
  };

  const getOptionLabel = (key, value) => {
    const options = parameterFieldMap[key]?.options || [];
    return options.find((option) => option.value === value)?.label || value || "N/A";
  };

  const handleSave = async (status) => {
    const { isValid, hasClientErrors } = validateForm();

    if (!selectedCustomerId) {
      alert("Please select a customer.");
      setFormTab("client");
      return;
    }

    if (!isValid) {
      setFormTab(hasClientErrors ? "client" : "parameters");
      return;
    }

    const items = pricedItems.map((item) => ({
      name: buildItemName(item),
      boxStyle: item.boxStyle,
      type: item.type,
      dimension: item.dimension,
      fluteType: item.fluteType,
      boardQuality: item.boardQuality,
      colors: item.colors,
      joints: item.joints,
      moq: item.moq,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
    }));

    const leadItem = items[0];
    const payload = {
      quoteNumber,
      customerId: selectedCustomerId,
      clientDetails,
      boxStyle: leadItem.boxStyle,
      type: leadItem.type,
      dimension: leadItem.dimension,
      fluteType: leadItem.fluteType,
      boardQuality: leadItem.boardQuality,
      colors: leadItem.colors,
      joints: leadItem.joints,
      moq: leadItem.moq,
      items,
      totalPlaceholder: Number(grandTotal.toFixed(2)),
      status,
      createdBy: currentUser.id,
    };

    try {
      if (id) {
        await apiService.updateQuote(id, {
          ...payload,
          updatedBy: currentUser.id,
          note:
            status === "Pending"
              ? "Sales updated the quote and resubmitted to HOD."
              : "Sales updated quote details.",
        });
      } else {
        await apiService.createQuote(payload);
      }

      navigate("/quotes");
    } catch (error) {
      console.error("Error saving quote:", error);
    }
  };

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
                  Walkthrough-ready preview
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
                SKU Specifications
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
                    <th style={{ padding: "0.5rem 0.25rem" }}>Dimension</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Flute</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Board Quality</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>No. Color</th>
                    <th style={{ padding: "0.5rem 0.25rem" }}>Joints</th>
                    <th style={{ padding: "0.5rem 0.25rem", textAlign: "right" }}>MOQ</th>
                  </tr>
                </thead>
                <tbody>
                  {pricedItems.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        fontSize: "0.8rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      <td style={{ padding: "0.9rem 0.25rem", fontWeight: 700 }}>{getOptionLabel("boxStyle", item.boxStyle)}</td>
                      <td style={{ padding: "0.9rem 0.25rem" }}>{getOptionLabel("type", item.type)}</td>
                      <td style={{ padding: "0.9rem 0.25rem" }}>{getOptionLabel("dimension", item.dimension)}</td>
                      <td style={{ padding: "0.9rem 0.25rem" }}>{getOptionLabel("fluteType", item.fluteType)}</td>
                      <td style={{ padding: "0.9rem 0.25rem" }}>{getOptionLabel("boardQuality", item.boardQuality)}</td>
                      <td style={{ padding: "0.9rem 0.25rem" }}>{getOptionLabel("colors", item.colors)}</td>
                      <td style={{ padding: "0.9rem 0.25rem" }}>{getOptionLabel("joints", item.joints)}</td>
                      <td style={{ padding: "0.9rem 0.25rem", textAlign: "right" }}>{item.moq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: "1.5rem", display: "grid", gap: "0.5rem" }}>
                {pricedItems.map((item, index) => (
                  <div
                    key={`price-${item.id}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.25fr 0.7fr 0.7fr 0.8fr",
                      gap: "0.75rem",
                      fontSize: "0.78rem",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>SKU {index + 1}: {item.name}</div>
                    <div>Qty: {new Intl.NumberFormat("en-US").format(item.quantity)}</div>
                    <div>Unit: {formatCurrency(item.unitPrice)}</div>
                    <div style={{ textAlign: "right", fontWeight: 700 }}>{formatCurrency(item.lineTotal)}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                <div
                  style={{
                    width: "260px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    fontSize: "0.8rem",
                  }}
                >
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
                Client Details
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "0.75rem 1rem",
                  fontSize: "0.8rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", display: "block" }}>
                    Company Name
                  </span>
                  <span style={{ fontWeight: 700 }}>{clientDetails.companyName || "Required"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", display: "block" }}>
                    Contact Person
                  </span>
                  <span style={{ fontWeight: 700 }}>{clientDetails.contactPerson || "Required"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", display: "block" }}>
                    Email / Phone
                  </span>
                  <span style={{ fontWeight: 600 }}>{clientDetails.email || "Required"} / {clientDetails.phoneNumber || "Required"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", display: "block" }}>
                    Company Address
                  </span>
                  <span style={{ fontWeight: 600 }}>{clientDetails.companyAddress || "Required"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", display: "block" }}>
                    Billing Address
                  </span>
                  <span style={{ fontWeight: 600 }}>{clientDetails.billingAddress || "Required"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.65rem", textTransform: "uppercase", display: "block" }}>
                    Delivery Address
                  </span>
                  <span style={{ fontWeight: 600 }}>{clientDetails.deliveryAddress || "Required"}</span>
                </div>
              </div>
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
                  onChange={(event) => handleCustomerChange(event.target.value)}
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
                    padding: "0.9rem 1rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Prefilled from customer master. You can edit the quote snapshot directly here.
                </div>
              )}

              {CLIENT_FIELDS.map((field) => {
                const hasError = validationErrors.client?.[field.key];
                const Component = field.multiline ? "textarea" : "input";

                return (
                  <div className="form-group" style={{ margin: 0 }} key={field.key}>
                    <label className="form-label">{field.label}</label>
                    <Component
                      className="form-control"
                      value={clientDetails[field.key] || ""}
                      onChange={(event) => handleClientFieldChange(field.key, event.target.value)}
                      placeholder={field.placeholder}
                      rows={field.multiline ? 3 : undefined}
                      style={{
                        borderColor: hasError ? "var(--danger)" : undefined,
                        boxShadow: hasError ? "0 0 0 1px var(--danger)" : undefined,
                        resize: field.multiline ? "vertical" : undefined,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="form-label" style={{ marginBottom: 0 }}>Quote SKU Rows</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Each row keeps its own parameters, MOQ, and quantity.
                  </div>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addSkuRow}>
                  Add SKU
                </button>
              </div>

              {isLoadingForm && quoteItems.length === 0 ? (
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
                quoteItems.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "var(--bg-app)",
                      borderRadius: "var(--radius-md)",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.9rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--primary)" }}>SKU {index + 1}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{item.name || buildItemName(item)}</div>
                      </div>
                      {quoteItems.length > 1 && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeSkuRow(item.id)}>
                          Remove
                        </button>
                      )}
                    </div>

                    {parameterFields.map((field) => {
                      const hasError = validationErrors.items?.[index]?.[field.key];
                      const fieldOptions =
                        item[field.key] && !field.options?.some((option) => option.value === item[field.key])
                          ? [{ value: item[field.key], label: item[field.key] }, ...(field.options || [])]
                          : field.options || [];
                      return (
                        <div className="form-group" style={{ margin: 0 }} key={`${item.id}-${field.key}`}>
                          <label className="form-label">{field.label}</label>
                          <select
                            className="form-control"
                            value={item[field.key] || ""}
                            onChange={(event) => handleItemFieldChange(item.id, field.key, event.target.value)}
                            style={{
                              borderColor: hasError ? "var(--danger)" : undefined,
                              boxShadow: hasError ? "0 0 0 1px var(--danger)" : undefined,
                            }}
                          >
                            {fieldOptions.map((option) => (
                              <option key={`${field.key}-${option.value}`} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Quantity</label>
                      <input
                        className="form-control"
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(event) => handleItemFieldChange(item.id, "quantity", event.target.value)}
                        placeholder="Enter quantity"
                        style={{
                          borderColor: validationErrors.items?.[index]?.quantity ? "var(--danger)" : undefined,
                          boxShadow: validationErrors.items?.[index]?.quantity ? "0 0 0 1px var(--danger)" : undefined,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "0.75rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      <div>
                        <div style={{ color: "var(--text-secondary)" }}>Unit Price</div>
                        <div style={{ fontWeight: 800 }}>{formatCurrency(getCalculatedUnitPrice(item))}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-secondary)" }}>MOQ Default Qty</div>
                        <div style={{ fontWeight: 800 }}>{new Intl.NumberFormat("en-US").format(getMoqQuantity(item.moq))}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-secondary)" }}>Line Total</div>
                        <div style={{ fontWeight: 800 }}>{formatCurrency(getCalculatedUnitPrice(item) * Number(item.quantity || 0))}</div>
                      </div>
                    </div>
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
