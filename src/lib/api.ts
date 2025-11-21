// src/lib/api.ts
import axios from 'axios';

// 1. Konfigurasi Base URL
// Menggunakan Environment Variable (Prioritas) atau Fallback ke Railway
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ciptastok-api-production.up.railway.app';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Penting untuk cookie/session lintas domain
  timeout: 15000, // Timeout 15 detik (aman untuk server cold start)
});

// 2. Konfigurasi Retry Logic (Custom)
(api.defaults as any).retry = 3; // Coba ulang 3 kali
(api.defaults as any).retryDelay = (retryCount: number) => {
  return retryCount * 1000; // Delay: 1 detik, 2 detik, 3 detik...
};

// 3. Request Interceptor (Inject Token)
api.interceptors.request.use(
  (config) => {
    // Pastikan berjalan di sisi client (browser)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 4. Response Interceptor (Global Error Handling & Retry)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // A. Handle Unauthorized (401) - Token Expired/Invalid
    if (response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Hapus data sesi
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('sessionStart');
        
        // Redirect paksa ke login jika belum di halaman login
        if (!window.location.pathname.includes('/login')) {
           window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }

    // B. Logic Retry (Hanya jika config ada)
    if (!config) return Promise.reject(error);

    // Inisialisasi counter retry
    config.retryCount = config.retryCount || 0;

    // Cek apakah harus retry (Jika status >= 500 atau Network Error)
    const shouldRetry = config.retryCount < ((config as any).retry || 0) && (!response || response.status >= 500);

    if (shouldRetry) {
      config.retryCount += 1;

      // Hitung delay
      const delayMs = (config as any).retryDelay ? (config as any).retryDelay(config.retryCount) : 1000;

      // Tunggu sebentar...
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Lakukan request ulang
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Retrying request (${config.retryCount}/${(config as any).retry}):`, config.url);
      }
      
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;