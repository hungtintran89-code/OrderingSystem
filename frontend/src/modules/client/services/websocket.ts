import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export class WebSocketClient {
  private client: Client | null = null;
  private isConnected = false;

  connect(
    tableSessionId: number,
    threadId: number,
    onCartUpdate?: (data: unknown) => void,
    onOrderStatusUpdate?: (data: unknown) => void
  ) {
    try {
      this.client = new Client({
        webSocketFactory: () => {
          try {
            return new SockJS('http://localhost:8080/ws');
          } catch (e) {
            console.warn('[WebSocket] SockJS factory error:', e);
            return new WebSocket('ws://localhost:8080/ws');
          }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          this.isConnected = true;
          console.log('[WebSocket] Connected to Spring Boot WS');

          if (onCartUpdate && tableSessionId) {
            this.client?.subscribe(`/topic/cart/session/${tableSessionId}`, (message) => {
              try {
                const payload = JSON.parse(message.body);
                onCartUpdate(payload);
              } catch (e) {
                console.error('[WebSocket] Error parsing cart message', e);
              }
            });
          }

          if (onOrderStatusUpdate && threadId) {
            this.client?.subscribe(`/topic/client/${threadId}`, (message) => {
              try {
                const payload = JSON.parse(message.body);
                onOrderStatusUpdate(payload);
              } catch (e) {
                console.error('[WebSocket] Error parsing status message', e);
              }
            });
          }
        },
        onStompError: (frame) => {
          console.warn('[WebSocket] STOMP error', frame);
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

  disconnect() {
    try {
      if (this.client) {
        this.client.deactivate();
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
