import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext({
  currency: 'INR',
  changeCurrency: () => {},
  formatPrice: (amount) => amount?.toLocaleString() || '',
  currencies: {}
});

const CURRENCIES = {
  INR: { symbol: '₹', rate: 1, label: 'Indian Rupee' },
  USD: { symbol: '$', rate: 0.012, label: 'US Dollar' },
  EUR: { symbol: '€', rate: 0.011, label: 'Euro' },
  GBP: { symbol: '£', rate: 0.0095, label: 'British Pound' },
  AED: { symbol: 'DH', rate: 0.044, label: 'UAE Dirham' }
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skystay_currency');
      if (saved && CURRENCIES[saved]) setCurrency(saved);
    }
  }, []);

  const changeCurrency = (code) => {
    if (CURRENCIES[code]) {
      setCurrency(code);
      if (typeof window !== 'undefined') {
        localStorage.setItem('skystay_currency', code);
      }
    }
  };

  const formatPrice = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '';
    const { symbol, rate } = CURRENCIES[currency];
    const converted = amount * rate;
    return `${symbol}${converted.toLocaleString(undefined, { 
      minimumFractionDigits: currency === 'INR' ? 0 : 2,
      maximumFractionDigits: currency === 'INR' ? 0 : 2
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency, formatPrice, currencies: CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
