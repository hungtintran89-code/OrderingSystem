import axios from 'axios';
import type { CategoryMenu, Cart, PersonalOrder, MasterTableOrder, RequestType } from '../types';
import { MOCK_MENU, MOCK_PERSONAL_ORDERS, MOCK_MASTER_TABLE_ORDER } from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: () => true,
});

export let isBackendConnected = false;

export const apiService = {
  // 1. Fetch full menu directly from PostgreSQL Database via /client/menu
  async getMenu(qrToken?: string): Promise<CategoryMenu[]> {
    try {
      // Ưu tiên 1: Gọi GET /client/menu truy vấn trực tiếp bảng categories và products từ Postgres DB
      const clientRes = await apiClient.get('/client/menu').catch(() => null);
      if (clientRes && clientRes.status >= 200 && clientRes.status < 300 && clientRes.data && clientRes.data.data && Array.isArray(clientRes.data.data) && clientRes.data.data.length > 0) {
        isBackendConnected = true;
        return clientRes.data.data;
      }

      // Ưu tiên 2: Gọi GET /qr/info/${tokenToUse}
      const tokenToUse = qrToken || 'qr_tok_table_01';
      const res = await apiClient.get(`/qr/info/${tokenToUse}`).catch(() => null);

      if (res && res.status >= 200 && res.status < 300 && res.data && (res.data.data || res.data.content)) {
        isBackendConnected = true;
        return res.data.data || res.data.content;
      }

      isBackendConnected = false;
      return MOCK_MENU;
    } catch {
      isBackendConnected = false;
      return MOCK_MENU;
    }
  },

  // 1.1 Fetch table info by QR token
  async getTableInfo(qrToken?: string): Promise<{ tableId: number; tableName: string; sessionId?: number } | null> {
    try {
      const tokenToUse = qrToken || 'qr_tok_table_01';
      const res = await apiClient.get(`/qr/table-info/${tokenToUse}`).catch(() => null);
      if (res && res.status >= 200 && res.status < 300 && res.data && res.data.data) {
        const d = res.data.data;
        return {
          tableId: Number(d.tableId || 1),
          tableName: String(d.tableName || 'Bàn 01'),
          sessionId: d.sessionId ? Number(d.sessionId) : undefined,
        };
      }
    } catch {}
    return null;
  },

  // 2. Fetch cart
  async getCart(tableSessionId: number, threadId: number): Promise<Cart> {
    try {
      const res = await apiClient.get('/cart', {
        params: { tableSessionId, threadId }
      }).catch(() => null);

      if (res && res.status >= 200 && res.status < 300 && res.data && res.data.data) {
        isBackendConnected = true;
        return res.data.data;
      }
      isBackendConnected = false;
      return { tableSessionId, threadId, items: [], totalItems: 0, totalAmount: 0 };
    } catch {
      isBackendConnected = false;
      return { tableSessionId, threadId, items: [], totalItems: 0, totalAmount: 0 };
    }
  },

  // 3. Add to cart
  async addToCart(
    tableSessionId: number,
    threadId: number,
    productId: number,
    quantity: number,
    note: string = ""
  ): Promise<Cart | null> {
    try {
      const res = await apiClient.post('/cart', {
        tableSessionId,
        threadId,
        productId,
        quantity,
        note
      }).catch(() => null);

      if (res && res.status >= 200 && res.status < 300 && res.data && res.data.data) {
        isBackendConnected = true;
        return res.data.data;
      }
      isBackendConnected = false;
      return null;
    } catch {
      isBackendConnected = false;
      return null;
    }
  },

  // 4. Update cart item
  async updateCartItem(
    tableSessionId: number,
    threadId: number,
    productId: number,
    quantity: number,
    note: string = ""
  ): Promise<Cart | null> {
    try {
      const res = await apiClient.put(`/cart/items/${productId}`, { quantity, note }, {
        params: { tableSessionId, threadId }
      }).catch(() => null);

      if (res && res.status >= 200 && res.status < 300 && res.data && res.data.data) {
        isBackendConnected = true;
        return res.data.data;
      }
      isBackendConnected = false;
      return null;
    } catch {
      isBackendConnected = false;
      return null;
    }
  },

  // 5. Delete item from cart
  async removeFromCart(tableSessionId: number, threadId: number, productId: number): Promise<Cart | null> {
    try {
      const res = await apiClient.delete(`/cart/items/${productId}`, {
        params: { tableSessionId, threadId }
      }).catch(() => null);

      if (res && res.status >= 200 && res.status < 300 && res.data && res.data.data) {
        isBackendConnected = true;
        return res.data.data;
      }
      isBackendConnected = false;
      return null;
    } catch {
      isBackendConnected = false;
      return null;
    }
  },

  // 6. Clear cart
  async clearCart(tableSessionId: number, threadId: number): Promise<boolean> {
    try {
      const res = await apiClient.delete('/cart/clear', {
        params: { tableSessionId, threadId }
      }).catch(() => null);
      if (res && res.status >= 200 && res.status < 300) {
        isBackendConnected = true;
        return true;
      }
      isBackendConnected = false;
      return true;
    } catch {
      isBackendConnected = false;
      return true;
    }
  },

  // 7. Submit order
  async submitOrder(
    tableId: number,
    threadId: number,
    items: { productId: number; quantity: number; note?: string }[],
    note: string = ""
  ): Promise<PersonalOrder | null> {
    try {
      const payload = {
        tableId: Number(tableId || 1),
        threadId: Number(threadId || 12345),
        note: note || "",
        list: items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          note: item.note || ""
        }))
      };

      const res = await apiClient.post('/orders', payload);

      if (res && res.status >= 200 && res.status < 300 && res.data && res.data.data) {
        isBackendConnected = true;
        return res.data.data;
      } else {
        console.warn('Backend submit order response:', res?.data);
      }
    } catch (err) {
      console.error('Error submitting order to backend:', err);
    }
    return null;
  },

  // 8. Get personal orders history
  async getPersonalOrder(tableSessionId: number, threadId: number): Promise<PersonalOrder> {
    try {
      const res = await apiClient.get('/orders/personal', {
        params: { tableSessionId, threadId }
      }).catch(() => null);

      if (res && res.status >= 200 && res.status < 300 && res.data && res.data.data) {
        isBackendConnected = true;
        return res.data.data;
      }
      isBackendConnected = false;
      return MOCK_PERSONAL_ORDERS;
    } catch {
      isBackendConnected = false;
      return MOCK_PERSONAL_ORDERS;
    }
  },

  // 9. Get table order summary
  async getMasterTableOrder(tableId: number): Promise<MasterTableOrder> {
    try {
      const res = await apiClient.get(`/orders/table/${tableId}`).catch(() => null);

      if (res && res.status >= 200 && res.status < 300 && res.data && res.data.data) {
        isBackendConnected = true;
        return res.data.data;
      }
      isBackendConnected = false;
      return MOCK_MASTER_TABLE_ORDER;
    } catch {
      isBackendConnected = false;
      return MOCK_MASTER_TABLE_ORDER;
    }
  },

  // 10. Send service request
  async sendServiceRequest(sessionToken: string, requestType: RequestType): Promise<boolean> {
    try {
      const res = await apiClient.post(
        '/service-requests',
        { requestType },
        { headers: { 'X-Session-Token': sessionToken } }
      ).catch(() => null);
      if (res && res.status >= 200 && res.status < 300) {
        isBackendConnected = true;
        return true;
      }
      isBackendConnected = false;
      return true;
    } catch {
      isBackendConnected = false;
      return true;
    }
  }
};
