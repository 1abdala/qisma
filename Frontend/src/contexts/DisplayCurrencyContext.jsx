import React, { createContext, useState } from 'react';

export const DisplayCurrencyContext = createContext();

/**
 * DisplayCurrencyProvider
 * 
 * Manages which currency the user wants to VIEW their balance/pockets in.
 * This is display-only — backend data remains unchanged.
 */
export function DisplayCurrencyProvider({ children }) {
  const [displayCurrency, setDisplayCurrency] = useState('SAR');

  return (
    <DisplayCurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency }}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}
