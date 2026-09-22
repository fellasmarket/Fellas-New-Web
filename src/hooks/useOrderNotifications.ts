import { useState, useEffect, useRef, useCallback } from 'react';
import { Order } from '../types';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestOrderNotificationPermission,
  sendOrderDesktopNotification,
  playOrderAlertChime
} from '../utils/orderNotification';

export interface UseOrderNotificationsResult {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSoundEnabled: boolean;
  toggleSound: () => void;
  requestPermission: () => Promise<NotificationPermission | 'unsupported'>;
  testNotification: () => void;
  latestOrderAlert: Order | null;
  dismissAlert: () => void;
}

export function useOrderNotifications(
  onNewOrderReceived?: (order: Order) => void,
  enabled: boolean = true
): UseOrderNotificationsResult {
  const [isSupported] = useState<boolean>(() => isNotificationSupported());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => getNotificationPermission());
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('fellas_order_sound_enabled') !== 'false';
  });
  const [latestOrderAlert, setLatestOrderAlert] = useState<Order | null>(null);

  // Keep track of alerted order IDs to never alert the same order twice
  const alertedOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Toggle sound chime
  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('fellas_order_sound_enabled', String(next));
      if (next) {
        playOrderAlertChime();
      }
      return next;
    });
  }, []);

  // Request browser authorization
  const requestPermission = useCallback(async () => {
    const res = await requestOrderNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      playOrderAlertChime();
      // Send welcoming confirmation notification
      if (isNotificationSupported()) {
        try {
          new Notification('🔔 ¡Computador Autorizado con Éxito!', {
            body: 'A partir de ahora recibirás alertas instantáneas y sonido cada vez que un cliente realice un pedido.',
            icon: '/favicon.ico'
          });
        } catch {
          // ignore
        }
      }
    }
    return res;
  }, []);

  // Dismiss in-app alert banner
  const dismissAlert = useCallback(() => {
    setLatestOrderAlert(null);
  }, []);

  // Process a newly detected order
  const handleIncomingOrder = useCallback((order: Order) => {
    if (!order || !order.id) return;

    if (alertedOrderIdsRef.current.has(order.id)) {
      return;
    }
    alertedOrderIdsRef.current.add(order.id);

    // Play chime sound
    if (isSoundEnabled) {
      playOrderAlertChime();
    }

    // Trigger desktop notification on the computer
    sendOrderDesktopNotification(order, () => {
      setLatestOrderAlert(order);
    });

    // Set floating in-app banner alert
    setLatestOrderAlert(order);

    // Notify caller callback (to refresh order list)
    if (onNewOrderReceived) {
      onNewOrderReceived(order);
    }
  }, [isSoundEnabled, onNewOrderReceived]);

  // Test notification button
  const testNotification = useCallback(() => {
    playOrderAlertChime();

    const mockOrder: Order = {
      id: `test-${Date.now()}`,
      code: 'TEST-123',
      customerName: 'Cliente de Prueba',
      customerEmail: 'prueba@ejemplo.cl',
      customerPhone: '+569 1234 5678',
      location: 'Antofagasta Centro',
      address: 'Av. Prat 450, Depto 802',
      items: [
        {
          productId: 'p-1',
          productName: 'Pisco Alto del Carmen 750ml',
          quantity: 2,
          price: 9990,
          image: ''
        },
        {
          productId: 'p-2',
          productName: 'Pack Heineken 12 Latas Heladas',
          quantity: 1,
          price: 13990,
          image: ''
        }
      ],
      subtotal: 33970,
      discountAmount: 0,
      shippingCost: 2000,
      total: 35970,
      paymentMethod: 'Transferencia Bancaria',
      status: 'nuevo',
      createdAt: new Date().toISOString()
    };

    if (permission === 'granted') {
      sendOrderDesktopNotification(mockOrder);
    }
    setLatestOrderAlert(mockOrder);
  }, [permission]);

  // 1. Establish Real-time Server-Sent Events (SSE) connection
  useEffect(() => {
    if (!enabled) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/orders/events');

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.type === 'new_order' && data.order) {
              handleIncomingOrder(data.order);
            }
          } catch (e) {
            // Ignore parse errors on ping
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Reconnect after 5 seconds
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              connectSSE();
            }, 5000);
          }
        };
      } catch (err) {
        console.warn('[Notifications] Error conectando SSE:', err);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [enabled, handleIncomingOrder]);

  // 2. Fallback polling every 10 seconds to catch orders if tab was sleeping or SSE disconnected
  useEffect(() => {
    if (!enabled) return;

    const checkOrdersFallback = async () => {
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) return;
        const data = await res.json();
        const orders: Order[] = data.orders || [];

        if (isFirstLoadRef.current) {
          // On first load, record existing order IDs so we don't alert old past orders
          orders.forEach(o => alertedOrderIdsRef.current.add(o.id));
          isFirstLoadRef.current = false;
          return;
        }

        // For subsequent polls, find any new order that was created in the last 2 minutes and not alerted
        const now = Date.now();
        orders.forEach(o => {
          if (!alertedOrderIdsRef.current.has(o.id)) {
            const orderTime = new Date(o.createdAt).getTime();
            // If created within the last 5 minutes
            if (now - orderTime < 5 * 60 * 1000) {
              handleIncomingOrder(o);
            } else {
              alertedOrderIdsRef.current.add(o.id);
            }
          }
        });
      } catch {
        // network error, ignore
      }
    };

    // Run first check immediately
    checkOrdersFallback();
    const interval = setInterval(checkOrdersFallback, 10000);
    return () => clearInterval(interval);
  }, [enabled, handleIncomingOrder]);

  return {
    isSupported,
    permission,
    isSoundEnabled,
    toggleSound,
    requestPermission,
    testNotification,
    latestOrderAlert,
    dismissAlert
  };
}
