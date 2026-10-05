import { useState, useCallback, useEffect } from 'react';
import { getAllFromStore, putToStore, getFromStore, STORES } from '../services/db';

export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllFromStore(STORES.INVENTORY);
      setInventory(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load inventory', err);
      setError('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInventoryItem = useCallback(async (perfume_id, stock_quantity, cost_price, selling_price) => {
    try {
      const record = {
        perfume_id: Number(perfume_id),
        stock_quantity: Number(stock_quantity),
        cost_price: Number(cost_price),
        selling_price: Number(selling_price),
        last_updated: new Date().toISOString()
      };
      await putToStore(STORES.INVENTORY, record);
      await loadInventory(); // refresh state
      return true;
    } catch (err) {
      console.error('Failed to update inventory item', err);
      setError('Failed to update inventory item.');
      return false;
    }
  }, [loadInventory]);

  const getInventoryItem = useCallback(async (perfume_id) => {
    try {
      return await getFromStore(STORES.INVENTORY, Number(perfume_id));
    } catch (err) {
      console.error('Failed to fetch inventory item', err);
      return null;
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return {
    inventory,
    loading,
    error,
    updateInventoryItem,
    getInventoryItem,
    reloadInventory: loadInventory
  };
}
