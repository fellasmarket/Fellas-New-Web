import React, { useState, useEffect, useRef } from 'react';
import { CartItem, UserAccount, StoreSettings, CategoryData } from '../types';
import { formatPrice } from '../data/products';

interface HeaderProps {
  cartItems: CartItem[];
  location: string;
  onUpdateLocation: (loc: string) => void;
  user: UserAccount | null;
  onLogin: (name: string, email: string, role?: 'admin' | 'customer') => void;
  onLogout: () => void;
  onRemoveFromCart: (productId: string) => void;
  onUpdateCartQuantity: (productId: string, delta: number) => void;
  onOpenCheckout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  settings: StoreSettings;
  categories: CategoryData[];
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartItems,
  location,
  onUpdateLocation,
  user,
  onLogin,
  onLogout,
  onRemoveFromCart,
  onUpdateCartQuantity,
  onOpenCheckout,
  searchQuery,
  onSearchChange,
  settings,
  categories,
  onOpenAdmin
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activePopup, setActivePopup] = useState<'delivery' | 'login' | 'cart' | null>(null);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');

  const [tempLocation, setTempLocation] = useState(location);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close modals
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActivePopup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const togglePopup = (popup: 'delivery' | 'login' | 'cart') => {
    setActivePopup(prev => (prev === popup ? null : popup));
  };

  const handleSaveLocation = () => {
    onUpdateLocation(tempLocation);
    setActivePopup(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;

    try {
      // Call backend auth API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          onLogin(data.user.name, data.user.email, data.user.role);
          setActivePopup(null);
          setLoginPass('');
          if (data.user.role === 'admin') {
            onOpenAdmin();
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Backend login fallback:', err);
    }

    // Fallback if network issue
    const namePart = loginEmail.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const isAdmin = loginEmail.toLowerCase().includes('admin');
    onLogin(formattedName, loginEmail, isAdmin ? 'admin' : 'customer');
    setActivePopup(null);
    setLoginPass('');
    if (isAdmin) {
      onOpenAdmin();
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regName) return;
    onLogin(regName, regEmail, 'customer');
    setActivePopup(null);
    setRegPass('');
  };

  return (
    <header
      id="main-header"
      ref={headerRef}
      className={`fixed left-1/2 -translate-x-1/2 z-50 bg-[#141414] text-white transition-all duration-500 ease-in-out ${
        isScrolled
          ? 'top-4 w-[92%] max-w-6xl px-6 py-2.5 rounded-3xl shadow-2xl border border-stone-800'
          : 'top-0 w-full px-4 md:px-8 py-3 shadow-xl border border-transparent rounded-none'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        
        {/* ÁREA SUPERIOR: Logo, Despacho, Búsqueda, Login & Carrito */}
        <div className="flex items-center justify-between gap-3 md:gap-4">
          
          {/* Logo Marca Dinámico */}
          <div className="flex items-center gap-2 shrink-0">
            <a href="#" className="text-xl md:text-2xl font-extrabold tracking-wider text-white hover:opacity-90 transition flex items-center">
              {settings.logoImage ? (
                <img
                  src={settings.logoImage}
                  alt={settings.storeName || 'Logo de la tienda'}
                  className="h-9 sm:h-10 md:h-11 w-auto max-w-[180px] sm:max-w-[220px] object-contain"
                />
              ) : (
                <>
                  {settings.logoTextPrimary}<span className="text-[#ffd129]">{settings.logoTextAccent}</span>
                </>
              )}
            </a>
          </div>

          {/* Opciones de Despacho (con Popup Dropdown) */}
          <div className="relative hidden lg:block">
            <button
              id="delivery-btn"
              onClick={() => togglePopup('delivery')}
              className="flex items-center gap-2.5 bg-stone-800/80 hover:bg-stone-800 text-stone-200 px-3.5 py-2 rounded-xl text-xs font-medium border border-stone-700 transition"
              aria-label="Seleccionar ubicación de entrega"
            >
              <i className="fa-solid fa-location-dot text-[#ffd129] text-base"></i>
              <div className="text-left leading-tight">
                <span className="block text-[10px] text-stone-400 font-normal">Enviar a:</span>
                <span id="current-location" className="font-semibold text-white truncate max-w-[120px] inline-block">
                  {location}
                </span>
              </div>
              <i className="fa-solid fa-chevron-down text-stone-400 text-[10px] ml-1"></i>
            </button>

            {/* Modal Despacho Popup */}
            {activePopup === 'delivery' && (
              <div
                id="delivery-modal"
                className="absolute left-0 mt-2 w-72 bg-[#141414] border border-stone-700 rounded-2xl shadow-2xl p-4 z-50 text-white animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <i className="fa-solid fa-map-location-dot text-[#ffd129]"></i> Zonas de Cobertura
                  </span>
                  <button
                    id="close-delivery-btn"
                    onClick={() => setActivePopup(null)}
                    className="text-stone-400 hover:text-white transition"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <p className="text-xs text-stone-400 mb-3">Elige tu comuna para despacho exprés:</p>
                <select
                  id="location-select"
                  value={tempLocation}
                  onChange={(e) => setTempLocation(e.target.value)}
                  className="w-full bg-stone-800 text-white text-xs rounded-lg p-2.5 border border-stone-700 outline-none focus:border-[#ffd129] mb-3"
                >
                  {settings.deliveryZones.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
                <button
                  id="save-location-btn"
                  onClick={handleSaveLocation}
                  className="w-full bg-[#ffd129] text-[#141414] text-xs font-bold py-2 rounded-lg hover:bg-yellow-400 transition flex items-center justify-center gap-2 shadow"
                >
                  <i className="fa-solid fa-floppy-disk"></i> Guardar Dirección
                </button>
              </div>
            )}
          </div>

          {/* Barra de Búsqueda Interactiva */}
          <div className="flex-1 max-w-xl mx-2 min-w-0">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-stone-400">
                <i className="fa-solid fa-magnifying-glass text-xs"></i>
              </span>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar pisco, cerveza, whisky, vino, hielo..."
                className="w-full bg-stone-800/90 text-white text-xs md:text-sm rounded-xl pl-10 pr-8 py-2 border border-stone-700 focus:outline-none focus:border-[#ffd129] focus:ring-1 focus:ring-[#ffd129] transition placeholder-stone-400"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-white"
                >
                  <i className="fa-solid fa-circle-xmark text-xs"></i>
                </button>
              )}
            </div>
          </div>

          {/* Botones Acceso Usuario y Carrito */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Botón Mi Cuenta (con Modal desplegable) */}
            <div className="relative">
              <button
                id="user-account-btn"
                onClick={() => togglePopup('login')}
                className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white px-3 md:px-3.5 py-2 rounded-xl text-xs font-medium border border-stone-700 transition"
              >
                <i className={`fa-solid ${user?.isLoggedIn ? (user.role === 'admin' ? 'fa-shield-halved text-[#ffd129]' : 'fa-user-check text-green-400') : 'fa-user text-[#ffd129]'}`}></i>
                <span className="hidden sm:inline font-semibold">
                  {user?.isLoggedIn ? (user.role === 'admin' ? 'Admin Botillería' : user.name) : 'Mi Cuenta'}
                </span>
              </button>

              {/* Modal Login / Panel Usuario */}
              {activePopup === 'login' && (
                <div
                  id="login-modal"
                  className="absolute right-0 mt-2 w-84 bg-[#141414] border border-stone-700 rounded-2xl shadow-2xl p-5 z-50 text-white animate-in fade-in zoom-in-95 duration-200"
                >
                  {user?.isLoggedIn ? (
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-stone-800 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-[#ffd129] text-[#141414] font-black flex items-center justify-center text-xs shadow">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.role === 'admin' && (
                                <span className="bg-[#ffd129] text-[#141414] text-[9px] px-1.5 py-0.2 rounded font-black">ADMIN</span>
                              )}
                            </p>
                            <p className="text-[10px] text-stone-400">{user.email}</p>
                          </div>
                        </div>
                        <button
                          id="close-account-btn"
                          onClick={() => setActivePopup(null)}
                          className="text-stone-400 hover:text-white"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>

                      <div className="space-y-2 py-1">
                        {/* Botón directo para ingresar al panel de autoadministración */}
                        <button
                          onClick={() => {
                            setActivePopup(null);
                            onOpenAdmin();
                          }}
                          className="w-full flex items-center gap-2.5 text-xs text-[#141414] font-black bg-[#ffd129] hover:bg-yellow-400 p-2.5 rounded-xl transition shadow"
                        >
                          <i className="fa-solid fa-gauge-high"></i>
                          <span>Panel de Autoadministración</span>
                        </button>

                        <a
                          href="#mis-pedidos"
                          onClick={() => setActivePopup(null)}
                          className="flex items-center gap-2 text-xs text-stone-300 hover:text-[#ffd129] p-2 rounded-lg hover:bg-stone-800 transition"
                        >
                          <i className="fa-solid fa-receipt text-stone-400"></i> Historial de Compras
                        </a>
                      </div>

                      <button
                        id="logout-btn"
                        onClick={() => {
                          onLogout();
                          setActivePopup(null);
                        }}
                        className="w-full mt-4 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2 border border-stone-700"
                      >
                        <i className="fa-solid fa-arrow-right-from-bracket text-red-400"></i> Cerrar Sesión
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-stone-800 pb-3">
                        <div className="flex gap-4">
                          <button
                            id="tab-login-btn"
                            onClick={() => setAuthTab('login')}
                            className={`text-xs pb-1 flex items-center gap-1.5 transition ${
                              authTab === 'login'
                                ? 'font-bold text-[#ffd129] border-b-2 border-[#ffd129]'
                                : 'font-semibold text-stone-400 hover:text-white'
                            }`}
                          >
                            <i className="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
                          </button>
                          <button
                            id="tab-register-btn"
                            onClick={() => setAuthTab('register')}
                            className={`text-xs pb-1 flex items-center gap-1.5 transition ${
                              authTab === 'register'
                                ? 'font-bold text-[#ffd129] border-b-2 border-[#ffd129]'
                                : 'font-semibold text-stone-400 hover:text-white'
                            }`}
                          >
                            <i className="fa-solid fa-user-plus"></i> Registrarse
                          </button>
                        </div>
                        <button
                          id="close-login-modal-btn"
                          onClick={() => setActivePopup(null)}
                          className="text-stone-400 hover:text-white"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>

                      {/* Formulario Iniciar Sesión */}
                      {authTab === 'login' ? (
                        <form id="form-login" onSubmit={handleLoginSubmit} className="space-y-3">
                          {/* Nota rápida de credenciales para el usuario */}
                          <div className="p-2.5 bg-stone-800/80 rounded-xl border border-stone-700 text-[11px] text-stone-300 leading-snug">
                            <span className="font-bold text-[#ffd129]">Acceso Autoadministración:</span><br />
                            Usuario: <code className="text-white bg-stone-900 px-1 py-0.5 rounded font-mono">admin</code> o <code className="text-white bg-stone-900 px-1 py-0.5 rounded font-mono">fellas</code><br />
                            Clave: <code className="text-white bg-amber-400/20 text-[#ffd129] px-1 py-0.5 rounded font-mono font-bold">fellhonpm</code> o <code className="text-white bg-stone-900 px-1 py-0.5 rounded font-mono">admin123</code>
                          </div>

                          <div>
                            <label className="block text-[11px] text-stone-400 mb-1">Usuario / Correo Electrónico</label>
                            <div className="relative">
                              <i className="fa-solid fa-envelope absolute left-3 top-2.5 text-stone-500 text-xs"></i>
                              <input
                                id="login-email-input"
                                type="text"
                                required
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                placeholder="admin@botilleria.cl"
                                className="w-full bg-stone-800 text-white text-xs rounded-lg pl-9 pr-3 py-2 border border-stone-700 outline-none focus:border-[#ffd129]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] text-stone-400 mb-1">Contraseña</label>
                            <div className="relative">
                              <i className="fa-solid fa-lock absolute left-3 top-2.5 text-stone-500 text-xs"></i>
                              <input
                                id="login-password-input"
                                type="password"
                                required
                                value={loginPass}
                                onChange={(e) => setLoginPass(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-stone-800 text-white text-xs rounded-lg pl-9 pr-3 py-2 border border-stone-700 outline-none focus:border-[#ffd129]"
                              />
                            </div>
                          </div>
                          <button
                            id="login-submit-btn"
                            type="submit"
                            className="w-full bg-[#ffd129] text-[#141414] text-xs font-bold py-2.5 rounded-lg hover:bg-yellow-400 transition mt-2 flex items-center justify-center gap-2 shadow"
                          >
                            <i className="fa-solid fa-arrow-right-to-bracket"></i> Entrar al Sistema
                          </button>
                        </form>
                      ) : (
                        /* Formulario Registro */
                        <form id="form-register" onSubmit={handleRegisterSubmit} className="space-y-3">
                          <div>
                            <label className="block text-[11px] text-stone-400 mb-1">Nombre Completo</label>
                            <div className="relative">
                              <i className="fa-solid fa-id-card absolute left-3 top-2.5 text-stone-500 text-xs"></i>
                              <input
                                id="reg-name-input"
                                type="text"
                                required
                                value={regName}
                                onChange={(e) => setRegName(e.target.value)}
                                placeholder="Juan Pérez"
                                className="w-full bg-stone-800 text-white text-xs rounded-lg pl-9 pr-3 py-2 border border-stone-700 outline-none focus:border-[#ffd129]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] text-stone-400 mb-1">Correo Electrónico</label>
                            <div className="relative">
                              <i className="fa-solid fa-envelope absolute left-3 top-2.5 text-stone-500 text-xs"></i>
                              <input
                                id="reg-email-input"
                                type="email"
                                required
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                placeholder="juan@correo.com"
                                className="w-full bg-stone-800 text-white text-xs rounded-lg pl-9 pr-3 py-2 border border-stone-700 outline-none focus:border-[#ffd129]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] text-stone-400 mb-1">Crear Contraseña</label>
                            <div className="relative">
                              <i className="fa-solid fa-lock absolute left-3 top-2.5 text-stone-500 text-xs"></i>
                              <input
                                id="reg-password-input"
                                type="password"
                                required
                                value={regPass}
                                onChange={(e) => setRegPass(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-stone-800 text-white text-xs rounded-lg pl-9 pr-3 py-2 border border-stone-700 outline-none focus:border-[#ffd129]"
                              />
                            </div>
                          </div>
                          <button
                            id="register-submit-btn"
                            type="submit"
                            className="w-full bg-[#ffd129] text-[#141414] text-xs font-bold py-2.5 rounded-lg hover:bg-yellow-400 transition mt-2 flex items-center justify-center gap-2 shadow"
                          >
                            <i className="fa-solid fa-user-check"></i> Crear Cuenta y Obtener 5% OFF
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botón Carrito de Compras */}
            <div className="relative">
              <button
                id="cart-toggle-btn"
                onClick={() => togglePopup('cart')}
                className="relative bg-stone-800 hover:bg-stone-700 text-white p-2.5 rounded-xl border border-stone-700 transition flex items-center justify-center"
                aria-label="Abrir carrito de compras"
              >
                <i className="fa-solid fa-cart-shopping text-base text-[#ffd129]"></i>
                {totalCartCount > 0 && (
                  <span
                    id="cart-badge-count"
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#141414] animate-pulse"
                  >
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Modal Carrito Popup */}
              {activePopup === 'cart' && (
                <div
                  id="cart-modal"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#141414] border border-stone-700 rounded-2xl shadow-2xl p-4 z-50 text-white animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-cart-shopping text-[#ffd129]"></i>
                      <h4 className="text-sm font-bold">Carrito de Compras</h4>
                      <span className="text-[11px] text-stone-400">({totalCartCount} items)</span>
                    </div>
                    <button
                      id="close-cart-btn"
                      onClick={() => setActivePopup(null)}
                      className="text-stone-400 hover:text-white"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="py-8 text-center text-stone-400">
                      <i className="fa-solid fa-bottle-water text-3xl mb-2 text-stone-600 block"></i>
                      <p className="text-xs">Tu carrito está vacío.</p>
                      <p className="text-[11px] text-stone-500 mt-1">¡Agrega tus piscos o cervezas heladas!</p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                        {cartItems.map((item) => (
                          <div
                            key={item.product.id}
                            className="flex items-center justify-between gap-3 bg-stone-800/60 p-2.5 rounded-xl border border-stone-700/50"
                          >
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded-lg bg-stone-700 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-semibold text-white truncate">
                                {item.product.name}
                              </h5>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-[#ffd129] font-bold">
                                  {formatPrice(item.product.price)}
                                </span>
                                {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                                  <span className="text-[9px] text-red-500 font-bold line-through">
                                    {formatPrice(item.product.originalPrice)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={() => onUpdateCartQuantity(item.product.id, -1)}
                                  className="w-5 h-5 rounded bg-stone-700 text-stone-300 hover:bg-stone-600 flex items-center justify-center text-xs font-bold"
                                >
                                  -
                                </button>
                                <span className="text-xs font-semibold text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => onUpdateCartQuantity(item.product.id, 1)}
                                  className="w-5 h-5 rounded bg-stone-700 text-stone-300 hover:bg-stone-600 flex items-center justify-center text-xs font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => onRemoveFromCart(item.product.id)}
                              className="text-stone-500 hover:text-red-400 p-1 transition"
                              title="Eliminar producto"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-800 space-y-2">
                        <div className="flex items-center justify-between text-xs text-stone-300">
                          <span>Subtotal:</span>
                          <span className="font-extrabold text-sm text-[#ffd129]">
                            {formatPrice(subtotal)}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400">
                          {subtotal > 50000 ? '🎉 ¡Tienes Despacho Gratis!' : '🚚 Envío gratis sobre $50.000'}
                        </p>
                        <button
                          id="checkout-btn"
                          onClick={() => {
                            setActivePopup(null);
                            onOpenCheckout();
                          }}
                          className="w-full bg-[#ffd129] text-[#141414] font-extrabold text-xs py-2.5 rounded-xl hover:bg-yellow-400 transition shadow flex items-center justify-center gap-2 mt-2"
                        >
                          <i className="fa-solid fa-lock text-xs"></i>
                          <span>Proceder al Pago Seguro</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ÁREA INFERIOR: Menú Navegación Dinámico */}
        <nav id="header-menu" className="border-t border-stone-800 pt-2 flex items-center justify-between overflow-x-auto no-scrollbar">
          <ul className="flex items-center gap-5 md:gap-6 text-xs font-medium whitespace-nowrap text-stone-300">
            <li>
              <a href="#" className="text-[#ffd129] font-bold flex items-center gap-1.5 hover:opacity-90 transition">
                <i className="fa-solid fa-house"></i> Inicio
              </a>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <a href={`#${cat.id}`} className="hover:text-[#ffd129] transition flex items-center gap-1.5">
                  <i className={cat.icon}></i> {cat.name}
                </a>
              </li>
            ))}
          </ul>
          <div className="hidden md:flex items-center gap-3 text-[11px] text-stone-400 pl-4">
            {user?.role === 'admin' ? (
              <button
                onClick={onOpenAdmin}
                className="text-[#ffd129] hover:underline font-bold flex items-center gap-1"
              >
                <i className="fa-solid fa-gauge"></i> Ir a Panel Admin
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-motorcycle text-[#ffd129]"></i> Despacho en 45 min
              </div>
            )}
          </div>
        </nav>

      </div>
    </header>
  );
};
