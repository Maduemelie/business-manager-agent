import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
// Normalize: remove any trailing slashes and redundant /api suffix
export const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');

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
