// Client-side Web Notification API & Web Audio API synthesizer for instant order notifications
import { Order } from '../types';

let audioCtx: AudioContext | null = null;

/**
 * Plays a pleasant, distinct cash-register / boutique chime using Web Audio API.
 * 100% self-contained: no external audio files, no CORS issues, works offline.
 */
export function playOrderAlertChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Tone 1: High crisp bell (C6 ~ 1046.5 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Tone 2: Bright chime (E6 ~ 1318.5 Hz)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.12);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.4, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);

    // Tone 3: Celebratory Cash Register Bell (G6 ~ 1567.98 Hz)
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1567.98, now + 0.24);
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.setValueAtTime(0.5, now + 0.24);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    osc3.connect(gain3);
    gain3.connect(audioCtx.destination);
    osc3.start(now + 0.24);
    osc3.stop(now + 0.95);

    // Tone 4: High sparkle ping (C7 ~ 2093 Hz)
    const osc4 = audioCtx.createOscillator();
    const gain4 = audioCtx.createGain();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(2093, now + 0.3);
    gain4.gain.setValueAtTime(0, now);
    gain4.gain.setValueAtTime(0.3, now + 0.3);
    gain4.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc4.connect(gain4);
    gain4.connect(audioCtx.destination);
    osc4.start(now + 0.3);
    osc4.stop(now + 1.2);
  } catch (err) {
    console.warn('[Notifications] No se pudo reproducir el timbre de audio:', err);
  }
}

/**
 * Checks if the current browser supports HTML5 Desktop Notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets the current notification permission state
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests desktop notification authorization from the user/browser
 */
export async function requestOrderNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      localStorage.setItem('fellas_order_notifications_authorized', 'true');
    }
    return result;
  } catch (err) {
    console.error('[Notifications] Error solicitando permiso de notificaciones:', err);
    return 'denied';
  }
}

/**
 * Fires a desktop notification on the computer
 */
export function sendOrderDesktopNotification(order: Order, onClick?: () => void) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  const orderCode = order.code || (order.id ? order.id.slice(-6) : 'S/N');
  const customer = order.customerName || 'Cliente anónimo';
  const totalStr = (order.total || 0).toLocaleString('es-CL');
  const itemsCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
  
  const itemsPreview = (order.items || [])
    .slice(0, 3)
    .map(i => `${i.quantity}x ${i.productName || (i as any).name}`)
    .join(', ') + ((order.items || []).length > 3 ? ` (+${order.items.length - 3} más)` : '');

  const destination = order.address || order.location || 'Retiro en Local';

  const title = `🔔 ¡NUEVO PEDIDO RECIBIDO! #${orderCode}`;
  const body = `👤 ${customer} ($${totalStr} CLP)\n📦 ${itemsCount} items: ${itemsPreview}\n📍 ${destination}`;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `order-${order.id || orderCode}`, // Prevents duplicate spamming
      requireInteraction: true // Keep visible in OS notification tray until handled
    });

    notification.onclick = () => {
      window.focus();
      if (onClick) onClick();
      notification.close();
    };
  } catch (err) {
    console.warn('[Notifications] Error mostrando notificación de escritorio:', err);
  }
}
