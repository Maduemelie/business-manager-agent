import { useState, useEffect, useCallback } from 'react';
import { generateDailyBlueprint, getTodayBlueprint } from '../services/contentGenerator';
import { seedDatabaseIfEmpty, getAllFromStore, STORES } from '../services/db';

/**
 * Custom React hook managing offline-first content generation and IndexedDB state.
 * Runs 100% offline without remote server calls.
 * 
 * @returns {{
 *   loading: boolean,
 *   postData: Object|null,
 *   setPostData: Function,
 *   error: string|null,
 *   generateContent: Function,
 *   reloadContent: Function,
 *   isReady: boolean
 * }}
 */
export const useContentGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [postData, setPostData] = useState(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const reloadContent = useCallback(async () => {
    try {
      const todayContent = await getTodayBlueprint();
      if (todayContent) {
        setPostData(todayContent);
        return todayContent;
      }
      const allPosts = await getAllFromStore(STORES.POSTS);
      if (Array.isArray(allPosts) && allPosts.length > 0) {
        const latest = allPosts[allPosts.length - 1];
        setPostData(latest);
        return latest;
      }
      setPostData(null);
      return null;
    } catch (err) {
      console.error('Failed to reload content:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialState = async () => {
      setLoading(true);
      try {
        await seedDatabaseIfEmpty();
        if (isMounted) {
          setIsReady(true);
        }
        const todayContent = await getTodayBlueprint();
        if (isMounted) {
          setPostData(todayContent || null);
        }
      } catch (err) {
        console.error("Failed to load today's blueprint from IndexedDB on mount:", err);
        if (isMounted) {
          setError(err.message || 'Failed to access local database.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialState();

    return () => {
      isMounted = false;
    };
  }, []);

  const generateContent = useCallback(async (perfumeId = null) => {
    setLoading(true);
    setError(null);
    try {
      await seedDatabaseIfEmpty();
      const blueprint = await generateDailyBlueprint(perfumeId);
      setPostData(blueprint);
      return blueprint;
    } catch (err) {
      console.error('Content generation error:', err);
      const errMsg = err.message || 'Failed to generate content blueprint.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    postData,
    setPostData,
    error,
    generateContent,
    reloadContent,
    isReady
  };
};
