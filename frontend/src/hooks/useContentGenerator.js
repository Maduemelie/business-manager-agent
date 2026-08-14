import { useState, useEffect } from 'react';
import { generateContent as apiGenerateContent, fetchTodayContent } from '../services/api';

/**
 * Custom React hook managing the content generation state and execution.
 * @returns {Object} { loading, postData, error, generateContent }
 */
export const useContentGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [postData, setPostData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkTodayContent = async () => {
      setLoading(true);
      try {
        const todayContent = await fetchTodayContent();
        if (todayContent) {
          setPostData(todayContent);
        }
      } catch (err) {
        console.error("Failed to load today's generated content on mount:", err);
      } finally {
        setLoading(false);
      }
    };
    checkTodayContent();
  }, []);

  const generateContent = async (perfumeId = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGenerateContent(perfumeId);
      setPostData(data);
      return data;
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Failed to connect to the AI Engine. Is the backend running?";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    postData,
    error,
    generateContent
  };
};
