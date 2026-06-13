const {
  quoteParameterFields,
  quoteParameterDefaults,
} = require("./quoteParameters.model");

const getQuoteParameterOptions = () => {
  return {
    fields: quoteParameterFields.map((field) => ({
      ...field,
      options: field.options.map((option) => ({ ...option })),
    })),
    defaults: { ...quoteParameterDefaults },
  };
};

module.exports = {
  getQuoteParameterOptions,
};
