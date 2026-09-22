import React, { useState, useEffect } from 'react';
import { CartItem, Product, UserAccount, CategoryData, StoreSettings, HeroSlide, BackupStoreConfig } from './types';
import { CATEGORIES as INITIAL_CATEGORIES, MEGA_OFFERS as INITIAL_MEGA_OFFERS, HERO_SLIDES as INITIAL_HERO_SLIDES, formatPrice, getDiscountPercentage } from './data/products';
import { Header } from './components/Header';
import { HeroSlider } from './components/HeroSlider';
import { Newsletter } from './components/Newsletter';
import { MegaOffers } from './components/MegaOffers';
import { CategoryGrid } from './components/CategoryGrid';
import { CategorySection } from './components/CategorySection';
import { CategoryCatalogView } from './components/CategoryCatalogView';
import { BottomPromoBanner } from './components/BottomPromoBanner';
import { BottomDualBanners } from './components/BottomDualBanners';
import { FloatingActions } from './components/FloatingActions';
import { CheckoutModal } from './components/CheckoutModal';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { AdminDashboard } from './components/AdminDashboard';
import { DeliveryDashboard } from './components/DeliveryDashboard';
import { VisualQuickEditorModal, QuickEditTarget } from './components/admin/VisualQuickEditorModal';
import { useOrderNotifications } from './hooks/useOrderNotifications';

const DEFAULT_SETTINGS: StoreSettings = {
  isEmergencyMode: false,
  storeName: 'Botillería Nova Express',
  logoTextPrimary: 'BOTI',
  logoTextAccent: '.EXPRESS',
  tagline: 'Botillería online & despacho exprés de cervezas, piscos, vinos y promociones',
  footerAbout: 'Tu botillería online de confianza. Piscos, cervezas heladas, destilados premium, vinos y aperitivos con despacho exprés directo a tu puerta.',
  contactEmail: 'contacto@botilleriaexpress.cl',
  contactPhone: '+56 2 2840 5500',
  contactAddress: 'Av. Providencia 1208, Santiago, Chile',
  socialInstagram: 'https://instagram.com',
  socialTwitter: 'https://twitter.com',
  socialFacebook: 'https://facebook.com',
  socialWhatsapp: '+56912345678',
  bottomBannerImage: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=1600&auto=format&fit=crop',
  bottomBannerLink: '#mega-ofertas',
  showBottomBanner: true,
  showBottomDualBanners: true,
  bottomDualBanner1Image: 'https://images.unsplash.com/photo-1608270190578-831e51b32d2e?q=80&w=800&auto=format&fit=crop',
  bottomDualBanner1Link: '#mega-ofertas',
  bottomDualBanner2Image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop',
  bottomDualBanner2Link: '#mega-ofertas',
  deliveryZones: [
    'Santiago Centro',
    'Providencia',
    'Las Condes',
    'Ñuñoa',
    'Vitacura',
    'La Reina',
    'San Miguel',
    'Macul'
  ],
  customerDiscountPercent: 10,
  customerDiscountTiers: [
    { name: 'Cliente Frecuente', minPurchases: 3, discountPercent: 5 },
    { name: 'Cliente VIP Sediento', minPurchases: 8, discountPercent: 10 },
    { name: 'Parrillero de Oro', minPurchases: 15, discountPercent: 15 }
  ],
  agencyName: 'Muller Ads and Design'
};

