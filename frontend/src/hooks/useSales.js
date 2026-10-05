import { useState, useCallback, useEffect } from 'react';
import { getAllFromStore, putToStore, deleteFromStore, STORES } from '../services/db';

export function useSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllFromStore(STORES.SALES);
      // Sort by date descending
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSales(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load sales', err);
      setError('Failed to load sales.');
    } finally {
      setLoading(false);
    }
  }, []);

  const recordSale = useCallback(async (perfume_id, quantity, selling_price, cost_price, date = new Date().toISOString()) => {
    try {
      const qty = Number(quantity);
      const sp = Number(selling_price);
      const cp = Number(cost_price);
      const profit = (sp - cp) * qty;

      const record = {
        perfume_id: Number(perfume_id),
        quantity: qty,
        selling_price: sp,
        cost_price: cp,
        profit,
        date
      };
      
      await putToStore(STORES.SALES, record);
      await loadSales(); // refresh state
      return true;
    } catch (err) {
      console.error('Failed to record sale', err);
      setError('Failed to record sale.');
      return false;
    }
  }, [loadSales]);

  const removeSale = useCallback(async (id) => {
    try {
      await deleteFromStore(STORES.SALES, id);
      await loadSales();
      return true;
    } catch (err) {
      console.error('Failed to remove sale', err);
      setError('Failed to delete sale record.');
      return false;
    }
  }, [loadSales]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  return {
    sales,
    loading,
    error,
    recordSale,
    removeSale,
    reloadSales: loadSales
  };
}
