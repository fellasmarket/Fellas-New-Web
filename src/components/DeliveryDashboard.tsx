import React, { useState, useEffect, useCallback } from 'react';
import { Order, StoreSettings } from '../types';
import { formatPrice } from '../data/products';

export interface DeliveryDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
  onExit?: () => void;
  showToast?: (message: string) => void;
  settings?: StoreSettings;
}

// Fallback initial orders in case the backend returns an empty list
const DEFAULT_FALLBACK_ORDERS: Order[] = [
  {
    id: 'ord-fallback-1',
    code: 'ORD-8492',
    customerName: 'Rodrigo Araya',
    customerEmail: 'rodrigo.araya@gmail.com',
    customerPhone: '+56987654321',
    location: 'Alerce Histórico',
    address: 'Calle Los Notros 342, Pasaje Los Mañíos',
    items: [
      {
        productId: 'dest-1',
        productName: 'Pisco Alto del Carmen 35° Especial 1L',
        quantity: 2,
        price: 8490,
        image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=400&auto=format&fit=crop'
      },
      {
        productId: 'bev-1',
        productName: 'Bebida Coca Cola Original 1.5L',
        quantity: 2,
        price: 2190,
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400&auto=format&fit=crop'
      },
      {
        productId: 'ice-1',
        productName: 'Bolsa de Hielo Purificado 2.5 Kg',
        quantity: 1,
        price: 1890,
        image: 'https://images.unsplash.com/photo-1516715094483-75da7dee9758?q=80&w=400&auto=format&fit=crop'
      }
    ],
    subtotal: 23250,
    discountAmount: 0,
    shippingCost: 2000,
    total: 25250,
    paymentMethod: 'Transferencia Bancaria',
    status: 'nuevo',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'ord-fallback-2',
    code: 'ORD-8493',
    customerName: 'Fernanda Valenzuela',
    customerEmail: 'f.valenzuela@hotmail.com',
    customerPhone: '+56991234567',
    location: 'Puerto Montt Centro',
    address: 'Av. Diego Portales 850, Depto 402',
    items: [
      {
        productId: 'mega-2',
        productName: 'Pack Corona Extra 24 Botellas 330cc Heladas',
        quantity: 1,
        price: 19990,
        image: 'https://images.unsplash.com/photo-1608270190578-831e51b32d2e?q=80&w=400&auto=format&fit=crop'
      }
    ],
    subtotal: 19990,
    discountAmount: 0,
    shippingCost: 3500,
    total: 23490,
    paymentMethod: 'Efectivo al recibir',
    status: 'confirmado_preparacion',
    createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString()
  },
  {
    id: 'ord-fallback-3',
    code: 'ORD-8494',
    customerName: 'Claudio Mardones',
    customerEmail: 'claudio.m@gmail.com',
    customerPhone: '+56976541234',
    location: 'Alerce Norte',
    address: 'Villa Alerce Norte, Calle Gabriela Mistral 110',
    items: [
      {
        productId: 'promo-1',
        productName: 'Pack Pisco Mistral 35° 1L + Coca Cola 1.5L + Hielo',
        quantity: 1,
        price: 12990,
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=400&auto=format&fit=crop'
      }
    ],
    subtotal: 12990,
    discountAmount: 0,
    shippingCost: 2000,
    total: 14990,
    paymentMethod: 'Pago Online Webpay',
    status: 'delivery_camino',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  }
];

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({
  isOpen = true,
  onClose,
  onLogout,
  onExit,
  showToast,
  settings
}) => {
  const [orders, setOrders] = useState<Order[]>(DEFAULT_FALLBACK_ORDERS);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'todos' | 'activos' | 'en_camino' | 'entregados'>('activos');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Set of order IDs that are currently UNFOLDED / EXPANDED.
  // By default, start with only active orders or empty so all orders fit cleanly in screen!
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());

  const handleExit = () => {
    if (onExit) onExit();
    else if (onClose) onClose();
  };

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    } else {
      handleExit();
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.orders) ? data.orders : [];
        if (list.length > 0) {
          setOrders(list);
        } else {
          setOrders(prev => (prev.length > 0 ? prev : DEFAULT_FALLBACK_ORDERS));
        }
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching orders for delivery:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    if (autoRefresh) {
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchOrders, autoRefresh]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedOrderIds(new Set(filteredOrders.map(o => o.id)));
  };

  const collapseAll = () => {
    setExpandedOrderIds(new Set());
  };

  // Clean phone number for WhatsApp (+569...)
  const getCleanPhone = (rawPhone?: string): string => {
    if (!rawPhone) return '';
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('569') && digits.length >= 11) return digits;
    if (digits.startsWith('9') && digits.length === 9) return `56${digits}`;
    if (digits.length === 8) return `569${digits}`;
    return digits;
  };

  const openWhatsAppMessage = (phone: string, text: string) => {
    const clean = getCleanPhone(phone);
    if (!clean) {
      if (showToast) showToast('El cliente no ingresó un teléfono válido para WhatsApp.');
      else alert('El cliente no ingresó un teléfono válido para WhatsApp.');
      return;
    }
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleUpdateStatus = async (
    order: Order,
    newStatus: 'confirmado_preparacion' | 'listo_retirar' | 'delivery_camino' | 'entregado',
    shouldNotifyWhatsApp: boolean = true
  ) => {
    setUpdatingOrderId(order.id);
    const storeName = settings?.storeName || "Fella's Market";

    try {
      await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      setOrders(prev =>
        prev.map(o => (o.id === order.id ? { ...o, status: newStatus } : o))
      );

      const statusLabels: Record<string, string> = {
        confirmado_preparacion: 'Confirmado y en preparación',
        listo_retirar: 'Listo para retirar',
        delivery_camino: 'Delivery en camino',
        entregado: 'Entregado'
      };

      if (showToast) {
        showToast(`Pedido ${order.code}: ${statusLabels[newStatus]}`);
      }

      if (shouldNotifyWhatsApp && order.customerPhone) {
        let message = '';
        const addressText = order.address ? `${order.address}, ${order.location}` : order.location;

        if (newStatus === 'confirmado_preparacion') {
          message = `¡Hola ${order.customerName}! 🍻 Tu pedido *${order.code}* en *${storeName}* ha sido *CONFIRMADO Y ESTÁ EN PREPARACIÓN*.\nEn breves minutos saldrá a despacho hacia *${addressText}*.\n¡Muchas gracias por tu compra!`;
        } else if (newStatus === 'listo_retirar') {
          message = `¡Hola ${order.customerName}! 📦 Tu pedido *${order.code}* en *${storeName}* ya está *LISTO PARA RETIRAR*.\nPuedes acercarte a nuestro local para retirar tus productos helados.\n¡Te esperamos!`;
        } else if (newStatus === 'delivery_camino') {
          message = `¡Hola ${order.customerName}! 🛵 ¡Buenas noticias! Tu pedido *${order.code}* de *${storeName}* está *EN CAMINO* con nuestro repartidor hacia *${addressText}*.\nPor favor mantente atento al teléfono o timbre para recibirlo.\n¡Salud! 🍻`;
        } else if (newStatus === 'entregado') {
          message = `¡Hola ${order.customerName}! 🎉 Tu pedido *${order.code}* ha sido *ENTREGADO CON ÉXITO*.\nMuchas gracias por confiar en *${storeName}*.\n¡Que disfrutes tu previa o celebración! 🍻`;
        }

        if (message) {
          openWhatsAppMessage(order.customerPhone, message);
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setOrders(prev =>
        prev.map(o => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCreateMockOrder = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    const mock: Order = {
      id: `ord-mock-${Date.now()}`,
      code: `ORD-${num}`,
      customerName: 'Cliente Prueba Express',
      customerEmail: 'cliente.prueba@gmail.com',
      customerPhone: '+56912345678',
      location: 'Alerce Histórico',
      address: 'Calle Gabriela Mistral 420, Pasaje El Roble',
      items: [
        {
          productId: 'p-test',
          productName: 'Pack Corona Extra 12x 330cc + Hielo',
          quantity: 1,
          price: 11990,
          image: 'https://images.unsplash.com/photo-1608270190578-831e51b32d2e?q=80&w=400&auto=format&fit=crop'
        }
      ],
      subtotal: 11990,
      discountAmount: 0,
      shippingCost: 2000,
      total: 13990,
      paymentMethod: 'Transferencia Bancaria',
      status: 'nuevo',
      createdAt: new Date().toISOString()
    };
    setOrders(prev => [mock, ...prev]);
    // Auto expand the newly created order so user sees it right away
    setExpandedOrderIds(prev => new Set(prev).add(mock.id));
    if (showToast) showToast(`Nuevo pedido de prueba #${mock.code} creado.`);
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Hace instantes';
      if (diffMins < 60) return `${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} h`;
      return new Date(isoString).toLocaleDateString('es-CL');
    } catch {
      return '';
    }
  };

  if (isOpen === false) return null;

  // Filters
  const filteredOrders = orders.filter(order => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchCode = order.code?.toLowerCase().includes(q);
      const matchName = order.customerName?.toLowerCase().includes(q);
      const matchPhone = order.customerPhone?.toLowerCase().includes(q);
      const matchAddress = order.address?.toLowerCase().includes(q);
      const matchLoc = order.location?.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchPhone && !matchAddress && !matchLoc) {
        return false;
      }
    }

    if (filter === 'todos') return true;
    if (filter === 'activos') {
      return order.status !== 'entregado' && order.status !== 'cancelado';
    }
    if (filter === 'en_camino') {
      return order.status === 'delivery_camino' || order.status === 'en_camino';
    }
    if (filter === 'entregados') {
      return order.status === 'entregado';
    }
    return true;
  });

  const countActivos = orders.filter(o => o.status !== 'entregado' && o.status !== 'cancelado').length;
  const countEnCamino = orders.filter(o => o.status === 'delivery_camino' || o.status === 'en_camino').length;
  const countEntregados = orders.filter(o => o.status === 'entregado').length;
  const totalRecaudado = orders
    .filter(o => o.status === 'entregado')
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const getStatusBadge = (status: Order['status'], isCompact = false) => {
    switch (status) {
      case 'confirmado_preparacion':
      case 'en_preparacion':
        return (
          <span className={`inline-flex items-center gap-1 font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full whitespace-nowrap ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>En Preparación</span>
          </span>
        );
      case 'listo_retirar':
        return (
          <span className={`inline-flex items-center gap-1 font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full whitespace-nowrap ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
            <i className="fa-solid fa-box-open text-[10px]"></i>
            <span>Listo Retiro</span>
          </span>
        );
      case 'delivery_camino':
      case 'en_camino':
        return (
          <span className={`inline-flex items-center gap-1 font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full whitespace-nowrap ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
            <i className="fa-solid fa-motorcycle text-[10px] animate-bounce"></i>
            <span>En Camino</span>
          </span>
        );
      case 'entregado':
        return (
          <span className={`inline-flex items-center gap-1 font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full whitespace-nowrap ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
            <i className="fa-solid fa-circle-check text-[10px]"></i>
            <span>Entregado</span>
          </span>
        );
      case 'cancelado':
        return (
          <span className={`inline-flex items-center gap-1 font-black bg-red-500/20 text-red-300 border border-red-500/40 rounded-full whitespace-nowrap ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
            <i className="fa-solid fa-ban text-[10px]"></i>
            <span>Cancelado</span>
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 font-black bg-[#ffd129] text-[#141414] rounded-full whitespace-nowrap animate-pulse ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
            <i className="fa-solid fa-bell text-[10px]"></i>
            <span>Nuevo</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white antialiased selection:bg-[#ffd129] selection:text-black">
      {/* BARRA SUPERIOR DE NAVEGACIÓN COMPACTA */}
      <header className="sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-md border-b border-stone-800 shadow-md px-3 sm:px-5 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Logo & Título */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ffd129] text-[#141414] flex items-center justify-center text-base font-black shadow shrink-0">
              <i className="fa-solid fa-motorcycle"></i>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                  {settings?.storeName || "FELLA'S"} <span className="text-[#ffd129]">DELIVERY</span>
                </h1>
                <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                  Repartidor
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                  En Vivo
                </span>
              </div>
              <p className="text-[10px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                <span>Modo ultra compacto & ventanas plegables</span>
                <span className="text-stone-600">•</span>
                <span className="text-amber-400 font-mono text-[10px]">
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
            </div>
          </div>

          {/* Botones de Cabecera */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold border border-stone-700 flex items-center gap-1 transition cursor-pointer"
              title="Actualizar listado de pedidos"
            >
              <i className={`fa-solid fa-rotate ${loading ? 'animate-spin' : ''}`}></i>
              <span className="hidden sm:inline">Refrescar</span>
            </button>

            <button
              onClick={handleCreateMockOrder}
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg text-xs font-bold border border-amber-500/30 flex items-center gap-1 transition cursor-pointer"
              title="Generar pedido simulado para probar el flujo"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span className="hidden md:inline">+ Test</span>
            </button>

            <button
              onClick={handleExit}
              className="px-3 py-1.5 bg-[#ffd129] hover:bg-yellow-400 text-[#141414] rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow active:scale-95"
            >
              <i className="fa-solid fa-shop"></i>
              <span>Tienda</span>
            </button>

            <button
              onClick={handleLogoutAction}
              className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg text-xs font-bold border border-red-800/50 flex items-center gap-1 transition cursor-pointer"
              title="Cerrar sesión de repartidor"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-5 py-3 sm:py-4 space-y-3">
        {/* BARRA DE RESUMEN ULTRA COMPACTA (1 SOLA LÍNEA HORIZONTAL) */}
        <div className="bg-[#141414] border border-stone-800/80 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm text-xs">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-stone-400 font-medium">Pendientes:</span>
              <strong className="text-white font-black">{countActivos}</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-stone-400 font-medium">En Ruta:</span>
              <strong className="text-white font-black">{countEnCamino}</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-stone-400 font-medium">Entregados:</span>
              <strong className="text-white font-black">{countEntregados}</strong>
            </div>

            <div className="flex items-center gap-1.5 border-l border-stone-800 pl-3">
              <span className="text-stone-400 font-medium">Recaudado:</span>
              <strong className="text-[#ffd129] font-black">{formatPrice(totalRecaudado)}</strong>
            </div>
          </div>

          {/* Botones de Colapso Masivo */}
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-0.5 bg-stone-800/80 hover:bg-stone-800 rounded transition cursor-pointer flex items-center gap-1"
              title="Expandir todos los pedidos para ver detalles completos"
            >
              <i className="fa-solid fa-angles-down text-[10px]"></i>
              <span>Desplegar todos</span>
            </button>

            <button
              onClick={collapseAll}
              className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-0.5 bg-stone-800/80 hover:bg-stone-800 rounded transition cursor-pointer flex items-center gap-1"
              title="Plegar todos los pedidos para ahorrar el máximo espacio"
            >
              <i className="fa-solid fa-angles-up text-[10px]"></i>
              <span>Plegar todos</span>
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS & BÚSQUEDA COMPACTA */}
        <div className="bg-[#141414] border border-stone-800/80 p-2.5 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 shadow-sm">
          {/* Tabs de Filtro */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setFilter('activos')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                filter === 'activos'
                  ? 'bg-[#ffd129] text-[#141414] shadow font-black'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <i className="fa-solid fa-fire text-[11px]"></i>
              <span>Pendientes ({countActivos})</span>
            </button>

            <button
              onClick={() => setFilter('en_camino')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                filter === 'en_camino'
                  ? 'bg-[#ffd129] text-[#141414] shadow font-black'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <i className="fa-solid fa-motorcycle text-[11px]"></i>
              <span>En Camino ({countEnCamino})</span>
            </button>

            <button
              onClick={() => setFilter('entregados')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                filter === 'entregados'
                  ? 'bg-[#ffd129] text-[#141414] shadow font-black'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <i className="fa-solid fa-circle-check text-[11px]"></i>
              <span>Entregados ({countEntregados})</span>
            </button>

            <button
              onClick={() => setFilter('todos')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                filter === 'todos'
                  ? 'bg-[#ffd129] text-[#141414] shadow font-black'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>Todos ({orders.length})</span>
            </button>
          </div>

          {/* Buscador Rápido y Auto-refresh */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1 md:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-stone-400 text-xs"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar código, cliente, calle..."
                className="w-full bg-[#1c1c1c] border border-stone-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-stone-400 focus:border-[#ffd129] outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-stone-400 hover:text-white text-xs cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition border cursor-pointer shrink-0 flex items-center gap-1 ${
                autoRefresh
                  ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                  : 'bg-stone-800 border-stone-700 text-stone-400'
              }`}
              title="Auto-actualizar cada 10 segundos"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`}></span>
              <span className="hidden sm:inline">10s</span>
            </button>
          </div>
        </div>

        {/* LISTADO DE PEDIDOS PLEGABLES / ACORDEÓN ULTRA COMPACTO */}
        <div className="space-y-1.5">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-10 bg-[#141414] rounded-2xl border border-stone-800 p-6">
              <div className="w-12 h-12 rounded-full bg-stone-800 text-stone-500 flex items-center justify-center mx-auto mb-2 text-xl">
                <i className="fa-solid fa-clipboard-check"></i>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                No hay pedidos para mostrar
              </h3>
              <p className="text-xs text-stone-400 max-w-md mx-auto mb-3">
                {searchTerm
                  ? `Sin coincidencias para "${searchTerm}".`
                  : 'No hay pedidos en este filtro.'}
              </p>
              <button
                onClick={handleCreateMockOrder}
                className="bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-black text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer"
              >
                + Crear Pedido Simulado
              </button>
            </div>
          ) : (
            filteredOrders.map(order => {
              const isExpanded = expandedOrderIds.has(order.id);
              const fullAddress = order.address ? `${order.address}, ${order.location}` : order.location;
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress + ', Chile')}`;
              const cleanPhone = getCleanPhone(order.customerPhone);
              const isBusy = updatingOrderId === order.id;
              const itemCount = order.items.reduce((acc, it) => acc + it.quantity, 0);

              return (
                <div
                  key={order.id}
                  className={`bg-[#141414] border transition-all duration-150 rounded-xl overflow-hidden shadow-sm ${
                    isExpanded ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-stone-800/80 hover:border-stone-700'
                  }`}
                >
                  {/* FILA PLEGADA / ENCABEZADO ULTRA COMPACTO (ALTURA MÍNIMA: ~54px) */}
                  <div
                    onClick={() => toggleExpand(order.id)}
                    className="p-2.5 sm:px-3.5 sm:py-2.5 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-stone-900/50 select-none transition"
                  >
                    {/* LADO IZQUIERDO: Flecha Plegable + Código + Estado + Cliente + Ubicación */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {/* Indicador flecha giratoria */}
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Plegar pedido' : 'Desplegar pedido'}
                        className="w-6 h-6 rounded-md bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center shrink-0 text-xs transition-transform duration-200"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        <i className="fa-solid fa-chevron-down text-[11px]"></i>
                      </button>

                      {/* Código del Pedido */}
                      <span className="font-mono text-xs sm:text-sm font-black text-[#ffd129] tracking-wider shrink-0">
                        {order.code}
                      </span>

                      {/* Badge de Estado Compacto */}
                      <div className="shrink-0">
                        {getStatusBadge(order.status, true)}
                      </div>

                      {/* Nombre y Dirección (Compacta y Truncada) */}
                      <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[180px]">
                          {order.customerName}
                        </span>
                        <span className="text-[11px] text-stone-400 truncate max-w-[180px] sm:max-w-[260px] hidden xs:inline">
                          <i className="fa-solid fa-location-dot text-amber-500/80 text-[10px] mr-1"></i>
                          {order.address || order.location}
                        </span>
                      </div>
                    </div>

                    {/* LADO DERECHO: Total + Tiempo + Acciones Rápidas Directas */}
                    <div
                      className="flex items-center gap-2 sm:gap-3 shrink-0"
                      onClick={(e) => e.stopPropagation()} // Evita toggle si hace clic en botones
                    >
                      {/* Tiempo transcurrido */}
                      <span className="text-[10px] text-stone-500 font-mono hidden md:inline">
                        {getRelativeTime(order.createdAt)}
                      </span>

                      {/* Total en pesos */}
                      <div className="text-right">
                        <span className="font-mono text-xs sm:text-sm font-black text-[#ffd129] block">
                          {formatPrice(order.total)}
                        </span>
                        <span className="text-[9px] text-stone-400 block -mt-0.5">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      {/* Botón rápido de WhatsApp (Directo sin desplegar) */}
                      {cleanPhone && (
                        <button
                          type="button"
                          onClick={() =>
                            openWhatsAppMessage(
                              order.customerPhone!,
                              `¡Hola ${order.customerName}! 🍻 Te contacto desde ${settings?.storeName || "Fella's Market"} respecto a tu pedido *${order.code}*.`
                            )
                          }
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center justify-center text-xs transition shadow cursor-pointer shrink-0"
                          title="Contactar por WhatsApp sin desplegar"
                        >
                          <i className="fa-brands fa-whatsapp text-sm"></i>
                        </button>
                      )}

                      {/* Botón rápido de GPS Maps (Directo sin desplegar) */}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center text-xs transition shadow cursor-pointer shrink-0"
                        title="Abrir ubicación en Google Maps"
                      >
                        <i className="fa-solid fa-diamond-turn-right text-xs"></i>
                      </a>
                    </div>
                  </div>

                  {/* CONTENIDO DESPLEGABLE / PLEGABLE CON TRANSICIÓN */}
                  {isExpanded && (
                    <div className="border-t border-stone-800/80 bg-[#171717] p-3 sm:p-4 space-y-3 animate-in fade-in duration-150">
                      {/* Grid de 2 columnas compactas: Cliente vs Destino */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {/* Datos de Contacto */}
                        <div className="bg-stone-900/90 p-3 rounded-lg border border-stone-800/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">
                              <i className="fa-solid fa-user text-[#ffd129] mr-1"></i> Cliente
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString('es-CL')}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">{order.customerName}</p>
                            <p className="text-[11px] text-stone-400">{order.customerEmail}</p>
                          </div>
                          {order.customerPhone && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-md text-[11px] font-bold transition"
                              >
                                <i className="fa-solid fa-phone text-emerald-400 text-xs"></i>
                                <span>{order.customerPhone}</span>
                              </a>
                              <button
                                onClick={() =>
                                  openWhatsAppMessage(
                                    order.customerPhone!,
                                    `¡Hola ${order.customerName}! 🍻 Te contacto desde ${settings?.storeName || "Fella's Market"} respecto a tu pedido *${order.code}*.`
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-black transition cursor-pointer"
                              >
                                <i className="fa-brands fa-whatsapp"></i>
                                <span>Chat</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Dirección de Despacho */}
                        <div className="bg-stone-900/90 p-3 rounded-lg border border-stone-800/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">
                              <i className="fa-solid fa-location-dot text-[#ffd129] mr-1"></i> Destino
                            </span>
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded">
                              {order.location}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white">
                            {order.address || 'Sin dirección específica (acordar entrega con cliente)'}
                          </p>
                          <div className="pt-1">
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[11px] font-bold transition shadow"
                            >
                              <i className="fa-solid fa-diamond-turn-right text-xs"></i>
                              <span>Abrir Ruta en Google Maps / GPS</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Productos Compacta */}
                      <div className="bg-stone-900/60 p-2.5 rounded-lg border border-stone-800/70">
                        <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                          <span>Detalle ({order.items.length} productos):</span>
                          <span>
                            Pago: <strong className="text-stone-200">{order.paymentMethod}</strong>
                            {order.shippingCost > 0 ? ` • Envío: ${formatPrice(order.shippingCost)}` : ' • Envío Gratis'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {order.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 bg-stone-950 px-2 py-0.5 rounded text-[11px] text-stone-200 border border-stone-800"
                            >
                              <span className="font-black text-[#ffd129]">{it.quantity}x</span>
                              <span className="truncate max-w-[200px]">{it.productName}</span>
                              <span className="text-stone-400 font-mono text-[10px]">
                                ({formatPrice(it.price * it.quantity)})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 4 BOTONES DE ESTADO COMPACTOS CON WHATSAPP */}
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 block mb-1.5">
                          Cambiar Estado (Notifica de inmediato al cliente por WhatsApp):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {/* 1: Confirmado y en preparación */}
                          <button
                            id={`btn-prep-${order.id}`}
                            onClick={() => handleUpdateStatus(order, 'confirmado_preparacion', true)}
                            disabled={isBusy}
                            className={`p-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer border active:scale-95 ${
                              order.status === 'confirmado_preparacion' || order.status === 'en_preparacion'
                                ? 'bg-amber-500 text-[#141414] border-amber-400 ring-2 ring-amber-400/40 font-black'
                                : 'bg-stone-900 hover:bg-amber-500 hover:text-[#141414] text-amber-300 border-amber-500/30'
                            }`}
                          >
                            <i className="fa-brands fa-whatsapp text-xs"></i>
                            <span className="truncate">En Preparación</span>
                          </button>

                          {/* 2: Listo para retirar */}
                          <button
                            id={`btn-pickup-${order.id}`}
                            onClick={() => handleUpdateStatus(order, 'listo_retirar', true)}
                            disabled={isBusy}
                            className={`p-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer border active:scale-95 ${
                              order.status === 'listo_retirar'
                                ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400/40 font-black'
                                : 'bg-stone-900 hover:bg-purple-600 hover:text-white text-purple-300 border-purple-500/30'
                            }`}
                          >
                            <i className="fa-brands fa-whatsapp text-xs"></i>
                            <span className="truncate">Listo Retiro</span>
                          </button>

                          {/* 3: Delivery en camino */}
                          <button
                            id={`btn-onway-${order.id}`}
                            onClick={() => handleUpdateStatus(order, 'delivery_camino', true)}
                            disabled={isBusy}
                            className={`p-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer border active:scale-95 ${
                              order.status === 'delivery_camino' || order.status === 'en_camino'
                                ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/40 font-black'
                                : 'bg-stone-900 hover:bg-blue-600 hover:text-white text-blue-300 border-blue-500/30'
                            }`}
                          >
                            <i className="fa-brands fa-whatsapp text-xs"></i>
                            <span className="truncate">En Camino</span>
                          </button>

                          {/* 4: Entregado */}
                          <button
                            id={`btn-delivered-${order.id}`}
                            onClick={() => handleUpdateStatus(order, 'entregado', true)}
                            disabled={isBusy}
                            className={`p-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer border active:scale-95 ${
                              order.status === 'entregado'
                                ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40 font-black'
                                : 'bg-stone-900 hover:bg-emerald-600 hover:text-white text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            <i className="fa-solid fa-check text-xs"></i>
                            <span className="truncate">Entregado</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};
