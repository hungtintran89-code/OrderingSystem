import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export class WebSocketClient {
  private client: Client | null = null;
  private isConnected = false;
  private topicListeners: Map<string, Set<(data: any) => void>> = new Map();

  connectGeneric() {
    if (this.client) return;
    try {
      this.client = new Client({
        webSocketFactory: () => {
          try {
            return new SockJS('http://localhost:8080/ws');
          } catch (e) {
            console.warn('[WebSocket] SockJS factory fallback:', e);
            return new WebSocket('ws://localhost:8080/ws');
          }
        },
        reconnectDelay: 3000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          this.isConnected = true;
          console.log('[WebSocket] STOMP connected to Spring Boot');

          // Tự động đăng ký tất cả các topic đã được lưu trong Map khi vừa kết nối xong
          this.topicListeners.forEach((listeners, topic) => {
            this.client?.subscribe(topic, (message) => {
              try {
                const payload = JSON.parse(message.body);
                listeners.forEach((fn) => fn(payload));
              } catch (e) {
                console.error('[WebSocket] Error parsing topic payload:', topic, e);
              }
            });
          });
        },
        onStompError: (frame) => {
          console.warn('[WebSocket] STOMP error frame:', frame);
          this.isConnected = false;
        },
        onWebSocketClose: () => {
          this.isConnected = false;
        }
      });
      this.client.activate();
    } catch (e) {
      console.warn('[WebSocket] Cannot initialize STOMP client:', e);
      this.isConnected = false;
    }
  }

  connect(
    tableSessionId: number,
    threadId: number,
    onCartUpdate?: (data: unknown) => void,
    onOrderStatusUpdate?: (data: unknown) => void
  ) {
    if (onCartUpdate && tableSessionId) {
      this.subscribe(`/topic/cart/session/${tableSessionId}`, onCartUpdate);
    }
    if (onOrderStatusUpdate && threadId) {
      this.subscribe(`/topic/client/${threadId}`, onOrderStatusUpdate);
    }
    this.connectGeneric();
  }

  subscribe(topic: string, callback: (data: any) => void): (() => void) {
    if (!this.topicListeners.has(topic)) {
      this.topicListeners.set(topic, new Set());
    }
    const listeners = this.topicListeners.get(topic)!;
    listeners.add(callback);

    this.connectGeneric();

    // Nếu đã kết nối rồi, đăng ký ngay trực tiếp với client
    let stompSub: any = null;
    if (this.isConnected && this.client) {
      try {
        stompSub = this.client.subscribe(topic, (message) => {
          try {
            const payload = JSON.parse(message.body);
            callback(payload);
          } catch (e) {
            console.error('[WebSocket] Error parsing topic payload:', topic, e);
          }
        });
      } catch (e) {
        console.warn('[WebSocket] Direct subscribe error:', e);
      }
    }

    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.topicListeners.delete(topic);
      }
      if (stompSub) {
        try {
          stompSub.unsubscribe();
        } catch (e) {}
      }
    };
  }

  disconnect() {
    try {
      if (this.client) {
        this.client.deactivate();
        this.client = null;
        this.isConnected = false;
      }
    } catch (e) {
      console.warn('[WebSocket] Error disconnecting:', e);
    }
  }

  getConnected(): boolean {
    return this.isConnected;
  }
}

export const wsService = new WebSocketClient();
