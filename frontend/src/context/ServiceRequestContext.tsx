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

  // 1. Load active pending requests from backend
  const loadActiveRequests = useCallback(async () => {
    const list = await fetchActiveServiceRequestsApi();
    setPendingRequests(list);
  }, []);

  // 2. Add incoming request to Toast stack (if toasts.length < 3)
  const addIncomingToast = useCallback((newItem: ServiceRequestItem) => {
    setToasts((prevToasts) => {
      // Avoid duplicate toasts for same request ID
      if (prevToasts.some((t) => t.id === newItem.id)) {
        return prevToasts;
      }

      // Max display 3 visible toasts. 4th onwards only goes to Bell Drawer
      if (prevToasts.length >= 3) {
        return prevToasts;
      }

      const toastObj: ToastItem = {
        ...newItem,
        progressPercent: 100,
        isExiting: false,
      };

      return [toastObj, ...prevToasts];
    });
  }, []);

  // 3. Dismiss Toast (Slide-out animation into Bell Drawer)
  const dismissToast = useCallback((requestId: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === requestId ? { ...t, isExiting: true } : t))
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== requestId));
    }, 400); // 400ms CSS slide-out duration
  }, []);

  // 4. Handle 1-Tap Confirm (on Toast or inside Bell Drawer)
  const handleConfirmRequest = useCallback(
    async (requestId: number) => {
      const targetReq = pendingRequests.find((r) => r.id === requestId) || toasts.find((t) => t.id === requestId);

      // Instantly remove from toasts and pending list (1-Tap UX response)
      dismissToast(requestId);
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));

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
    const unsubRequests = wsService.subscribe('/topic/admin/service-requests', (data) => {
      if (data) {
        if (data.requestStatus === 'PENDING') {
          setPendingRequests((prev) => {
            const exists = prev.some((r) => r.id === data.id);
            return exists ? prev : [data, ...prev];
          });
          addIncomingToast(data);
        } else if (data.requestStatus === 'COMPLETED') {
          setPendingRequests((prev) => prev.filter((r) => r.id !== data.id));
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
