const buildOptions = (labels) =>
  labels.map((label) => ({
    value: label,
    label,
  }));

const quoteParameterFields = [
  {
    key: "boxStyle",
    label: "Box Style",
    options: buildOptions(["Corrugated", "Offset", "Offset laminated"]),
    defaultValue: "Corrugated",
  },
  {
    key: "type",
    label: "Type",
    options: buildOptions(["RSC", "FOL", "Two-piece", "Tray", "Sleeve"]),
    defaultValue: "RSC",
  },
  {
    key: "dimension",
    label: "Dimensions",
    options: buildOptions(["ID (L x W x H mm)", "OD (L x W x H mm)"]),
    defaultValue: "ID (L x W x H mm)",
  },
  {
    key: "fluteType",
    label: "Flute Type",
    options: buildOptions(["B", "C", "E", "F", "BC", "BE"]),
    defaultValue: "B",
  },
  {
    key: "boardQuality",
    label: "Board Quality",
    options: buildOptions(["125 GSM", "150 GSM", "200 GSM", "250 GSM", "300 GSM"]),
    defaultValue: "150 GSM",
  },
  {
    key: "colors",
    label: "No. Colors",
    options: buildOptions(["1", "2", "Up to 4", "4 + varnish"]),
    defaultValue: "2",
  },
  {
    key: "joints",
    label: "Joints",
    options: buildOptions(["Glue", "Stitch"]),
    defaultValue: "Glue",
  },
  {
    key: "moq",
    label: "MOQ",
    options: buildOptions(["Based on enquiry", "1k", "3k", "5k", "10k"]),
    defaultValue: "5k",
  },
];

const quoteParameterDefaults = quoteParameterFields.reduce((defaults, field) => {
  defaults[field.key] = field.defaultValue;
  return defaults;
}, {});

module.exports = {
  quoteParameterFields,
  quoteParameterDefaults,
};
