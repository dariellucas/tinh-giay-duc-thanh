import React, { createContext, useContext } from 'react';
import { usePricingData } from '../hooks/usePricingData';

const PricingDataContext = createContext(null);

export function PricingDataProvider({ children }) {
  const pricingData = usePricingData();
  return <PricingDataContext.Provider value={pricingData}>{children}</PricingDataContext.Provider>;
}

export function usePricingDataContext() {
  const context = useContext(PricingDataContext);
  if (!context) {
    throw new Error('usePricingDataContext must be used within PricingDataProvider');
  }
  return context;
}
