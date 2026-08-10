import axios from 'axios';
import type { CategoryMenu, Cart, PersonalOrder, MasterTableOrder, RequestType } from '../types';
import { MOCK_MENU, MOCK_PERSONAL_ORDERS, MOCK_MASTER_TABLE_ORDER } from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 2500,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: () => true,
});

export let isBackendConnected = false;

export const apiService = {
  // 1. Resolve QR token or fetch full menu
  async getMenu(qrToken?: string): Promise<CategoryMenu[]> {
    try {
      const tokenToUse = qrToken || 'qr_tok_table_01';
      const res = await apiClient.get(`/qr/resolve/${tokenToUse}`).catch(() => null);

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
      const res = await apiClient.post('/orders', {
        tableId,
        threadId,
        note,
        list: items
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
