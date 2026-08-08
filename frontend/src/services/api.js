import axios from 'axios';

// Export API base URL: loads from environment variable or dynamically resolves based on local address
export const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

/**
 * Executes a POST request to generate daily social media content blueprint.
 * @returns {Promise<Object>} Response packet data
 */
export const generateContent = async () => {
  const secretKey = import.meta.env.VITE_API_SECRET_KEY || '';
  const response = await axios.post(`${API_BASE_URL}/api/generate`, {}, {
    headers: {
      'X-API-Key': secretKey
    }
  });
  return response.data;
};
