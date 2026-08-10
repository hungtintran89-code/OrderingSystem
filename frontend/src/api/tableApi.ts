import apiClient, { ApiResponse } from '../services/api';
import { message } from 'antd';

export interface TableTransferRequest {
  sourceTableId: number;
  targetTableId: number;
  note?: string;
}

export interface TableMergeRequest {
  sourceTableIds: number[];
  targetTableId: number;
  note?: string;
}

export interface FloorMapTable {
  tableId: number;
  tableName: string;
  tableStatus: 'EMPTY' | 'OCCUPIED' | 'CALL_STAFF' | 'PAYMENT_REQUESTED';
  activeSessionId?: number;
  currentAmount?: number;
  itemCount?: number;
  capacity?: number;
}

export const tableApi = {
  // 1. GET /api/v1/admin/tables/floor-map
  async getFloorMap(): Promise<FloorMapTable[]> {
    try {
      const res = await apiClient.get<ApiResponse<FloorMapTable[]>>('/admin/tables/floor-map');
      if (res.data && res.data.data) {
        return res.data.data;
      }
      return [];
    } catch {
      return [];
    }
  },

  // 2. POST /api/v1/tables/transfer (Chuyển Bàn)
  async transferTable(sourceTableId: number, targetTableId: number, note = ''): Promise<boolean> {
    try {
      const res = await apiClient.post<ApiResponse<string>>('/tables/transfer', {
        sourceTableId,
        targetTableId,
        note,
      });
      if (res.data && res.data.code === 200) {
        message.success(res.data.message || `Chuyển Bàn ${sourceTableId} sang Bàn ${targetTableId} thành công!`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // 3. POST /api/v1/tables/merge (Gộp Bàn)
  async mergeTables(sourceTableIds: number[], targetTableId: number, note = ''): Promise<boolean> {
    try {
      const res = await apiClient.post<ApiResponse<string>>('/tables/merge', {
        sourceTableIds,
        targetTableId,
        note,
      });
      if (res.data && res.data.code === 200) {
        message.success(res.data.message || `Gộp các bàn thành công về Bàn ${targetTableId}!`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // 4. POST /api/v1/admin/tables/{tableId}/open-session
  async openSession(tableId: number): Promise<boolean> {
    try {
      const res = await apiClient.post<ApiResponse<string>>(`/admin/tables/${tableId}/open-session`);
      if (res.data && res.data.code === 200) {
        message.success(`Đã mở bàn ${tableId} thành công!`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // 5. POST /api/v1/admin/tables/sessions/{sessionId}/close
  async closeSession(sessionId: number): Promise<boolean> {
    try {
      const res = await apiClient.post<ApiResponse<string>>(`/admin/tables/sessions/${sessionId}/close`);
      if (res.data && res.data.code === 200) {
        message.success('Đã hoàn tất thanh toán và đóng phiên bàn!');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
};
