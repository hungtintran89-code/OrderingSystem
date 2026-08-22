import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ServiceRequestItem,
  fetchActiveServiceRequestsApi,
  completeServiceRequestApi,
  undoServiceRequestApi,
} from '../api/adminApi';
import { wsService } from '../modules/client/services/websocket';

export interface ToastItem extends ServiceRequestItem {
  progressPercent: number; // 100 to 0 over 3 seconds
  isExiting?: boolean;
}

interface ServiceRequestContextType {
  pendingRequests: ServiceRequestItem[];
  toasts: ToastItem[];
  badgeCount: number;
  lastConfirmedRequest: ServiceRequestItem | null;
  undoTimerSeconds: number;
  handleConfirmRequest: (requestId: number) => Promise<void>;
  handleUndoRequest: () => Promise<void>;
  dismissToast: (requestId: number) => void;
  loadActiveRequests: () => Promise<void>;
}

const ServiceRequestContext = createContext<ServiceRequestContextType | undefined>(undefined);

export const ServiceRequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingRequests, setPendingRequests] = useState<ServiceRequestItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [lastConfirmedRequest, setLastConfirmedRequest] = useState<ServiceRequestItem | null>(null);
  const [undoTimerSeconds, setUndoTimerSeconds] = useState<number>(0);

  const isBillRequest = (type?: string): boolean => {
    if (!type) return false;
    const upper = type.toUpperCase();
    return upper.includes('BILL') || upper.includes('PAYMENT');
  };

  // Helper: Khử trùng lặp danh sách theo tableId (Mỗi bàn chỉ xuất hiện 1 dòng duy nhất, ưu tiên Yêu cầu tính tiền)
  const deduplicateByTable = (list: ServiceRequestItem[]): ServiceRequestItem[] => {
    const map = new Map<string, ServiceRequestItem>();
    list.forEach((item) => {
      const normalizedItem: ServiceRequestItem = {
        ...item,
        id: item.id || item.requestId || 0,
        requestId: item.requestId || item.id,
      };
      const key = normalizedItem.tableId ? String(normalizedItem.tableId) : (normalizedItem.tableName || String(normalizedItem.id));
      const existing = map.get(key);
      if (!existing) {
        map.set(key, normalizedItem);
      } else {
        const existingIsBill = isBillRequest(existing.requestType);
        const itemIsBill = isBillRequest(normalizedItem.requestType);
        if (itemIsBill && !existingIsBill) {
          map.set(key, normalizedItem);
        } else if (itemIsBill === existingIsBill) {
          map.set(key, normalizedItem);
        }
      }
    });
    return Array.from(map.values());
  };

  // 1. Load active pending requests from backend
  const loadActiveRequests = useCallback(async () => {
    const list = await fetchActiveServiceRequestsApi();
    setPendingRequests(deduplicateByTable(list));
  }, []);

  // 2. Add incoming request to Toast stack (if toasts.length < 3)
  const addIncomingToast = useCallback((newItem: ServiceRequestItem) => {
    const reqId = newItem.id || newItem.requestId;
    if (!reqId) return;

    const normalizedItem: ToastItem = {
      ...newItem,
      id: reqId,
      requestId: reqId,
      progressPercent: 100,
      isExiting: false,
    };

    setToasts((prevToasts) => {
      // Avoid duplicate toasts for same request ID
      if (prevToasts.some((t) => t.id === reqId || t.requestId === reqId)) {
        return prevToasts;
      }

      // Max display 3 visible toasts. 4th onwards only goes to Bell Drawer
      if (prevToasts.length >= 3) {
        return prevToasts;
      }

      return [normalizedItem, ...prevToasts];
    });
  }, []);

  // 3. Dismiss Toast (Slide-out animation into Bell Drawer)
  const dismissToast = useCallback((requestId: number) => {
    if (!requestId) return;
    setToasts((prev) =>
      prev.map((t) => ((t.id === requestId || t.requestId === requestId) ? { ...t, isExiting: true } : t))
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== requestId && t.requestId !== requestId));
    }, 400); // 400ms CSS slide-out duration
  }, []);

  // 4. Handle 1-Tap Confirm (on Toast or inside Bell Drawer)
  const handleConfirmRequest = useCallback(
    async (requestId: number) => {
      if (!requestId) return;

      const targetReq = pendingRequests.find((r) => r.id === requestId || r.requestId === requestId) ||
        toasts.find((t) => t.id === requestId || t.requestId === requestId);

      // Instantly remove from toasts and pending list (1-Tap UX response)
      dismissToast(requestId);
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId && r.requestId !== requestId));

      if (targetReq) {
        setLastConfirmedRequest(targetReq);
        setUndoTimerSeconds(3); // Start 3-second Undo timer
      }

      // Send API update to backend
      await completeServiceRequestApi(requestId);
    },
    [pendingRequests, toasts, dismissToast]
  );

  // 5. Handle Undo (3-Second Snackbar Action)
  const handleUndoRequest = useCallback(async () => {
    if (!lastConfirmedRequest) return;

    const reqToUndo = lastConfirmedRequest;
    setLastConfirmedRequest(null);
    setUndoTimerSeconds(0);

    // Call backend undo API
    await undoServiceRequestApi(reqToUndo.id);

    // Re-add to pending list and toast stack
    setPendingRequests((prev) => [reqToUndo, ...prev]);
    addIncomingToast(reqToUndo);
  }, [lastConfirmedRequest, addIncomingToast]);

  // 6. Countdown Timer for Undo Snackbar (3s)
  useEffect(() => {
    let timer: any = null;
    if (undoTimerSeconds > 0) {
      timer = setInterval(() => {
        setUndoTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setLastConfirmedRequest(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [undoTimerSeconds]);

  // 7. 3-Second Independent Countdown Timer & Progress Bar for Toasts
  useEffect(() => {
    const intervalMs = 50; // Update progress bar every 50ms for smooth 60fps animation
    const stepPercent = (intervalMs / 3000) * 100; // 3 seconds total duration

    const timer = setInterval(() => {
      setToasts((prevToasts) => {
        if (prevToasts.length === 0) return prevToasts;

        return prevToasts
          .map((t) => {
            if (t.isExiting) return t;
            const newProgress = t.progressPercent - stepPercent;
            if (newProgress <= 0) {
              return { ...t, progressPercent: 0, isExiting: true };
            }
            return { ...t, progressPercent: newProgress };
          })
          .filter((t) => {
            if (t.progressPercent <= 0 && t.isExiting) {
              // Toast timed out after 3s -> Slide out into Bell Drawer
              return false;
            }
            return true;
          });
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, []);

  // 8. WebSocket Realtime Listeners
  useEffect(() => {
    loadActiveRequests();

    // Subscribe to service requests broadcast channel
    const unsubRequests = wsService.subscribe('/topic/admin/service-requests', (rawMessage) => {
      if (rawMessage) {
        const reqId = rawMessage.id || rawMessage.requestId || 0;
        const data: ServiceRequestItem = {
          ...rawMessage,
          id: reqId,
          requestId: reqId,
        };

        if (data.requestStatus === 'PENDING') {
          setPendingRequests((prev) => {
            const isMatch = (r: ServiceRequestItem) =>
              (data.tableId && r.tableId === data.tableId) ||
              (data.tableName && r.tableName === data.tableName);

            const existingIndex = prev.findIndex(isMatch);
            if (existingIndex !== -1) {
              const existing = prev[existingIndex];
              const existingIsBill = isBillRequest(existing.requestType);
              const dataIsBill = isBillRequest(data.requestType);

              // Nếu bàn đang có Yêu cầu tính tiền (BILL) mà nhận Gọi phục vụ (CALL_STAFF), giữ nguyên Yêu cầu tính tiền!
              if (existingIsBill && !dataIsBill) {
                return prev;
              }

              const newPrev = prev.filter((_, idx) => idx !== existingIndex);
              return [data, ...newPrev];
            }
            return [data, ...prev];
          });
          addIncomingToast(data);
        } else if (data.requestStatus === 'COMPLETED') {
          setPendingRequests((prev) =>
            prev.filter(
              (r) =>
                r.id !== data.id &&
                r.requestId !== data.id &&
                !(data.tableId && r.tableId === data.tableId) &&
                !(data.tableName && r.tableName === data.tableName)
            )
          );
          dismissToast(data.id);
        }
      }
    });

    // Subscribe to floor map updates
    const unsubFloorMap = wsService.subscribe('/topic/tables/floor-map', () => {
      loadActiveRequests();
    });

    return () => {
      if (unsubRequests) unsubRequests();
      if (unsubFloorMap) unsubFloorMap();
    };
  }, [loadActiveRequests, addIncomingToast, dismissToast]);

  return (
    <ServiceRequestContext.Provider
      value={{
        pendingRequests,
        toasts,
        badgeCount: pendingRequests.length,
        lastConfirmedRequest,
        undoTimerSeconds,
        handleConfirmRequest,
        handleUndoRequest,
        dismissToast,
        loadActiveRequests,
      }}
    >
      {children}
    </ServiceRequestContext.Provider>
  );
};

export const useServiceRequests = () => {
  const context = useContext(ServiceRequestContext);
  if (!context) {
    throw new Error('useServiceRequests must be used within a ServiceRequestProvider');
  }
  return context;
};
