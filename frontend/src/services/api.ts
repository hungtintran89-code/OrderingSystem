import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { message } from 'antd';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Errors with subtle Toast Notification & Refresh Token
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // 1. Automatic Token Refresh on 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post<ApiResponse<{ token: string; refreshToken: string }>>(
            `${BASE_URL}/auth/refresh`,
            { refreshToken }
          );
          if (res.data && res.data.data) {
            const { token, refreshToken: newRefresh } = res.data.data;
            localStorage.setItem('access_token', token);
            localStorage.setItem('refresh_token', newRefresh);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          }
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
    }

    // 2. Display subtle Toast notification for API errors
    const errorMessage =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'Kết nối API quá thời gian quy định'
        : 'Có lỗi kết nối đến máy lưu trữ CSDL!');

    message.error({
      content: errorMessage,
      duration: 3,
    });

    return Promise.reject(error);
  }
);

export default apiClient;
