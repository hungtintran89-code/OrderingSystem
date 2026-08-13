import apiClient, { ApiResponse } from '../services/api';
import { message } from 'antd';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponseData {
  token: string;
  tokenType: string;
  refreshToken: string;
  userId: number;
  username: string;
  fullName: string;
  role: 'MANAGER' | 'STAFF' | 'KITCHEN';
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const authApi = {
  // 1. POST /api/v1/auth/login
  async login(credentials: LoginRequest): Promise<AuthResponseData> {
    try {
      const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', credentials);
      if (res.data && res.data.data) {
        const data = res.data.data;
        localStorage.setItem('access_token', data.token);
        localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('user_role', data.role);
        localStorage.setItem('user_name', data.fullName || data.username);
        return data;
      }
      throw new Error('Dữ liệu phản hồi từ máy chủ không hợp lệ!');
    } catch (error) {
      // Toast error is handled centrally by apiClient interceptor
      throw error;
    }
  },

  // 2. POST /api/v1/auth/change-password
  async changePassword(dto: ChangePasswordRequest): Promise<boolean> {
    try {
      const res = await apiClient.post<ApiResponse<string>>('/auth/change-password', dto);
      if (res.data && res.data.code === 200) {
        message.success(res.data.message || 'Đổi mật khẩu thành công!');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // 3. PATCH /api/v1/admin/staffs/{id}/toggle-active
  async toggleStaffActive(staffId: number): Promise<boolean> {
    try {
      const res = await apiClient.patch<ApiResponse<string>>(`/admin/staffs/${staffId}/toggle-active`);
      if (res.data && res.data.code === 200) {
        message.success(res.data.message || 'Cập nhật trạng thái tài khoản nhân viên thành công!');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
};
