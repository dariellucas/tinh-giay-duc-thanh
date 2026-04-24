import { useCallback, useEffect, useState } from 'react';
import { loadPricingData } from '../services/pricingService';

export function usePricingData() {
  const [paperDatabase, setPaperDatabase] = useState(null);
  const [printerDatabase, setPrinterDatabase] = useState([]);
  const [finishingDatabase, setFinishingDatabase] = useState([]);
  const [hopMemDatabase, setHopMemDatabase] = useState([]);
  const [dinhMucDatabase, setDinhMucDatabase] = useState([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [priceLoadError, setPriceLoadError] = useState('');

  const fetchPaperPrices = useCallback(async () => {
    setIsLoadingPrices(true);
    setPriceLoadError('');
    const payload = await loadPricingData();
    setPaperDatabase(payload.paperDatabase);
    setPrinterDatabase(payload.printerDatabase);
    setFinishingDatabase(payload.finishingDatabase);
    setHopMemDatabase(payload.hopMemDatabase);
    setDinhMucDatabase(payload.dinhMucDatabase);
    setPriceLoadError(payload.priceLoadError || '');
    setIsLoadingPrices(false);
  }, []);

  useEffect(() => {
    fetchPaperPrices();
  }, [fetchPaperPrices]);

  return {
    paperDatabase,
    printerDatabase,
    finishingDatabase,
    hopMemDatabase,
    dinhMucDatabase,
    isLoadingPrices,
    priceLoadError,
    fetchPaperPrices,
  };
}
