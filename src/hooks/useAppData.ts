import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sale, Reception, AppConfig } from '../types';

export function useAppData() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    reinvestPct: 40,
    savingsPct: 20,
    profitPct: 40,
    criticalStockThreshold: 50
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedSales = localStorage.getItem('nfc_sap_sales');
      const storedReceptions = localStorage.getItem('nfc_sap_receptions');
      const storedConfig = localStorage.getItem('nfc_sap_config');

      if (storedSales) setSales(JSON.parse(storedSales));
      if (storedReceptions) setReceptions(JSON.parse(storedReceptions));
      if (storedConfig) setConfig(JSON.parse(storedConfig));
    } catch (e) {
      console.error('Error loading storage:', e);
    }
    setIsLoaded(true);
  }, []);

  const saveToStorage = useCallback((newSales: Sale[], newReceptions: Reception[], newConfig: AppConfig) => {
    try {
      localStorage.setItem('nfc_sap_sales', JSON.stringify(newSales));
      localStorage.setItem('nfc_sap_receptions', JSON.stringify(newReceptions));
      localStorage.setItem('nfc_sap_config', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Storage Warning:', e);
    }
  }, []);

  const addSale = useCallback((sale: Sale) => {
    setSales(prev => {
      const next = [sale, ...prev];
      saveToStorage(next, receptions, config);
      return next;
    });
  }, [receptions, config, saveToStorage]);

  const addReception = useCallback((reception: Reception) => {
    setReceptions(prev => {
      const next = [reception, ...prev];
      saveToStorage(sales, next, config);
      return next;
    });
  }, [sales, config, saveToStorage]);

  const deleteSale = useCallback((id: string) => {
    setSales(prev => {
      const next = prev.filter(s => s.id !== id);
      saveToStorage(next, receptions, config);
      return next;
    });
  }, [receptions, config, saveToStorage]);

  const deleteReception = useCallback((id: string) => {
    setReceptions(prev => {
      const next = prev.filter(r => r.id !== id);
      saveToStorage(sales, next, config);
      return next;
    });
  }, [sales, config, saveToStorage]);

  const updateConfig = useCallback((newConfig: AppConfig) => {
    setConfig(newConfig);
    saveToStorage(sales, receptions, newConfig);
  }, [sales, receptions, saveToStorage]);

  const importBatch = useCallback((newSales: Sale[], newReceptions: Reception[]) => {
    setSales(prev => {
      const combined = [...prev];
      newSales.forEach(ns => { if (!combined.some(s => s.id === ns.id)) combined.push(ns); });
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setReceptions(prevRec => {
        const combRec = [...prevRec];
        newReceptions.forEach(nr => { if (!combRec.some(r => r.id === nr.id)) combRec.push(nr); });
        combRec.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        saveToStorage(combined, combRec, config);
        return combRec;
      });

      return combined;
    });
  }, [config, saveToStorage]);
  
  const resetAll = useCallback(() => {
    setSales([]);
    setReceptions([]);
    localStorage.removeItem('nfc_sap_sales');
    localStorage.removeItem('nfc_sap_receptions');
  }, []);

  const getAvailableStock = useCallback(() => {
    const totalReceived = receptions.reduce((acc, curr) => acc + (curr.qty || 0), 0);
    const totalSold = sales.reduce((acc, curr) => acc + (curr.qty || 0), 0);
    return totalReceived - totalSold;
  }, [receptions, sales]);

  const getAverageLandedUnitCost = useCallback(() => {
    if (receptions.length === 0) return 3100;
    const totalCost = receptions.reduce((acc, curr) => acc + curr.totalLandedClp, 0);
    const totalQty = receptions.reduce((acc, curr) => acc + curr.qty, 0);
    return totalQty > 0 ? Math.round(totalCost / totalQty) : 3100;
  }, [receptions]);

  return {
    isLoaded,
    sales,
    receptions,
    config,
    addSale,
    deleteSale,
    addReception,
    deleteReception,
    updateConfig,
    importBatch,
    resetAll,
    getAvailableStock,
    getAverageLandedUnitCost
  };
}
