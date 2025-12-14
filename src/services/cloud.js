// src/services/cloud.js
import axios from 'axios';

const GATEWAY_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_GATEWAY_URL ||
  import.meta.env.VITE_GATEWAY_BASE ||
  'http://localhost:8080';

const cloudApi = axios.create({
  baseURL: GATEWAY_BASE,
  withCredentials: true, 
});

cloudApi.interceptors.request.use(cfg => {
  try {
    const token = localStorage.getItem('anta_token') || localStorage.getItem('token') || null;
    if (token) {
      cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
    }
  } catch (e) { /* ignore */ }
   console.log('[cloudApi] request', cfg.method, cfg.url, cfg.headers?.Authorization ? 'has token' : 'no token');
  return cfg;
}, err => Promise.reject(err));

cloudApi.interceptors.response.use(res => {
  return res;
}, err => {
  console.error('[cloudApi] error', err?.response?.status, err?.response?.data, err?.config?.url);
  return Promise.reject(err);
});

export async function uploadMultipleToCloud(files = [], extra = {}) {
  if (!Array.isArray(files)) files = [files].filter(Boolean);
  if (!files.length) return [];

  const formData = new FormData();
  files.forEach(f => formData.append('files', f)); 
  Object.keys(extra || {}).forEach(k => {
    if (extra[k] !== undefined && extra[k] !== null) {
      formData.append(k, String(extra[k]));
    }
  });

  const res = await cloudApi.post('/api/cloud/upload-multiple', formData);
  return res.data;
}

export default cloudApi;