import React, { useState } from 'react';
import { CartItem, UserAccount } from '../types';
import { formatPrice } from '../data/products';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  location: string;
  onConfirmOrder: () => void;
  user: UserAccount | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  location,
  onConfirmOrder,
  user
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'webpay' | 'card' | 'transfer'>('webpay');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = user?.discountPercent ? Math.round(subtotal * (user.discountPercent / 100)) : 0;
  const shippingCost = subtotal - discountAmount > 50000 ? 0 : 3990;
  const total = subtotal - discountAmount + shippingCost;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
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
      customerName: customerName || 'Cliente Invitado',
      customerEmail: customerEmail || 'sin-correo@botilleria.cl',
      customerPhone: customerPhone || '+56 9 1234 5678',
      location,
      address: customerAddress || location,
      items: cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.image
      })),
      subtotal,
      discountAmount,
      shippingCost,
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
      // Also register subscriber to marketing list if email provided
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="checkout-modal"
        className="bg-[#141414] text-white border border-stone-700 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white transition p-2"
        >
          <i className="fa-solid fa-xmark text-base"></i>
        </button>

        {orderPlaced ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-[#ffd129]/20 border border-[#ffd129]/40 text-[#ffd129] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
              <i className="fa-solid fa-check"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">¡Pedido Enviado a la Botillería!</h3>
            <p className="text-xs text-stone-400 mb-4">
              Tu orden <span className="font-mono text-[#ffd129] font-bold">{orderCode}</span> ha ingresado en tiempo real.
            </p>
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 text-left mb-6 text-xs text-stone-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-400">Destino de despacho:</span>
                <span className="font-semibold text-white">{customerAddress || location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Total abonado:</span>
                <span className="font-bold text-[#ffd129]">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Tiempo de entrega estimado:</span>
                <span className="text-emerald-400 font-bold">25 a 45 minutos (¡Licores helados!)</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-bold text-xs py-3 rounded-xl transition shadow"
            >
              Volver a la Tienda
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-3">
              <i className="fa-solid fa-bolt text-[#ffd129] text-lg"></i>
              <div>
                <h3 className="text-base font-bold text-white">Despacho Exprés Botillería</h3>
                <p className="text-[11px] text-stone-400">Tus licores y hielo directo a la puerta de tu previa</p>
              </div>
            </div>

            {/* Resumen de productos */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-stone-300 block mb-2">Resumen de tus botellas:</span>
              <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 max-h-32 overflow-y-auto space-y-2">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center text-xs">
                    <span className="truncate max-w-[220px] text-stone-300">
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">Nombre y Apellido</label>
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
                  <label className="block text-[11px] text-stone-400 mb-1">WhatsApp / Teléfono</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+56 9 ..."
                    className="w-full bg-stone-800 text-white text-xs rounded-lg px-2.5 py-2 border border-stone-700 outline-none focus:border-[#ffd129]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Correo Electrónico (Boleta)</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="ejemplo@correo.cl"
                  className="w-full bg-stone-800 text-white text-xs rounded-lg px-2.5 py-2 border border-stone-700 outline-none focus:border-[#ffd129]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Dirección Exacta (Calle, Número, Depto)</label>
                <input
                  type="text"
                  required
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder={`Ej: Los Leones 450, Depto 301 (${location})`}
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
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'webpay'
                        ? 'border-[#ffd129] bg-stone-800/80 text-white font-bold'
                        : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    <i className="fa-solid fa-credit-card text-sm text-[#ffd129]"></i>
                    <span className="text-[10px]">Webpay / Redcompra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
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
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
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
                  <span>Envío Exprés:</span>
                  <span>{shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-stone-800 font-black">
                  <span className="text-xs text-stone-300">Total a Pagar:</span>
                  <span className="text-lg text-[#ffd129]">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
              >
                <i className="fa-solid fa-lock"></i> {isSubmitting ? 'Procesando Pedido...' : `Pagar ${formatPrice(total)} y Enviar`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
