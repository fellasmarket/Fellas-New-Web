import React, { useState, useEffect, useRef } from 'react';
import { CartItem, UserAccount, StoreSettings, CategoryData } from '../types';
import {
  formatPrice,
  getDeliveryLocations,
  getLocationPrice,
  checkStoreOpenStatus
} from '../data/products';
import { Emoji3D, getCategoryEmoji3DKey } from './Emoji3D';

interface HeaderProps {
  cartItems: CartItem[];
  location: string;
  onUpdateLocation: (loc: string) => void;
  user: UserAccount | null;
  onLogin: (name: string, email: string, role?: 'admin' | 'customer' | 'delivery') => void;
  onLogout: () => void;
  onRemoveFromCart: (productId: string) => void;
  onUpdateCartQuantity: (productId: string, delta: number) => void;
  onOpenCheckout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  settings: StoreSettings;
  categories: CategoryData[];
  onOpenAdmin: () => void;
  onOpenDelivery?: () => void;
  onNavigateHome?: () => void;
  onSelectCategory?: (categoryId: string) => void;
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
  onOpenAdmin,
  onOpenDelivery,
  onNavigateHome,
  onSelectCategory
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activePopup, setActivePopup] = useState<'delivery' | 'login' | 'cart' | null>(null);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');

  const [tempLocation, setTempLocation] = useState(location);
  const headerRef = useRef<HTMLElement>(null);

  // Clear login error when changing tab or closing the popup
  useEffect(() => {
    setLoginError(null);
  }, [activePopup, authTab]);

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
    setLoginError(null);
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
          } else if (data.user.role === 'delivery') {
            onOpenDelivery?.();
          }
          return;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setLoginError(errData.error || 'Credenciales incorrectas. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.warn('Backend login connection error:', err);
      setLoginError('Error de conexión con el de servidor. Por favor, inténtalo más tarde.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regName) return;
    onLogin(regName, regEmail, 'customer');
    setActivePopup(null);
    setRegPass('');
  };

  const deliveryLocations = getDeliveryLocations(settings);
  const currentLocationPrice = getLocationPrice(location, settings);
  const storeStatus = checkStoreOpenStatus(settings.scheduleConfig);

  return (
    <header
      id="main-header"
      ref={headerRef}
      className="fixed top-0 inset-x-0 z-50 w-full text-white bg-[#141414] border-b border-stone-800/80 px-3 sm:px-4 md:px-8 py-2 sm:py-2.5"
    >
        <div className="max-w-7xl mx-auto flex flex-col gap-1 sm:gap-1.5">
          {/* DIVISIÓN SUPERIOR INTEGRADA: Sesión Repartidor Activa */}
          {user?.role === 'delivery' && (
            <div className="flex items-center justify-between pb-1.5 sm:pb-2 mb-1 border-b border-stone-800/80 text-[11px] sm:text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-motorcycle"></i> Sesión Repartidor Delivery
                </span>
                <span className="text-stone-400 hidden sm:inline font-normal">| {user.name}</span>
              </div>
              <div className="flex items-center gap-2.5">
                {onOpenDelivery && (
                  <button
                    onClick={onOpenDelivery}
                    className="bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-black px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-xs uppercase tracking-wide"
                  >
                    <i className="fa-solid fa-boxes-stacked"></i>
                    <span>Ir a Panel Delivery</span>
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="text-stone-400 hover:text-white px-1.5 py-1 text-[11px] transition cursor-pointer flex items-center gap-1 hover:underline"
                  title="Cerrar sesión"
                >
                  <i className="fa-solid fa-right-from-bracket text-[10px]"></i>
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}

          {/* DIVISIÓN SUPERIOR INTEGRADA: Modo Administrador Activo */}
          {user?.role === 'admin' && (
            <div className="flex items-center justify-between pb-1.5 sm:pb-2 mb-1 border-b border-stone-800/80 text-[11px] sm:text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-[#ffd129] flex items-center gap-1.5">
                  <i className="fa-solid fa-shield-halved"></i> Modo Administrador
                </span>
                <span className="text-stone-400 hidden sm:inline font-normal">| {user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                {onOpenDelivery && (
                  <button
                    onClick={onOpenDelivery}
                    className="bg-stone-800 hover:bg-stone-700 text-cyan-400 border border-stone-700 font-bold px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <i className="fa-solid fa-motorcycle"></i>
                    <span>Delivery</span>
                  </button>
                )}
                <button
                  onClick={onOpenAdmin}
                  className="bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-black px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                >
                  <i className="fa-solid fa-gauge"></i>
                  <span>Panel Admin</span>
                </button>
              </div>
            </div>
          )}
        
        {/* ÁREA SUPERIOR: Logo, Despacho, Búsqueda, Login & Carrito */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          
          {/* Logo Marca Dinámico */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href="#"
              onClick={(e) => {
                if (onNavigateHome) {
                  e.preventDefault();
                  onNavigateHome();
                }
              }}
              className="text-base sm:text-lg md:text-xl font-extrabold tracking-wider text-white hover:opacity-90 transition flex items-center"
            >
              {settings.logoImage ? (
                <img
                  src={settings.logoImage}
                  alt={settings.storeName || 'Logo de la tienda'}
                  className="h-7 sm:h-8 md:h-9 w-auto max-w-[120px] sm:max-w-[160px] md:max-w-[200px] object-contain"
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
              className="flex items-center gap-2.5 bg-stone-800/80 hover:bg-stone-800 text-stone-200 px-3.5 py-2 rounded-xl text-xs font-medium border border-stone-700 transition cursor-pointer"
              aria-label="Seleccionar ubicación de entrega"
            >
              <i className="fa-solid fa-location-dot text-[#ffd129] text-base"></i>
              <div className="text-left leading-tight">
                <span className="block text-[10px] text-stone-400 font-normal">Enviar a:</span>
                <span id="current-location" className="font-bold text-white truncate max-w-[140px] inline-block">
                  {location} <span className="text-[#ffd129]">({formatPrice(currentLocationPrice)})</span>
                </span>
              </div>
              <i className="fa-solid fa-chevron-down text-stone-400 text-[10px] ml-1"></i>
            </button>

            {/* Modal Despacho Popup */}
            {activePopup === 'delivery' && (
              <div
                id="delivery-modal"
                className="absolute left-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-[#141414] border border-stone-700 rounded-2xl shadow-2xl p-4 z-50 text-white animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <i className="fa-solid fa-map-location-dot text-[#ffd129]"></i> Zonas y Tarifas Fijas
                  </span>
                  <button
                    id="close-delivery-btn"
                    onClick={() => setActivePopup(null)}
                    className="text-stone-400 hover:text-white transition cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <p className="text-xs text-stone-400 mb-3">Elige tu sector para calcular el costo de despacho fijo:</p>
                <select
                  id="location-select"
                  value={tempLocation}
                  onChange={(e) => setTempLocation(e.target.value)}
                  className="w-full bg-stone-800 text-white text-xs rounded-lg p-2.5 border border-stone-700 outline-none focus:border-[#ffd129] mb-3"
                >
                  {deliveryLocations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} — {formatPrice(loc.price)} (~{loc.estimatedMinutes} min)
                    </option>
                  ))}
                </select>
                <button
                  id="save-location-btn"
                  onClick={handleSaveLocation}
                  className="w-full bg-[#ffd129] text-[#141414] text-xs font-bold py-2 rounded-lg hover:bg-yellow-400 transition flex items-center justify-center gap-2 shadow cursor-pointer"
                >
                  <i className="fa-solid fa-floppy-disk"></i> Guardar Sector
                </button>
              </div>
            )}
          </div>

          {/* Indicador de Horario Local Abierto / Cerrado */}
          <div className="hidden xl:flex items-center">
            {storeStatus.isOpen ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Abierto
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Cerrado hoy
              </span>
            )}
          </div>

          {/* Barra de Búsqueda Interactiva */}
          <div className="flex-1 max-w-xl mx-1 sm:mx-2 min-w-0">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 sm:pl-3 pointer-events-none">
                <i className="fa-solid fa-magnifying-glass text-stone-400 text-xs sm:text-sm"></i>
              </span>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar pisco, cerveza, whisky, vino, hielo..."
                className="w-full bg-stone-800/90 text-white text-[11px] sm:text-xs md:text-sm rounded-xl pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 border border-stone-700 focus:outline-none focus:border-[#ffd129] focus:ring-1 focus:ring-[#ffd129] transition placeholder-stone-400 truncate"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-stone-400 hover:text-white cursor-pointer"
                >
                  <i className="fa-solid fa-circle-xmark text-xs"></i>
                </button>
              )}
            </div>
          </div>

          {/* Botones Acceso Usuario y Carrito */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Botón Mi Cuenta (con Modal desplegable) */}
            <div className="relative">
              <button
                id="user-account-btn"
                onClick={() => togglePopup('login')}
                className="h-9 w-9 sm:h-9 sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 bg-stone-800 hover:bg-stone-700 text-white p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium border border-stone-700 transition cursor-pointer shrink-0"
                aria-label="Cuenta de usuario"
              >
                <i
                  className={`fa-solid ${
                    user?.isLoggedIn
                      ? user.role === 'admin'
                        ? 'fa-shield-halved text-[#ffd129]'
                        : 'fa-user-check text-[#ffd129]'
                      : 'fa-user'
                  } text-xs sm:text-sm`}
                ></i>
                <span className="hidden sm:inline font-semibold">
                  {user?.isLoggedIn ? (user.role === 'admin' ? 'Admin Botillería' : user.name) : 'Mi Cuenta'}
                </span>
              </button>

              {/* Modal Login / Panel Usuario */}
              {activePopup === 'login' && (
                <div
                  id="login-modal"
                  className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-84 max-w-[340px] bg-[#141414] border border-stone-700 rounded-2xl shadow-2xl p-4 sm:p-5 z-50 text-white animate-in fade-in zoom-in-95 duration-200"
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
                              {user.role === 'delivery' && (
                                <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.2 rounded font-black">REPARTIDOR</span>
                              )}
                            </p>
                            <p className="text-[10px] text-stone-400">{user.email}</p>
                          </div>
                        </div>
                        <button
                          id="close-account-btn"
                          onClick={() => setActivePopup(null)}
                          className="text-stone-400 hover:text-white cursor-pointer text-xs"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>

                      <div className="space-y-2 py-1">
                        {/* Botón panel administrador */}
                        {user.role === 'admin' && (
                          <button
                            onClick={() => {
                              setActivePopup(null);
                              onOpenAdmin();
                            }}
                            className="w-full flex items-center gap-2.5 text-xs text-[#141414] font-black bg-[#ffd129] hover:bg-yellow-400 p-2.5 rounded-xl transition shadow cursor-pointer"
                          >
                            <i className="fa-solid fa-chart-line text-sm"></i>
                            <span>Panel de Autoadministración</span>
                          </button>
                        )}

                        {/* Botón panel delivery / pedidos */}
                        {(user.role === 'delivery' || user.role === 'admin') && (
                          <button
                            onClick={() => {
                              setActivePopup(null);
                              onOpenDelivery?.();
                            }}
                            className="w-full flex items-center gap-2.5 text-xs text-white font-black bg-blue-600 hover:bg-blue-500 p-2.5 rounded-xl transition shadow cursor-pointer"
                          >
                            <i className="fa-solid fa-motorcycle text-sm"></i>
                            <span>Panel de Delivery / Pedidos</span>
                          </button>
                        )}

                        <a
                          href="#mis-pedidos"
                          onClick={() => setActivePopup(null)}
                          className="flex items-center gap-2 text-xs text-stone-300 hover:text-[#ffd129] p-2 rounded-lg hover:bg-stone-800 transition"
                        >
                          <i className="fa-solid fa-box-open text-xs"></i>
                          <span>Historial de Compras</span>
                        </a>
                      </div>

                      <button
                        id="logout-btn"
                        onClick={() => {
                          onLogout();
                          setActivePopup(null);
                        }}
                        className="w-full mt-4 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2 border border-stone-700 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-stone-800 pb-3">
                        <div className="flex gap-4">
                          <button
                            id="tab-login-btn"
                            onClick={() => setAuthTab('login')}
                            className={`text-xs pb-1 flex items-center gap-1.5 transition cursor-pointer ${
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
                            className={`text-xs pb-1 flex items-center gap-1.5 transition cursor-pointer ${
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
                          className="text-stone-400 hover:text-white cursor-pointer"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>

                      {/* Formulario Iniciar Sesión (Sin credenciales expuestas) */}
                      {authTab === 'login' ? (
                        <form id="form-login" onSubmit={handleLoginSubmit} className="space-y-3">
                          {loginError && (
                            <div className="bg-red-950/40 border border-red-500/50 text-red-200 text-[11px] p-2 rounded-lg text-center font-medium animate-shake">
                              <i className="fa-solid fa-circle-exclamation mr-1.5 text-red-400"></i>
                              {loginError}
                            </div>
                          )}
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
                                placeholder="tu@correo.cl o usuario"
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
                            className="w-full bg-[#ffd129] text-[#141414] text-xs font-bold py-2.5 rounded-lg hover:bg-yellow-400 transition mt-2 flex items-center justify-center gap-2 shadow cursor-pointer"
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
                className="relative h-9 w-9 sm:h-9 sm:w-auto bg-stone-800 hover:bg-stone-700 text-white p-2 sm:px-3 sm:py-2 rounded-xl border border-stone-700 transition flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Abrir carrito de compras"
              >
                <i className="fa-solid fa-cart-shopping text-base sm:text-lg"></i>
                {totalCartCount > 0 && (
                  <span
                    id="cart-badge-count"
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-[#141414] animate-pulse"
                  >
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Modal Carrito Popup */}
              {activePopup === 'cart' && (
                <div
                  id="cart-modal"
                  className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-[380px] bg-[#141414] border border-stone-700 rounded-2xl shadow-2xl p-3.5 sm:p-4 z-50 text-white animate-in fade-in zoom-in-95 duration-200"
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
                      className="text-stone-400 hover:text-white cursor-pointer"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="py-8 text-center text-stone-400">
                      <i className="fa-solid fa-bottle-water text-4xl mb-2 block text-stone-600"></i>
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
                              className="text-stone-400 hover:text-red-400 p-1 transition cursor-pointer"
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
                          className="w-full bg-[#ffd129] text-[#141414] font-extrabold text-xs py-2.5 rounded-xl hover:bg-yellow-400 transition shadow flex items-center justify-center gap-2 mt-2 cursor-pointer"
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

        {/* ÁREA INFERIOR: Menú Navegación Dinámico con Efecto Infinito Suave */}
        <nav
          id="header-menu"
          aria-label="Menú de categorías"
          className="border-t border-stone-800/80 pt-1 pb-0.5 relative flex items-center justify-between overflow-hidden"
        >
          {/* Carrusel / Marquesina Infinita con Máscara de Desvanecimiento Invisible */}
          <div className="flex-1 overflow-hidden marquee-mask relative py-0.5 min-w-0">
            <div className="animate-marquee-infinite flex items-center text-[11px] sm:text-xs font-medium whitespace-nowrap text-stone-300">
              
              {/* Primer Bloque de Items */}
              <div className="flex items-center gap-5 sm:gap-7 pr-5 sm:pr-7 shrink-0">
                <a
                  href="#"
                  onClick={(e) => {
                    if (onNavigateHome) {
                      e.preventDefault();
                      onNavigateHome();
                    }
                  }}
                  className="text-[#ffd129] font-black flex items-center gap-1.5 hover:text-white transition"
                >
                  <Emoji3D name="home" className="w-3.5 h-3.5 sm:w-4 sm:h-4" alt="Inicio" />
                  <span>Inicio</span>
                </a>
                {categories.map((cat) => (
                  <a
                    key={`loop1-${cat.id}`}
                    href={`#${cat.id}`}
                    onClick={(e) => {
                      if (onSelectCategory) {
                        e.preventDefault();
                        onSelectCategory(cat.id);
                      }
                    }}
                    className="hover:text-[#ffd129] text-stone-200 transition flex items-center gap-1.5 shrink-0"
                  >
                    <Emoji3D name={getCategoryEmoji3DKey(cat.id, cat.name)} className="w-3.5 h-3.5 sm:w-4 sm:h-4" alt={cat.name} />
                    <span>{cat.name}</span>
                  </a>
                ))}
                <span className="text-stone-600 text-[10px]">✦</span>
                <a
                  href="#mega-ofertas"
                  className="text-amber-400 font-bold flex items-center gap-1.5 hover:text-amber-300 transition shrink-0"
                >
                  <Emoji3D name="fire" className="w-3.5 h-3.5 sm:w-4 sm:h-4" alt="Mega Ofertas" />
                  <span>Mega Ofertas</span>
                </a>
                <span className="text-stone-600 text-[10px]">✦</span>
              </div>

              {/* Segundo Bloque de Items (Duplicado idéntico para continuidad infinita sin saltos) */}
              <div className="flex items-center gap-5 sm:gap-7 pr-5 sm:pr-7 shrink-0" aria-hidden="true">
                <a
                  href="#"
                  onClick={(e) => {
                    if (onNavigateHome) {
                      e.preventDefault();
                      onNavigateHome();
                    }
                  }}
                  className="text-[#ffd129] font-black flex items-center gap-1.5 hover:text-white transition"
                >
                  <Emoji3D name="home" className="w-3.5 h-3.5 sm:w-4 sm:h-4" alt="Inicio" />
                  <span>Inicio</span>
                </a>
                {categories.map((cat) => (
                  <a
                    key={`loop2-${cat.id}`}
                    href={`#${cat.id}`}
                    onClick={(e) => {
                      if (onSelectCategory) {
                        e.preventDefault();
                        onSelectCategory(cat.id);
                      }
                    }}
                    className="hover:text-[#ffd129] text-stone-200 transition flex items-center gap-1.5 shrink-0"
                  >
                    <Emoji3D name={getCategoryEmoji3DKey(cat.id, cat.name)} className="w-3.5 h-3.5 sm:w-4 sm:h-4" alt={cat.name} />
                    <span>{cat.name}</span>
                  </a>
                ))}
                <span className="text-stone-600 text-[10px]">✦</span>
                <a
                  href="#mega-ofertas"
                  className="text-amber-400 font-bold flex items-center gap-1.5 hover:text-amber-300 transition shrink-0"
                >
                  <Emoji3D name="fire" className="w-3.5 h-3.5 sm:w-4 sm:h-4" alt="Mega Ofertas" />
                  <span>Mega Ofertas</span>
                </a>
                <span className="text-stone-600 text-[10px]">✦</span>
              </div>

            </div>
          </div>

          {/* Acceso Rápido Derecho */}
          <div className="hidden md:flex items-center gap-3 text-[11px] text-stone-400 pl-4 shrink-0 border-l border-stone-800/80">
            {user?.role === 'admin' ? (
              <button
                onClick={onOpenAdmin}
                className="text-[#ffd129] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Emoji3D name="gear" className="w-3.5 h-3.5" alt="Admin" />
                <span>Ir a Admin</span>
              </button>
            ) : user?.role === 'delivery' ? (
              <button
                onClick={onOpenDelivery}
                className="text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Emoji3D name="scooter" className="w-3.5 h-3.5" alt="Delivery" />
                <span>Delivery</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-stone-300 font-medium">
                <Emoji3D name="scooter" className="w-3.5 h-3.5" alt="Delivery" />
                <span>Despacho 45 min</span>
              </div>
            )}
          </div>
        </nav>

      </div>
    </header>
  );
};
