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

let isRedirectingToLogin = false;

// Response Interceptor: Handle Errors with subtle Toast Notification & Refresh Token
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const isLoginRequest = originalRequest?.url?.includes('/auth/login');

    // 0. Special Handling for Login Request Failures
    if (isLoginRequest) {
      const serverMsg = error.response?.data?.message;
      let loginErrMsg = 'Tên đăng nhập hoặc mật khẩu không chính xác!';

      if (serverMsg) {
        if (serverMsg.includes('User account is disabled')) {
          loginErrMsg = 'Tài khoản người dùng đã bị vô hiệu hóa!';
        } else if (serverMsg.includes('Incorrect username or password')) {
          loginErrMsg = 'Tên đăng nhập hoặc mật khẩu không chính xác!';
        } else {
          loginErrMsg = serverMsg;
        }
      } else if (error.code === 'ERR_NETWORK') {
        loginErrMsg = 'Không thể kết nối đến máy chủ Backend! Vui lòng kiểm tra lại dịch vụ Spring Boot.';
      }

      message.error({
        content: loginErrMsg,
        key: 'login-failed-toast',
        duration: 4,
      });

      return Promise.reject(error);
    }

    // 1. Automatic Token Refresh on 401 Unauthorized for Protected Endpoints
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
          // Token refresh failed
        }
      }

      // If refresh token is missing or failed
      localStorage.clear();

      if (!isRedirectingToLogin && window.location.pathname.startsWith('/app') && !window.location.pathname.includes('/app/login')) {
        isRedirectingToLogin = true;
        message.error({
          content: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!',
          key: 'session-expired',
          duration: 4,
        });

        setTimeout(() => {
          isRedirectingToLogin = false;
          window.location.href = '/app/login';
        }, 600);
      }

      return Promise.reject(error);
    }

    // Suppress duplicate toasts if 401 is already handling redirect
    if (error.response?.status === 401) {
      return Promise.reject(error);
    }

    // 2. Display Toast notification for non-401 API errors
    const errorMessage =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'Kết nối API quá thời gian quy định'
        : 'Có lỗi xảy ra khi gọi dịch vụ máy chủ!');

    message.error({
      content: errorMessage,
      duration: 3.5,
    });

    return Promise.reject(error);
  }
);

export default apiClient;
