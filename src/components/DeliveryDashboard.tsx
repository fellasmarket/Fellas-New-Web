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
  },
  {
    id: 'ord-fallback-4',
    code: 'ORD-8495',
    customerName: 'Marcela Vivar',
    customerEmail: 'm.vivar@gmail.com',
    customerPhone: '+56984512390',
    location: 'Valle Volcanes',
    address: 'Calle Los Volcanes 1420, Condominio El Roble',
    items: [
      {
        productId: 'vodka-1',
        productName: 'Vodka Absolut Regular 750ml',
        quantity: 1,
        price: 14990,
        image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=400&auto=format&fit=crop'
      },
      {
        productId: 'ener-1',
        productName: 'Pack 4 Bebidas Red Bull 250ml',
        quantity: 1,
        price: 6490,
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=400&auto=format&fit=crop'
      }
    ],
    subtotal: 21480,
    discountAmount: 0,
    shippingCost: 3000,
    total: 24480,
    paymentMethod: 'Transferencia Bancaria',
    status: 'entregado',
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString()
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
  
  // Set of order IDs where the user clicked "+ ver todos los items"
  const [expandedItemsIds, setExpandedItemsIds] = useState<Set<string>>(new Set());

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

  const toggleExpandItems = (orderId: string) => {
    setExpandedItemsIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
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
    if (showToast) showToast(`Nuevo pedido de prueba #${mock.code} creado.`);
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Hace instantes';
      if (diffMins < 60) return `${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
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

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'confirmado_preparacion':
      case 'en_preparacion':
        return (
          <span className="inline-flex items-center gap-1 font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full px-2 py-0.5 text-[10px] whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>En Preparación</span>
          </span>
        );
      case 'listo_retirar':
        return (
          <span className="inline-flex items-center gap-1 font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full px-2 py-0.5 text-[10px] whitespace-nowrap">
            <i className="fa-solid fa-box-open text-[10px]"></i>
            <span>Listo Retiro</span>
          </span>
        );
      case 'delivery_camino':
      case 'en_camino':
        return (
          <span className="inline-flex items-center gap-1 font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full px-2 py-0.5 text-[10px] whitespace-nowrap">
            <i className="fa-solid fa-motorcycle text-[10px] animate-bounce"></i>
            <span>En Camino</span>
          </span>
        );
      case 'entregado':
        return (
          <span className="inline-flex items-center gap-1 font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full px-2 py-0.5 text-[10px] whitespace-nowrap">
            <i className="fa-solid fa-circle-check text-[10px]"></i>
            <span>Entregado</span>
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 font-black bg-red-500/20 text-red-300 border border-red-500/40 rounded-full px-2 py-0.5 text-[10px] whitespace-nowrap">
            <i className="fa-solid fa-ban text-[10px]"></i>
            <span>Cancelado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 font-black bg-[#ffd129] text-[#141414] rounded-full px-2 py-0.5 text-[10px] whitespace-nowrap animate-pulse">
            <i className="fa-solid fa-bell text-[10px]"></i>
            <span>Nuevo</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white antialiased selection:bg-[#ffd129] selection:text-black">
      {/* BARRA SUPERIOR DE NAVEGACIÓN Y CONTROL (COMPLETA Y ELEGANTE) */}
      <header className="sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-md border-b border-gray-800 shadow-xl px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#ffd129] text-[#141414] flex items-center justify-center text-xl font-black shadow-lg shrink-0">
              <i className="fa-solid fa-motorcycle"></i>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  {settings?.storeName || "FELLA'S"} <span className="text-[#ffd129]">DELIVERY</span>
                </h1>
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Repartidor
                </span>
                <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  En Vivo
                </span>
              </div>
              <p className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                <span>Gestión de pedidos en ruta y avisos por WhatsApp</span>
                <span className="text-gray-600">•</span>
                <span className="text-amber-400 font-mono">
                  Actualizado: {lastUpdated.toLocaleTimeString()}
                </span>
              </p>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold border border-stone-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Actualizar listado de pedidos"
            >
              <i className={`fa-solid fa-rotate ${loading ? 'animate-spin' : ''}`}></i>
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={handleCreateMockOrder}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer"
              title="Generar pedido simulado para probar el flujo"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span className="hidden md:inline">Test Pedido</span>
            </button>

            <button
              onClick={handleExit}
              className="px-4 py-2 bg-[#ffd129] hover:bg-yellow-400 text-[#141414] rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow active:scale-95"
            >
              <i className="fa-solid fa-shop"></i>
              <span>Volver a la Tienda</span>
            </button>

            <button
              onClick={handleLogoutAction}
              className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-xl text-xs font-bold border border-red-800/50 flex items-center gap-1.5 transition cursor-pointer"
              title="Cerrar sesión de repartidor"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5">
        {/* TARJETAS DE RESUMEN RÁPIDO (4 KPIS VISUALES) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#141414] border border-amber-500/30 p-4 rounded-2xl shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider">Pendientes</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm">
                <i className="fa-solid fa-fire"></i>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{countActivos}</span>
              <span className="text-[11px] text-stone-400">por preparar o enviar</span>
            </div>
          </div>

          <div className="bg-[#141414] border border-blue-500/30 p-4 rounded-2xl shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-blue-400 tracking-wider">En Camino</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center text-sm">
                <i className="fa-solid fa-motorcycle"></i>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{countEnCamino}</span>
              <span className="text-[11px] text-stone-400">en ruta de reparto</span>
            </div>
          </div>

          <div className="bg-[#141414] border border-emerald-500/30 p-4 rounded-2xl shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">Entregados</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-sm">
                <i className="fa-solid fa-circle-check"></i>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{countEntregados}</span>
              <span className="text-[11px] text-stone-400">completados con éxito</span>
            </div>
          </div>

          <div className="bg-[#141414] border border-gray-800 p-4 rounded-2xl shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-yellow-400 tracking-wider">Recaudación</span>
              <div className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-300 flex items-center justify-center text-sm">
                <i className="fa-solid fa-sack-dollar"></i>
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-[#ffd129] font-mono">{formatPrice(totalRecaudado)}</span>
            </div>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="bg-[#141414] border border-gray-800 p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow">
          {/* Tabs de Filtro */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setFilter('activos')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                filter === 'activos'
                  ? 'bg-[#ffd129] text-[#141414] shadow font-black'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <i className="fa-solid fa-fire text-xs"></i>
              <span>Pendientes ({countActivos})</span>
            </button>

            <button
              onClick={() => setFilter('en_camino')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                filter === 'en_camino'
                  ? 'bg-[#ffd129] text-[#141414] shadow font-black'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <i className="fa-solid fa-motorcycle text-xs"></i>
              <span>En Camino ({countEnCamino})</span>
            </button>

            <button
              onClick={() => setFilter('entregados')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                filter === 'entregados'
                  ? 'bg-[#ffd129] text-[#141414] shadow font-black'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <i className="fa-solid fa-circle-check text-xs"></i>
              <span>Entregados ({countEntregados})</span>
            </button>

            <button
              onClick={() => setFilter('todos')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                filter === 'todos'
                  ? 'bg-[#ffd129] text-[#141414] shadow font-black'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>Todos ({orders.length})</span>
            </button>
          </div>

          {/* Buscador Rápido */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-72">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-stone-400 text-xs"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar código, cliente, calle..."
                className="w-full bg-[#1c1c1c] border border-gray-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-stone-400 focus:border-[#ffd129] outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-white text-xs cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {/* Toggle Auto-Refresh */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer shrink-0 flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                  : 'bg-stone-800 border-stone-700 text-stone-400'
              }`}
              title="Auto-actualizar cada 10 segundos"
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`}></span>
              <span className="hidden sm:inline">Auto 10s</span>
            </button>
          </div>
        </div>

        {/* LISTADO DE PEDIDOS: RECUADROS EN FILAS HORIZONTALES DE A 4 HACIA ABAJO */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-[#141414] rounded-3xl border border-gray-800 p-8">
            <div className="w-16 h-16 rounded-full bg-stone-800 text-stone-500 flex items-center justify-center mx-auto mb-3 text-2xl">
              <i className="fa-solid fa-clipboard-check"></i>
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              No hay pedidos para mostrar
            </h3>
            <p className="text-xs text-stone-400 max-w-md mx-auto mb-4">
              {searchTerm
                ? `No se encontraron coincidencias para "${searchTerm}".`
                : 'No hay pedidos en la pestaña seleccionada. Puedes crear un pedido simulado para verificar el flujo de estados y WhatsApp.'}
            </p>
            <button
              onClick={handleCreateMockOrder}
              className="bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              + Crear Pedido de Prueba
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 items-start">
            {filteredOrders.map(order => {
              const fullAddress = order.address ? `${order.address}, ${order.location}` : order.location;
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress + ', Chile')}`;
              const cleanPhone = getCleanPhone(order.customerPhone);
              const isBusy = updatingOrderId === order.id;
              const totalItems = order.items.reduce((acc, it) => acc + it.quantity, 0);
              const isExpandedItems = expandedItemsIds.has(order.id);
              const visibleItems = isExpandedItems ? order.items : order.items.slice(0, 2);

              return (
                <div
                  key={order.id}
                  className="bg-[#141414] border border-stone-800 hover:border-stone-700 rounded-2xl p-3.5 sm:p-4 transition-all duration-200 shadow-md flex flex-col justify-between space-y-3"
                >
                  {/* 1. CABECERA DEL RECUADRO: Código, Tiempo y Estado */}
                  <div className="flex items-center justify-between gap-1.5 border-b border-stone-800/80 pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-sm font-black text-[#ffd129] tracking-wider shrink-0">
                        {order.code}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono shrink-0">
                        {getRelativeTime(order.createdAt)}
                      </span>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* 2. DATOS DEL CLIENTE Y CONTACTO RÁPIDO */}
                  <div className="bg-[#1a1a1a] p-2.5 rounded-xl border border-stone-800/80 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black text-white truncate max-w-[140px] sm:max-w-[160px]" title={order.customerName}>
                        <i className="fa-solid fa-user text-[#ffd129] text-[10px] mr-1.5"></i>
                        {order.customerName}
                      </span>
                      {/* Acciones directas de Teléfono & WhatsApp */}
                      <div className="flex items-center gap-1 shrink-0">
                        {order.customerPhone && (
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="w-6 h-6 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center text-[10px] transition"
                            title={`Llamar a ${order.customerPhone}`}
                          >
                            <i className="fa-solid fa-phone text-emerald-400"></i>
                          </a>
                        )}
                        {cleanPhone && (
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsAppMessage(
                                order.customerPhone!,
                                `¡Hola ${order.customerName}! 🍻 Te contacto desde ${settings?.storeName || "Fella's Market"} respecto a tu pedido *${order.code}*.`
                              )
                            }
                            className="w-6 h-6 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-[10px] transition shadow cursor-pointer"
                            title="Chat directo por WhatsApp"
                          >
                            <i className="fa-brands fa-whatsapp text-xs"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] text-stone-400 truncate">{order.customerEmail}</p>
                  </div>

                  {/* 3. DESTINO Y GPS */}
                  <div className="bg-[#1a1a1a] p-2.5 rounded-xl border border-stone-800/80 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded truncate max-w-[150px]">
                        <i className="fa-solid fa-location-dot mr-1 text-[9px]"></i>
                        {order.location}
                      </span>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition"
                        title="Ver en Google Maps"
                      >
                        <span>GPS</span>
                        <i className="fa-solid fa-diamond-turn-right text-[10px]"></i>
                      </a>
                    </div>
                    <p className="text-[11px] text-stone-200 font-medium line-clamp-2 leading-tight" title={order.address || order.location}>
                      {order.address || 'Sin dirección específica (acordar entrega)'}
                    </p>
                  </div>

                  {/* 4. PRODUCTOS COMPACTOS (CHIPS) */}
                  <div className="bg-[#1a1a1a]/60 p-2.5 rounded-xl border border-stone-800/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase">
                      <span>{totalItems} {totalItems === 1 ? 'producto' : 'productos'}:</span>
                      <span className="text-stone-300 truncate max-w-[110px]">{order.paymentMethod}</span>
                    </div>

                    <div className="space-y-1">
                      {visibleItems.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] text-stone-200 leading-tight">
                          <span className="truncate flex-1 pr-1">
                            <strong className="text-[#ffd129] mr-1">{it.quantity}x</strong>
                            {it.productName}
                          </span>
                          <span className="text-stone-400 font-mono text-[10px] shrink-0">
                            {formatPrice(it.price * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.items.length > 2 && (
                      <button
                        onClick={() => toggleExpandItems(order.id)}
                        className="text-[10px] text-amber-400 hover:text-yellow-300 font-bold block pt-0.5 cursor-pointer"
                      >
                        {isExpandedItems ? '▲ Ver menos' : `▼ +${order.items.length - 2} productos más...`}
                      </button>
                    )}

                    <div className="border-t border-stone-800 pt-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-stone-400">
                        {order.shippingCost > 0 ? `Envío: ${formatPrice(order.shippingCost)}` : 'Envío Gratis'}
                      </span>
                      <span className="text-xs font-black text-white">
                        Total: <strong className="text-[#ffd129] font-mono text-sm">{formatPrice(order.total)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* 5. BOTONES DE ACCIÓN: 4 BOTONES DE ESTADO EN MATRIZ 2x2 */}
                  <div className="pt-1">
                    <span className="text-[9px] font-bold text-stone-400 block mb-1.5 uppercase tracking-wider">
                      Estado & Aviso WhatsApp:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* 1: En Preparación */}
                      <button
                        id={`btn-prep-${order.id}`}
                        onClick={() => handleUpdateStatus(order, 'confirmado_preparacion', true)}
                        disabled={isBusy}
                        className={`p-2 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition cursor-pointer border active:scale-95 ${
                          order.status === 'confirmado_preparacion' || order.status === 'en_preparacion'
                            ? 'bg-amber-500 text-[#141414] border-amber-400 ring-2 ring-amber-400/40 shadow'
                            : 'bg-stone-900 hover:bg-amber-500 hover:text-[#141414] text-amber-300 border-amber-500/30'
                        }`}
                        title="Marcar como Confirmado y en preparación y avisar por WhatsApp"
                      >
                        <i className="fa-brands fa-whatsapp text-xs"></i>
                        <span className="truncate">En Prep.</span>
                      </button>

                      {/* 2: Listo Retiro */}
                      <button
                        id={`btn-pickup-${order.id}`}
                        onClick={() => handleUpdateStatus(order, 'listo_retirar', true)}
                        disabled={isBusy}
                        className={`p-2 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition cursor-pointer border active:scale-95 ${
                          order.status === 'listo_retirar'
                            ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400/40 shadow'
                            : 'bg-stone-900 hover:bg-purple-600 hover:text-white text-purple-300 border-purple-500/30'
                        }`}
                        title="Marcar como Listo para retirar y avisar por WhatsApp"
                      >
                        <i className="fa-brands fa-whatsapp text-xs"></i>
                        <span className="truncate">Listo Retiro</span>
                      </button>

                      {/* 3: En Camino */}
                      <button
                        id={`btn-onway-${order.id}`}
                        onClick={() => handleUpdateStatus(order, 'delivery_camino', true)}
                        disabled={isBusy}
                        className={`p-2 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition cursor-pointer border active:scale-95 ${
                          order.status === 'delivery_camino' || order.status === 'en_camino'
                            ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/40 shadow'
                            : 'bg-stone-900 hover:bg-blue-600 hover:text-white text-blue-300 border-blue-500/30'
                        }`}
                        title="Marcar como Delivery en camino y avisar por WhatsApp"
                      >
                        <i className="fa-brands fa-whatsapp text-xs"></i>
                        <span className="truncate">En Camino</span>
                      </button>

                      {/* 4: Entregado */}
                      <button
                        id={`btn-delivered-${order.id}`}
                        onClick={() => handleUpdateStatus(order, 'entregado', true)}
                        disabled={isBusy}
                        className={`p-2 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition cursor-pointer border active:scale-95 ${
                          order.status === 'entregado'
                            ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40 shadow'
                            : 'bg-stone-900 hover:bg-emerald-600 hover:text-white text-emerald-300 border-emerald-500/30'
                        }`}
                        title="Marcar como Entregado y avisar por WhatsApp"
                      >
                        <i className="fa-solid fa-check text-xs"></i>
                        <span className="truncate">Entregado</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