export default function App() {
  // Navigation / View state: 'store', 'admin' or 'delivery'
  const [currentView, setCurrentView] = useState<'store' | 'admin' | 'delivery'>('store');
  const [selectedCatalogCategoryId, setSelectedCatalogCategoryId] = useState<string | null>(null);

  // Dynamic Data States connected to backend / defaults
  const [categories, setCategories] = useState<CategoryData[]>(INITIAL_CATEGORIES);
  const [megaOffers, setMegaOffers] = useState<Product[]>(INITIAL_MEGA_OFFERS);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(INITIAL_HERO_SLIDES);
  const [backupStore, setBackupStore] = useState<BackupStoreConfig>({
    enabled: false,
    title: "Fella's Market — Tienda Alterna de Contingencia",
    subtitle: "Pedidos rápidos para despacho y retiro en local",
    bannerNotice: "⚠️ Estamos actualizando nuestro catálogo principal. Puedes pedir directamente aquí tus productos esenciales.",
    whatsappNumber: "+56958866754",
    deliveryCost: 2000,
    selectedProductIds: []
  });

  const isEmergencyMode = Boolean(backupStore.enabled || settings.isEmergencyMode);

  useEffect(() => {
    if (isEmergencyMode && selectedCatalogCategoryId) {
      setSelectedCatalogCategoryId(null);
    }
  }, [isEmergencyMode, selectedCatalogCategoryId]);

  // Cart state with 2 initial liquor store items
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      product: {
        id: 'dest-1',
        name: 'Pisco Mistral Gran Nobel 40° 750ml',
        category: 'Destilados & Piscos',
        categoryId: 'cat-destilados',
        subcategory: 'Pisco',
        price: 24990,
        originalPrice: 29990,
        discount: '-17%',
        image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=400&auto=format&fit=crop',
        description: 'Añejado pacientemente en barricas de roble americano.',
        buttonText: 'Agregar'
      },
      quantity: 1
    },
    {
      product: {
        id: 'cer-1',
        name: 'Pack Cerveza Corona Extra 24x330ml',
        category: 'Cervezas Heladas & Artesanales',
        categoryId: 'cat-cervezas',
        subcategory: 'Cervezas',
        price: 22990,
        originalPrice: 26990,
        discount: '-15%',
        image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=400&auto=format&fit=crop',
        description: 'Cerveza rubia tipo Lager mexicana refrescante.',
        buttonText: 'Agregar'
      },
      quantity: 1
    }
  ]);

  const [location, setLocation] = useState<string>('Santiago Centro');
  const [user, setUser] = useState<UserAccount | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Visual In-Context Editor State
  const [isVisualEditMode, setIsVisualEditMode] = useState<boolean>(true);
  const [quickEditTarget, setQuickEditTarget] = useState<QuickEditTarget | null>(null);

  // Desktop Notifications & Audio Chime on store view if authorized or admin
  const isAuthorizedPC = typeof window !== 'undefined' && localStorage.getItem('fellas_order_notifications_authorized') === 'true';
  const shouldListenInStore = currentView !== 'admin' && (user?.role === 'admin' || isAuthorizedPC);

  const {
    latestOrderAlert: storeLatestOrderAlert,
    dismissAlert: dismissStoreOrderAlert
  } = useOrderNotifications(
    shouldListenInStore
      ? (newOrder) => {
          showToast(`🔔 ¡Nuevo pedido #${newOrder.code || newOrder.id} recibido!`);
        }
      : undefined,
    shouldListenInStore
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 3500);
  };

  // Fetch initial data from Express backend on startup
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, setRes, banRes, megaRes, backupRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/settings'),
          fetch('/api/banners'),
          fetch('/api/mega-offers'),
          fetch('/api/admin/backup-store')
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          const cats = catData.categories || catData;
          if (Array.isArray(cats) && cats.length > 0) {
            setCategories(cats);
          }
        }

        if (backupRes && backupRes.ok) {
          const bData = await backupRes.json();
          if (bData && typeof bData.enabled === 'boolean') {
            setBackupStore(bData);
          }
        }

        if (setRes.ok) {
          const resJson = await setRes.json();
          const setData = resJson.settings || resJson;
          if (setData && setData.logoTextPrimary) {
            setSettings(prev => ({ ...prev, ...setData }));
            if (setData.deliveryZones && setData.deliveryZones.length > 0) {
              setLocation(setData.deliveryZones[0]);
            }
          }
        }

        if (banRes.ok) {
          const banData = await banRes.json();
          const slides = banData.heroSlides || banData.banners || banData;
          if (Array.isArray(slides) && slides.length > 0) {
            setHeroSlides(slides);
          }
        }

        if (megaRes.ok) {
          const mData = await megaRes.json();
          const offers = mData.megaOffers || mData;
          if (Array.isArray(offers) && offers.length > 0) {
            setMegaOffers(offers);
          }
        }
      } catch (err) {
        console.log('Using default local store data:', err);
      }
    };

    fetchData();
  }, []);

  // Client-side Keep-Alive Heartbeat: Mantiene activo el servidor de Render cuando hay visitantes o pestaña abierta
  useEffect(() => {
    const pingHeartbeat = () => {
      fetch('/api/keepalive', { method: 'GET' }).catch(() => {});
    };

    // Pulso inicial a los 4 segundos
    const initialTimer = setTimeout(pingHeartbeat, 4000);

    // Pulso recurrente cada 4 minutos (240.000 ms)
    const interval = setInterval(pingHeartbeat, 240000);

    // Pulso inmediato cuando el usuario regresa a la pestaña
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pingHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleAddToCart = (product: Product, selectedVariety?: string) => {
    if (product.inStock === false) {
      showToast(`"${product.name}" no tiene stock disponible en este momento.`);
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.selectedVariety === selectedVariety
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.selectedVariety === selectedVariety
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, selectedVariety }];
    });
    showToast(`"${product.name}" ${selectedVariety ? `(${selectedVariety}) ` : ''}agregado al carrito.`);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Producto eliminado del carrito.');
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleLogin = (name: string, email: string, role: 'admin' | 'customer' | 'delivery' = 'customer') => {
    const isSpecialAdmin = email.toLowerCase().includes('admin') || role === 'admin';
    const isDelivery = role === 'delivery' || email.toLowerCase().includes('delivery');
    const userRole: 'admin' | 'customer' | 'delivery' = isSpecialAdmin ? 'admin' : isDelivery ? 'delivery' : 'customer';
    
    setUser({
      name,
      email,
      isLoggedIn: true,
      role: userRole,
      discountPercent: userRole === 'customer' ? settings.customerDiscountPercent : 0
    });

    if (userRole === 'admin') {
      showToast(`¡Bienvenido Administrador ${name}! Abriendo panel de control.`);
      setCurrentView('admin');
    } else if (userRole === 'delivery') {
      showToast(`¡Bienvenido Repartidor ${name}! Abriendo panel de pedidos en ruta.`);
      setCurrentView('delivery');
    } else {
      showToast(`¡Bienvenido ${name}! Tienes ${settings.customerDiscountPercent}% de descuento de cliente.`);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('store');
    showToast('Sesión cerrada con éxito.');
  };

  const handleUpdateLocation = (loc: string) => {
    setLocation(loc);
    showToast(`Ubicación de entrega: ${loc}`);
  };

  const handleNewsletterSubscribe = async (email: string) => {
    try {
      await fetch('/api/marketing/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'Banner Newsletter' })
      });
    } catch (err) {
      console.warn('Subscriber save failed:', err);
    }
    showToast(`¡Gracias! Te suscribiste con éxito (${email}). Recibirás nuestras promociones exclusivas.`);
  };

  const handleConfirmOrder = () => {
    setCartItems([]);
  };

  // Sync updated categories
  const handleUpdateCategories = (updatedCategories: CategoryData[]) => {
    setCategories(updatedCategories);
  };

  // Sync updated settings
  const handleUpdateSettings = (updatedSettings: StoreSettings) => {
    setSettings(updatedSettings);
  };

  // Sync updated hero banners
  const handleUpdateHeroSlides = (updatedSlides: HeroSlide[]) => {
    setHeroSlides(updatedSlides);
  };

  // QUICK EDIT HANDLERS (From Visual Popup Editor)
  const handleQuickSaveProduct = async (updatedProduct: Product) => {
    // Update in categories
    setCategories((prevCategories) =>
      prevCategories.map((cat) => ({
        ...cat,
        products: cat.products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
      }))
    );

    // Update in mega offers if present
    setMegaOffers((prevOffers) =>
      prevOffers.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );

    // Save to backend & sync categories
    try {
      const res = await fetch(`/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
        if (Array.isArray(data.megaOffers)) {
          setMegaOffers(data.megaOffers);
        }
      }
    } catch (err) {
      console.warn('Backend product update error:', err);
    }

    showToast(`Producto "${updatedProduct.name}" actualizado correctamente.`);
    setQuickEditTarget(null);
  };

  const handleQuickSaveCategory = async (updatedCategory: CategoryData) => {
    setCategories((prevCategories) =>
      prevCategories.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat))
    );

    try {
      await fetch(`/api/categories/${updatedCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory)
      });
    } catch (err) {
      console.warn('Backend category update error:', err);
    }

    showToast(`Categoría "${updatedCategory.name}" actualizada.`);
    setQuickEditTarget(null);
  };

  const handleQuickSaveHeroSlide = async (updatedSlide: HeroSlide) => {
    const updated = heroSlides.map((slide) =>
      slide.id === updatedSlide.id ? updatedSlide : slide
    );
    setHeroSlides(updated);

    try {
      await fetch('/api/hero-slides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Backend hero slides update error:', err);
    }

    showToast(`Banner "${updatedSlide.title || 'Principal'}" actualizado.`);
    setQuickEditTarget(null);
  };

  const handleQuickSaveSettings = async (partialSettings: Partial<StoreSettings>) => {
    const newSettings = { ...settings, ...partialSettings };
    setSettings(newSettings);

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (err) {
      console.warn('Backend settings update error:', err);
    }

    showToast('Banner / Configuración actualizada con éxito.');
    setQuickEditTarget(null);
  };

  // All searchable products
  const allProducts: Product[] = React.useMemo(() => {
    if (isEmergencyMode) {
      // In emergency mode, only products visible on the express homepage can be searched/accessed
      const expressProds: Product[] = [...megaOffers];
      categories.forEach((cat) => {
        let prods: Product[] = [];
        if (cat.featuredProductIds && cat.featuredProductIds.length > 0) {
          const featured = cat.featuredProductIds
            .map(id => cat.products.find(p => p.id === id))
            .filter((p): p is Product => !!p);
          const remaining = cat.products.filter(p => !cat.featuredProductIds?.includes(p.id));
          prods = [...featured, ...remaining].slice(0, 6);
        } else {
          prods = cat.products.slice(0, 6);
        }
        prods.forEach(p => {
          if (!expressProds.some(ep => ep.id === p.id)) {
            expressProds.push(p);
          }
        });
      });
      return expressProds;
    }

    return [
      ...megaOffers,
      ...categories.flatMap((c) => c.products)
    ];
  }, [categories, megaOffers, isEmergencyMode]);

  const searchResults = searchQuery.trim()
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="bg-stone-100 min-h-screen text-[#141414] antialiased relative selection:bg-[#ffd129] selection:text-[#141414]">
      {/* RENDERIZADO CONDICIONAL: Vista Admin vs Vista Delivery vs Vista Tienda */}
      {currentView === 'admin' ? (
        <AdminDashboard
          onExitAdmin={() => setCurrentView('store')}
          categories={categories}
          onUpdateCategories={handleUpdateCategories}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          heroSlides={heroSlides}
          onUpdateHeroSlides={handleUpdateHeroSlides}
          showToast={showToast}
          megaOffers={megaOffers}
          onUpdateMegaOffers={setMegaOffers}
          onOpenDelivery={() => setCurrentView('delivery')}
          backupStore={backupStore}
          onUpdateBackupStore={setBackupStore}
        />
      ) : currentView === 'delivery' ? (
        <DeliveryDashboard
          onExit={() => setCurrentView('store')}
          onLogout={handleLogout}
          showToast={showToast}
          settings={settings}
        />
      ) : (
        <>
          {/* Header flotante interactivo con Logo y Categorías dinámicas */}
          <Header
            cartItems={cartItems}
            location={location}
            onUpdateLocation={handleUpdateLocation}
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            settings={settings}
            categories={categories}
            onOpenAdmin={() => setCurrentView('admin')}
            onOpenDelivery={() => setCurrentView('delivery')}
            onNavigateHome={() => {
              setSelectedCatalogCategoryId(null);
              setSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectCategory={(catId) => {
              if (isEmergencyMode) {
                const el = document.getElementById(catId);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
                setSelectedCatalogCategoryId(null);
              } else {
                setSelectedCatalogCategoryId(catId);
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />

          {/* Contenido Principal con espaciado superior e inferior optimizado para celular */}
          <main className={`pb-8 sm:pb-8 px-2 sm:px-4 md:px-6 max-w-[100vw] overflow-x-hidden ${(user?.role === 'admin' || user?.role === 'delivery') ? 'pt-24 sm:pt-28 md:pt-32' : 'pt-24 sm:pt-24 md:pt-28'}`}>
            {/* Si el usuario busca algo, mostramos los resultados en tiempo real */}
            {searchQuery.trim() !== '' ? (
              <section className="max-w-7xl mx-auto my-8">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-300">
                  <div>
                    <h3 className="text-xl font-bold text-[#141414] flex items-center gap-2">
                      <i className="fa-solid fa-magnifying-glass text-yellow-600"></i> Resultados para "{searchQuery}"
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Se encontraron {searchResults.length} productos coincidentes
                    </p>
                  </div>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold text-stone-600 hover:text-[#141414] bg-stone-200 hover:bg-stone-300 px-3 py-1.5 rounded-lg transition"
                  >
                    Limpiar búsqueda
                  </button>
                </div>

                {searchResults.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
                    <i className="fa-solid fa-wine-bottle text-4xl text-stone-400 mb-3"></i>
                    <h4 className="text-base font-bold text-stone-700">No encontramos productos para "{searchQuery}"</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      Intenta buscar por piscos, cervezas, gin, whisky, vinos o hielo.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                    {searchResults.map((product) => {
                      const autoDiscount = product.discount || getDiscountPercentage(product.price, product.originalPrice);
                      const hasDiscount = product.originalPrice && product.originalPrice > product.price;

                      return (
                        <div
                          key={product.id}
                          className={`bg-white border border-stone-200 hover:border-[#ffd129] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative ${
                            user?.role === 'admin' && isVisualEditMode ? 'cursor-pointer ring-1 ring-amber-400 ring-dashed' : ''
                          }`}
                          onClick={() => {
                            if (user?.role === 'admin' && isVisualEditMode) {
                              setQuickEditTarget({ type: 'product', data: product });
                            }
                          }}
                        >
                          {user?.role === 'admin' && isVisualEditMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickEditTarget({ type: 'product', data: product });
                              }}
                              className="absolute top-1.5 right-1.5 z-20 bg-stone-900 hover:bg-stone-800 text-[#ffd129] text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded shadow flex items-center gap-1 border border-stone-700 cursor-pointer"
                            >
                              <i className="fa-solid fa-pen"></i> <span className="hidden xs:inline">Editar</span>
                            </button>
                          )}
                          <div>
                            <div className="aspect-square w-full bg-stone-100 rounded-lg sm:rounded-xl mb-2 sm:mb-3 overflow-hidden relative">
                              <img
                                src={product.image}
                                alt={product.name}
                                className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 rounded-lg sm:rounded-xl ${product.inStock === false ? 'opacity-50 grayscale-40' : ''}`}
                              />
                              {autoDiscount && product.inStock !== false && (
                                <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-red-600 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded shadow-md animate-pulse">
                                  {autoDiscount}
                                </span>
                              )}
                              {product.inStock === false && (
                                <span className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-stone-900/90 text-red-400 border border-red-500/40 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md uppercase tracking-wider flex items-center gap-0.5 sm:gap-1">
                                  <i className="fa-solid fa-ban text-[7px] sm:text-[8px]"></i> <span className="hidden xs:inline">Sin stock</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                              {product.subcategory}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-stone-900 mt-0.5 group-hover:text-amber-600 transition line-clamp-2 leading-tight">
                              {product.name}
                            </h4>
                            <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2">
                              {product.description}
                            </p>
                          </div>
                          <div className="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-stone-100 flex items-center justify-between gap-1">
                            <div className="min-w-0">
                              {hasDiscount && (
                                <span className="text-[9px] sm:text-[11px] font-bold text-red-600 line-through decoration-red-600 decoration-2 block leading-tight">
                                  {formatPrice(product.originalPrice!)}
                                </span>
                              )}
                              <span className="text-xs sm:text-sm font-black text-[#141414] block truncate">
                                {formatPrice(product.price)}
                                {product.unit && <span className="text-[8px] sm:text-[10px] font-normal text-stone-500 ml-0.5">{product.unit}</span>}
                              </span>
                            </div>
                            {product.inStock === false ? (
                              <button
                                disabled
                                aria-label={`${product.name} sin stock`}
                                className="bg-stone-200 text-stone-500 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl cursor-not-allowed flex items-center gap-1 opacity-70 shrink-0"
                              >
                                <i className="fa-solid fa-ban text-[9px] sm:text-[11px]"></i>
                                <span className="hidden xs:inline">Agotado</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAddToCart(product)}
                                className="bg-[#ffd129] text-[#141414] text-[10px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1 sm:py-2 rounded-lg sm:rounded-xl hover:bg-yellow-400 transition shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                              >
                                <i className="fa-solid fa-cart-plus text-[9px] sm:text-[11px]"></i>
                                <span>{product.buttonText || 'Comprar'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : !isEmergencyMode && selectedCatalogCategoryId ? (
              /* Vista Completa de Catálogo de Categoría con Menú lateral de filtros y búsqueda */
              <CategoryCatalogView
                category={
                  categories.find((c) => c.id === selectedCatalogCategoryId) || categories[0]
                }
                onAddToCart={handleAddToCart}
                onBack={() => {
                  setSelectedCatalogCategoryId(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                allCategories={categories}
                onSelectCategory={(catId) => {
                  setSelectedCatalogCategoryId(catId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isVisualEditMode={user?.role === 'admin' && isVisualEditMode}
                onQuickEditProduct={(product) => setQuickEditTarget({ type: 'product', product: product })}
                onQuickEditCategory={(category) => setQuickEditTarget({ type: 'category', category: category })}
              />
            ) : (
              <>
                {/* 1. Hero Banner Carousel Dinámico */}
                <HeroSlider
                  slides={heroSlides}
                  isVisualEditMode={user?.role === 'admin' && isVisualEditMode}
                  onQuickEdit={(slide) => setQuickEditTarget({ type: 'hero_slide', slide: slide, index: 0 })}
                />

                {/* 2. Banner de Suscripción Newsletter */}
                <Newsletter onSubscribe={handleNewsletterSubscribe} />

                {/* 3. Mega Oferta Destacada */}
                <MegaOffers
                  onAddToCart={handleAddToCart}
                  megaOffers={megaOffers}
                  settings={settings}
                  isVisualEditMode={user?.role === 'admin' && isVisualEditMode}
                  onQuickEditProduct={(product) => setQuickEditTarget({ type: 'product', product: product })}
                  onQuickEditSection={() => setQuickEditTarget({ type: 'mega_offers_section' })}
                />

                {/* 4. Colecciones & Áreas (Oculto estrictamente cuando la Tienda Alterna está activa) */}
                {!isEmergencyMode && (
                  <CategoryGrid isEmergencyMode={isEmergencyMode} />
                )}

                {/* 5. Secciones de Categorías (con selección de 6 productos por pasillo en Tienda Alterna) */}
                {(isEmergencyMode ? categories.filter(c => (c.products && c.products.length > 0)) : categories).map((category) => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    isEmergencyMode={isEmergencyMode}
                    onAddToCart={handleAddToCart}
                    onOpenCategoryCatalog={(catId) => {
                      if (!isEmergencyMode) {
                        setSelectedCatalogCategoryId(catId);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    isVisualEditMode={user?.role === 'admin' && isVisualEditMode}
                    onQuickEditCategory={(cat) => setQuickEditTarget({ type: 'category', category: cat })}
                    onQuickEditProduct={(prod) => setQuickEditTarget({ type: 'product', product: prod })}
                  />
                ))}

                {/* 6. Banner Promocional Final (Entre las secciones de productos y el pie de página) */}
                <BottomPromoBanner
                  settings={settings}
                  isVisualEditMode={user?.role === 'admin' && isVisualEditMode}
                  onQuickEdit={() => setQuickEditTarget({ type: 'bottom_promo_banner' })}
                  onOpenWhatsApp={() => {
                    const cleanNum = (settings.socialWhatsapp || settings.contactPhone || '+56958866754').replace(/[^0-9]/g, '');
                    const message = encodeURIComponent(
                      `¡Hola ${settings.storeName || "Fella's Market"}! Quisiera consultar por promociones o realizar un pedido exprés.`
                    );
                    window.open(`https://wa.me/${cleanNum}?text=${message}`, '_blank', 'noopener,noreferrer');
                  }}
                  onExploreProducts={() => {
                    if (categories.length > 0) {
                      if (isEmergencyMode) {
                        const el = document.getElementById(categories[0].id);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        setSelectedCatalogCategoryId(categories[0].id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }
                  }}
                />

                {/* 7. Dos Banners Promocionales Lado a Lado (Solo imagen, sin marcos ni textos, pegados al pie de página) */}
                <BottomDualBanners
                  settings={settings}
                  isVisualEditMode={user?.role === 'admin' && isVisualEditMode}
                  onQuickEdit={() => setQuickEditTarget({ type: 'bottom_dual_banners' })}
                  onExploreProducts={() => {
                    if (categories.length > 0) {
                      if (isEmergencyMode) {
                        const el = document.getElementById(categories[0].id);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        setSelectedCatalogCategoryId(categories[0].id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }
                  }}
                />
              </>
            )}
          </main>

          {/* Modal Checkout */}
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            cartItems={cartItems}
            location={location}
            onConfirmOrder={handleConfirmOrder}
            user={user}
          />

          {/* Pie de página con datos dinámicos */}
          <Footer settings={settings} categories={categories} />

          {/* Botones Flotantes Fijos: Volver arriba & Contacto WhatsApp */}
          <FloatingActions
            whatsappNumber={settings.socialWhatsapp || settings.contactPhone}
            storeName={settings.storeName}
          />

          {/* BARRA FLOTANTE DE CONTROL ADMIN PARA EDICIÓN VISUAL CLICK-TO-EDIT */}
          {user?.role === 'admin' && (
            <div className="fixed bottom-4 left-4 z-40 bg-stone-950/95 text-white border border-amber-500/40 rounded-2xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs">
              <div className="w-8 h-8 rounded-xl bg-[#ffd025] text-stone-950 flex items-center justify-center font-black text-sm shrink-0">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <div className="hidden sm:block pr-1">
                <p className="font-extrabold text-[11px] text-[#ffd025] leading-tight">Editor Visual</p>
                <p className="text-[10px] text-stone-400">Click en cualquier elemento</p>
              </div>
              <button
                onClick={() => {
                  setIsVisualEditMode(!isVisualEditMode);
                  showToast(isVisualEditMode ? 'Edición visual pausada' : 'Edición visual activada (haz clic en cualquier elemento)');
                }}
                className={`px-3 py-1.5 rounded-xl font-black text-[11px] uppercase transition cursor-pointer flex items-center gap-1.5 ${
                  isVisualEditMode
                    ? 'bg-amber-400 text-stone-950 hover:bg-yellow-400'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <i className={`fa-solid ${isVisualEditMode ? 'fa-toggle-on text-emerald-950' : 'fa-toggle-off'}`}></i>
                <span>{isVisualEditMode ? 'Activo' : 'Inactivo'}</span>
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                title="Ir al panel completo"
              >
                <i className="fa-solid fa-gauge-high text-[10px]"></i>
                <span className="hidden md:inline">Panel</span>
              </button>
            </div>
          )}

          {/* MODAL POPUP DE EDICIÓN RÁPIDA VISUAL */}
          {quickEditTarget && (
            <VisualQuickEditorModal
              target={quickEditTarget}
              onClose={() => setQuickEditTarget(null)}
              onUpdateProduct={handleQuickSaveProduct}
              onUpdateCategory={handleQuickSaveCategory}
              onUpdateHeroSlide={handleQuickSaveHeroSlide}
              onUpdateSettings={handleQuickSaveSettings}
            />
          )}
        </>
      )}

      {/* BANNER FLOTANTE DE NUEVO PEDIDO EN VISTA TIENDA */}
      {storeLatestOrderAlert && currentView !== 'admin' && (
        <div className="fixed top-5 right-5 z-50 max-w-sm sm:max-w-md w-full bg-[#18181b] border-2 border-[#ffd025] rounded-3xl shadow-2xl p-4 sm:p-5 text-white animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#ffd025] text-stone-950 flex items-center justify-center text-lg font-black shrink-0 shadow-lg animate-bounce">
                <i className="fa-solid fa-bell"></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-[#ffd025] bg-[#ffd025]/10 px-2 py-0.5 rounded-md">
                    ¡Nuevo Pedido en Fella's Market!
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    #{storeLatestOrderAlert.code || storeLatestOrderAlert.id.slice(-6)}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white mt-1 truncate">
                  {storeLatestOrderAlert.customerName}
                </h4>
                <div className="text-xs font-black text-amber-400 mt-0.5">
                  ${(storeLatestOrderAlert.total || 0).toLocaleString('es-CL')} CLP
                </div>
                <p className="text-[11px] text-stone-300 mt-1 line-clamp-2">
                  {storeLatestOrderAlert.items?.map(i => `${i.quantity}x ${i.productName || (i as any).name}`).join(', ')}
                </p>
                <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1 truncate">
                  <i className="fa-solid fa-location-dot text-amber-400"></i>
                  <span className="truncate">{storeLatestOrderAlert.address || storeLatestOrderAlert.location || 'Local'}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissStoreOrderAlert}
              className="text-stone-400 hover:text-white p-1 text-xs cursor-pointer shrink-0"
              title="Cerrar aviso"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-800">
            <button
              type="button"
              onClick={() => {
                setCurrentView('admin');
                dismissStoreOrderAlert();
              }}
              className="flex-1 bg-[#ffd025] hover:bg-yellow-400 text-stone-950 font-black text-xs py-2 px-3 rounded-xl transition text-center cursor-pointer shadow active:scale-95 uppercase tracking-wide flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-gauge-high"></i>
              <span>Abrir Comanda en Panel Admin</span>
            </button>
            <button
              type="button"
              onClick={dismissStoreOrderAlert}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs py-2 px-3 rounded-xl transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Toast Notificación Global */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
