export const QUOTE_STATUS_FILTER_OPTIONS = [
  "All",
  "Draft",
  "Pending",
  "Processing",
  "PendingApproval",
  "Active",
  "Approved",
  "Rejected",
  "AskedForEdit",
];

const normalizeText = (value) => {
  return String(value || "").trim().toLowerCase();
};

export const filterQuotes = (
  quotes = [],
  filters = {},
  activeTab = "quotes"
) => {
  const {
    companyName = "",
    status = "All",
    quoteNumber = "",
  } = filters;

  const normalizedCompanyName = normalizeText(companyName);
  const normalizedQuoteNumber = normalizeText(quoteNumber);
  const normalizedStatus = normalizeText(status);

  return quotes.filter((quote) => {
    const quoteCompanyName = normalizeText(
      quote.companyName || quote.customer?.companyName
    );

    const quoteContactName = normalizeText(
      quote.contactName || quote.customer?.contactName
    );

    const currentQuoteNumber = normalizeText(quote.quoteNumber);
    const rawStatus = normalizeText(quote.status);
    const statusLabel = normalizeText(quote.statusLabel);

    const matchesCompanyName =
      !normalizedCompanyName ||
      quoteCompanyName.includes(normalizedCompanyName) ||
      quoteContactName.includes(normalizedCompanyName);

    const matchesQuoteNumber =
      !normalizedQuoteNumber ||
      currentQuoteNumber.includes(normalizedQuoteNumber);

    const matchesStatus =
      normalizedStatus === "all" ||
      rawStatus === normalizedStatus ||
      statusLabel === normalizedStatus ||
      (normalizedStatus === "active" && rawStatus === "approved");

    const matchesTab =
      activeTab === "active_orders"
        ? ["pending", "processing", "pendingapproval"].includes(rawStatus)
        : activeTab === "quotes"
          ? !["rejected", "askedforedit"].includes(rawStatus)
          : activeTab === "upcoming" ||
              activeTab === "on_hold" ||
              activeTab === "cancelled"
            ? false
            : true;

    return (
      matchesCompanyName &&
      matchesQuoteNumber &&
      matchesStatus &&
      matchesTab
    );
  });
};

export const getRejectedAndEditQuotes = (
  quotes = [],
  companyNameSearch = ""
) => {
  const normalizedCompanyName = normalizeText(companyNameSearch);

  return quotes.filter((quote) => {
    const quoteCompanyName = normalizeText(
      quote.companyName || quote.customer?.companyName
    );

    const quoteContactName = normalizeText(
      quote.contactName || quote.customer?.contactName
    );

    const rawStatus = normalizeText(quote.status);

    const isRejectedOrEdit =
      rawStatus === "rejected" || rawStatus === "askedforedit";

    const matchesCompanyName =
      !normalizedCompanyName ||
      quoteCompanyName.includes(normalizedCompanyName) ||
      quoteContactName.includes(normalizedCompanyName);

    return isRejectedOrEdit && matchesCompanyName;
  });
};