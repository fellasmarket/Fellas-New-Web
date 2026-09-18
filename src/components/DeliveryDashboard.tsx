import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { formatPrice } from '../data/products';

interface DeliveryDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({
  isOpen,
  onClose,
  onLogout
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'todos' | 'activos' | 'en_camino' | 'entregados'>('activos');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.orders) ? data.orders : [];
        setOrders(list);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching orders for delivery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000); // Poll every 10s for new orders
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Clean phone for WhatsApp (+569...)
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
      alert('El cliente no ingresó un teléfono válido para WhatsApp.');
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
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setOrders(prev =>
          prev.map(o => (o.id === order.id ? { ...o, status: newStatus } : o))
        );

        if (shouldNotifyWhatsApp && order.customerPhone) {
          let message = '';
          const addressText = order.address ? `${order.address}, ${order.location}` : order.location;

          if (newStatus === 'confirmado_preparacion') {
            message = `¡Hola ${order.customerName}! 🍻 Tu pedido *${order.code}* en Boti Express ha sido *CONFIRMADO Y ESTÁ EN PREPARACIÓN*. En breves minutos saldrá a despacho hacia ${addressText}. ¡Muchas gracias por tu compra!`;
          } else if (newStatus === 'listo_retirar') {
            message = `¡Hola ${order.customerName}! 📦 Tu pedido *${order.code}* en Boti Express ya está *LISTO PARA RETIRAR*. Puedes acercarte a nuestro local para recoger tus productos. ¡Te esperamos!`;
          } else if (newStatus === 'delivery_camino') {
            message = `¡Hola ${order.customerName}! 🛵 ¡Buenas noticias! Tu pedido *${order.code}* de Boti Express está *EN CAMINO* con nuestro repartidor hacia ${addressText}. Por favor mantente atento para recibirlo. ¡Salud!`;
          } else if (newStatus === 'entregado') {
            message = `¡Hola ${order.customerName}! 🎉 Tu pedido *${order.code}* ha sido *ENTREGADO*. Muchas gracias por confiar en Boti Express. ¡Que disfrutes tu previa o celebración! 🍻`;
          }

          if (message) {
            openWhatsAppMessage(order.customerPhone, message);
          }
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
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

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'confirmado_preparacion':
      case 'en_preparacion':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Confirmado y en preparación
          </span>
        );
      case 'listo_retirar':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <i className="fa-solid fa-box-check text-xs"></i>
            Listo para retirar
          </span>
        );
      case 'delivery_camino':
      case 'en_camino':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <i className="fa-solid fa-motorcycle text-xs"></i>
            Delivery en camino
          </span>
        );
      case 'entregado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <i className="fa-solid fa-circle-check text-xs"></i>
            Entregado
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-500/20 text-red-300 border border-red-500/40">
            <i className="fa-solid fa-ban text-xs"></i>
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-yellow-400 text-stone-900">
            <i className="fa-solid fa-bell text-xs animate-bounce"></i>
            Nuevo Pedido
          </span>
        );
    }
  };

  return (
    <div
      id="delivery-dashboard-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-[#141414] text-white border border-stone-700 rounded-2xl sm:rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Encabezado del Panel */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 bg-stone-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffd129] text-[#141414] flex items-center justify-center text-lg font-black shadow">
              <i className="fa-solid fa-motorcycle"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Panel de Delivery & Despacho
                </h2>
                <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Repartidor
                </span>
              </div>
              <p className="text-xs text-stone-400 flex items-center gap-2">
                <span>Gestión de pedidos en tiempo real y avisos por WhatsApp</span>
                <span className="text-stone-600">•</span>
                <span className="text-[11px] text-amber-400">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-delivery-orders"
              onClick={fetchOrders}
              disabled={loading}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold border border-stone-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <i className={`fa-solid fa-rotate ${loading ? 'animate-spin' : ''}`}></i>
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              id="logout-delivery"
              onClick={onLogout}
              className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-xl text-xs font-bold border border-red-800/50 flex items-center gap-1.5 transition cursor-pointer"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        {/* Barra de Filtros Rápidos */}
        <div className="px-4 py-3 bg-[#181818] border-b border-stone-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setFilter('activos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filter === 'activos'
                  ? 'bg-[#ffd129] text-[#141414] shadow'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <i className="fa-solid fa-fire"></i>
              <span>Pendientes & Activos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-900/40">
                {orders.filter(o => o.status !== 'entregado' && o.status !== 'cancelado').length}
              </span>
            </button>
            <button
              onClick={() => setFilter('en_camino')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filter === 'en_camino'
                  ? 'bg-[#ffd129] text-[#141414] shadow'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <i className="fa-solid fa-motorcycle"></i>
              <span>En Camino</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-900/40">
                {orders.filter(o => o.status === 'delivery_camino' || o.status === 'en_camino').length}
              </span>
            </button>
            <button
              onClick={() => setFilter('entregados')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filter === 'entregados'
                  ? 'bg-[#ffd129] text-[#141414] shadow'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <i className="fa-solid fa-circle-check"></i>
              <span>Entregados</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-900/40">
                {orders.filter(o => o.status === 'entregado').length}
              </span>
            </button>
            <button
              onClick={() => setFilter('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                filter === 'todos'
                  ? 'bg-[#ffd129] text-[#141414] shadow'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>Todos ({orders.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-stone-400 font-medium">
            Mostrando {filteredOrders.length} pedidos
          </span>
        </div>

        {/* Lista de Pedidos para Despacho */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-stone-900/40 rounded-2xl border border-stone-800">
              <div className="w-16 h-16 rounded-full bg-stone-800 text-stone-500 flex items-center justify-center mx-auto mb-3 text-2xl">
                <i className="fa-solid fa-clipboard-check"></i>
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                No hay pedidos en esta categoría
              </h3>
              <p className="text-xs text-stone-400">
                Cuando los clientes realicen compras, aparecerán aquí inmediatamente con sus datos y ubicación.
              </p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const fullAddress = order.address ? `${order.address}, ${order.location}` : order.location;
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress + ', Chile')}`;
              const cleanPhone = getCleanPhone(order.customerPhone);
              const isBusy = updatingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-stone-900/90 border border-stone-800 hover:border-stone-700 rounded-2xl p-4 sm:p-5 transition shadow-lg space-y-4"
                >
                  {/* Fila Superior: Código, Estado y Fecha */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-black text-[#ffd129]">
                        {order.code}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-right text-xs text-stone-400">
                      <span>{new Date(order.createdAt).toLocaleString('es-CL')}</span>
                    </div>
                  </div>

                  {/* Fila Central: Datos de Entrega & Cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tarjeta Cliente & Contacto */}
                    <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800/80 space-y-2">
                      <h4 className="text-[11px] font-black uppercase text-stone-400 tracking-wider flex items-center gap-1.5">
                        <i className="fa-solid fa-user text-[#ffd129]"></i> Datos del Cliente
                      </h4>
                      <div>
                        <p className="text-sm font-black text-white">{order.customerName}</p>
                        <p className="text-xs text-stone-400">{order.customerEmail}</p>
                      </div>

                      {order.customerPhone && (
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold transition"
                          >
                            <i className="fa-solid fa-phone text-emerald-400"></i>
                            <span>{order.customerPhone}</span>
                          </a>
                          {cleanPhone && (
                            <button
                              onClick={() =>
                                openWhatsAppMessage(
                                  order.customerPhone!,
                                  `¡Hola ${order.customerName}! 🍻 Te contacto desde Boti Express respecto a tu pedido *${order.code}*.`
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer"
                            >
                              <i className="fa-brands fa-whatsapp text-sm"></i>
                              <span>WhatsApp</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tarjeta Destino & Dirección Exacta */}
                    <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800/80 space-y-2">
                      <h4 className="text-[11px] font-black uppercase text-stone-400 tracking-wider flex items-center gap-1.5">
                        <i className="fa-solid fa-location-dot text-[#ffd129]"></i> Dirección de Despacho
                      </h4>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                            Área: {order.location}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white mt-1">
                          {order.address || 'Sin dirección específica (acordar entrega)'}
                        </p>
                      </div>

                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow"
                      >
                        <i className="fa-solid fa-diamond-turn-right text-xs"></i>
                        <span>Abrir en Google Maps / GPS</span>
                      </a>
                    </div>
                  </div>

                  {/* Resumen de Productos */}
                  <div className="bg-stone-950/50 p-3 rounded-xl border border-stone-800/60">
                    <p className="text-[11px] font-bold text-stone-400 mb-2 uppercase tracking-wider">
                      Productos del Pedido ({order.items.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 bg-stone-900 px-2.5 py-1 rounded-lg text-xs text-stone-200 border border-stone-800"
                        >
                          <span className="font-black text-[#ffd129]">{it.quantity}x</span>
                          <span className="truncate max-w-[200px]">{it.productName}</span>
                          <span className="text-stone-400">({formatPrice(it.price * it.quantity)})</span>
                        </span>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between text-xs">
                      <span className="text-stone-400">
                        Pago: <strong className="text-stone-200">{order.paymentMethod}</strong>
                        {order.shippingCost > 0 ? ` • Envío: ${formatPrice(order.shippingCost)}` : ' • Envío Gratis'}
                      </span>
                      <span className="text-sm font-black text-white">
                        Total: <span className="text-[#ffd129]">{formatPrice(order.total)}</span>
                      </span>
                    </div>
                  </div>

                  {/* BOTONES DE ACCIÓN EXCLUSIVOS PEDIDOS POR EL USUARIO */}
                  <div>
                    <p className="text-[11px] font-bold text-stone-400 mb-2 flex items-center gap-1.5">
                      <i className="fa-solid fa-hand-pointer text-[#ffd129]"></i>
                      Actualizar Estado y Notificar al Cliente (Abre WhatsApp automáticamente):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {/* Botón 1: Confirmado y en preparación */}
                      <button
                        id={`btn-prep-${order.id}`}
                        onClick={() => handleUpdateStatus(order, 'confirmado_preparacion', true)}
                        disabled={isBusy}
                        className={`p-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition shadow cursor-pointer border active:scale-95 ${
                          order.status === 'confirmado_preparacion' || order.status === 'en_preparacion'
                            ? 'bg-amber-500 text-stone-900 border-amber-400 ring-2 ring-amber-400/40'
                            : 'bg-stone-800 hover:bg-amber-600/90 text-amber-300 hover:text-stone-900 border-amber-500/30'
                        }`}
                      >
                        <i className="fa-brands fa-whatsapp text-sm"></i>
                        <span>Confirmado y en preparación</span>
                      </button>

                      {/* Botón 2: Listo para retirar */}
                      <button
                        id={`btn-ready-${order.id}`}
                        onClick={() => handleUpdateStatus(order, 'listo_retirar', true)}
                        disabled={isBusy}
                        className={`p-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition shadow cursor-pointer border active:scale-95 ${
                          order.status === 'listo_retirar'
                            ? 'bg-purple-500 text-white border-purple-400 ring-2 ring-purple-400/40'
                            : 'bg-stone-800 hover:bg-purple-600/90 text-purple-300 hover:text-white border-purple-500/30'
                        }`}
                      >
                        <i className="fa-brands fa-whatsapp text-sm"></i>
                        <span>Listo para retirar</span>
                      </button>

                      {/* Botón 3: Delivery en camino */}
                      <button
                        id={`btn-onway-${order.id}`}
                        onClick={() => handleUpdateStatus(order, 'delivery_camino', true)}
                        disabled={isBusy}
                        className={`p-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition shadow cursor-pointer border active:scale-95 ${
                          order.status === 'delivery_camino' || order.status === 'en_camino'
                            ? 'bg-blue-500 text-white border-blue-400 ring-2 ring-blue-400/40'
                            : 'bg-stone-800 hover:bg-blue-600/90 text-blue-300 hover:text-white border-blue-500/30'
                        }`}
                      >
                        <i className="fa-brands fa-whatsapp text-sm"></i>
                        <span>Delivery en camino</span>
                      </button>

                      {/* Botón 4: Entregado */}
                      <button
                        id={`btn-delivered-${order.id}`}
                        onClick={() => handleUpdateStatus(order, 'entregado', true)}
                        disabled={isBusy}
                        className={`p-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition shadow cursor-pointer border active:scale-95 ${
                          order.status === 'entregado'
                            ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40'
                            : 'bg-stone-800 hover:bg-emerald-600/90 text-emerald-300 hover:text-white border-emerald-500/30'
                        }`}
                      >
                        <i className="fa-solid fa-check text-sm"></i>
                        <span>Entregado</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
