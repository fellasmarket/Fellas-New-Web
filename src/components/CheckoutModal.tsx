import React, { useState, useEffect } from 'react';
import { CartItem, UserAccount, StoreSettings } from '../types';
import {
  formatPrice,
  getDeliveryLocations,
  getLocationPrice,
  getLocationEstimatedTime,
  checkStoreOpenStatus
} from '../data/products';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  location: string;
  onConfirmOrder: () => void;
  user: UserAccount | null;
  settings: StoreSettings;
  onUpdateLocation?: (loc: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  location: initialLocation,
  onConfirmOrder,
  user,
  settings,
  onUpdateLocation
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'webpay' | 'card' | 'transfer'>('webpay');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || 'Alerce Norte');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  if (!isOpen) return null;

  // Check store schedule status
  const storeStatus = checkStoreOpenStatus(settings?.scheduleConfig);

  const deliveryLocations = getDeliveryLocations(settings);
  const baseShippingCost = getLocationPrice(selectedLocation, settings);
  const estimatedTime = getLocationEstimatedTime(selectedLocation, settings);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = user?.discountPercent ? Math.round(subtotal * (user.discountPercent / 100)) : 0;
  
  const freeThreshold = settings?.freeShippingThreshold ?? 50000;
  const isFreeShipping = freeThreshold > 0 && subtotal - discountAmount >= freeThreshold;
  const finalShippingCost = isFreeShipping ? 0 : baseShippingCost;
  const total = subtotal - discountAmount + finalShippingCost;

  const handleLocationChange = (newLoc: string) => {
    setSelectedLocation(newLoc);
    if (onUpdateLocation) {
      onUpdateLocation(newLoc);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeStatus.isOpen) {
      alert('En este momento el local se encuentra cerrado según nuestro horario de atención. No es posible ingresar nuevos pedidos.');
      return;
    }

    setIsSubmitting(true);

    const code = 'BOTI-' + Math.floor(100000 + Math.random() * 900000);
    setOrderCode(code);

    const paymentMethodNames = {
      webpay: 'Webpay Plus / Débito',
      card: 'Tarjeta de Crédito',
      transfer: 'Transferencia Bancaria'
    };

    const newOrderPayload = {
      code,
      customerName: customerName.trim() || 'Cliente Invitado',
      customerEmail: customerEmail.trim() || 'sin-correo@botilleria.cl',
      customerPhone: customerPhone.trim() || '+56 9 1234 5678',
      location: selectedLocation,
      address: customerAddress.trim() || selectedLocation,
      items: cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.image
      })),
      subtotal,
      discountAmount,
      shippingCost: finalShippingCost,
      total,
      paymentMethod: paymentMethodNames[paymentMethod],
      status: 'nuevo'
    };

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderPayload)
      });

      if (customerEmail && customerEmail.includes('@')) {
        fetch('/api/marketing/subscribers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: customerEmail, source: 'Checkout de Compra' })
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Error posting order:', err);
    }

    setIsSubmitting(false);
    setOrderPlaced(true);
    onConfirmOrder();
  };

  return (
    <div
      id="checkout-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="checkout-modal"
        className="bg-[#141414] text-white border border-stone-700 rounded-3xl w-full max-w-lg shadow-2xl p-5 sm:p-6 relative max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white transition p-2 cursor-pointer"
        >
          <i className="fa-solid fa-xmark text-base"></i>
        </button>

        {orderPlaced ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-[#ffd129]/20 border border-[#ffd129]/40 text-[#ffd129] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
              <i className="fa-solid fa-check"></i>
            </div>
            <h3 className="text-xl font-black text-white mb-1">¡Pedido Enviado a la Botillería!</h3>
            <p className="text-xs text-stone-400 mb-4">
              Tu orden <span className="font-mono text-[#ffd129] font-bold">{orderCode}</span> ha ingresado en tiempo real a nuestro sistema de despacho.
            </p>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 text-left mb-6 text-xs text-stone-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-400">Cliente:</span>
                <span className="font-semibold text-white">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">WhatsApp de contacto:</span>
                <span className="font-semibold text-emerald-400">{customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Área de despacho:</span>
                <span className="font-semibold text-amber-300">{selectedLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Ubicación exacta:</span>
                <span className="font-semibold text-white">{customerAddress}</span>
              </div>
              <div className="flex justify-between border-t border-stone-800 pt-2">
                <span className="text-stone-400">Total pagado:</span>
                <span className="font-bold text-[#ffd129] text-sm">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Tiempo de entrega estimado:</span>
                <span className="text-emerald-400 font-bold">{estimatedTime} minutos aprox.</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-black text-xs py-3 rounded-xl transition shadow cursor-pointer"
            >
              Volver a la Tienda
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-3">
              <i className="fa-solid fa-bolt text-[#ffd129] text-lg"></i>
              <div>
                <h3 className="text-base font-black text-white">Despacho Exprés Botillería</h3>
                <p className="text-[11px] text-stone-400">Tus licores y packs helados directo a tu puerta</p>
              </div>
            </div>

            {/* AVISO DE HORARIO DE ATENCIÓN / CIERRE */}
            {!storeStatus.isOpen && (
              <div className="mb-4 p-3.5 bg-red-950/40 border border-red-800/80 rounded-2xl text-left space-y-1.5 animate-pulse">
                <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase tracking-wider">
                  <i className="fa-solid fa-clock"></i>
                  <span>Local Cerrado Actualmente</span>
                </div>
                <p className="text-xs text-stone-200">
                  {storeStatus.reason || 'Nuestro local no se encuentra recibiendo pedidos en este horario.'}
                </p>
                <div className="text-[11px] text-amber-300 font-semibold flex items-center justify-between pt-1 border-t border-red-900/60">
                  <span>{storeStatus.todayHoursText}</span>
                  {storeStatus.nextOpenText && <span>• {storeStatus.nextOpenText}</span>}
                </div>
              </div>
            )}

            {/* Resumen de productos */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-stone-300 block mb-2">Resumen de tus botellas:</span>
              <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 max-h-28 overflow-y-auto space-y-2">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center text-xs">
                    <span className="truncate max-w-[240px] text-stone-300">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="font-semibold text-white shrink-0">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario de Entrega y Pago */}
            <form onSubmit={handlePay} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-stone-300 font-semibold mb-1">
                    Nombre y Apellido <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Martín González"
                    className="w-full bg-stone-800 text-white text-xs rounded-lg px-2.5 py-2 border border-stone-700 outline-none focus:border-[#ffd129]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-stone-300 font-semibold mb-1">
                    WhatsApp / Teléfono <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full bg-stone-800 text-white text-xs rounded-lg px-2.5 py-2 border border-stone-700 outline-none focus:border-[#ffd129]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-stone-300 font-semibold mb-1">
                  Correo Electrónico (Para envío de comprobante)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="ejemplo@correo.cl"
                  className="w-full bg-stone-800 text-white text-xs rounded-lg px-2.5 py-2 border border-stone-700 outline-none focus:border-[#ffd129]"
                />
              </div>

              {/* SELECCIÓN DE ÁREA CON PRECIO FIJO CONFIGURABLE */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] text-stone-300 font-semibold">
                    Área de Cobertura <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-[#ffd129]">
                    Tarifa fija por sector
                  </span>
                </div>
                <select
                  value={selectedLocation}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full bg-stone-800 text-white text-xs rounded-lg px-2.5 py-2 border border-stone-700 outline-none focus:border-[#ffd129]"
                >
                  {deliveryLocations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} — {formatPrice(loc.price)} (Aprox. {loc.estimatedMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* UBICACIÓN EXACTA SOLICITADA POR EL USUARIO */}
              <div>
                <label className="block text-[11px] text-stone-300 font-semibold mb-1">
                  Ubicación Exacta de Entrega <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Calle, número de casa/depto, block, condominio o referencia"
                  className="w-full bg-stone-800 text-white text-xs rounded-lg px-2.5 py-2 border border-stone-700 outline-none focus:border-[#ffd129]"
                />
              </div>

              {/* Método de pago */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-stone-300 block mb-2">Selecciona método de pago:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('webpay')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'webpay'
                        ? 'border-[#ffd129] bg-stone-800/80 text-white font-bold'
                        : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-credit-card text-sm text-[#ffd129]"></i>
                    <span className="text-[10px]">Webpay / Débito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-[#ffd129] bg-stone-800/80 text-white font-bold'
                        : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    <i className="fa-brands fa-cc-visa text-sm text-sky-400"></i>
                    <span className="text-[10px]">Tarjeta Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentMethod === 'transfer'
                        ? 'border-[#ffd129] bg-stone-800/80 text-white font-bold'
                        : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-building-columns text-sm text-amber-400"></i>
                    <span className="text-[10px]">Transferencia</span>
                  </button>
                </div>
              </div>

              {/* Total final */}
              <div className="border-t border-stone-800 pt-3 space-y-1">
                <div className="flex justify-between text-xs text-stone-400">
                  <span>Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-400">
                    <span>Descuento de Cliente ({user?.discountPercent}%):</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-stone-400">
                  <span>
                    Envío ({selectedLocation}):
                  </span>
                  <span className={finalShippingCost === 0 ? 'text-emerald-400 font-bold' : 'text-stone-200'}>
                    {finalShippingCost === 0 ? 'Gratis' : formatPrice(finalShippingCost)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-stone-800 font-black">
                  <span className="text-xs text-stone-300">Total a Pagar:</span>
                  <span className="text-lg text-[#ffd129]">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !storeStatus.isOpen}
                className={`w-full font-black text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow cursor-pointer ${
                  !storeStatus.isOpen
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                    : 'bg-[#ffd129] hover:bg-yellow-400 text-[#141414] active:scale-98'
                }`}
              >
                {!storeStatus.isOpen ? (
                  <>
                    <i className="fa-solid fa-lock"></i>
                    <span>Local Cerrado (No se reciben pedidos)</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>Procesando Pedido...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lock"></i>
                    <span>Pagar {formatPrice(total)} y Enviar Pedido</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
