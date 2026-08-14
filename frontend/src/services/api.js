import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
// Normalize: remove any trailing slashes and redundant /api suffix
export const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');

/**
 * Executes a POST request to generate daily social media content blueprint.
 * @param {number|null} perfumeId Optional perfume ID to force regeneration for that perfume.
 * @returns {Promise<Object>} Response packet data
 */
export const generateContent = async (perfumeId = null) => {
  const rawKey = import.meta.env.VITE_API_SECRET_KEY || '';
  const secretKey = rawKey.trim().replace(/^["']|["']$/g, '');
  const payload = perfumeId ? { perfume_id: perfumeId } : {};
  const response = await axios.post(`${API_BASE_URL}/api/generate`, payload, {
    headers: {
      'X-API-Key': secretKey
    }
  });
  return response.data;
};

/**
 * Executes a GET request to fetch today's generated post content if it exists.
 * @returns {Promise<Object|null>} Today's generated content, or null.
 */
export const fetchTodayContent = async () => {
  const rawKey = import.meta.env.VITE_API_SECRET_KEY || '';
  const secretKey = rawKey.trim().replace(/^["']|["']$/g, '');
  const response = await axios.get(`${API_BASE_URL}/api/generate/today`, {
    headers: {
      'X-API-Key': secretKey
    }
  });
  return response.data;
};
