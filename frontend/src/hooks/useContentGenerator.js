import { useState } from 'react';
import { generateContent as apiGenerateContent } from '../services/api';

/**
 * Custom React hook managing the content generation state and execution.
 * @returns {Object} { loading, postData, error, generateContent }
 */
export const useContentGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [postData, setPostData] = useState(null);
  const [error, setError] = useState(null);

  const generateContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGenerateContent();
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
