/**
 * useCurrencyConverter Hook
 * 
 * Client-side currency conversion for display purposes only.
 * Uses the same exchange rates as the backend currencyService.
 */

// Copy of backend rates (keep in sync with backend/services/currencyService.js)
const RATES = {
  SAR: { SAR: 1, AED: 0.98, EGP: 13, OMR: 0.10 },
  AED: { AED: 1, SAR: 1.02, EGP: 13.3, OMR: 0.10 },
  EGP: { EGP: 1, SAR: 0.077, AED: 0.075, OMR: 0.008 },
  OMR: { OMR: 1, SAR: 9.75, AED: 9.55, EGP: 126.5 },
};

/**
 * Convert amount from one currency to another (client-side)
 */
export function convertAmount(amount, fromCurrency, toCurrency) {
  if (!amount) return 0;
  if (fromCurrency === toCurrency) return amount;

  const rate = RATES[fromCurrency]?.[toCurrency];
  if (!rate) return amount; // fallback if rate not found

  return parseFloat((amount * rate).toFixed(2));
}

/**
 * Hook to convert amounts for display
 */
export function useCurrencyConverter(displayCurrency) {
  return {
    convert: (amount, fromCurrency, toCurrency) => {
      return convertAmount(amount, fromCurrency, toCurrency);
    },

    /**
     * Format amount with currency symbol
     */
    format: (amount, sourceCurrency) => {
      const converted = convertAmount(amount, sourceCurrency, displayCurrency);
      return `${converted.toLocaleString()} ${displayCurrency}`;
    },
  };
}

export default useCurrencyConverter;
