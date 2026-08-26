import { useState, useEffect } from 'react';
import { seedDatabaseIfEmpty, countStore, STORES } from '../services/db';

/**
 * Custom React hook managing the initialization and state of client-side IndexedDB storage.
 * @returns {{ isReady: boolean, isSeeding: boolean, error: string|null, perfumesCount: number }}
 */
export const useAppStorage = () => {
  const [isReady, setIsReady] = useState(false);
  const [isSeeding, setIsSeeding] = useState(true);
  const [error, setError] = useState(null);
  const [perfumesCount, setPerfumesCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const initStorage = async () => {
      try {
        setIsSeeding(true);
        await seedDatabaseIfEmpty();
        const count = await countStore(STORES.PERFUMES);
        if (isMounted) {
          setPerfumesCount(count);
          setIsReady(true);
          setIsSeeding(false);
        }
      } catch (err) {
        console.error('Failed to initialize IndexedDB app storage:', err);
        if (isMounted) {
          setError(err.message || 'Storage initialization failed.');
          setIsSeeding(false);
        }
      }
    };

    initStorage();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isReady,
    isSeeding,
    error,
    perfumesCount
  };
};
