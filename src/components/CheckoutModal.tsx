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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<'webpay' | 'card' | 'transfer'>('webpay');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || 'Alerce Norte');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  useEffect(() => {
    if (isOpen && !orderPlaced) {
      setCurrentStep(1);
      setErrors({});
    }
  }, [isOpen, orderPlaced]);

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

  const validateStep1 = () => {
    const errs: { [key: string]: string } = {};
    if (!customerName.trim()) {
      errs.customerName = 'Por favor ingresa tu nombre y apellido.';
    }
    if (!customerPhone.trim()) {
      errs.customerPhone = 'Por favor ingresa tu WhatsApp o teléfono.';
    } else if (customerPhone.trim().length < 8) {
      errs.customerPhone = 'Ingresa un número telefónico válido.';
    }
    if (customerEmail.trim() && !customerEmail.includes('@')) {
      errs.customerEmail = 'Ingresa un correo electrónico válido.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: { [key: string]: string } = {};
    if (!customerAddress.trim()) {
      errs.customerAddress = 'Por favor ingresa tu calle, número o detalles de entrega.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
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
        className="bg-[#141414] text-white border border-stone-700 rounded-3xl w-full max-w-lg shadow-2xl p-4 sm:p-6 relative max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white transition p-2 cursor-pointer"
          aria-label="Cerrar modal"
        >
          <i className="fa-solid fa-xmark text-base"></i>
        </button>

        {orderPlaced ? (
          <div className="text-center py-6 animate-in fade-in">
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
            {/* Encabezado del modal */}
            <div className="flex items-center gap-2 mb-3 border-b border-stone-800 pb-3">
              <div className="w-8 h-8 rounded-lg bg-[#ffd129]/20 text-[#ffd129] flex items-center justify-center shrink-0">
                <i className="fa-solid fa-cart-shopping text-sm"></i>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">Finalizar Compra</h3>
                <p className="text-[10px] sm:text-[11px] text-stone-400">Proceso rápido y seguro en 3 simples pasos</p>
              </div>
            </div>

            {/* AVISO DE HORARIO DE ATENCIÓN / CIERRE */}
            {!storeStatus.isOpen && (
              <div className="mb-3 p-3 bg-red-950/40 border border-red-800/80 rounded-2xl text-left space-y-1.5 animate-pulse">
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

            {/* INDICADOR DE ETAPAS (STEPPER) */}
            <div className="mb-4 bg-stone-900/90 border border-stone-800 rounded-2xl p-2.5 sm:p-3">
              <div className="flex items-center justify-between relative">
                {/* Línea de fondo entre etapas */}
                <div className="absolute left-6 right-6 top-3.5 sm:top-4 h-0.5 bg-stone-800 -z-0">
                  <div
                    className="h-full bg-[#ffd129] transition-all duration-300"
                    style={{
                      width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%'
                    }}
                  />
                </div>

                {/* Etapa 1 */}
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep > 1) setCurrentStep(1);
                  }}
                  className={`flex flex-col items-center gap-1 relative z-10 ${currentStep >= 1 ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow ${
                      currentStep === 1
                        ? 'bg-[#ffd129] text-[#141414] ring-4 ring-[#ffd129]/20'
                        : currentStep > 1
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    {currentStep > 1 ? <i className="fa-solid fa-check text-[10px]"></i> : '1'}
                  </div>
                  <span className={`text-[9px] sm:text-[11px] font-semibold ${currentStep === 1 ? 'text-[#ffd129]' : currentStep > 1 ? 'text-stone-300' : 'text-stone-500'}`}>
                    Contacto
                  </span>
                </button>

                {/* Etapa 2 */}
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep > 2) setCurrentStep(2);
                    else if (currentStep === 1 && validateStep1()) setCurrentStep(2);
                  }}
                  className={`flex flex-col items-center gap-1 relative z-10 ${currentStep >= 2 ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow ${
                      currentStep === 2
                        ? 'bg-[#ffd129] text-[#141414] ring-4 ring-[#ffd129]/20'
                        : currentStep > 2
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    {currentStep > 2 ? <i className="fa-solid fa-check text-[10px]"></i> : '2'}
                  </div>
                  <span className={`text-[9px] sm:text-[11px] font-semibold ${currentStep === 2 ? 'text-[#ffd129]' : currentStep > 2 ? 'text-stone-300' : 'text-stone-500'}`}>
                    Despacho
                  </span>
                </button>

                {/* Etapa 3 */}
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1 && validateStep1() && validateStep2()) setCurrentStep(3);
                    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
                  }}
                  className={`flex flex-col items-center gap-1 relative z-10 ${currentStep === 3 ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow ${
                      currentStep === 3
                        ? 'bg-[#ffd129] text-[#141414] ring-4 ring-[#ffd129]/20'
                        : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    3
                  </div>
                  <span className={`text-[9px] sm:text-[11px] font-semibold ${currentStep === 3 ? 'text-[#ffd129]' : 'text-stone-500'}`}>
                    Pago
                  </span>
                </button>
              </div>
            </div>

            {/* FORMULARIO POR ETAPAS */}
            <form onSubmit={handlePay}>
              {/* ETAPA 1: DATOS DE CONTACTO */}
              {currentStep === 1 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="bg-stone-900/60 p-3 rounded-xl border border-stone-800/80 mb-3">
                    <h4 className="text-xs font-bold text-[#ffd129] flex items-center gap-2 mb-1">
                      <i className="fa-solid fa-user text-xs"></i>
                      <span>Paso 1: Tus Datos Personales</span>
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Necesitamos tu nombre y teléfono para coordinar el pedido y avisarte cuando salga el repartidor.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-stone-300 font-semibold mb-1">
                      Nombre y Apellido <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (errors.customerName) setErrors({ ...errors, customerName: '' });
                      }}
                      placeholder="Ej: Martín González"
                      className={`w-full bg-stone-800 text-white text-xs rounded-xl px-3 py-2.5 border outline-none transition focus:ring-1 focus:ring-[#ffd129] ${
                        errors.customerName ? 'border-red-500 bg-red-950/20' : 'border-stone-700 focus:border-[#ffd129]'
                      }`}
                    />
                    {errors.customerName && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <i className="fa-solid fa-circle-exclamation"></i> {errors.customerName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-stone-300 font-semibold mb-1">
                      WhatsApp / Teléfono Móvil <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (errors.customerPhone) setErrors({ ...errors, customerPhone: '' });
                      }}
                      placeholder="+56 9 1234 5678"
                      className={`w-full bg-stone-800 text-white text-xs rounded-xl px-3 py-2.5 border outline-none transition focus:ring-1 focus:ring-[#ffd129] ${
                        errors.customerPhone ? 'border-red-500 bg-red-950/20' : 'border-stone-700 focus:border-[#ffd129]'
                      }`}
                    />
                    {errors.customerPhone && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <i className="fa-solid fa-circle-exclamation"></i> {errors.customerPhone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-stone-300 font-semibold mb-1">
                      Correo Electrónico <span className="text-stone-500 font-normal">(Opcional para boleta y estado)</span>
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => {
                        setCustomerEmail(e.target.value);
                        if (errors.customerEmail) setErrors({ ...errors, customerEmail: '' });
                      }}
                      placeholder="ejemplo@correo.cl"
                      className={`w-full bg-stone-800 text-white text-xs rounded-xl px-3 py-2.5 border outline-none transition focus:ring-1 focus:ring-[#ffd129] ${
                        errors.customerEmail ? 'border-red-500 bg-red-950/20' : 'border-stone-700 focus:border-[#ffd129]'
                      }`}
                    />
                    {errors.customerEmail && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <i className="fa-solid fa-circle-exclamation"></i> {errors.customerEmail}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-black text-xs py-3 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>Siguiente: Dirección de Envío</span>
                      <i className="fa-solid fa-arrow-right text-xs"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 2: LUGAR DE ENTREGA */}
              {currentStep === 2 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="bg-stone-900/60 p-3 rounded-xl border border-stone-800/80 mb-3">
                    <h4 className="text-xs font-bold text-[#ffd129] flex items-center gap-2 mb-1">
                      <i className="fa-solid fa-location-dot text-xs"></i>
                      <span>Paso 2: Dirección y Despacho</span>
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Selecciona tu sector y la dirección exacta para calcular el tiempo y costo de entrega.
                    </p>
                  </div>

                  {/* SELECCIÓN DE ÁREA CON PRECIO FIJO CONFIGURABLE */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs text-stone-300 font-semibold">
                        Área de Cobertura <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[10px] text-[#ffd129] font-medium">
                        Tarifa fija por sector
                      </span>
                    </div>
                    <select
                      value={selectedLocation}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      className="w-full bg-stone-800 text-white text-xs rounded-xl px-3 py-2.5 border border-stone-700 outline-none focus:border-[#ffd129] cursor-pointer"
                    >
                      {deliveryLocations.map((loc) => (
                        <option key={loc.id} value={loc.name}>
                          {loc.name} — {formatPrice(loc.price)} (Aprox. {loc.estimatedMinutes} min)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* UBICACIÓN EXACTA */}
                  <div>
                    <label className="block text-xs text-stone-300 font-semibold mb-1">
                      Ubicación Exacta de Entrega <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={customerAddress}
                      onChange={(e) => {
                        setCustomerAddress(e.target.value);
                        if (errors.customerAddress) setErrors({ ...errors, customerAddress: '' });
                      }}
                      placeholder="Calle, número de casa/depto, block, condominio o referencias para el repartidor"
                      className={`w-full bg-stone-800 text-white text-xs rounded-xl px-3 py-2 border outline-none transition focus:ring-1 focus:ring-[#ffd129] resize-none ${
                        errors.customerAddress ? 'border-red-500 bg-red-950/20' : 'border-stone-700 focus:border-[#ffd129]'
                      }`}
                    />
                    {errors.customerAddress && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <i className="fa-solid fa-circle-exclamation"></i> {errors.customerAddress}
                      </p>
                    )}
                  </div>

                  {/* Detalle rápido de entrega */}
                  <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-truck-fast text-[#ffd129]"></i>
                      <span className="text-stone-300">Tiempo de entrega estimado:</span>
                    </div>
                    <span className="font-bold text-emerald-400">{estimatedTime} min aprox.</span>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="w-1/3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs py-3 rounded-xl transition border border-stone-700 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="fa-solid fa-arrow-left text-[10px]"></i>
                      <span>Atrás</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-2/3 bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-black text-xs py-3 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>Siguiente: Método de Pago</span>
                      <i className="fa-solid fa-arrow-right text-xs"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 3: MÉTODO DE PAGO Y CONFIRMACIÓN */}
              {currentStep === 3 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="bg-stone-900/60 p-3 rounded-xl border border-stone-800/80">
                    <h4 className="text-xs font-bold text-[#ffd129] flex items-center gap-2 mb-1">
                      <i className="fa-solid fa-credit-card text-xs"></i>
                      <span>Paso 3: Método de Pago y Resumen</span>
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Revisa tus productos, tus datos de entrega y selecciona cómo deseas abonar tu compra.
                    </p>
                  </div>

                  {/* Resumen de productos compacto */}
                  <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 max-h-24 overflow-y-auto space-y-1.5">
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

                  {/* Resumen de datos de entrega */}
                  <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-2.5 text-[11px] space-y-1 text-stone-300">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Entrega a:</span>
                      <span className="font-semibold text-white truncate max-w-[180px]">{customerName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">WhatsApp:</span>
                      <span className="text-emerald-400 font-semibold">{customerPhone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Sector:</span>
                      <span className="text-amber-300 font-semibold">{selectedLocation}</span>
                    </div>
                    <div className="flex justify-between items-start pt-1 border-t border-stone-800/60">
                      <span className="text-stone-400 shrink-0">Dirección:</span>
                      <span className="text-stone-200 text-right truncate ml-2">{customerAddress}</span>
                    </div>
                  </div>

                  {/* Selector de Método de pago */}
                  <div>
                    <label className="text-xs font-semibold text-stone-300 block mb-2">Selecciona cómo pagar:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('webpay')}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          paymentMethod === 'webpay'
                            ? 'border-[#ffd129] bg-stone-800 text-white font-bold ring-2 ring-[#ffd129]/30'
                            : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-white'
                        }`}
                      >
                        <i className="fa-solid fa-credit-card text-sm text-[#ffd129]"></i>
                        <span className="text-[10px] leading-tight">Webpay / Débito</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'border-[#ffd129] bg-stone-800 text-white font-bold ring-2 ring-[#ffd129]/30'
                            : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-white'
                        }`}
                      >
                        <i className="fa-brands fa-cc-visa text-sm text-sky-400"></i>
                        <span className="text-[10px] leading-tight">Crédito</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('transfer')}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          paymentMethod === 'transfer'
                            ? 'border-[#ffd129] bg-stone-800 text-white font-bold ring-2 ring-[#ffd129]/30'
                            : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-white'
                        }`}
                      >
                        <i className="fa-solid fa-building-columns text-sm text-amber-400"></i>
                        <span className="text-[10px] leading-tight">Transferencia</span>
                      </button>
                    </div>
                  </div>

                  {/* Total final */}
                  <div className="border-t border-stone-800 pt-2.5 space-y-1">
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

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="w-1/3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs py-3 rounded-xl transition border border-stone-700 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="fa-solid fa-arrow-left text-[10px]"></i>
                      <span>Atrás</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !storeStatus.isOpen}
                      className={`w-2/3 font-black text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow cursor-pointer ${
                        !storeStatus.isOpen
                          ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                          : 'bg-[#ffd129] hover:bg-yellow-400 text-[#141414] active:scale-98'
                      }`}
                    >
                      {!storeStatus.isOpen ? (
                        <>
                          <i className="fa-solid fa-lock"></i>
                          <span>Local Cerrado</span>
                        </>
                      ) : isSubmitting ? (
                        <>
                          <i className="fa-solid fa-spinner animate-spin"></i>
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-lock"></i>
                          <span>Confirmar y Pagar {formatPrice(total)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
