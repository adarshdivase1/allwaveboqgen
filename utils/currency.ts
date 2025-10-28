
import { CURRENCIES, Currency } from '../types';

export const formatCurrency = (amount: number, currency: Currency): string => {
  const currencyInfo = CURRENCIES.find(c => c.value === currency);
  
  // Fallback for environments that may not fully support Intl with all currencies
  if (!currencyInfo) {
    return `$${amount.toFixed(2)}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  }).format(amount);
};

// In a real application, you would fetch this from an API.
// Using USD as the base currency (rate = 1).
export const fetchExchangeRates = async (): Promise<Record<Currency, number>> => {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    // Example rates relative to USD
    const rates = {
        USD: 1,
        EUR: 0.93,
        GBP: 0.79,
        INR: 83.45,
    };
    return rates;
};