import React, { useState, useEffect, useRef } from 'react';
import { 
  CategoryData, 
  Product, 
  Order, 
  StoreSettings, 
  EmailMarketingSubscriber, 
  HeroSlide,
  BackupStoreConfig,
  SubscriptionPopupConfig,
  FeedbackItem,
  CustomerDiscountCode,
  DeliveryLocation,
  DaySchedule,
  StoreScheduleConfig
} from '../types';
import { 
  formatPrice, 
  getDiscountPercentage,
  getDeliveryLocations,
  DEFAULT_STORE_SCHEDULE,
  checkStoreOpenStatus
} from '../data/products';
import { ExcelImportModal } from './ExcelImportModal';
import { HeroBannerEditor } from './admin/HeroBannerEditor';
import { MegaOffersEditor } from './admin/MegaOffersEditor';
import { FooterEditor } from './admin/FooterEditor';
import { CategoryBannerModal } from './admin/CategoryBannerModal';
import { CategoryFeaturedProductsModal } from './admin/CategoryFeaturedProductsModal';
import { KeepAliveEditor } from './admin/KeepAliveEditor';
import { ProductImageUploader } from './admin/ProductImageUploader';

interface AdminDashboardProps {
  onExitAdmin: () => void;
  categories: CategoryData[];
  onUpdateCategories: (categories: CategoryData[]) => void;
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  heroSlides: HeroSlide[];
  onUpdateHeroSlides: (slides: HeroSlide[]) => void;
  showToast: (msg: string) => void;
  megaOffers?: Product[];
  onUpdateMegaOffers?: (offers: Product[]) => void;
  onOpenDelivery?: () => void;
  backupStore?: BackupStoreConfig;
  onUpdateBackupStore?: (config: BackupStoreConfig) => void;
}

// Exact tabs from fellasmarket.cl plus Excel IA and Custom Page Editors
type AdminTab = 
  | 'products' 
  | 'excel_ia'
  | 'classifications'
  | 'hero_banner'
  | 'mega_offers'
  | 'footer_editor'
  | 'orders' 
  | 'stats' 
  | 'alt_store' 
  | 'settings' 
  | 'popup' 
  | 'social' 
  | 'customers' 
  | 'feedback' 
  | 'compressor' 
  | 'backup'
  | 'keep_alive';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onExitAdmin,
  categories,
  onUpdateCategories,
  settings,
  onUpdateSettings,
  heroSlides,
  onUpdateHeroSlides,
  showToast,
  megaOffers = [],
  onUpdateMegaOffers,
  onOpenDelivery,
  backupStore: propBackupStore,
  onUpdateBackupStore
}) => {
  // Current active tab
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Shared Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscribers, setSubscribers] = useState<EmailMarketingSubscriber[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'nuevo' | 'en_preparacion' | 'en_camino' | 'entregado' | 'cancelado'>('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  // TAB 1: PRODUCTOS
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    categoryId: categories[0]?.id || '',
    subcategory: '',
    price: 9990,
    originalPrice: 0,
    image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=400&auto=format&fit=crop',
    description: '',
    discount: '',
    stock: 24,
    inStock: true,
    brand: '',
    varieties: '',
    publishedSocial: true
  });

  // Clear All Previous Products Modal State
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Photoshoot IA Modal State (Fellas Market signature tool)
  const [isPhotoshootModalOpen, setIsPhotoshootModalOpen] = useState(false);
  const [photoshootProduct, setPhotoshootProduct] = useState<Product | null>(null);
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);
  const [generatedPhotoUrl, setGeneratedPhotoUrl] = useState<string | null>(null);

  // TAB 2: CLASIFICACIONES & PASILLOS
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catTitle, setCatTitle] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catBadge, setCatBadge] = useState('');
  const [catIcon, setCatIcon] = useState('fa-solid fa-wine-bottle');
  const [catImage, setCatImage] = useState('');
  const [selectedBannerCategory, setSelectedBannerCategory] = useState<CategoryData | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  // Featured Products per Category Modal (6 products per section)
  const [selectedFeaturedCategory, setSelectedFeaturedCategory] = useState<CategoryData | null>(null);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);

  const handleSaveCategoryFeaturedProducts = async (categoryId: string, featuredProductIds: string[]) => {
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredProductIds })
      });

      const updatedCategories = categories.map((c) =>
        c.id === categoryId ? { ...c, featuredProductIds } : c
      );
      onUpdateCategories(updatedCategories);

      if (res.ok) {
        const data = await res.json();
        if (data.categories) {
          onUpdateCategories(data.categories);
        }
      }
      showToast('Selección de 6 productos guardada con éxito');
    } catch (err) {
      console.error('Error saving featured products:', err);
      showToast('Error al guardar productos de portada');
    }
  };

  // TAB 4: ESTADÍSTICAS
  const [visitStats, setVisitStats] = useState<any>({
    totalVisits: 1482,
    todayVisits: 96,
    activeUsers: 8,
    conversionRate: 14.8,
    topDevices: [{ device: 'Móvil (Android / iOS)', percentage: 78 }, { device: 'Computador', percentage: 22 }],
    sourceOrigins: [{ source: 'WhatsApp / Redes', percentage: 56 }, { source: 'Búsqueda Google Alerce', percentage: 32 }]
  });
  const [salesStats, setSalesStats] = useState<any>({
    totalOrders: 0,
    totalRevenue: 0,
    averageTicket: 0,
    hourlyDistribution: [],
    dayOfWeekDistribution: []
  });

  // TAB 5: TIENDA ALTERNA (MODO CONTINGENCIA)
  const [backupStore, setBackupStore] = useState<BackupStoreConfig>(() => {
    if (propBackupStore) return propBackupStore;
    return {
      enabled: false,
      title: "Fella's Market — Tienda Alterna de Contingencia",
      subtitle: "Pedidos rápidos para despacho y retiro en local",
      bannerNotice: "⚠️ Estamos actualizando nuestro catálogo principal. Puedes pedir directamente aquí tus productos esenciales.",
      whatsappNumber: "+56958866754",
      deliveryCost: 2000,
      selectedProductIds: []
    };
  });

  useEffect(() => {
    if (propBackupStore) {
      setBackupStore(propBackupStore);
    }
  }, [propBackupStore]);

  // TAB 6: AJUSTES GENERALES & PERSONALIZACIÓN
  const [pageTitle, setPageTitle] = useState("Fella's Market — Botillería en Alerce");
  const [faviconUrl, setFaviconUrl] = useState("https://fellasmarket.cl/favicon.ico");
  const [formSettings, setFormSettings] = useState<StoreSettings>(() => {
    const defaultLocs = getDeliveryLocations(settings);
    const defaultSched = settings.scheduleConfig || DEFAULT_STORE_SCHEDULE;
    return {
      ...settings,
      deliveryLocations: settings.deliveryLocations && settings.deliveryLocations.length > 0
        ? settings.deliveryLocations
        : defaultLocs,
      scheduleConfig: defaultSched
    };
  });
  const [newLocName, setNewLocName] = useState('');
  const [newLocPrice, setNewLocPrice] = useState<number>(2000);
  const [newLocMinutes, setNewLocMinutes] = useState<number>(45);

  // TAB 7: POPUP SUSCRIPCIÓN
  const [subscriptionPopup, setSubscriptionPopup] = useState<SubscriptionPopupConfig>({
    enabled: true,
    title: "¡ÚNETE AL CLUB FELLAS!",
    subtitle: "Suscríbete y recibe ofertas relámpago, cupones exclusivos de fin de semana y novedades antes que nadie.",
    discountBadge: "10% OFF EN TU PRIMERA COMPRA",
    buttonText: "Quiero mi Descuento",
    image: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=800&auto=format&fit=crop"
  });

  // TAB 8: COMMUNITY & REDES SOCIALES
  const [socialSearch, setSocialSearch] = useState('');
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);

  // TAB 9: CLIENTES & CUPONES
  const [discounts, setDiscounts] = useState<CustomerDiscountCode[]>([]);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    amount: 10,
    minOrder: 15000,
    usesLeft: 100,
    expiresAt: '2026-12-31'
  });

  // TAB 10: COMENTARIOS Y RECLAMOS (FEEDBACK)
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<'ALL' | 'pendiente' | 'resuelto'>('ALL');

  // TAB 11: COMPRESOR DE FOTOS
  const [compressorFile, setCompressorFile] = useState<File | null>(null);
  const [compressedImagePreview, setCompressedImagePreview] = useState<string | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number>(0);
  const [compressedFileSize, setCompressedFileSize] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isUploadingToR2, setIsUploadingToR2] = useState<boolean>(false);
  const [uploadedR2Url, setUploadedR2Url] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TAB 12: RESPALDO & NUBE
  const [systemStatus, setSystemStatus] = useState<any>({
    status: 'online',
    database: 'Firestore / In-Memory Active',
    lastPing: new Date().toLocaleTimeString('es-CL'),
    apiLatencyMs: 18
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // GEMINI AI & CLOUDFLARE R2 STATE
  const [geminiStatus, setGeminiStatus] = useState<{
    configured: boolean;
    valid: boolean;
    model: string;
    source: string;
    message: string;
    keySnippet: string;
  }>({
    configured: false,
    valid: false,
    model: 'gemini-3.8-flash',
    source: 'none',
    message: 'Consultando estado de conexión con Gemini...',
    keySnippet: ''
  });
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isSavingGeminiKey, setIsSavingGeminiKey] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestFeedback, setGeminiTestFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isReclassifyingCatalog, setIsReclassifyingCatalog] = useState(false);

  // CLOUDFLARE R2 DATABASE AUTO-PERSISTENCE STATE
  const [r2DbStatus, setR2DbStatus] = useState<{
    configured: boolean;
    bucketName?: string;
    accountConfigured: boolean;
    lastSyncTime?: string | null;
    statusMessage?: string;
    totalProductsInCatalog?: number;
    totalCategories?: number;
  }>({
    configured: false,
    accountConfigured: false,
    statusMessage: 'Consultando estado de sincronización Cloudflare R2...'
  });
  const [isSyncingR2, setIsSyncingR2] = useState(false);
  const [isRestoringR2, setIsRestoringR2] = useState(false);

  // Load initial backend data
  useEffect(() => {
    loadAllData();
    const timer = setInterval(() => {
      loadOrders();
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const loadAllData = async () => {
    loadOrders();
    loadStats();
    loadFeedback();
    loadDiscounts();
    loadBackupStore();
    loadSubscribers();
    loadSystemStatus();
    loadGeminiStatus();
    loadR2DbStatus();
  };

  const loadGeminiStatus = async () => {
    try {
      const res = await fetch('/api/admin/gemini-status');
      if (res.ok) {
        const data = await res.json();
        setGeminiStatus(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadR2DbStatus = async () => {
    try {
      const res = await fetch('/api/admin/r2-database-status');
      if (res.ok) {
        const data = await res.json();
        setR2DbStatus(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGeminiKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!geminiApiKeyInput.trim()) {
      showToast('Por favor escribe tu API Key de Gemini');
      return;
    }
    setIsSavingGeminiKey(true);
    setGeminiTestFeedback(null);
    try {
      const res = await fetch('/api/admin/save-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKeyInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormSettings(prev => ({ ...prev, geminiApiKey: geminiApiKeyInput.trim() }));
        showToast('¡Clave de Gemini guardada exitosamente!');
        await loadGeminiStatus();
      } else {
        showToast(data.error || 'Error al guardar la clave de Gemini');
      }
    } catch (err: any) {
      showToast('Error de conexión al guardar la clave');
    } finally {
      setIsSavingGeminiKey(false);
    }
  };

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiTestFeedback(null);
    try {
      const res = await fetch('/api/admin/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKeyInput.trim() || undefined })
      });
      const data = await res.json();
      setGeminiTestFeedback({
        success: !!data.valid,
        message: data.message || (data.valid ? 'Conexión exitosa' : 'Error en la conexión')
      });
      if (data.valid) {
        showToast('¡Conexión con Gemini verificada correctamente!');
      } else {
        showToast('Gemini rechazó la clave: ' + (data.message || 'Error'));
      }
      await loadGeminiStatus();
    } catch (err: any) {
      setGeminiTestFeedback({
        success: false,
        message: 'Fallo al contactar el servidor: ' + err.message
      });
      showToast('Fallo al probar conexión');
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleReorganizeCatalogWithAi = async () => {
    if (!window.confirm('¿Deseas que la IA de Gemini analice los nombres de TODOS tus productos actuales y los reorganice en sus pasillos, categorías y subcategorías correctas?')) {
      return;
    }
    setIsReclassifyingCatalog(true);
    try {
      const res = await fetch('/api/admin/reclassify-catalog', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.categories)) {
          onUpdateCategories(data.categories);
        }
        if (Array.isArray(data.megaOffers)) {
          onUpdateMegaOffers(data.megaOffers);
        }
        showToast(data.message || '¡Catálogo reorganizado exitosamente por la IA!');
        await loadR2DbStatus();
      } else {
        showToast(data.error || 'Error al reorganizar el catálogo');
      }
    } catch (err: any) {
      showToast('Error de conexión al reorganizar catálogo');
    } finally {
      setIsReclassifyingCatalog(false);
    }
  };

  const handleSyncR2Now = async () => {
    setIsSyncingR2(true);
    try {
      const res = await fetch('/api/admin/r2-sync-now', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || '¡Base de datos asegurada en Cloudflare R2!');
        await loadR2DbStatus();
      } else {
        showToast(data.error || 'Error al respaldar en R2');
      }
    } catch (err: any) {
      showToast('Error de conexión al sincronizar con R2');
    } finally {
      setIsSyncingR2(false);
    }
  };

  const handleRestoreR2Now = async () => {
    if (!window.confirm('¿Deseas restaurar la base de datos completa (productos, categorías, fotos, pedidos y ajustes) desde la última copia guardada en Cloudflare R2?')) {
      return;
    }
    setIsRestoringR2(true);
    try {
      const res = await fetch('/api/admin/r2-restore-now', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.categories)) onUpdateCategories(data.categories);
        if (Array.isArray(data.megaOffers)) onUpdateMegaOffers(data.megaOffers);
        if (Array.isArray(data.heroSlides)) onUpdateHeroSlides(data.heroSlides);
        if (data.settings) onUpdateSettings(data.settings);
        showToast(data.message || '¡Base de datos restaurada exitosamente desde Cloudflare R2!');
        await loadR2DbStatus();
      } else {
        showToast(data.error || 'No se pudo restaurar desde R2');
      }
    } catch (err: any) {
      showToast('Error de conexión al restaurar desde R2');
    } finally {
      setIsRestoringR2(false);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadStats = async () => {
    try {
      const [vRes, sRes] = await Promise.all([
        fetch('/api/admin/visits/stats'),
        fetch('/api/admin/sales/stats')
      ]);
      if (vRes.ok) setVisitStats(await vRes.json());
      if (sRes.ok) setSalesStats(await sRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadFeedback = async () => {
    try {
      const res = await fetch('/api/admin/feedback/responses');
      if (res.ok) setFeedbackList(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadDiscounts = async () => {
    try {
      const res = await fetch('/api/admin/discounts');
      if (res.ok) setDiscounts(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadBackupStore = async () => {
    try {
      const res = await fetch('/api/admin/backup-store');
      if (res.ok) setBackupStore(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadSubscribers = async () => {
    try {
      const res = await fetch('/api/marketing/subscribers');
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const res = await fetch('/api/admin/system/status');
      if (res.ok) setSystemStatus(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Products flat list
  const allProducts = categories.flatMap(c => c.products);

  // PRODUCT CRUD
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      categoryId: categories[0]?.id || '',
      subcategory: '',
      price: 9990,
      originalPrice: 0,
      image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=400&auto=format&fit=crop',
      description: '',
      discount: '',
      stock: 24,
      inStock: true,
      brand: '',
      publishedSocial: true
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      categoryId: prod.categoryId,
      subcategory: prod.subcategory,
      price: prod.price,
      originalPrice: prod.originalPrice || 0,
      image: prod.image,
      description: prod.description,
      discount: prod.discount || '',
      stock: prod.stock !== undefined ? prod.stock : 24,
      inStock: prod.inStock !== false,
      brand: prod.brand || '',
      varieties: prod.varieties ? prod.varieties.join(', ') : '',
      publishedSocial: prod.publishedSocial !== false
    });
    setIsProductModalOpen(true);
  };

  const handleToggleStock = async (prod: Product) => {
    const newInStock = prod.inStock === false ? true : false;
    const updatedProduct: Product = {
      ...prod,
      inStock: newInStock
    };

    try {
      await fetch(`/api/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });
    } catch (err) {
      console.error(err);
    }

    const updatedCategories = categories.map(cat => ({
      ...cat,
      products: cat.products.map(p => p.id === prod.id ? updatedProduct : p)
    }));
    onUpdateCategories(updatedCategories);

    if (megaOffers.some(m => m.id === prod.id) && onUpdateMegaOffers) {
      onUpdateMegaOffers(megaOffers.map(m => m.id === prod.id ? updatedProduct : m));
    }

    showToast(
      newInStock
        ? `"${prod.name}" marcado EN STOCK (disponible)`
        : `"${prod.name}" marcado SIN STOCK (agotado para clientes)`
    );
  };

  const [quickUploadingProductId, setQuickUploadingProductId] = useState<string | null>(null);

  const handleQuickProductImageUpload = async (prod: Product, file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP)');
      return;
    }

    setQuickUploadingProductId(prod.id);
    showToast(`Comprimiendo y subiendo foto de "${prod.name}"...`);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('productName', prod.name);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Error al subir la imagen');
      }

      const updatedProduct: Product = {
        ...prod,
        image: data.url
      };

      await fetch(`/api/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });

      const updatedCategories = categories.map(cat => ({
        ...cat,
        products: cat.products.map(p => p.id === prod.id ? updatedProduct : p)
      }));
      onUpdateCategories(updatedCategories);

      if (megaOffers.some(m => m.id === prod.id) && onUpdateMegaOffers) {
        onUpdateMegaOffers(megaOffers.map(m => m.id === prod.id ? updatedProduct : m));
      }

      if (data.storage === 'cloudflare-r2') {
        showToast(`¡Foto de "${prod.name}" comprimida (${data.savingsPercent || 0}% más ligera) y guardada en Cloudflare R2!`);
      } else {
        showToast(`¡Foto de "${prod.name}" comprimida (${data.savingsPercent || 0}% más ligera) y actualizada!`);
      }
    } catch (err: any) {
      console.error('Error al subir foto de producto:', err);
      showToast(`Error al subir imagen: ${err?.message || 'Fallo de conexión'}`);
    } finally {
      setQuickUploadingProductId(null);
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen (PNG recomendado).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormSettings(prev => ({ ...prev, logoImage: result }));
        showToast('¡Imagen PNG cargada con éxito! Haz clic en "Guardar Ajustes" para aplicarla en la cabecera.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Por favor arrastra un archivo de imagen PNG.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormSettings(prev => ({ ...prev, logoImage: result }));
        showToast('¡Imagen PNG cargada con éxito! Haz clic en "Guardar Ajustes" para aplicarla en la cabecera.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim() || !prodForm.categoryId) return;

    const targetCategory = categories.find(c => c.id === prodForm.categoryId);
    const categoryName = targetCategory ? targetCategory.name : 'Destilados';

    const finalPrice = Number(prodForm.price);
    const finalOriginalPrice = prodForm.originalPrice > 0 ? Number(prodForm.originalPrice) : undefined;
    const computedDiscount = prodForm.discount || getDiscountPercentage(finalPrice, finalOriginalPrice) || undefined;

    if (editingProduct) {
      const updatedProduct: Product = {
        ...editingProduct,
        name: prodForm.name,
        categoryId: prodForm.categoryId,
        category: categoryName,
        subcategory: prodForm.subcategory || categoryName,
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        image: prodForm.image,
        description: prodForm.description,
        varieties: prodForm.varieties ? prodForm.varieties.split(',').map(v => v.trim()).filter(v => v !== '') : undefined,
        discount: computedDiscount,
        stock: Number(prodForm.stock),
        inStock: prodForm.inStock,
        brand: prodForm.brand || undefined,
        publishedSocial: prodForm.publishedSocial
      };

      try {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct)
        });
      } catch (err) {
        console.error(err);
      }

      const updatedCategories = categories.map(cat => ({
        ...cat,
        products: cat.products.map(p => p.id === editingProduct.id ? updatedProduct : p)
      }));
      onUpdateCategories(updatedCategories);
      showToast('Producto actualizado exitosamente');
    } else {
      const newProduct: Product = {
        id: 'prod-' + Date.now(),
        name: prodForm.name,
        categoryId: prodForm.categoryId,
        category: categoryName,
        subcategory: prodForm.subcategory || categoryName,
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        image: prodForm.image,
        description: prodForm.description,
        varieties: prodForm.varieties ? prodForm.varieties.split(',').map(v => v.trim()).filter(v => v !== '') : undefined,
        discount: computedDiscount,
        buttonText: 'Comprar',
        stock: Number(prodForm.stock),
        inStock: prodForm.inStock,
        brand: prodForm.brand || undefined,
        publishedSocial: prodForm.publishedSocial
      };

      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct)
        });
      } catch (err) {
        console.error(err);
      }

      const updatedCategories = categories.map(cat => {
        if (cat.id === prodForm.categoryId) {
          return { ...cat, products: [newProduct, ...cat.products] };
        }
        return cat;
      });
      onUpdateCategories(updatedCategories);
      showToast('Nuevo producto ingresado al catálogo');
    }

    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar este producto del sistema?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    const updated = categories.map(c => ({
      ...c,
      products: c.products.filter(p => p.id !== id)
    }));
    onUpdateCategories(updated);
    showToast('Producto eliminado');
  };

  // GENERAL CLEAR PREVIOUS PRODUCTS (Delete all products at once without one-by-one effort)
  const handleClearAllProducts = async () => {
    setIsClearingAll(true);
    try {
      const res = await fetch('/api/products/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = res.ok ? await res.json() : null;
      const count = data?.totalDeleted ?? (allProducts.length + megaOffers.length);
      
      const updatedCategories = categories.map(c => ({ ...c, products: [] }));
      onUpdateCategories(updatedCategories);
      if (onUpdateMegaOffers) {
        onUpdateMegaOffers([]);
      }
      showToast(`¡Se han eliminado todos los productos anteriores (${count} en total)! Catálogo limpio.`);
      setIsClearAllModalOpen(false);
    } catch (e) {
      console.error(e);
      const updatedCategories = categories.map(c => ({ ...c, products: [] }));
      onUpdateCategories(updatedCategories);
      if (onUpdateMegaOffers) {
        onUpdateMegaOffers([]);
      }
      showToast('Se vaciaron los productos anteriores del catálogo.');
      setIsClearAllModalOpen(false);
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleRestoreDefaultProducts = async () => {
    try {
      const res = await fetch('/api/products/restore-defaults', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.categories) onUpdateCategories(data.categories);
        if (data.megaOffers && onUpdateMegaOffers) onUpdateMegaOffers(data.megaOffers);
        showToast('Catálogo restablecido con productos de demostración');
        setIsClearAllModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // PHOTOSHOOT IA GENERATOR (Fellas Market signature 1.85:1 #141414 ceramic luxury style)
  const handleOpenPhotoshoot = (prod: Product) => {
    setPhotoshootProduct(prod);
    setGeneratedPhotoUrl(null);
    setIsPhotoshootModalOpen(true);
  };

  const handleGeneratePhotoshoot = async () => {
    if (!photoshootProduct) return;
    setIsGeneratingPhoto(true);
    try {
      const res = await fetch('/api/admin/generate-photoshoot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: photoshootProduct.name,
          category: photoshootProduct.category,
          brand: photoshootProduct.brand
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPhotoUrl(data.imageUrl);
        showToast('¡Photoshoot IA #141414 generado con éxito!');
      }
    } catch (e) {
      showToast('Error al generar photoshoot IA');
    } finally {
      setIsGeneratingPhoto(false);
    }
  };

  const handleApplyPhotoshootToProduct = async () => {
    if (!photoshootProduct || !generatedPhotoUrl) return;
    const updatedProd = { ...photoshootProduct, image: generatedPhotoUrl };
    
    try {
      await fetch(`/api/products/${photoshootProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProd)
      });
    } catch (err) {
      console.error(err);
    }

    const updatedCategories = categories.map(cat => ({
      ...cat,
      products: cat.products.map(p => p.id === photoshootProduct.id ? updatedProd : p)
    }));
    onUpdateCategories(updatedCategories);
    setIsPhotoshootModalOpen(false);
    showToast('¡Imagen de photoshoot aplicada al producto!');
  };

  // CATEGORY / CLASIFICACIONES CRUD
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const newCategory: CategoryData = {
      id: 'cat-' + catName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: catName,
      title: catTitle || catName,
      description: catDesc || `Variedades selectas de ${catName}.`,
      badge: catBadge || 'Selección Fellas',
      icon: catIcon || 'fa-solid fa-wine-bottle',
      bannerImage: catImage || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1600&auto=format&fit=crop',
      products: []
    };

    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });
    } catch (err) {
      console.error(err);
    }

    onUpdateCategories([...categories, newCategory]);
    setIsCategoryModalOpen(false);
    setCatName('');
    showToast(`Categoría "${newCategory.name}" agregada con éxito`);
  };

  // CATEGORY BANNER ADJUSTMENT & PERSISTENCE
  const handleSaveCategoryBanner = async (
    categoryId: string,
    bannerUrl: string,
    bannerPosition: 'center' | 'top' | 'bottom'
  ) => {
    try {
      await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerImage: bannerUrl, bannerPosition })
      });
    } catch (err) {
      console.error('Error al persistir banner de categoría:', err);
    }

    const updatedCategories = categories.map((cat) =>
      cat.id === categoryId
        ? { ...cat, bannerImage: bannerUrl, bannerPosition }
        : cat
    );
    onUpdateCategories(updatedCategories);
  };

  // ORDER STATUS CHANGE
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
        showToast(`Pedido actualizado: ${newStatus.replace('_', ' ').toUpperCase()}`);
      }
    } catch (e) {
      showToast('Error al actualizar pedido');
    }
  };

  const getOrderStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'nuevo':
        return {
          label: 'Nuevo',
          badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
          dotClass: 'bg-rose-400 animate-pulse'
        };
      case 'en_preparacion':
      case 'confirmado_preparacion':
        return {
          label: 'En Preparación',
          badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
          dotClass: 'bg-amber-400'
        };
      case 'en_camino':
      case 'delivery_camino':
        return {
          label: 'En Camino',
          badgeClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
          dotClass: 'bg-blue-400 animate-pulse'
        };
      case 'entregado':
      case 'listo_retirar':
        return {
          label: 'Entregado',
          badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
          dotClass: 'bg-emerald-400'
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          badgeClass: 'bg-stone-800 text-stone-400 border border-stone-700',
          dotClass: 'bg-stone-500'
        };
      default:
        return {
          label: String(status).replace('_', ' '),
          badgeClass: 'bg-stone-800 text-stone-300 border border-stone-700',
          dotClass: 'bg-stone-400'
        };
    }
  };

  const handleCopyOrderWhatsApp = (order: Order) => {
    const itemsList = order.items.map(it => `  • ${it.quantity}x ${it.productName} (${formatPrice(it.price * it.quantity)})`).join('\n');
    const msg = `🧾 *COMANDA DE DESPACHO #${order.code}*\n` +
      `👤 *Cliente:* ${order.customerName}\n` +
      `📍 *Dirección:* ${order.address || order.location}\n` +
      (order.customerPhone ? `📞 *Teléfono:* ${order.customerPhone}\n` : '') +
      `💳 *Pago:* ${order.paymentMethod || 'No especificado'}\n\n` +
      `📦 *Detalle de Productos:*\n${itemsList}\n\n` +
      `💵 *Subtotal:* ${formatPrice(order.subtotal || order.total)}\n` +
      (order.shippingCost ? `🛵 *Despacho:* ${formatPrice(order.shippingCost)}\n` : '') +
      `💰 *TOTAL A COBRAR:* ${formatPrice(order.total)}`;

    navigator.clipboard.writeText(msg);
    showToast('¡Comanda copiada en formato WhatsApp!');
  };

  // BACKUP STORE SAVE & TOGGLE
  const handleToggleBackupStore = async () => {
    const updated = { ...backupStore, enabled: !backupStore.enabled };
    setBackupStore(updated);
    if (onUpdateBackupStore) {
      onUpdateBackupStore(updated);
    }
    try {
      await fetch('/api/admin/backup-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      showToast(
        updated.enabled
          ? '🟢 Tienda Alterna ACTIVADA: Vista express para clientes activa (sin "Ver más" ni colecciones completas)'
          : '⚪ Tienda Alterna DESACTIVADA: Catálogo completo restaurado para los clientes'
      );
    } catch (e) {
      showToast('Error al actualizar estado de Tienda Alterna');
    }
  };

  const handleSaveBackupStore = async () => {
    try {
      if (onUpdateBackupStore) {
        onUpdateBackupStore(backupStore);
      }
      await fetch('/api/admin/backup-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupStore)
      });
      showToast('Configuración de Tienda Alterna / Contingencia guardada');
    } catch (e) {
      showToast('Error al guardar tienda alterna');
    }
  };

  // SETTINGS SAVE
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formSettings)
      });
    } catch (e) {
      console.error(e);
    }
    onUpdateSettings(formSettings);
    showToast('Ajustes generales, tarifas y horarios guardados');
  };

  // DELIVERY LOCATIONS WITH SPECIFIC PRICES
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;
    const currentLocs = formSettings.deliveryLocations || getDeliveryLocations(formSettings);
    const newLoc: DeliveryLocation = {
      id: `loc-${Date.now()}`,
      name: newLocName.trim(),
      price: Math.max(0, Number(newLocPrice) || 0),
      estimatedMinutes: Math.max(10, Number(newLocMinutes) || 45)
    };
    const updatedLocs = [...currentLocs, newLoc];
    const updatedZones = Array.from(new Set([...formSettings.deliveryZones, newLoc.name]));
    const updatedSettings = {
      ...formSettings,
      deliveryLocations: updatedLocs,
      deliveryZones: updatedZones
    };
    setFormSettings(updatedSettings);
    setNewLocName('');
    setNewLocPrice(2000);
    setNewLocMinutes(45);
    showToast(`Ubicación "${newLoc.name}" agregada con tarifa ${formatPrice(newLoc.price)}`);
  };

  const handleUpdateLocationPrice = (id: string | undefined, name: string, newPrice: number) => {
    const currentLocs = formSettings.deliveryLocations || getDeliveryLocations(formSettings);
    const updatedLocs = currentLocs.map(l => (l.id === id || l.name === name ? { ...l, price: Math.max(0, newPrice) } : l));
    setFormSettings({ ...formSettings, deliveryLocations: updatedLocs });
  };

  const handleUpdateLocationMinutes = (id: string | undefined, name: string, newMinutes: number) => {
    const currentLocs = formSettings.deliveryLocations || getDeliveryLocations(formSettings);
    const updatedLocs = currentLocs.map(l => (l.id === id || l.name === name ? { ...l, estimatedMinutes: Math.max(5, newMinutes) } : l));
    setFormSettings({ ...formSettings, deliveryLocations: updatedLocs });
  };

  const handleRemoveLocation = (id: string | undefined, name: string) => {
    const currentLocs = formSettings.deliveryLocations || getDeliveryLocations(formSettings);
    const updatedLocs = currentLocs.filter(l => (l.id ? l.id !== id : l.name !== name));
    const updatedZones = formSettings.deliveryZones.filter(z => z !== name);
    setFormSettings({ ...formSettings, deliveryLocations: updatedLocs, deliveryZones: updatedZones });
    showToast(`Ubicación "${name}" eliminada`);
  };

  // SCHEDULE HANDLERS
  const handleUpdateDaySchedule = (dayIndex: number, field: keyof DaySchedule, value: any) => {
    const currentSched = formSettings.scheduleConfig || DEFAULT_STORE_SCHEDULE;
    const updatedDays = [...currentSched.days];
    updatedDays[dayIndex] = { ...updatedDays[dayIndex], [field]: value };
    setFormSettings({
      ...formSettings,
      scheduleConfig: {
        ...currentSched,
        days: updatedDays
      }
    });
  };

  const handleApplyTimeToAllDays = (openTime: string, closeTime: string) => {
    const currentSched = formSettings.scheduleConfig || DEFAULT_STORE_SCHEDULE;
    const updatedDays = currentSched.days.map(d => ({
      ...d,
      openTime,
      closeTime
    }));
    setFormSettings({
      ...formSettings,
      scheduleConfig: {
        ...currentSched,
        days: updatedDays
      }
    });
    showToast(`Horario (${openTime} a ${closeTime}) aplicado a todos los días`);
  };

  // COMMUNITY POST COPY (WhatsApp format like fellasmarket.cl)
  const handleCopySocialPost = (prod: Product) => {
    const waNumber = formSettings.contactPhone || '+56958866754';
    const cleanWa = waNumber.replace(/\D/g, '');
    const textLines = [
      `🛒 *${prod.name}*`,
      `💰 *${formatPrice(prod.price)}*`,
      prod.subcategory ? `📦 ${prod.subcategory}` : `📦 ${prod.category}`,
      `📲 Pedidos directos: wa.me/${cleanWa}`,
      `⚡ Entrega inmediata en Alerce y Puerto Montt`
    ];
    navigator.clipboard.writeText(textLines.join('\n'));
    setCopiedProductId(prod.id);
    showToast('¡Texto formateado para WhatsApp y Redes copiado al portapapeles!');
    setTimeout(() => setCopiedProductId(null), 2500);
  };

  // DISCOUNT CODE CREATE & TOGGLE
  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountForm.code.trim()) return;

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountForm)
      });
      if (res.ok) {
        const data = await res.json();
        setDiscounts(data.discounts);
        setIsDiscountModalOpen(false);
        setDiscountForm({
          code: '',
          type: 'percentage',
          amount: 10,
          minOrder: 15000,
          usesLeft: 100,
          expiresAt: '2026-12-31'
        });
        showToast(`Cupón "${discountForm.code.toUpperCase()}" creado exitosamente`);
      }
    } catch (e) {
      showToast('Error al crear cupón');
    }
  };

  const handleToggleDiscount = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      });
      if (res.ok) {
        const data = await res.json();
        setDiscounts(data.discounts);
        showToast(active ? 'Cupón activado' : 'Cupón desactivado');
      }
    } catch (e) {
      showToast('Error al actualizar cupón');
    }
  };

  // FEEDBACK STATUS TOGGLE
  const handleUpdateFeedbackStatus = async (id: string, status: FeedbackItem['status']) => {
    try {
      const res = await fetch(`/api/admin/feedback/responses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data.feedbacks);
        showToast(`Estado de mensaje actualizado a: ${status}`);
      }
    } catch (e) {
      showToast('Error al actualizar reclamo');
    }
  };

  // PHOTO COMPRESSOR (Browser Canvas Engine like fellasmarket.cl)
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressorFile(file);
    setOriginalFileSize(file.size);
    setCompressedImagePreview(null);

    // Compress client-side with Canvas
    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78);
          setCompressedImagePreview(compressedDataUrl);

          // Calculate new size
          const head = 'data:image/jpeg;base64,';
          const sizeInBytes = Math.round(((compressedDataUrl.length - head.length) * 3) / 4);
          setCompressedFileSize(sizeInBytes);
          setIsCompressing(false);
          showToast('¡Foto optimizada y comprimida con éxito!');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUploadCompressedToR2 = async () => {
    if (!compressorFile && !compressedImagePreview) return;
    setIsUploadingToR2(true);
    setUploadedR2Url(null);
    try {
      let data: any;
      if (compressorFile) {
        const formData = new FormData();
        formData.append('image', compressorFile);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        data = await res.json();
      } else if (compressedImagePreview) {
        const res = await fetch('/api/upload-base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl: compressedImagePreview, filename: 'foto-comprimida' })
        });
        data = await res.json();
      }

      if (data?.url) {
        setUploadedR2Url(data.url);
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(data.url);
            showToast(`¡Foto guardada en ${data.storage === 'cloudflare-r2' ? 'Cloudflare R2' : 'almacenamiento'} y URL copiada!`);
          } catch {
            showToast(`¡Foto guardada exitosamente!`);
          }
        } else {
          showToast(`¡Foto guardada exitosamente!`);
        }
      } else {
        showToast(data?.error || 'Error al subir a la nube');
      }
    } catch (err) {
      showToast('Error de conexión al subir imagen');
    } finally {
      setIsUploadingToR2(false);
    }
  };

  // DATABASE EXPORT & RESTORE (JSON like fellasmarket.cl)
  const handleDownloadBackup = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/database/export');
      if (res.ok) {
        const data = await res.json();
        const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const fileName = `fellas-market-completo-${dateStr}.json`;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✅ Respaldo JSON completo descargado y espejo local actualizado.');
      }
    } catch (e) {
      showToast('Error al exportar base de datos');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/admin/database/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        if (res.ok) {
          const result = await res.json();
          showToast(`✅ ${result.message}`);
          loadAllData();
        } else {
          showToast('Error: archivo de respaldo no compatible');
        }
      } catch (err) {
        showToast('Error al leer el archivo JSON');
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  const navSections = [
    {
      title: 'Catálogo & Tienda',
      tabs: [
        { id: 'products', label: 'Productos', icon: 'fa-solid fa-wine-bottle' },
        { id: 'excel_ia', label: 'Importar Excel IA', icon: 'fa-solid fa-file-excel' },
        { id: 'classifications', label: 'Clasificaciones', icon: 'fa-solid fa-tags' },
        { id: 'mega_offers', label: 'Promos Tío Fellas', icon: 'fa-solid fa-bolt' },
      ]
    },
    {
      title: 'Ventas & Operaciones',
      tabs: [
        { 
          id: 'orders', 
          label: 'Pedidos', 
          icon: 'fa-solid fa-receipt', 
          badge: orders.filter(o => o.status === 'nuevo' || o.status === 'en_preparacion').length 
        },
        { id: 'stats', label: 'Estadísticas', icon: 'fa-solid fa-chart-line' },
        { id: 'customers', label: 'Clientes & Cupones', icon: 'fa-solid fa-users' },
        { 
          id: 'feedback', 
          label: 'Comentarios', 
          icon: 'fa-solid fa-comments', 
          badge: feedbackList.filter(f => f.status === 'pendiente').length 
        },
      ]
    },
    {
      title: 'Diseño & Marca',
      tabs: [
        { id: 'hero_banner', label: 'Gestor de Banners (Todos)', icon: 'fa-solid fa-images' },
        { id: 'footer_editor', label: 'Pie de Página', icon: 'fa-solid fa-window-maximize' },
        { id: 'popup', label: 'Popup Suscripción', icon: 'fa-solid fa-envelope-open-text' },
        { id: 'social', label: 'Community & Redes', icon: 'fa-solid fa-share-nodes' },
        { id: 'compressor', label: 'Compresor Fotos', icon: 'fa-solid fa-compress' },
      ]
    },
    {
      title: 'Sistema & Ajustes',
      tabs: [
        { id: 'settings', label: 'Ajustes Generales', icon: 'fa-solid fa-sliders' },
        { id: 'keep_alive', label: 'Anti-Suspensión (Render)', icon: 'fa-solid fa-heart-pulse', activePill: formSettings.renderKeepAliveEnabled !== false },
        { id: 'alt_store', label: 'Tienda Alterna', icon: 'fa-solid fa-store', activePill: backupStore.enabled },
        { id: 'backup', label: 'Respaldo & Nube', icon: 'fa-solid fa-cloud' }
      ]
    }
  ];

  const allNavTabs = navSections.flatMap(s => s.tabs);
  const activeTabMeta = allNavTabs.find(t => t.id === activeTab) || { id: activeTab, label: activeTab, icon: 'fa-solid fa-circle' };
  const activeSectionMeta = navSections.find(s => s.tabs.some(t => t.id === activeTab));
  const storeOperationalStatus = checkStoreOpenStatus(formSettings.scheduleConfig || settings.scheduleConfig);
  const pendingOrdersBadge = orders.filter(o => o.status === 'nuevo' || o.status === 'en_preparacion').length;

  return (
    <div className="min-h-screen bg-[#0e0e11] text-white antialiased font-sans flex flex-col md:flex-row selection:bg-[#ffd025] selection:text-[#141414]">
      
      {/* Mobile Top Header (only visible on mobile) */}
      <div className="md:hidden bg-[#141418] border-b border-stone-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-9 h-9 rounded-xl bg-stone-800 text-stone-200 flex items-center justify-center hover:bg-stone-700 cursor-pointer"
            aria-label="Abrir menú vertical"
          >
            <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-sm`}></i>
          </button>
          <div>
            <h1 className="text-xs font-black tracking-wider text-white">FELLA'S MARKET</h1>
            <p className="text-[10px] text-stone-400">Panel Administrador</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingOrdersBadge > 0 && (
            <button
              onClick={() => setActiveTab('orders')}
              className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/40 flex items-center gap-1"
            >
              <i className="fa-solid fa-bell animate-bounce text-[9px]"></i>
              <span>{pendingOrdersBadge}</span>
            </button>
          )}
          <button
            onClick={onExitAdmin}
            className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-xl text-xs font-bold border border-stone-700 cursor-pointer"
          >
            <i className="fa-solid fa-store text-yellow-400 text-[10px]"></i>
            <span>Tienda</span>
          </button>
        </div>
      </div>

      {/* 1. VERTICAL MENU TO THE LEFT (Panel Administrador) */}
      <aside
        aria-label="Menú vertical administrador"
        className={`w-64 lg:w-72 shrink-0 bg-[#141418] border-r border-stone-800/80 flex flex-col fixed md:sticky top-0 h-screen z-50 md:z-30 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Brand / Header */}
        <div className="p-4 border-b border-stone-800/80 flex items-center justify-between gap-3 bg-[#121215]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#ffd025] text-[#121215] font-black flex items-center justify-center text-lg shadow-lg shadow-[#ffd025]/20 shrink-0">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-black tracking-wider text-white truncate">
                FELLA'S MARKET
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-[#ffd025] font-bold truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                <span>Panel Admin • Alerce</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-stone-400 hover:text-white p-1 rounded-lg"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Categorized Vertical Navigation Links */}
        <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto custom-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-stone-500">
                {section.title}
              </div>
              {section.tabs.map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as AdminTab);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#ffd025] text-[#121215] font-black shadow-md shadow-[#ffd025]/15'
                        : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      {tab.icon && (
                        <i className={`${tab.icon} w-4 text-center shrink-0 ${isSelected ? 'text-[#121215]' : 'text-stone-400'}`}></i>
                      )}
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {tab.activePill && (
                      <span className="px-1.5 py-0.5 bg-emerald-500 text-black text-[9px] font-black rounded-full animate-pulse shrink-0 ml-1">
                        ACTIVA
                      </span>
                    )}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-full shrink-0 ml-1 ${
                        isSelected ? 'bg-black text-[#ffd025]' : 'bg-rose-500 text-white'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Ver Tienda */}
        <div className="p-3 border-t border-stone-800/80 space-y-2 bg-[#121215]">
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center justify-center gap-2 bg-stone-800/90 hover:bg-stone-700 text-stone-200 hover:text-white font-bold text-xs py-2.5 px-3 rounded-xl border border-stone-700 hover:border-stone-600 transition cursor-pointer"
          >
            <i className="fa-solid fa-store text-yellow-400"></i>
            <span>Ver Tienda Online</span>
          </button>
          <div className="text-center text-[10px] text-stone-500 flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Alerce, Puerto Montt • v2.4</span>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
        ></div>
      )}

      {/* 2. MAIN CONTENT CONTAINER (Scrollable) */}
      <main className="flex-1 min-w-0 bg-[#0e0e11] overflow-y-auto flex flex-col">
        
        {/* Sticky Top Status & Breadcrumb Bar */}
        <header className="sticky top-0 z-30 bg-[#141418]/90 backdrop-blur-md border-b border-stone-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Breadcrumb / Active View */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-stone-500 hidden sm:inline truncate">
              {activeSectionMeta?.title || 'Administración'}
            </span>
            <span className="text-stone-700 hidden sm:inline">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-yellow-400/10 text-[#ffd025] flex items-center justify-center text-xs shrink-0 border border-yellow-400/20">
                <i className={activeTabMeta.icon}></i>
              </span>
              <span className="text-sm font-black text-white truncate">
                {activeTabMeta.label}
              </span>
            </div>
          </div>

          {/* Real-time Status & Quick Nav Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Store Status Button */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              title="Haz clic para ajustar horarios de atención y cierre"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                storeOperationalStatus.isOpen
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${storeOperationalStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              <span className="hidden sm:inline">
                {storeOperationalStatus.isOpen ? 'Local Abierto' : 'Local Cerrado'}
              </span>
            </button>

            {/* Pending Orders Pill */}
            {pendingOrdersBadge > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-black hover:bg-amber-500/25 transition cursor-pointer"
                title={`${pendingOrdersBadge} pedidos requieren atención`}
              >
                <i className="fa-solid fa-bell text-[10px] animate-bounce"></i>
                <span>{pendingOrdersBadge}</span>
                <span className="hidden lg:inline text-[11px] font-medium text-amber-200">pendientes</span>
              </button>
            )}

            {/* Quick Link to Store */}
            <button
              onClick={onExitAdmin}
              className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-stone-700 hover:border-stone-600 transition cursor-pointer"
            >
              <i className="fa-solid fa-store text-yellow-400 text-xs"></i>
              <span className="hidden md:inline">Ver Tienda</span>
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        
        {/* TAB 1: PRODUCTOS */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                  <i className="fa-solid fa-boxes-stacked text-[#ffd025]"></i> Catálogo de Productos
                </h2>
                <p className="text-xs text-gray-400">
                  Administra fichas, precios, disponibilidad para clientes y fotografías de estudio.
                </p>
              </div>

              {/* Action buttons: solo iconos, sin texto */}
              <div className="flex items-center gap-2">
                {/* 1. Borrar Anteriores (solo icono) */}
                <button
                  onClick={() => setIsClearAllModalOpen(true)}
                  disabled={allProducts.length === 0 && megaOffers.length === 0}
                  className="w-10 h-10 rounded-xl bg-red-950/40 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-red-300 hover:text-white border border-red-800/70 transition flex items-center justify-center shadow cursor-pointer active:scale-95"
                  title={`Borrar anteriores (${allProducts.length + megaOffers.length} productos)`}
                  aria-label="Borrar anteriores"
                >
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </button>

                {/* 2. Importar Excel con IA (solo icono) */}
                <button
                  onClick={() => setIsExcelModalOpen(true)}
                  className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center shadow cursor-pointer active:scale-95"
                  title="Importar Excel con IA"
                  aria-label="Importar Excel con IA"
                >
                  <i className="fa-solid fa-file-excel text-base"></i>
                </button>

                {/* 3. Reorganizar con IA (solo icono) */}
                <button
                  onClick={handleReorganizeCatalogWithAi}
                  disabled={isReclassifyingCatalog || (allProducts.length === 0 && megaOffers.length === 0)}
                  className="w-10 h-10 rounded-xl bg-purple-900/60 hover:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed text-purple-200 hover:text-white border border-purple-700/70 transition flex items-center justify-center shadow cursor-pointer active:scale-95"
                  title="Reorganizar todo el catálogo con IA (Pasillos, Categorías y Subcategorías)"
                  aria-label="Reorganizar con IA"
                >
                  <i className={`fa-solid fa-wand-magic-sparkles text-sm ${isReclassifyingCatalog ? 'animate-spin text-[#ffd025]' : ''}`}></i>
                </button>

                {/* 4. Agregar Producto (solo icono) */}
                <button
                  onClick={handleOpenNewProduct}
                  className="w-10 h-10 rounded-xl bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black transition flex items-center justify-center shadow cursor-pointer active:scale-95"
                  title="Agregar Producto"
                  aria-label="Agregar Producto"
                >
                  <i className="fa-solid fa-plus text-base font-black"></i>
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-[#1a1a1a] p-3 rounded-2xl border border-gray-800">
              <div className="relative flex-1">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-500 text-xs"></i>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar por nombre, categoría o subcategoría..."
                  className="w-full bg-[#141414] text-white text-xs rounded-xl pl-9 pr-3 py-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-[#141414] text-gray-200 text-xs rounded-xl px-3 py-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
              >
                <option value="ALL">Todos los Pasillos</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allProducts
                .filter(p => {
                  const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                    p.subcategory.toLowerCase().includes(productSearch.toLowerCase());
                  const matchCat = selectedCategoryFilter === 'ALL' || p.categoryId === selectedCategoryFilter;
                  return matchSearch && matchCat;
                })
                .map(prod => {
                  const autoDiscount = prod.discount || getDiscountPercentage(prod.price, prod.originalPrice);
                  const hasDiscount = prod.originalPrice && prod.originalPrice > prod.price;

                  return (
                    <div key={prod.id} className="bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden hover:border-[#ffd025]/40 transition flex flex-col justify-between group">
                      <div>
                        <div className="h-44 bg-[#141414] relative overflow-hidden flex items-center justify-center p-2">
                          <img src={prod.image} alt={prod.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition" />
                          
                          {/* Botón Rápido para Cargar Foto desde PC y Guardar en Cloudflare R2 */}
                          <label
                            title="Cargar foto desde tu PC para este producto (se comprime con Sharp y se guarda en Cloudflare R2)"
                            className="absolute bottom-2 left-2 bg-black/85 hover:bg-[#ffd025] hover:text-black text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-gray-700 hover:border-[#ffd025] transition cursor-pointer flex items-center gap-1.5 shadow-md backdrop-blur-xs z-10 opacity-90 group-hover:opacity-100"
                          >
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={quickUploadingProductId === prod.id}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleQuickProductImageUpload(prod, file);
                                e.target.value = '';
                              }}
                            />
                            <i className={`fa-solid ${quickUploadingProductId === prod.id ? 'fa-spinner fa-spin text-[#ffd025]' : 'fa-camera text-[#ffd025] hover:text-black'}`}></i>
                            <span>{quickUploadingProductId === prod.id ? 'Comprimiendo...' : 'Subir foto PC'}</span>
                          </label>

                          {autoDiscount && (
                            <span className="absolute top-2 left-2 bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-md animate-pulse">
                              {autoDiscount}
                            </span>
                          )}
                          {/* Botón Encendible / Apagable para Marcar Sin Stock */}
                          <button
                            type="button"
                            onClick={() => handleToggleStock(prod)}
                            title={prod.inStock === false ? 'Hacer clic para marcar EN STOCK' : 'Hacer clic para marcar SIN STOCK'}
                            className={`absolute top-2 right-2 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer border ${
                              prod.inStock === false
                                ? 'bg-red-950/85 text-red-300 border-red-600/60 hover:bg-red-900'
                                : 'bg-emerald-950/85 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${prod.inStock === false ? 'bg-red-500' : 'bg-emerald-400 animate-pulse'}`}></span>
                            <span>{prod.inStock === false ? 'Sin stock' : 'En stock'}</span>
                            <span className={`w-5 h-3 rounded-full relative flex items-center p-0.5 transition-colors ${prod.inStock === false ? 'bg-stone-700' : 'bg-emerald-500'}`}>
                              <span className={`w-2 h-2 bg-white rounded-full transition-transform ${prod.inStock === false ? 'translate-x-0' : 'translate-x-2'}`}></span>
                            </span>
                          </button>
                        </div>

                        <div className="p-3.5 space-y-1.5 min-w-0">
                          <div className="text-[10px] font-bold text-[#ffd025] uppercase tracking-wider truncate">{prod.subcategory || prod.category}</div>
                          <h4 className="text-xs font-bold text-white line-clamp-2 min-h-[2rem] leading-snug break-words">{prod.name}</h4>
                          <div className="flex items-baseline gap-2 pt-1 flex-wrap">
                            <span className="text-sm font-black text-white">{formatPrice(prod.price)}</span>
                            {hasDiscount && (
                              <span className="text-[10px] text-red-500 font-bold line-through decoration-red-500 decoration-2">{formatPrice(prod.originalPrice!)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                    {/* Actions bar */}
                    <div className="p-3 pt-0 border-t border-gray-800/80 flex items-center justify-between gap-1.5 mt-2 min-w-0">
                      <button
                        onClick={() => handleOpenPhotoshoot(prod)}
                        title="Generar Photoshoot IA (#141414)"
                        className="flex-1 min-w-0 bg-[#ffd025]/10 hover:bg-[#ffd025] hover:text-[#141414] text-[#ffd025] font-black text-[10px] py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1 border border-[#ffd025]/30 cursor-pointer"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles shrink-0"></i>
                        <span className="truncate">Photoshoot IA</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditProduct(prod)}
                        className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition shrink-0 cursor-pointer"
                        title="Editar"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1.5 bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg text-xs transition shrink-0 cursor-pointer"
                        title="Eliminar"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty Catalog State (e.g. after clearing all products) */}
            {allProducts.length === 0 && (
              <div className="py-16 px-6 text-center bg-[#1a1a1a]/70 border border-dashed border-gray-800 rounded-3xl space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl mx-auto">
                  <i className="fa-solid fa-boxes-packing"></i>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white uppercase">Catálogo Limpio y Listo</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                    No tienes productos anteriores en el catálogo. Puedes importar tu planilla Excel con IA en segundos para poblar automáticamente pasillos y ofertas, o ingresar productos manualmente.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsExcelModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow cursor-pointer uppercase active:scale-95"
                  >
                    <i className="fa-solid fa-file-excel"></i>
                    <span>Subir Planilla Excel con IA</span>
                  </button>
                  <button
                    onClick={handleOpenNewProduct}
                    className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow cursor-pointer uppercase"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Crear Producto</span>
                  </button>
                  <button
                    onClick={handleRestoreDefaultProducts}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-rotate-left"></i>
                    <span>Restablecer Demo</span>
                  </button>
                </div>
              </div>
            )}

            {allProducts.length > 0 && allProducts.filter(p => {
              const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                p.subcategory.toLowerCase().includes(productSearch.toLowerCase());
              const matchCat = selectedCategoryFilter === 'ALL' || p.categoryId === selectedCategoryFilter;
              return matchSearch && matchCat;
            }).length === 0 && (
              <div className="py-12 text-center text-gray-500 text-xs">
                No se encontraron productos que coincidan con la búsqueda o filtro seleccionado.
              </div>
            )}
          </div>
        )}

        {/* TAB EXCEL IA */}
        {activeTab === 'excel_ia' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/40 via-[#1a1a1a] to-[#141414] p-6 rounded-3xl border border-emerald-500/30 shadow-xl">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Potenciado por Gemini 3.8 Flash
                  </span>
                  <span className="text-gray-400 text-xs">• Clasificación Inteligente de Botillería</span>
                </div>
                <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                  <i className="fa-solid fa-file-excel text-emerald-400"></i> Importador Masivo de Planillas Excel con IA
                </h2>
                <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                  Sube tu planilla de cálculo con nombres y precios. La IA de Google clasificará automáticamente cada producto en su sección correspondiente, detectará packs para convertirlos en <strong>Mega Ofertas</strong> de portada y generará sugerencias de precios de referencia.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsClearAllModalOpen(true)}
                  disabled={allProducts.length === 0 && megaOffers.length === 0}
                  className="bg-red-950/40 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-red-300 hover:text-white border border-red-800/70 font-black text-xs px-4 py-3 rounded-2xl transition flex items-center gap-2 shadow cursor-pointer active:scale-95 uppercase"
                  title="Eliminar todos los productos anteriores para vaciar el catálogo"
                >
                  <i className="fa-solid fa-trash-can text-red-400"></i>
                  <span>Borrar Anteriores ({allProducts.length + megaOffers.length})</span>
                </button>
                <button
                  onClick={() => setIsExcelModalOpen(true)}
                  className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-5 py-3 rounded-2xl transition flex items-center gap-2 shadow-xl cursor-pointer active:scale-95 uppercase"
                >
                  <i className="fa-solid fa-cloud-arrow-up text-sm"></i>
                  <span>Abrir Importador Excel</span>
                </button>
              </div>
            </div>

            {/* Feature overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#181818] border border-gray-800 rounded-2xl p-5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-layer-group"></i>
                </div>
                <h4 className="text-sm font-black text-white uppercase">Clasificación en Secciones</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Asigna cada producto a la categoría correcta (Destilados, Cervezas, Vinos, etc.) y genera su subcategoría específica (ej. Piscos, Artesanales, Espumantes).
                </p>
              </div>

              <div className="bg-[#181818] border border-gray-800 rounded-2xl p-5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-fire"></i>
                </div>
                <h4 className="text-sm font-black text-white uppercase">Detección de Mega Ofertas</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Detecta promociones, combos y sixpacks para clasificarlos como <strong>Mega Ofertas</strong> que se publican directo en la sección estelar de portada.
                </p>
              </div>

              <div className="bg-[#181818] border border-gray-800 rounded-2xl p-5 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-percent"></i>
                </div>
                <h4 className="text-sm font-black text-white uppercase">Cálculo de Descuentos</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Calcula el porcentaje de ahorro y añade precios de referencia tachados para maximizar la conversión de tus clientes.
                </p>
              </div>
            </div>

            {/* Call to Action button banner */}
            <div className="bg-[#141414] border border-gray-800 rounded-2xl p-8 text-center space-y-3">
              <i className="fa-solid fa-wand-magic-sparkles text-3xl text-[#ffd025]"></i>
              <h3 className="text-base font-bold text-white">¿Listo para cargar tu lista de productos?</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Puedes subir tu propio archivo Excel (.xlsx / .csv) o probar de inmediato con una planilla de demostración preconfigurada.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setIsClearAllModalOpen(true)}
                  disabled={allProducts.length === 0 && megaOffers.length === 0}
                  className="bg-red-950/50 hover:bg-red-900/70 disabled:opacity-40 disabled:cursor-not-allowed text-red-300 hover:text-white border border-red-800/80 font-black text-xs px-5 py-3 rounded-xl transition flex items-center gap-2 shadow cursor-pointer uppercase"
                >
                  <i className="fa-solid fa-trash-can text-red-400"></i>
                  <span>Vaciar Productos Anteriores</span>
                </button>
                <button
                  onClick={() => setIsExcelModalOpen(true)}
                  className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-6 py-3 rounded-xl transition flex items-center gap-2 shadow cursor-pointer uppercase"
                >
                  <i className="fa-solid fa-file-excel"></i>
                  <span>Comenzar Importación con IA</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLASIFICACIONES & PASILLOS */}
        {activeTab === 'classifications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                  <i className="fa-solid fa-tags text-[#ffd025]"></i> Clasificaciones & Pasillos
                </h2>
                <p className="text-xs text-gray-400">
                  Organiza las secciones temáticas de la tienda (Destilados, Cervezas, Vinos, Snacks, etc.) y ajusta sus banners.
                </p>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow cursor-pointer active:scale-95 uppercase"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Nuevo Pasillo</span>
              </button>
            </div>

            {/* GUÍA DE MEDIDAS EXACTAS DE LOS BANNERS DE CLASIFICACIÓN */}
            <div className="bg-[#141414] border border-stone-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-stone-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-yellow-400/10 text-yellow-400 flex items-center justify-center text-sm border border-yellow-400/20 shrink-0">
                    <i className="fa-solid fa-ruler-combined text-base"></i>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white uppercase flex items-center gap-2 flex-wrap">
                      <span>Especificaciones y Medidas Exactas del Banner</span>
                      <span className="text-[10px] bg-yellow-400/20 text-[#ffd025] px-2 py-0.5 rounded font-mono font-bold">
                        1200 × 260 px
                      </span>
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      Cada pasillo cuenta con un banner panorámico visible al inicio de su sección en la tienda.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-stone-300 bg-[#1a1a1a] px-3 py-1.5 rounded-xl border border-stone-800 shrink-0">
                  <i className="fa-solid fa-circle-info text-[#ffd025]"></i>
                  <span>Relación de aspecto: <strong className="text-white font-mono">16:4 / 4.6:1</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-[#1a1a1a] border border-stone-800/80 rounded-xl p-2.5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Ancho Óptimo</span>
                  <span className="text-sm font-mono font-black text-white block mt-0.5">1200 px</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Hasta 1920 px (Full HD)</span>
                </div>
                <div className="bg-[#1a1a1a] border border-stone-800/80 rounded-xl p-2.5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Alto Óptimo</span>
                  <span className="text-sm font-mono font-black text-white block mt-0.5">260 px</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Pantalla: 200px a 270px</span>
                </div>
                <div className="bg-[#1a1a1a] border border-stone-800/80 rounded-xl p-2.5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Formato Recomendado</span>
                  <span className="text-sm font-mono font-black text-white block mt-0.5">JPG / WEBP / PNG</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Peso máx. sugerido: 1.5MB</span>
                </div>
                <div className="bg-[#1a1a1a] border border-stone-800/80 rounded-xl p-2.5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block">Alineación</span>
                  <span className="text-sm font-mono font-black text-[#ffd025] block mt-0.5">Ajuste Inteligente</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">Arriba, Centro o Abajo</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-[#1a1a1a] border border-gray-800 hover:border-stone-700 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition group">
                  <div>
                    <div className="h-36 relative overflow-hidden bg-gray-900">
                      <img
                        src={cat.bannerImage}
                        alt={cat.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ${
                          cat.bannerPosition === 'top'
                            ? 'object-top'
                            : cat.bannerPosition === 'bottom'
                            ? 'object-bottom'
                            : 'object-center'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-black/30"></div>
                      
                      {/* Badge superior con icono */}
                      <span className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-xs text-[#ffd025] text-[10px] font-bold px-2.5 py-1 rounded-md border border-[#ffd025]/30 flex items-center gap-1.5 shadow">
                        <i className={cat.icon}></i> {cat.badge}
                      </span>

                      {/* Medida exacta del banner */}
                      <span className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-xs text-stone-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-stone-700 flex items-center gap-1 shadow">
                        <i className="fa-solid fa-ruler text-yellow-400"></i>
                        <span>1200 × 260 px</span>
                      </span>

                      {/* Indicador de posición/enfoque */}
                      <span className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-xs text-stone-300 text-[9px] font-mono px-2 py-0.5 rounded border border-stone-800">
                        {cat.bannerPosition === 'top' ? '⬆️ Enfoque Superior' : cat.bannerPosition === 'bottom' ? '⬇️ Enfoque Inferior' : '⏺️ Enfoque Centrado'}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="font-extrabold text-white text-sm flex items-center justify-between">
                        <span>{cat.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono font-normal">
                          #{cat.id}
                        </span>
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-2">{cat.description}</p>
                      
                      <div className="pt-2 flex items-center justify-between text-xs text-stone-400">
                        <span className="text-[#ffd025] font-bold">
                          {cat.products.length} productos en pasillo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Gestión de Pasillo & Portada */}
                  <div className="p-4 pt-0 border-t border-gray-800/80 mt-2 space-y-2">
                    {/* Botón para Elegir los 6 Productos de la Sección */}
                    <button
                      type="button"
                      id={`btn-featured-${cat.id}`}
                      onClick={() => {
                        setSelectedFeaturedCategory(cat);
                        setIsFeaturedModalOpen(true);
                      }}
                      className="w-full mt-3 bg-amber-500/10 hover:bg-[#ffd025] text-amber-300 hover:text-[#141414] border border-amber-500/30 hover:border-[#ffd025] font-black text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95 group/fbtn"
                    >
                      <i className="fa-solid fa-star text-[#ffd025] group-hover/fbtn:text-[#141414]"></i>
                      <span>Elegir los 6 Productos de la Sección</span>
                      <span className="text-[10px] bg-stone-900 group-hover/fbtn:bg-stone-900 group-hover/fbtn:text-[#ffd025] px-2 py-0.5 rounded-md font-mono font-bold text-amber-200">
                        {cat.featuredProductIds && cat.featuredProductIds.length > 0 ? `${cat.featuredProductIds.length}/6` : 'Auto (6)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      id={`btn-adjust-banner-${cat.id}`}
                      onClick={() => {
                        setSelectedBannerCategory(cat);
                        setIsBannerModalOpen(true);
                      }}
                      className="w-full bg-stone-900 hover:bg-[#ffd025] text-stone-200 hover:text-[#141414] border border-stone-700 hover:border-[#ffd025] font-black text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95 group/btn"
                    >
                      <i className="fa-solid fa-ruler-combined text-yellow-400 group-hover/btn:text-[#141414]"></i>
                      <span>Ajustar Imagen de Banner & Medidas</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: GESTOR DE BANNERS (TODOS LOS BANNERS) */}
        {activeTab === 'hero_banner' && (
          <HeroBannerEditor
            heroSlides={heroSlides}
            onUpdateHeroSlides={onUpdateHeroSlides}
            settings={formSettings}
            onUpdateSettings={(updated) => {
              setFormSettings(updated);
              onUpdateSettings(updated);
            }}
            categories={categories}
            onUpdateCategories={onUpdateCategories}
            showToast={showToast}
          />
        )}

        {/* TAB: LAS PROMOS DEL TÍO FELLAS (MEGA OFERTAS) */}
        {activeTab === 'mega_offers' && (
          <MegaOffersEditor
            megaOffers={megaOffers}
            onUpdateMegaOffers={onUpdateMegaOffers || (() => {})}
            settings={formSettings}
            onUpdateSettings={(updated) => {
              setFormSettings(updated);
              onUpdateSettings(updated);
            }}
            categories={categories}
            showToast={showToast}
          />
        )}

        {/* TAB: PIE DE PÁGINA (FOOTER) */}
        {activeTab === 'footer_editor' && (
          <FooterEditor
            settings={formSettings}
            onUpdateSettings={(updated) => {
              setFormSettings(updated);
              onUpdateSettings(updated);
            }}
            categories={categories}
            showToast={showToast}
          />
        )}

        {/* TAB 3: PEDIDOS */}
        {activeTab === 'orders' && (() => {
          const countTotal = orders.length;
          const countNuevo = orders.filter(o => o.status === 'nuevo').length;
          const countPreparacion = orders.filter(o => o.status === 'en_preparacion' || o.status === 'confirmado_preparacion').length;
          const countCamino = orders.filter(o => o.status === 'en_camino' || o.status === 'delivery_camino').length;
          const countEntregado = orders.filter(o => o.status === 'entregado' || o.status === 'listo_retirar').length;
          const countCancelado = orders.filter(o => o.status === 'cancelado').length;

          const filteredOrders = orders.filter(order => {
            if (orderFilter !== 'ALL') {
              if (orderFilter === 'nuevo' && order.status !== 'nuevo') return false;
              if (orderFilter === 'en_preparacion' && order.status !== 'en_preparacion' && order.status !== 'confirmado_preparacion') return false;
              if (orderFilter === 'en_camino' && order.status !== 'en_camino' && order.status !== 'delivery_camino') return false;
              if (orderFilter === 'entregado' && order.status !== 'entregado' && order.status !== 'listo_retirar') return false;
              if (orderFilter === 'cancelado' && order.status !== 'cancelado') return false;
            }
            if (orderSearch.trim()) {
              const q = orderSearch.toLowerCase().trim();
              const matchCode = (order.code || '').toLowerCase().includes(q);
              const matchName = (order.customerName || '').toLowerCase().includes(q);
              const matchAddr = (order.address || order.location || '').toLowerCase().includes(q);
              const matchPhone = (order.customerPhone || '').toLowerCase().includes(q);
              return matchCode || matchName || matchAddr || matchPhone;
            }
            return true;
          });

          return (
            <div className="space-y-6">
              {/* Header & Metrics */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#141418] border border-stone-800/80 p-5 rounded-2xl">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-amber-400/10 text-[#ffd025] flex items-center justify-center text-sm border border-amber-400/20">
                      <i className="fa-solid fa-receipt"></i>
                    </span>
                    <div>
                      <h2 className="text-lg font-black uppercase text-white tracking-wide">
                        Pedidos para Despacho
                      </h2>
                      <p className="text-xs text-stone-400">
                        Comandas en tiempo real distribuidas en filas horizontales de a 4 recuadros
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300">
                    <span className="text-stone-500 font-bold">Total:</span>
                    <span className="font-black text-white">{countTotal}</span>
                  </div>
                  {countNuevo > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                      <span>{countNuevo} Nuevos</span>
                    </div>
                  )}
                  {countCamino > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-xs text-blue-400 font-bold">
                      <i className="fa-solid fa-motorcycle text-[10px]"></i>
                      <span>{countCamino} En Camino</span>
                    </div>
                  )}
                  <button
                    onClick={loadOrders}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-2 border border-stone-700 cursor-pointer shadow-xs active:scale-95"
                  >
                    <i className="fa-solid fa-rotate"></i>
                    <span>Actualizar</span>
                  </button>
                </div>
              </div>

              {/* Filter & Search Toolbar */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs"></i>
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Buscar por #comanda, cliente, fono o dirección..."
                    className="w-full bg-[#141418] text-white text-xs pl-9 pr-8 py-2.5 rounded-xl border border-stone-800/80 outline-none focus:border-[#ffd025] transition"
                  />
                  {orderSearch && (
                    <button
                      onClick={() => setOrderSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1"
                    >
                      <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                  )}
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
                  <button
                    onClick={() => setOrderFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      orderFilter === 'ALL'
                        ? 'bg-[#ffd025] text-[#121215] font-black'
                        : 'bg-[#141418] text-stone-400 hover:text-white border border-stone-800'
                    }`}
                  >
                    Todos ({countTotal})
                  </button>
                  <button
                    onClick={() => setOrderFilter('nuevo')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      orderFilter === 'nuevo'
                        ? 'bg-rose-500 text-white font-black'
                        : 'bg-[#141418] text-rose-400/90 hover:text-rose-300 border border-stone-800'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    <span>Nuevos ({countNuevo})</span>
                  </button>
                  <button
                    onClick={() => setOrderFilter('en_preparacion')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      orderFilter === 'en_preparacion'
                        ? 'bg-amber-500 text-black font-black'
                        : 'bg-[#141418] text-amber-400/90 hover:text-amber-300 border border-stone-800'
                    }`}
                  >
                    En Preparación ({countPreparacion})
                  </button>
                  <button
                    onClick={() => setOrderFilter('en_camino')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      orderFilter === 'en_camino'
                        ? 'bg-blue-500 text-white font-black'
                        : 'bg-[#141418] text-blue-400/90 hover:text-blue-300 border border-stone-800'
                    }`}
                  >
                    En Camino ({countCamino})
                  </button>
                  <button
                    onClick={() => setOrderFilter('entregado')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      orderFilter === 'entregado'
                        ? 'bg-emerald-500 text-black font-black'
                        : 'bg-[#141418] text-emerald-400/90 hover:text-emerald-300 border border-stone-800'
                    }`}
                  >
                    Entregados ({countEntregado})
                  </button>
                  {countCancelado > 0 && (
                    <button
                      onClick={() => setOrderFilter('cancelado')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        orderFilter === 'cancelado'
                          ? 'bg-stone-700 text-white font-black'
                          : 'bg-[#141418] text-stone-400 hover:text-stone-300 border border-stone-800'
                      }`}
                    >
                      Cancelados ({countCancelado})
                    </button>
                  )}
                </div>
              </div>

              {/* 4-COLUMN HORIZONTAL ROWS GRID */}
              {filteredOrders.length === 0 ? (
                <div className="bg-[#141418] border border-stone-800/80 rounded-2xl p-12 text-center text-stone-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-800 text-stone-500 mx-auto flex items-center justify-center text-xl">
                    <i className="fa-solid fa-receipt"></i>
                  </div>
                  <div className="text-sm font-bold text-white">No se encontraron pedidos</div>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    {orderSearch || orderFilter !== 'ALL'
                      ? 'No hay pedidos que coincidan con los filtros aplicados. Intenta cambiar o limpiar la búsqueda.'
                      : 'Actualmente no hay pedidos registrados. Los nuevos pedidos de clientes ingresarán aquí automáticamente.'}
                  </p>
                  {(orderSearch || orderFilter !== 'ALL') && (
                    <button
                      onClick={() => {
                        setOrderSearch('');
                        setOrderFilter('ALL');
                      }}
                      className="text-xs font-bold text-[#ffd025] hover:underline cursor-pointer pt-1"
                    >
                      Limpiar filtros de búsqueda
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredOrders.map(order => {
                    const statusInfo = getOrderStatusInfo(order.status);
                    const formattedTime = order.createdAt
                      ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--';
                    const itemsCount = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || order.items?.length || 0;

                    return (
                      <div
                        key={order.id}
                        className="bg-[#141418] border border-stone-800/80 hover:border-[#ffd025]/50 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-black/50 group"
                      >
                        {/* Card Header */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-stone-800/60 pb-2.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-mono font-black text-white text-sm">#{order.code}</span>
                              <span className="text-[11px] text-stone-500 font-mono">({formattedTime})</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${statusInfo.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`}></span>
                              <span>{statusInfo.label}</span>
                            </span>
                          </div>

                          {/* Customer info (zero overflow) */}
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <i className="fa-solid fa-user text-stone-500 text-xs shrink-0"></i>
                              <span className="font-bold text-xs text-stone-100 truncate">
                                {order.customerName || 'Cliente'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-stone-400 min-w-0" title={order.address || order.location}>
                              <i className="fa-solid fa-location-dot text-[#ffd025] text-xs shrink-0"></i>
                              <span className="truncate">
                                {order.address || order.location || 'Alerce / Puerto Montt'}
                              </span>
                            </div>
                            {order.customerPhone && (
                              <div className="flex items-center gap-1.5 text-xs text-stone-400 min-w-0">
                                <i className="fa-solid fa-phone text-stone-500 text-xs shrink-0"></i>
                                <span className="font-mono text-[11px] truncate">{order.customerPhone}</span>
                              </div>
                            )}
                          </div>

                          {/* Products breakdown box */}
                          <div className="bg-[#0e0e11] border border-stone-800/80 rounded-xl p-2.5 space-y-1.5 min-w-0">
                            <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                              <span>Productos ({itemsCount})</span>
                              <span className="text-[#ffd025] font-mono">{formatPrice(order.total)}</span>
                            </div>
                            <div className="space-y-1">
                              {order.items?.slice(0, 3).map((it, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-1.5 text-xs min-w-0">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="bg-amber-400/10 text-[#ffd025] font-black px-1.5 py-0.5 rounded text-[10px] shrink-0 font-mono">
                                      {it.quantity}x
                                    </span>
                                    <span className="text-stone-300 truncate text-[11px]" title={it.productName}>
                                      {it.productName}
                                    </span>
                                  </div>
                                  <span className="text-stone-400 font-mono text-[10px] shrink-0">
                                    {formatPrice(it.price * it.quantity)}
                                  </span>
                                </div>
                              ))}
                              {order.items?.length > 3 && (
                                <div className="text-[10px] text-stone-500 font-medium italic pt-0.5">
                                  + {order.items.length - 3} productos más en comanda
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer & Actions */}
                        <div className="pt-3 border-t border-stone-800/60 mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-stone-400 font-medium">Total comanda:</span>
                            <span className="text-sm font-black text-[#ffd025] font-mono">
                              {formatPrice(order.total)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="w-full bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 border border-stone-700 cursor-pointer"
                            >
                              <i className="fa-solid fa-eye text-yellow-400 text-[11px]"></i>
                              <span>Ver Comanda</span>
                            </button>

                            {/* Quick status button or selector */}
                            {order.status === 'nuevo' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'en_preparacion')}
                                className="w-full bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black text-xs font-bold py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 border border-amber-500/40 cursor-pointer"
                                title="Pasar a preparación"
                              >
                                <i className="fa-solid fa-box text-[10px]"></i>
                                <span>Preparar</span>
                              </button>
                            )}

                            {order.status === 'en_preparacion' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'en_camino')}
                                className="w-full bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white text-xs font-bold py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 border border-blue-500/40 cursor-pointer"
                                title="Enviar a reparto"
                              >
                                <i className="fa-solid fa-motorcycle text-[10px]"></i>
                                <span>A Reparto</span>
                              </button>
                            )}

                            {order.status === 'en_camino' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'entregado')}
                                className="w-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black text-xs font-bold py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 border border-emerald-500/40 cursor-pointer"
                                title="Marcar como entregado"
                              >
                                <i className="fa-solid fa-check text-[10px]"></i>
                                <span>Entregado</span>
                              </button>
                            )}

                            {(order.status === 'entregado' || order.status === 'cancelado') && (
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="w-full bg-stone-900 text-stone-400 hover:text-white text-xs font-bold py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 border border-stone-800 cursor-pointer"
                              >
                                <i className="fa-solid fa-receipt text-[10px]"></i>
                                <span>Detalle</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MODAL: COMANDA DE DESPACHO COMPLETA */}
              {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <div className="bg-[#141418] border border-stone-700/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-150">
                    
                    {/* Modal Header */}
                    <div className="p-5 border-b border-stone-800 flex items-center justify-between gap-3 bg-[#121215]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-[#ffd025] text-black font-black flex items-center justify-center text-base shrink-0">
                          <i className="fa-solid fa-receipt"></i>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white font-mono">
                              Comanda #{selectedOrder.code}
                            </h3>
                            {(() => {
                              const s = getOrderStatusInfo(selectedOrder.status);
                              return (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badgeClass}`}>
                                  {s.label}
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-xs text-stone-400 truncate">
                            {selectedOrder.createdAt
                              ? new Date(selectedOrder.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                              : 'Fecha no registrada'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="w-9 h-9 rounded-xl bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center hover:bg-stone-700 transition cursor-pointer shrink-0"
                        title="Cerrar modal"
                      >
                        <i className="fa-solid fa-xmark text-sm"></i>
                      </button>
                    </div>

                    {/* Modal Scrollable Body */}
                    <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                      
                      {/* Customer Card */}
                      <div className="bg-[#0e0e11] border border-stone-800 rounded-2xl p-4 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          Datos del Cliente & Despacho
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-stone-400 block text-[11px]">Nombre:</span>
                            <span className="text-white font-bold">{selectedOrder.customerName || 'No informado'}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[11px]">Teléfono / WhatsApp:</span>
                            {selectedOrder.customerPhone ? (
                              <a
                                href={`https://wa.me/${selectedOrder.customerPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:underline font-bold flex items-center gap-1.5"
                              >
                                <i className="fa-brands fa-whatsapp text-sm"></i>
                                <span>{selectedOrder.customerPhone}</span>
                              </a>
                            ) : (
                              <span className="text-stone-500">No especificado</span>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-stone-400 block text-[11px]">Dirección de Entrega:</span>
                            <span className="text-white font-medium flex items-center gap-1.5 mt-0.5">
                              <i className="fa-solid fa-location-dot text-[#ffd025] shrink-0"></i>
                              <span>{selectedOrder.address || selectedOrder.location || 'Alerce / Puerto Montt'}</span>
                            </span>
                          </div>
                          {selectedOrder.paymentMethod && (
                            <div>
                              <span className="text-stone-400 block text-[11px]">Método de Pago:</span>
                              <span className="text-stone-200 font-bold capitalize">{selectedOrder.paymentMethod}</span>
                            </div>
                          )}
                          {selectedOrder.customerEmail && (
                            <div>
                              <span className="text-stone-400 block text-[11px]">Correo Electrónico:</span>
                              <span className="text-stone-300 truncate">{selectedOrder.customerEmail}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Selector Buttons */}
                      <div className="space-y-2">
                        <label className="block text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                          Actualizar Estado del Pedido:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'en_preparacion')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                              selectedOrder.status === 'en_preparacion'
                                ? 'bg-amber-500 text-black border-amber-500 font-black'
                                : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                            }`}
                          >
                            En Preparación
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'en_camino')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                              selectedOrder.status === 'en_camino'
                                ? 'bg-blue-500 text-white border-blue-500 font-black'
                                : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            En Camino
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'entregado')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                              selectedOrder.status === 'entregado'
                                ? 'bg-emerald-500 text-black border-emerald-500 font-black'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            Entregado
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelado')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                              selectedOrder.status === 'cancelado'
                                ? 'bg-rose-600 text-white border-rose-600 font-black'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            Anular
                          </button>
                        </div>
                      </div>

                      {/* Products List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                          <span>Detalle de Productos ({selectedOrder.items?.length || 0}):</span>
                        </div>
                        <div className="bg-[#0e0e11] border border-stone-800 rounded-2xl divide-y divide-stone-800/80 overflow-hidden">
                          {selectedOrder.items?.map((it, i) => (
                            <div key={i} className="p-3 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-6 h-6 rounded-lg bg-amber-400/10 text-[#ffd025] font-black font-mono text-[11px] flex items-center justify-center shrink-0">
                                  {it.quantity}x
                                </span>
                                <span className="text-white font-medium truncate">
                                  {it.productName}
                                </span>
                              </div>
                              <div className="text-right shrink-0 font-mono">
                                <div className="text-[#ffd025] font-bold">
                                  {formatPrice(it.price * it.quantity)}
                                </div>
                                <div className="text-[10px] text-stone-500">
                                  {formatPrice(it.price)} c/u
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total Breakdown */}
                      <div className="bg-[#0e0e11] border border-stone-800 rounded-2xl p-3.5 space-y-1.5 text-xs font-mono">
                        {selectedOrder.subtotal !== undefined && (
                          <div className="flex justify-between text-stone-400">
                            <span>Subtotal:</span>
                            <span>{formatPrice(selectedOrder.subtotal)}</span>
                          </div>
                        )}
                        {selectedOrder.discountAmount !== undefined && selectedOrder.discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-400">
                            <span>Descuento cupón:</span>
                            <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                          </div>
                        )}
                        {selectedOrder.shippingCost !== undefined && (
                          <div className="flex justify-between text-stone-400">
                            <span>Costo de Despacho:</span>
                            <span>{formatPrice(selectedOrder.shippingCost)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-black text-[#ffd025] pt-1.5 border-t border-stone-800">
                          <span>TOTAL A COBRAR:</span>
                          <span>{formatPrice(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="p-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2.5 bg-[#121215]">
                      <button
                        onClick={() => handleCopyOrderWhatsApp(selectedOrder)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                      >
                        <i className="fa-brands fa-whatsapp text-sm"></i>
                        <span>Copiar para WhatsApp</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.print()}
                          className="bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-bold text-xs px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 border border-stone-700 cursor-pointer"
                        >
                          <i className="fa-solid fa-print"></i>
                          <span className="hidden sm:inline">Imprimir</span>
                        </button>
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="bg-[#ffd025] hover:bg-yellow-400 text-black font-black text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 4: ESTADÍSTICAS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                <i className="fa-solid fa-chart-line text-[#ffd025]"></i> Estadísticas & Métricas de Negocio
              </h2>
              <p className="text-xs text-gray-400">
                Resumen de ventas, horas pico, orígenes de tráfico y dispositivos de compra.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-gray-800">
                <div className="text-xs font-bold text-gray-400 mb-1">Total Ventas Facturadas</div>
                <div className="text-2xl font-black text-[#ffd025]">
                  {formatPrice(salesStats.totalRevenue || orders.reduce((s, o) => o.status !== 'cancelado' ? s + o.total : s, 0))}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1">En {orders.length} pedidos</div>
              </div>

              <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-gray-800">
                <div className="text-xs font-bold text-gray-400 mb-1">Visitas Registradas</div>
                <div className="text-2xl font-black text-white">{visitStats.totalVisits}</div>
                <div className="text-[11px] text-emerald-400 mt-1">+{visitStats.todayVisits} hoy</div>
              </div>

              <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-gray-800">
                <div className="text-xs font-bold text-gray-400 mb-1">Ticket Promedio</div>
                <div className="text-2xl font-black text-white">
                  {formatPrice(orders.length > 0 ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 18500)}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">Tasa conversión: {visitStats.conversionRate}%</div>
              </div>

              <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-gray-800">
                <div className="text-xs font-bold text-gray-400 mb-1">Usuarios en Línea</div>
                <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{visitStats.activeUsers} activos</span>
                </div>
                <div className="text-[11px] text-gray-400 mt-1">Navegando el catálogo</div>
              </div>
            </div>

            {/* Distribution Charts info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-gray-800 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase border-b border-gray-800 pb-2">
                  Horas Pico de Pedidos (Alerce & Puerto Montt)
                </h3>
                <div className="space-y-2 text-xs">
                  {[
                    { hour: '20:00 - 21:00', orders: 15, bar: '60%' },
                    { hour: '21:00 - 22:00', orders: 22, bar: '85%' },
                    { hour: '22:00 - 23:00 (Pico)', orders: 28, bar: '100%' },
                    { hour: '23:00 - 00:00', orders: 31, bar: '95%' },
                    { hour: '00:00 - 01:00', orders: 18, bar: '50%' }
                  ].map((h, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-gray-400">
                        <span>{h.hour}</span>
                        <span className="text-white font-bold">{h.orders} pedidos</span>
                      </div>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#ffd025]" style={{ width: h.bar }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-gray-800 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase border-b border-gray-800 pb-2">
                  Dispositivos y Fuentes de Tráfico
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-1">Móvil vs Escritorio:</span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-800 h-3 rounded-full overflow-hidden flex">
                        <div className="bg-[#ffd025] h-full" style={{ width: '78%' }}></div>
                        <div className="bg-blue-500 h-full" style={{ width: '22%' }}></div>
                      </div>
                      <span className="text-white font-bold">78% Móvil</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-800">
                    <span className="text-gray-400 block mb-1">Canales principales:</span>
                    <ul className="space-y-1 text-gray-300">
                      <li>• <strong>WhatsApp y Redes Sociales:</strong> 56%</li>
                      <li>• <strong>Google Maps y Búsqueda Local Alerce:</strong> 32%</li>
                      <li>• <strong>Clientes Frecuentes / Directo:</strong> 12%</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TIENDA ALTERNA (MODO CONTINGENCIA) */}
        {activeTab === 'alt_store' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-[#1a1a1a] p-6 rounded-3xl border border-[#ffd025]/20">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase text-[#ffd025] mb-1">
                  <i className="fa-solid fa-store"></i> Tienda Alterna de Respaldo & Contingencia
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Micropágina Express para Mantención o Alta Demanda
                </h2>
                <p className="text-xs text-gray-300 max-w-2xl mt-1">
                  Activa una versión ligera y enfocada de tu catálogo con los productos más pedidos. Cuando esté activa, será lo primero que verán tus clientes al entrar o vía <strong>/respaldo</strong>.
                </p>
              </div>

              {/* Activation Switch */}
              <div className="flex items-center gap-3 bg-[#141414] border border-gray-700 p-3.5 rounded-2xl shrink-0">
                <div className="text-right">
                  <span className="text-xs font-bold block text-white">Estado del Modo Alterno</span>
                  <span className={`text-[10px] font-bold ${backupStore.enabled ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {backupStore.enabled ? '🟢 ACTIVA Y VISIBLE' : '⚪ DESACTIVADA'}
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-toggle-alt-store"
                  onClick={handleToggleBackupStore}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    backupStore.enabled ? 'bg-emerald-500' : 'bg-gray-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    backupStore.enabled ? 'left-7' : 'left-1'
                  }`}></span>
                </button>
              </div>
            </div>

            {/* GESTIÓN DE PRODUCTOS DISPONIBLES EN MODO ALTERNO (6 POR SECCIÓN) */}
            <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-gray-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-[#ffd025]">
                    <i className="fa-solid fa-list-check"></i>
                    <span>Productos Visibles en Tienda Alterna (6 por sección)</span>
                  </div>
                  <h3 className="text-base font-black text-white mt-1">
                    Selecciona los 6 Productos Visibles por Cada Pasillo
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Cuando la Tienda Alterna está activa, los clientes <strong>no tendrán acceso a toda la página</strong> ni verán botones de "Ver más" ni el área de "Explorar Colecciones & Áreas". Solo podrán ver y comprar estos 6 productos elegidos en cada pasillo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {categories.slice(0, 3).map((cat) => (
                  <div
                    key={`alt-cat-${cat.id}`}
                    className="bg-[#141414] border border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-black text-white flex items-center gap-1.5 truncate">
                          <i className={cat.icon || 'fa-solid fa-box'}></i> {cat.name}
                        </span>
                        <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded shrink-0">
                          {cat.featuredProductIds && cat.featuredProductIds.length > 0
                            ? `${cat.featuredProductIds.length}/6 elegidos`
                            : 'Primeros 6 (Auto)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mb-3">
                        Total en inventario: {cat.products.length} productos.
                      </p>
                    </div>

                    <button
                      type="button"
                      id={`btn-alt-cat-${cat.id}`}
                      onClick={() => {
                        setSelectedFeaturedCategory(cat);
                        setIsFeaturedModalOpen(true);
                      }}
                      className="w-full bg-[#ffd025] hover:bg-yellow-400 text-stone-950 font-black text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95 uppercase tracking-wide"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                      <span>Elegir los 6 Productos</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Config Fields */}
            <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-gray-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase border-b border-gray-800 pb-2">
                Ajustes de la Tienda Alterna
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título de Contingencia</label>
                  <input
                    type="text"
                    value={backupStore.title}
                    onChange={(e) => setBackupStore(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">WhatsApp de Pedidos</label>
                  <input
                    type="text"
                    value={backupStore.whatsappNumber}
                    onChange={(e) => setBackupStore(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Aviso Superior (Banner)</label>
                <textarea
                  rows={2}
                  value={backupStore.bannerNotice}
                  onChange={(e) => setBackupStore(prev => ({ ...prev, bannerNotice: e.target.value }))}
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveBackupStore}
                  className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-6 py-2.5 rounded-xl transition shadow cursor-pointer uppercase"
                >
                  Guardar Configuración Tienda Alterna
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AJUSTES GENERALES */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-[#171719] p-6 sm:p-8 rounded-3xl border border-stone-800 w-full max-w-5xl space-y-6 shadow-xl animate-fade-in">
            <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
              <i className="fa-solid fa-sliders text-[#ffd025]"></i> Personalización del Sistema
            </h2>

            {/* Accesos directos a los Editores Visuales de Secciones */}
            <div className="bg-[#141414] p-4 rounded-2xl border border-gray-800 space-y-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles text-[#ffd025] text-xs"></i>
                <h3 className="text-xs font-black uppercase text-white tracking-wider">
                  Editores de Secciones de la Tienda
                </h3>
              </div>
              <p className="text-[11px] text-gray-400">
                Accede rápidamente a los editores completos de la página principal:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('hero_banner')}
                  className="p-3 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-[#ffd025] text-left transition flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#ffd025]/20 text-[#ffd025] flex items-center justify-center text-xs shrink-0 group-hover:scale-110 transition">
                    <i className="fa-solid fa-images"></i>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">Banner Principal</span>
                    <span className="text-[10px] text-gray-400 block truncate">Slides y carrusel</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('mega_offers')}
                  className="p-3 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-[#ffd025] text-left transition flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs shrink-0 group-hover:scale-110 transition">
                    <i className="fa-solid fa-bolt"></i>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">Promos Tío Fellas</span>
                    <span className="text-[10px] text-gray-400 block truncate">Ofertas y packs</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('footer_editor')}
                  className="p-3 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-[#ffd025] text-left transition flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs shrink-0 group-hover:scale-110 transition">
                    <i className="fa-solid fa-window-maximize"></i>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">Pie de Página</span>
                    <span className="text-[10px] text-gray-400 block truncate">Textos y columnas</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('keep_alive')}
                  className="p-3 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-cyan-400 text-left transition flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs shrink-0 group-hover:scale-110 transition">
                    <i className="fa-solid fa-heart-pulse animate-pulse"></i>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">Anti-Suspensión</span>
                    <span className="text-[10px] text-cyan-300 block truncate">Render 24/7 Always-On</span>
                  </div>
                </button>
              </div>
            </div>

            {/* GOOGLE GEMINI AI - CLASIFICACIÓN INTELIGENTE DE PRODUCTOS */}
            <div className="bg-gradient-to-br from-purple-950/30 via-[#17171a] to-[#121214] p-5 sm:p-6 rounded-3xl border border-purple-500/30 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center text-lg shadow-inner shrink-0">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wide flex items-center gap-2">
                      Conexión Google Gemini AI
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Clasificación semántica de nombres, pasillos, categorías y subcategorías de botillería.
                    </p>
                  </div>
                </div>

                {/* Gemini Status Badge */}
                <div>
                  {geminiStatus.valid ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Gemini Conectado & Listo
                    </span>
                  ) : geminiStatus.configured ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-black uppercase">
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                      Clave Requiere Actualización
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-black uppercase">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Motor Heurístico Activo
                    </span>
                  )}
                </div>
              </div>

              {/* Status Message Info */}
              <div className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 ${
                geminiStatus.valid 
                  ? 'bg-emerald-950/30 border border-emerald-800/50 text-emerald-200' 
                  : geminiStatus.configured 
                  ? 'bg-rose-950/30 border border-rose-800/50 text-rose-200' 
                  : 'bg-amber-950/30 border border-amber-800/50 text-amber-200'
              }`}>
                <i className={`mt-0.5 text-sm ${
                  geminiStatus.valid ? 'fa-solid fa-circle-check text-emerald-400' :
                  geminiStatus.configured ? 'fa-solid fa-triangle-exclamation text-rose-400' :
                  'fa-solid fa-circle-info text-amber-400'
                }`}></i>
                <div className="flex-1 text-[11px] leading-relaxed">
                  <strong>Estado:</strong> {geminiStatus.message}
                  {geminiStatus.keySnippet && (
                    <span className="ml-2 font-mono text-[10px] bg-black/40 px-2 py-0.5 rounded border border-gray-800 text-gray-300">
                      Clave actual: {geminiStatus.keySnippet}
                    </span>
                  )}
                </div>
              </div>

              {/* API Key Input and Action Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase">
                  API Key de Google Gemini (Google AI Studio)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      value={geminiApiKeyInput}
                      onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                      placeholder={geminiStatus.configured ? "Pega aquí una nueva API Key de Gemini..." : "AIzaSy..."}
                      className="w-full bg-[#141414] border border-gray-800 rounded-xl px-3 py-2.5 pr-10 text-xs text-white placeholder-gray-600 focus:border-purple-400 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 text-xs"
                      title={showGeminiKey ? "Ocultar" : "Mostrar"}
                    >
                      <i className={`fa-solid ${showGeminiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestGemini}
                    disabled={isTestingGemini}
                    className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 border border-gray-700 hover:border-gray-600 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer uppercase shrink-0"
                  >
                    <i className={`fa-solid ${isTestingGemini ? 'fa-spinner fa-spin' : 'fa-flask'} text-purple-400`}></i>
                    <span>{isTestingGemini ? 'Probando...' : 'Probar Conexión'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveGeminiKey}
                    disabled={isSavingGeminiKey || !geminiApiKeyInput.trim()}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer uppercase shrink-0 shadow"
                  >
                    <i className={`fa-solid ${isSavingGeminiKey ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
                    <span>{isSavingGeminiKey ? 'Guardando...' : 'Guardar Clave'}</span>
                  </button>
                </div>
              </div>

              {/* Test Result Message Box */}
              {geminiTestFeedback && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  geminiTestFeedback.success 
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                }`}>
                  <i className={`fa-solid ${geminiTestFeedback.success ? 'fa-check' : 'fa-xmark'}`}></i>
                  <span>{geminiTestFeedback.message}</span>
                </div>
              )}

              {/* Big Action: Reorganize entire catalog with AI */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/40 p-3.5 rounded-2xl border border-purple-500/20">
                <div className="text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-wand-magic-sparkles text-[#ffd025]"></i>
                    <span>Reorganizar Catálogo Actual con IA</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Analiza todos los nombres de productos existentes en la tienda y los mueve automáticamente a sus pasillos correctos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReorganizeCatalogWithAi}
                  disabled={isReclassifyingCatalog || (allProducts.length === 0 && megaOffers.length === 0)}
                  className="bg-[#ffd025] hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-xs px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer uppercase shrink-0 shadow-lg"
                >
                  <i className={`fa-solid ${isReclassifyingCatalog ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                  <span>{isReclassifyingCatalog ? 'Reorganizando con IA...' : 'Reorganizar Catálogo Ahora'}</span>
                </button>
              </div>
            </div>

            {/* CLOUDFLARE R2 PERSISTENCE ENGINE - PROTECCIÓN CONTRA REINICIOS */}
            <div className="bg-gradient-to-br from-cyan-950/30 via-[#17171a] to-[#121214] p-5 sm:p-6 rounded-3xl border border-cyan-500/30 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center text-lg shadow-inner shrink-0">
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-wide flex items-center gap-2">
                      Persistencia Cloudflare R2
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                        Respaldo Automático
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Evita que se borren tus productos o imágenes cuando Google AI Studio se reinicia por edición o publicación.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    R2 Always-Protected
                  </span>
                </div>
              </div>

              {/* R2 Status info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#141414] rounded-xl border border-gray-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Bucket R2:</span>
                  <span className="text-white font-mono font-bold">{r2DbStatus.bucketName || 'fellas-market'}</span>
                </div>
                <div className="p-3 bg-[#141414] rounded-xl border border-gray-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Productos Asegurados:</span>
                  <span className="text-[#ffd025] font-bold">{allProducts.length + megaOffers.length} en catálogo</span>
                </div>
                <div className="p-3 bg-[#141414] rounded-xl border border-gray-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Último Respaldo R2:</span>
                  <span className="text-cyan-300 font-mono text-[11px] truncate block">
                    {r2DbStatus.lastSyncTime ? new Date(r2DbStatus.lastSyncTime).toLocaleString('es-CL') : 'Automático'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                Cada vez que agregas productos, importas desde Excel, actualizas precios o cambias fotos, el sistema guarda de inmediato una copia en Cloudflare R2. Al reiniciar la app en Google AI Studios, el servidor descarga y restituye automáticamente todos tus datos.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSyncR2Now}
                  disabled={isSyncingR2}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer uppercase shadow"
                >
                  <i className={`fa-solid ${isSyncingR2 ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}></i>
                  <span>{isSyncingR2 ? 'Sincronizando...' : 'Asegurar en R2 Ahora'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreR2Now}
                  disabled={isRestoringR2}
                  className="bg-gray-800 hover:bg-gray-700 text-cyan-200 border border-cyan-800/60 font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer uppercase shadow"
                >
                  <i className={`fa-solid ${isRestoringR2 ? 'fa-spinner fa-spin' : 'fa-rotate-left'}`}></i>
                  <span>{isRestoringR2 ? 'Restaurando...' : 'Restaurar desde Cloudflare R2'}</span>
                </button>
              </div>
            </div>

            {/* Browser Tab Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-300 uppercase border-b border-gray-800 pb-2">
                Pestaña del Navegador
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título de la Página</label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ícono Favicon</label>
                <input
                  type="text"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                />
              </div>
            </div>

            {/* Logo & Marca (PNG desktop upload & texto alternativo) */}
            <div className="space-y-4 pt-3 border-t border-gray-800">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-300 uppercase">
                    Logo de la Página (Imagen PNG)
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Sube tu logo en formato PNG directamente desde tu escritorio para mostrarlo en el encabezado principal de la tienda.
                  </p>
                </div>
                {formSettings.logoImage && (
                  <button
                    type="button"
                    onClick={() => setFormSettings({ ...formSettings, logoImage: '' })}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                  >
                    <i className="fa-solid fa-trash"></i>
                    <span>Quitar logo PNG</span>
                  </button>
                )}
              </div>

              {/* Upload Dropzone from Desktop */}
              <input
                type="file"
                ref={logoFileInputRef}
                accept="image/png, image/*"
                className="hidden"
                onChange={handleLogoFileUpload}
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                onDragLeave={() => setIsDraggingLogo(false)}
                onDrop={handleLogoDrop}
                onClick={() => logoFileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center text-center gap-3 ${
                  isDraggingLogo
                    ? 'border-[#ffd025] bg-[#ffd025]/10'
                    : 'border-gray-700 bg-[#141414] hover:border-gray-600 hover:bg-[#161616]'
                }`}
              >
                {formSettings.logoImage ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#181818] rounded-xl border border-gray-800 inline-block">
                      <img
                        src={formSettings.logoImage}
                        alt="Logo cargado"
                        className="h-14 max-w-full object-contain mx-auto"
                      />
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-bold">
                        <i className="fa-solid fa-check"></i>
                        Logo PNG activo en encabezado
                      </span>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Haz clic o arrastra otra imagen para reemplazarla
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-[#ffd025]/15 border border-[#ffd025]/30 text-[#ffd025] flex items-center justify-center text-xl">
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Haz clic para subir tu logo PNG desde tu escritorio
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        o arrastra y suelta tu archivo PNG aquí (formato transparente recomendado)
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs rounded-xl shadow cursor-pointer uppercase flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-folder-open"></i>
                      <span>Explorar Escritorio</span>
                    </button>
                  </>
                )}
              </div>

              {/* URL o texto de respaldo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    O pegar URL de imagen PNG
                  </label>
                  <input
                    type="text"
                    value={formSettings.logoImage || ''}
                    onChange={(e) => setFormSettings({ ...formSettings, logoImage: e.target.value })}
                    placeholder="https://ejemplo.com/logo.png"
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Texto alternativo (fallback si no hay PNG)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formSettings.logoTextPrimary}
                      onChange={(e) => setFormSettings({ ...formSettings, logoTextPrimary: e.target.value })}
                      placeholder="FELLA'S"
                      className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                    />
                    <input
                      type="text"
                      value={formSettings.logoTextAccent}
                      onChange={(e) => setFormSettings({ ...formSettings, logoTextAccent: e.target.value })}
                      placeholder="MARKET"
                      className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Acceso Rápido al Panel de Delivery */}
            {onOpenDelivery && (
              <div className="p-4 bg-blue-950/40 border border-blue-600/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg shrink-0">
                    <i className="fa-solid fa-motorcycle"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white">Panel de Pedidos & Repartidores</h4>
                    <p className="text-[11px] text-blue-200">
                      Acceso exclusivo para repartidores (usuario: <code className="bg-black/40 px-1 py-0.5 rounded text-yellow-400 font-mono">delivery</code>) para gestionar y despachar pedidos en tiempo real.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenDelivery}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2 rounded-xl transition shadow flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  <span>Abrir Panel de Delivery</span>
                </button>
              </div>
            )}

            {/* Zonas y Tarifas Fijas de Delivery */}
            <div className="space-y-4 pt-3 border-t border-gray-800">
              <div>
                <h3 className="text-sm font-bold text-gray-300 uppercase flex items-center gap-2">
                  <i className="fa-solid fa-map-location-dot text-[#ffd025]"></i>
                  <span>Ubicaciones y Tarifas Fijas de Delivery ({((formSettings.deliveryLocations && formSettings.deliveryLocations.length > 0) ? formSettings.deliveryLocations : getDeliveryLocations(formSettings)).length})</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Define el costo específico de envío y tiempo estimado de entrega para cada sector o comuna.
                </p>
              </div>

              {/* Formulario para agregar nueva ubicación */}
              <div className="bg-[#141414] p-4 rounded-2xl border border-gray-800 space-y-3">
                <span className="text-[11px] font-bold text-gray-300 uppercase block">Agregar Nueva Ubicación:</span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      value={newLocName}
                      onChange={(e) => setNewLocName(e.target.value)}
                      placeholder="Nombre (ej: Alerce Norte, Valle Volcanes, Mirasol...)"
                      className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025] outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={newLocPrice}
                        onChange={(e) => setNewLocPrice(Number(e.target.value))}
                        placeholder="Tarifa CLP"
                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl pl-7 pr-3 py-2.5 text-xs text-white focus:border-[#ffd025] outline-none font-bold"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-3 flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="5"
                        step="5"
                        value={newLocMinutes}
                        onChange={(e) => setNewLocMinutes(Number(e.target.value))}
                        placeholder="Minutos"
                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#ffd025] outline-none"
                      />
                      <span className="absolute right-2.5 top-2.5 text-[10px] text-gray-400">min</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddLocation}
                      className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <i className="fa-solid fa-plus"></i>
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de ubicaciones configuradas */}
              <div className="space-y-2">
                {((formSettings.deliveryLocations && formSettings.deliveryLocations.length > 0)
                  ? formSettings.deliveryLocations
                  : getDeliveryLocations(formSettings)
                ).map((loc) => (
                  <div
                    key={loc.id || loc.name}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#141414] border border-gray-800 rounded-2xl hover:border-gray-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center text-[#ffd025] text-sm shrink-0">
                        <i className="fa-solid fa-location-dot"></i>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{loc.name}</span>
                        <span className="text-[10px] text-gray-400">Entrega estimada: ~{loc.estimatedMinutes || 45} min</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-xl border border-gray-700">
                        <span className="text-[10px] text-gray-400 font-medium">Tarifa:</span>
                        <span className="text-xs text-[#ffd025] font-black">$</span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={loc.price}
                          onChange={(e) => handleUpdateLocationPrice(loc.id, loc.name, Number(e.target.value))}
                          className="w-20 bg-transparent text-white font-black text-xs outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-[#1a1a1a] px-2 py-1 rounded-xl border border-gray-700">
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={loc.estimatedMinutes || 45}
                          onChange={(e) => handleUpdateLocationMinutes(loc.id, loc.name, Number(e.target.value))}
                          className="w-12 bg-transparent text-white text-xs outline-none text-right font-medium"
                        />
                        <span className="text-[10px] text-gray-400">min</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(loc.id, loc.name)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition cursor-pointer text-xs"
                        title="Eliminar ubicación"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Horario de Cierre y Atención Comercial por Día */}
            <div className="space-y-5 pt-6 border-t border-stone-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-[#171719] to-[#141416] rounded-2xl border border-stone-800 shadow-sm">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="w-8 h-8 rounded-xl bg-yellow-400/10 text-[#ffd025] flex items-center justify-center text-sm border border-yellow-400/20 shrink-0">
                      <i className="fa-solid fa-clock"></i>
                    </span>
                    <h3 className="text-sm font-black text-white uppercase tracking-wide">
                      Horario de Cierre y Atención por Día
                    </h3>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed max-w-2xl">
                    Define las ventanas de apertura y cierre para cada día de la semana. Si la botillería está fuera de horario, el sistema bloqueará compras al carrito y mostrará tu aviso personalizado.
                  </p>
                </div>

                {/* Master switch */}
                <div className="flex items-center justify-between sm:justify-end gap-3 bg-[#0f0f10] border border-stone-700/80 px-4 py-2.5 rounded-xl shrink-0">
                  <span className="text-xs font-bold text-stone-300">
                    {formSettings.scheduleConfig?.enabled ?? true ? 'Restricción Activa' : 'Sin Restricción'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentSched = formSettings.scheduleConfig || DEFAULT_STORE_SCHEDULE;
                      const isCurrentlyEnabled = formSettings.scheduleConfig?.enabled ?? true;
                      setFormSettings({
                        ...formSettings,
                        scheduleConfig: {
                          ...currentSched,
                          enabled: !isCurrentlyEnabled
                        }
                      });
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      (formSettings.scheduleConfig?.enabled ?? true) ? 'bg-emerald-500' : 'bg-stone-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        (formSettings.scheduleConfig?.enabled ?? true) ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Selector de Modo Manual & Mensaje */}
              <div className="bg-[#161618] p-4 sm:p-5 rounded-2xl border border-stone-800 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                    Estado de Atención y Anulación Manual:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Auto */}
                    <button
                      type="button"
                      onClick={() => {
                        const currentSched = formSettings.scheduleConfig || DEFAULT_STORE_SCHEDULE;
                        setFormSettings({
                          ...formSettings,
                          scheduleConfig: { ...currentSched, manualOverride: 'auto' }
                        });
                      }}
                      className={`p-3.5 rounded-xl text-left transition-all border flex items-center gap-3 cursor-pointer ${
                        (!formSettings.scheduleConfig?.manualOverride || formSettings.scheduleConfig.manualOverride === 'auto')
                          ? 'bg-[#ffd025]/10 border-[#ffd025] text-white shadow-sm shadow-yellow-500/10'
                          : 'bg-[#101011] border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-900'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                        (!formSettings.scheduleConfig?.manualOverride || formSettings.scheduleConfig.manualOverride === 'auto')
                          ? 'bg-[#ffd025] text-[#141414] font-black'
                          : 'bg-stone-800 text-stone-400'
                      }`}>
                        <i className="fa-solid fa-calendar-check"></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-white truncate">Automático</span>
                          {(!formSettings.scheduleConfig?.manualOverride || formSettings.scheduleConfig.manualOverride === 'auto') && (
                            <span className="w-2 h-2 rounded-full bg-[#ffd025] shrink-0 animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 truncate">Según horario semanal</p>
                      </div>
                    </button>

                    {/* Force Open */}
                    <button
                      type="button"
                      onClick={() => {
                        const currentSched = formSettings.scheduleConfig || DEFAULT_STORE_SCHEDULE;
                        setFormSettings({
                          ...formSettings,
                          scheduleConfig: { ...currentSched, manualOverride: 'force_open' }
                        });
                      }}
                      className={`p-3.5 rounded-xl text-left transition-all border flex items-center gap-3 cursor-pointer ${
                        formSettings.scheduleConfig?.manualOverride === 'force_open'
                          ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                          : 'bg-[#101011] border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-900'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                        formSettings.scheduleConfig?.manualOverride === 'force_open'
                          ? 'bg-emerald-500 text-white font-black'
                          : 'bg-stone-800 text-stone-400'
                      }`}>
                        <i className="fa-solid fa-door-open"></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-white truncate">Forzar Abierto</span>
                          {formSettings.scheduleConfig?.manualOverride === 'force_open' && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 truncate">Atención continua 24/7</p>
                      </div>
                    </button>

                    {/* Force Closed */}
                    <button
                      type="button"
                      onClick={() => {
                        const currentSched = formSettings.scheduleConfig || DEFAULT_STORE_SCHEDULE;
                        setFormSettings({
                          ...formSettings,
                          scheduleConfig: { ...currentSched, manualOverride: 'force_closed' }
                        });
                      }}
                      className={`p-3.5 rounded-xl text-left transition-all border flex items-center gap-3 cursor-pointer ${
                        formSettings.scheduleConfig?.manualOverride === 'force_closed'
                          ? 'bg-rose-500/10 border-rose-500 text-white shadow-sm shadow-rose-500/10'
                          : 'bg-[#101011] border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-900'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                        formSettings.scheduleConfig?.manualOverride === 'force_closed'
                          ? 'bg-rose-600 text-white font-black'
                          : 'bg-stone-800 text-stone-400'
                      }`}>
                        <i className="fa-solid fa-lock"></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-white truncate">Forzar Cerrado</span>
                          {formSettings.scheduleConfig?.manualOverride === 'force_closed' && (
                            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 truncate">Pausa temporal de ventas</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Mensaje al cliente */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-stone-300 uppercase">
                    Mensaje de local cerrado (visible para clientes al intentar comprar):
                  </label>
                  <input
                    type="text"
                    value={formSettings.scheduleConfig?.closedMessage || ''}
                    onChange={(e) => {
                      const currentSched = formSettings.scheduleConfig || DEFAULT_STORE_SCHEDULE;
                      setFormSettings({
                        ...formSettings,
                        scheduleConfig: { ...currentSched, closedMessage: e.target.value }
                      });
                    }}
                    placeholder="Ej: Nuestra botillería se encuentra cerrada en este momento. Revisa nuestro horario semanal de atención."
                    className="w-full bg-[#101011] border border-stone-700 hover:border-stone-600 focus:border-[#ffd025] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition placeholder-stone-500"
                  />
                </div>

                {/* Atajos rápidos */}
                <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
                    <i className="fa-solid fa-wand-magic-sparkles text-[#ffd025] text-xs"></i>
                    <span>Atajos Rápidos:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyTimeToAllDays('12:00', '02:00')}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs px-3 py-1.5 rounded-xl border border-stone-700 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <i className="fa-regular fa-clock text-[10px] text-yellow-400"></i>
                    <span>12:00 a 02:00 (Estándar)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTimeToAllDays('12:00', '04:00')}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs px-3 py-1.5 rounded-xl border border-stone-700 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <i className="fa-regular fa-moon text-[10px] text-indigo-400"></i>
                    <span>12:00 a 04:00 (Nocturno)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTimeToAllDays('11:00', '00:00')}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs px-3 py-1.5 rounded-xl border border-stone-700 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <i className="fa-regular fa-sun text-[10px] text-amber-400"></i>
                    <span>11:00 a 00:00 (Diurno)</span>
                  </button>
                </div>
              </div>

              {/* Días de la semana en grid espacioso de 2 columnas donde NUNCA desborda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formSettings.scheduleConfig?.days || DEFAULT_STORE_SCHEDULE.days).map((daySched, idx) => {
                  const isOvernight = daySched.closeTime < daySched.openTime;
                  return (
                    <div
                      key={daySched.day}
                      className={`p-4 rounded-2xl border transition-all ${
                        daySched.isOpen
                          ? 'bg-[#161618] border-stone-800 hover:border-stone-700 shadow-sm'
                          : 'bg-[#121213]/90 border-stone-900 opacity-65'
                      }`}
                    >
                      {/* Cabecera del día */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-800/80">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            daySched.isOpen 
                              ? 'bg-yellow-400/10 text-[#ffd025] border border-yellow-400/20' 
                              : 'bg-stone-800 text-stone-500'
                          }`}>
                            {daySched.label.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-black text-white">{daySched.label}</span>
                              {isOvernight && daySched.isOpen && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/25 whitespace-nowrap">
                                  🌙 Madrugada
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Toggle Abierto / Cerrado */}
                        <button
                          type="button"
                          onClick={() => handleUpdateDaySchedule(idx, 'isOpen', !daySched.isOpen)}
                          className={`px-3 py-1 rounded-full text-[11px] font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                            daySched.isOpen
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${daySched.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`}></span>
                          <span>{daySched.isOpen ? 'Abierto' : 'Cerrado'}</span>
                        </button>
                      </div>

                      {/* Configuración de horas */}
                      <div className="pt-3">
                        {daySched.isOpen ? (
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              {/* Apertura */}
                              <div className="flex-1 min-w-[120px]">
                                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1 flex items-center gap-1">
                                  <i className="fa-regular fa-sun text-yellow-400/80 text-[10px]"></i>
                                  <span>Apertura</span>
                                </label>
                                <input
                                  type="time"
                                  value={daySched.openTime}
                                  onChange={(e) => handleUpdateDaySchedule(idx, 'openTime', e.target.value)}
                                  className="w-full bg-[#101011] border border-stone-700 hover:border-stone-600 focus:border-[#ffd025] rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none transition"
                                />
                              </div>

                              <div className="hidden sm:flex items-center text-stone-600 pt-5">
                                <i className="fa-solid fa-arrow-right text-xs"></i>
                              </div>

                              {/* Cierre */}
                              <div className="flex-1 min-w-[120px]">
                                <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1 flex items-center gap-1">
                                  <i className="fa-regular fa-moon text-indigo-400 text-[10px]"></i>
                                  <span>Cierre</span>
                                </label>
                                <input
                                  type="time"
                                  value={daySched.closeTime}
                                  onChange={(e) => handleUpdateDaySchedule(idx, 'closeTime', e.target.value)}
                                  className="w-full bg-[#101011] border border-stone-700 hover:border-stone-600 focus:border-[#ffd025] rounded-xl px-2.5 py-1.5 text-xs text-white font-mono outline-none transition"
                                />
                              </div>
                            </div>

                            {/* Detalle y copiar */}
                            <div className="flex items-center justify-between text-[11px] text-stone-400 pt-0.5">
                              <span className="font-mono text-stone-300">
                                Horario: <strong className="text-[#ffd025]">{daySched.openTime}</strong> a <strong className="text-[#ffd025]">{daySched.closeTime} hrs</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleApplyTimeToAllDays(daySched.openTime, daySched.closeTime)}
                                className="text-[10px] text-stone-400 hover:text-[#ffd025] underline cursor-pointer transition"
                                title="Copiar este horario a todos los demás días"
                              >
                                Copiar a todos
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-3 px-3 rounded-xl bg-stone-900/60 border border-stone-800/60 flex items-center justify-between text-xs text-stone-400">
                            <div className="flex items-center gap-2">
                              <i className="fa-solid fa-ban text-stone-500 text-xs"></i>
                              <span>Local cerrado todo este día</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUpdateDaySchedule(idx, 'isOpen', true)}
                              className="text-[11px] text-[#ffd025] hover:underline font-bold cursor-pointer"
                            >
                              Habilitar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact & Footer */}
            <div className="space-y-3 pt-3 border-t border-gray-800">
              <h3 className="text-sm font-bold text-gray-300 uppercase border-b border-gray-800 pb-2">
                Datos del Pie de Página (Footer)
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Dirección del Local</label>
                <input
                  type="text"
                  value={formSettings.contactAddress}
                  onChange={(e) => setFormSettings({ ...formSettings, contactAddress: e.target.value })}
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={formSettings.contactPhone}
                    onChange={(e) => setFormSettings({ ...formSettings, contactPhone: e.target.value })}
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={formSettings.contactEmail}
                    onChange={(e) => setFormSettings({ ...formSettings, contactEmail: e.target.value })}
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 flex justify-end">
              <button
                type="submit"
                className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-6 py-2.5 rounded-xl transition shadow"
              >
                Guardar Ajustes
              </button>
            </div>
          </form>
        )}

        {/* TAB 7: POPUP SUSCRIPCIÓN */}
        {activeTab === 'popup' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-[#1a1a1a] p-6 rounded-3xl border border-[#ffd025]/20">
              <div>
                <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                  <i className="fa-solid fa-envelope-open-text text-[#ffd025]"></i> Popup de Suscripción & Captura de Clientes
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Configura la ventana emergente para capturar emails de nuevos visitantes ofreciendo un descuento.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[#141414] border border-gray-700 p-3 rounded-2xl">
                <span className="text-xs font-bold">{subscriptionPopup.enabled ? '🟢 Activo' : '⚪ Desactivado'}</span>
                <button
                  type="button"
                  onClick={() => setSubscriptionPopup(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    subscriptionPopup.enabled ? 'bg-emerald-500' : 'bg-gray-700'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    subscriptionPopup.enabled ? 'left-6' : 'left-0.5'
                  }`}></span>
                </button>
              </div>
            </div>

            {/* Popup preview & inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-gray-800 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título</label>
                  <input
                    type="text"
                    value={subscriptionPopup.title}
                    onChange={(e) => setSubscriptionPopup(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Insignia de Descuento</label>
                  <input
                    type="text"
                    value={subscriptionPopup.discountBadge}
                    onChange={(e) => setSubscriptionPopup(prev => ({ ...prev, discountBadge: e.target.value }))}
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Subtítulo / Mensaje</label>
                  <textarea
                    rows={3}
                    value={subscriptionPopup.subtitle}
                    onChange={(e) => setSubscriptionPopup(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Configuración de Popup guardada')}
                  className="bg-[#ffd025] text-[#141414] font-black text-xs px-5 py-2.5 rounded-xl uppercase hover:bg-yellow-400 transition"
                >
                  Guardar Popup
                </button>
              </div>

              {/* Visual Preview */}
              <div className="bg-[#141414] p-6 rounded-3xl border border-dashed border-gray-700 flex flex-col justify-center items-center text-center">
                <span className="text-[10px] text-gray-500 uppercase font-bold mb-4">Vista Previa Popup:</span>
                <div className="bg-[#1a1a1a] border border-[#ffd025]/40 rounded-2xl p-6 max-w-sm shadow-2xl space-y-3">
                  <span className="bg-[#ffd025] text-[#141414] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                    {subscriptionPopup.discountBadge}
                  </span>
                  <h3 className="text-base font-black text-white">{subscriptionPopup.title}</h3>
                  <p className="text-xs text-gray-400">{subscriptionPopup.subtitle}</p>
                  <div className="pt-2">
                    <button className="w-full bg-[#ffd025] text-[#141414] font-black text-xs py-2 rounded-xl">
                      {subscriptionPopup.buttonText}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: COMMUNITY & REDES SOCIALES */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                <i className="fa-solid fa-share-nodes text-[#ffd025]"></i> Community & Publicación en Redes
              </h2>
              <p className="text-xs text-gray-400">
                Copia fichas y promociones ya formateadas con enlaces directos para publicar en estados de WhatsApp, Instagram o Facebook.
              </p>
            </div>

            <div className="relative max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-500 text-xs"></i>
              <input
                type="text"
                value={socialSearch}
                onChange={(e) => setSocialSearch(e.target.value)}
                placeholder="Buscar producto para compartir..."
                className="w-full bg-[#1a1a1a] text-white text-xs rounded-xl pl-9 pr-3 py-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {allProducts
                .filter(p => p.name.toLowerCase().includes(socialSearch.toLowerCase()))
                .map(prod => (
                  <div key={prod.id} className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                    <div className="flex gap-3">
                      <img src={prod.image} alt={prod.name} className="w-14 h-14 rounded-xl object-contain bg-[#141414] shrink-0 p-1" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                        <div className="text-[11px] text-[#ffd025] font-black">{formatPrice(prod.price)}</div>
                        <div className="text-[10px] text-gray-400">{prod.subcategory}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-800">
                      <button
                        onClick={() => handleCopySocialPost(prod)}
                        className={`w-full text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                          copiedProductId === prod.id
                            ? 'bg-emerald-500 text-black'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        <i className="fa-brands fa-whatsapp"></i>
                        <span>{copiedProductId === prod.id ? '¡Copiado para WhatsApp!' : 'Copiar Texto para WhatsApp'}</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 9: CLIENTES & CUPONES */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                  <i className="fa-solid fa-users text-[#ffd025]"></i> Clientes & Cupones de Descuento
                </h2>
                <p className="text-xs text-gray-400">
                  Crea códigos de descuento exclusivos, administra suscriptores y visualiza el historial de compradores.
                </p>
              </div>
              <button
                onClick={() => setIsDiscountModalOpen(true)}
                className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow uppercase"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Nuevo Cupón</span>
              </button>
            </div>

            {/* Discount Codes Table */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-gray-800 font-bold text-xs uppercase text-gray-300">
                Cupones Activos
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141414] text-gray-400 uppercase font-bold border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Descuento</th>
                    <th className="py-3 px-4">Mínimo de Compra</th>
                    <th className="py-3 px-4">Usos Restantes</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-200">
                  {discounts.map(disc => (
                    <tr key={disc.id} className="hover:bg-gray-800/40">
                      <td className="py-3 px-4 font-mono font-black text-[#ffd025]">{disc.code}</td>
                      <td className="py-3 px-4 font-bold text-white">
                        {disc.type === 'percentage' ? `${disc.amount}% OFF` : `$${disc.amount.toLocaleString('es-CL')} OFF`}
                      </td>
                      <td className="py-3 px-4 text-gray-400">${disc.minOrder?.toLocaleString('es-CL') || 0}</td>
                      <td className="py-3 px-4 text-gray-400">{disc.usesLeft || 'Ilimitado'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          disc.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {disc.active ? 'ACTIVO' : 'PAUSADO'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleDiscount(disc.id, !disc.active)}
                          className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
                        >
                          {disc.active ? 'Pausar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 10: COMENTARIOS Y RECLAMOS (FEEDBACK) */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                  <i className="fa-solid fa-comments text-[#ffd025]"></i> Feedback, Comentarios y Reclamos
                </h2>
                <p className="text-xs text-gray-400">
                  Bandeja de entrada de mensajes enviados por clientes desde la tienda o formulario de atención.
                </p>
              </div>

              {/* Status filter pills */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFeedbackFilter('ALL')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${
                    feedbackFilter === 'ALL' ? 'bg-[#ffd025] text-[#141414]' : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  Todos ({feedbackList.length})
                </button>
                <button
                  onClick={() => setFeedbackFilter('pendiente')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition ${
                    feedbackFilter === 'pendiente' ? 'bg-[#ffd025] text-[#141414]' : 'bg-gray-800 text-amber-400'
                  }`}
                >
                  Pendientes ({feedbackList.filter(f => f.status === 'pendiente').length})
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {feedbackList
                .filter(f => feedbackFilter === 'ALL' || f.status === feedbackFilter)
                .map(item => (
                  <div key={item.id} className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          item.type === 'reclamo' ? 'bg-red-500/20 text-red-400' :
                          item.type === 'felicitacion' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {item.type}
                        </span>
                        <span className="font-bold text-white text-xs">{item.name}</span>
                        {item.phone && <span className="text-gray-400 text-xs">• {item.phone}</span>}
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'pendiente' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 bg-[#141414] p-3 rounded-xl border border-gray-800">
                      "{item.message}"
                    </p>

                    <div className="flex justify-between items-center text-[11px] text-gray-500 pt-1">
                      <span>{item.email} • {new Date(item.createdAt).toLocaleDateString()}</span>
                      {item.status === 'pendiente' ? (
                        <button
                          onClick={() => handleUpdateFeedbackStatus(item.id, 'resuelto')}
                          className="bg-emerald-500/20 hover:bg-emerald-500 hover:text-black text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold transition"
                        >
                          Marcar como Resuelto
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateFeedbackStatus(item.id, 'pendiente')}
                          className="text-gray-500 hover:text-white text-xs"
                        >
                          Reabrir
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 11: COMPRESOR DE FOTOS (Fellas Market tool) */}
        {activeTab === 'compressor' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-[#ffd025]/20 max-w-2xl space-y-4">
              <div>
                <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                  <i className="fa-solid fa-bolt text-[#ffd025]"></i> Compresor de Fotos Express
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Reduce el peso de las fotos de tus productos sin perder calidad antes de subirlas al catálogo para que la página cargue ultra rápido en celulares.
                </p>
              </div>

              {/* Upload input */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 hover:border-[#ffd025] rounded-2xl p-8 text-center cursor-pointer transition bg-[#141414]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  className="hidden"
                />
                <i className="fa-solid fa-cloud-arrow-up text-3xl text-[#ffd025] mb-2 block"></i>
                <span className="text-xs font-bold text-white block">Haz clic para seleccionar una foto</span>
                <span className="text-[11px] text-gray-500">Formatos soportados: JPG, PNG, WEBP</span>
              </div>

              {/* Results & Comparison */}
              {compressedImagePreview && (
                <div className="space-y-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between text-xs bg-[#141414] p-3 rounded-xl border border-gray-800">
                    <div>
                      <span className="text-gray-400">Peso Original:</span>
                      <div className="text-sm font-bold text-white">{Math.round(originalFileSize / 1024)} KB</div>
                    </div>
                    <i className="fa-solid fa-arrow-right text-gray-600"></i>
                    <div>
                      <span className="text-gray-400">Peso Optimizado:</span>
                      <div className="text-sm font-black text-emerald-400">{Math.round(compressedFileSize / 1024)} KB</div>
                    </div>
                    <div className="text-right">
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-1 rounded-full">
                        -{Math.round((1 - compressedFileSize / originalFileSize) * 100)}% REDUCIDO
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center p-2 bg-[#141414] rounded-2xl border border-gray-800 max-h-64 overflow-hidden">
                    <img src={compressedImagePreview} alt="Comprimida" className="object-contain max-h-60 rounded-xl" />
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleUploadCompressedToR2}
                      disabled={isUploadingToR2}
                      className="bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/50 font-black text-xs px-4 py-2.5 rounded-xl transition shadow inline-flex items-center gap-2 cursor-pointer"
                      title="Sube la foto optimizada a Cloudflare R2 y copia el enlace web al portapapeles"
                    >
                      <i className={`fa-solid ${isUploadingToR2 ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up text-amber-400'}`}></i>
                      <span>{isUploadingToR2 ? 'Subiendo a Cloudflare R2...' : 'Guardar en Cloudflare R2 y Copiar URL'}</span>
                    </button>

                    <a
                      href={compressedImagePreview}
                      download={`fellas-optimizada-${Date.now()}.jpg`}
                      className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-5 py-2.5 rounded-xl transition shadow inline-flex items-center gap-2"
                    >
                      <i className="fa-solid fa-download"></i> Descargar Foto Comprimida
                    </a>
                  </div>

                  {uploadedR2Url && (
                    <div className="bg-[#141414] border border-amber-500/40 p-3 rounded-2xl flex items-center justify-between gap-2 animate-fade-in">
                      <div className="flex items-center gap-2 min-w-0">
                        <i className="fa-solid fa-circle-check text-emerald-400 shrink-0"></i>
                        <div className="min-w-0">
                          <span className="text-[10px] text-gray-400 block">URL permanente en la nube:</span>
                          <span className="text-xs text-amber-300 font-mono truncate block">{uploadedR2Url}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(uploadedR2Url);
                          showToast('¡Enlace copiado al portapapeles!');
                        }}
                        className="bg-[#ffd025] hover:bg-yellow-400 text-black font-bold text-xs px-3 py-1.5 rounded-xl shrink-0 cursor-pointer shadow"
                      >
                        Copiar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 12: RESPALDO & NUBE (Exact like fellasmarket.cl) */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-[#ffd025]/20 max-w-2xl space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-black uppercase text-white flex items-center gap-2">
                  <i className="fa-solid fa-shield-halved text-[#ffd025]"></i> Respaldo & Seguridad en la Nube
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Exporta una copia completa de tu inventario, pedidos, zonas y configuraciones en formato JSON, o restaura la tienda con un solo clic.
                </p>
              </div>

              {/* System Cloud Status */}
              <div className="bg-[#141414] p-4 rounded-2xl border border-gray-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Estado del Servidor:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> ONLINE (Latencia: {systemStatus.apiLatencyMs}ms)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Espejo Local de Base de Datos:</span>
                  <span className="text-white font-mono">{systemStatus.database}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Última Sincronización:</span>
                  <span className="text-gray-300 font-mono">{systemStatus.lastPing}</span>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#141414] rounded-2xl border border-gray-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Descargar Respaldo JSON</h4>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Genera un archivo JSON con todos los productos, fotos, precios, categorías y pedidos guardados en el sistema.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadBackup}
                    disabled={isExporting}
                    className="w-full bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer uppercase"
                  >
                    <i className="fa-solid fa-download"></i>
                    <span>{isExporting ? 'Exportando...' : 'Descargar JSON'}</span>
                  </button>
                </div>

                <div className="p-4 bg-[#141414] rounded-2xl border border-gray-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Restaurar Base de Datos</h4>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Sube un archivo de respaldo previo para restaurar catálogo completo, categorías y ajustes al instante.
                    </p>
                  </div>
                  <input
                    ref={restoreInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackupFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => restoreInputRef.current?.click()}
                    disabled={isRestoring}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white font-black text-xs py-2.5 rounded-xl transition border border-gray-700 flex items-center justify-center gap-2 cursor-pointer uppercase"
                  >
                    <i className="fa-solid fa-upload"></i>
                    <span>{isRestoring ? 'Restaurando...' : 'Subir Archivo JSON'}</span>
                  </button>
                </div>
              </div>

              {/* CLOUDFLARE R2 PERSISTENCE SYNC IN BACKUP TAB */}
              <div className="p-5 bg-gradient-to-r from-cyan-950/40 via-[#141414] to-[#121214] rounded-2xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-cloud-arrow-up text-cyan-400 text-lg"></i>
                    <h4 className="text-xs font-black uppercase text-white">Sincronización Cloudflare R2 (Automática)</h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {r2DbStatus.bucketName || 'fellas-market'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Tus productos e imágenes se guardan automáticamente en Cloudflare R2. Al reiniciar la app en Google AI Studio, los datos se recargan automáticamente sin que pierdas tus modificaciones.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSyncR2Now}
                    disabled={isSyncingR2}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer uppercase shadow"
                  >
                    <i className={`fa-solid ${isSyncingR2 ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}></i>
                    <span>Asegurar en R2 Ahora</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestoreR2Now}
                    disabled={isRestoringR2}
                    className="bg-gray-800 hover:bg-gray-700 text-cyan-200 border border-cyan-700/60 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer uppercase shadow"
                  >
                    <i className={`fa-solid ${isRestoringR2 ? 'fa-spinner fa-spin' : 'fa-rotate-left'}`}></i>
                    <span>Restaurar Catálogo desde R2</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 13: ANTI-SUSPENSIÓN (RENDER 24/7 ALWAYS-ON) */}
        {activeTab === 'keep_alive' && (
          <KeepAliveEditor
            settings={formSettings}
            onUpdateSettings={setFormSettings}
            showToast={showToast}
          />
        )}

        </div>
      </main>

      {/* 4. MODAL: ESTUDIO PHOTOSHOOT IA (1.85:1 #141414) - Exact from fellasmarket.cl */}
      {isPhotoshootModalOpen && photoshootProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-[#141414] border border-[#ffd025]/30 rounded-3xl w-full max-w-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPhotoshootModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-black uppercase text-white tracking-wide">
                Estudio Photoshoot IA (1.85:1)
              </h3>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Gemini Conectado
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#ffd025]/20 border border-[#ffd025]/40 text-[#ffd025] text-[10px] font-black uppercase">
                Cerámica #141414
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Genera fotos hiperrealistas de tus botellas y productos centrados sobre cerámica oscura #141414 con decorativos naturales.
            </p>

            <div className="space-y-4">
              <div className="p-3 bg-[#1a1a1a] rounded-xl border border-gray-800 text-xs">
                <span className="text-gray-400">Producto Seleccionado:</span>
                <div className="text-sm font-bold text-white mt-0.5">{photoshootProduct.name}</div>
                <div className="text-gray-400 text-[11px]">{photoshootProduct.subcategory} • {formatPrice(photoshootProduct.price)}</div>
              </div>

              {/* Photo Preview Container */}
              <div className="w-full aspect-[1.85/1] bg-[#1a1a1a] rounded-2xl border border-dashed border-gray-700 flex items-center justify-center overflow-hidden relative">
                {generatedPhotoUrl ? (
                  <img src={generatedPhotoUrl} alt="Photoshoot IA" className="w-full h-full object-cover" />
                ) : isGeneratingPhoto ? (
                  <div className="text-center space-y-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-3xl text-[#ffd025] animate-spin"></i>
                    <div className="text-xs font-bold text-[#ffd025]">Renderizando iluminación de estudio sobre cerámica #141414...</div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-500 text-xs">
                    <i className="fa-solid fa-camera text-3xl text-gray-600 mb-2 block"></i>
                    Presiona "Generar Photoshoot IA" para componer la fotografía de estudio.
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleGeneratePhotoshoot}
                  disabled={isGeneratingPhoto}
                  className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2 uppercase cursor-pointer"
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>{isGeneratingPhoto ? 'Generando...' : 'Generar Photoshoot IA (#141414)'}</span>
                </button>

                {generatedPhotoUrl && (
                  <button
                    type="button"
                    onClick={handleApplyPhotoshootToProduct}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2 uppercase cursor-pointer"
                  >
                    <i className="fa-solid fa-check"></i>
                    <span>Aplicar al Producto</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: PRODUCT FORM */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-[#1a1a1a] border border-[#ffd025]/30 rounded-3xl w-full max-w-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <h3 className="text-base font-black uppercase text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-box-open text-[#ffd025]"></i>
              <span>{editingProduct ? 'Editar Producto' : 'Ingresar Nuevo Producto'}</span>
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="Ej: Pisco Alto del Carmen 35° 750ml"
                  className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Pasillo</label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                    className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Subcategoría</label>
                  <input
                    type="text"
                    value={prodForm.subcategory}
                    onChange={(e) => setProdForm({ ...prodForm, subcategory: e.target.value })}
                    placeholder="Ej: Pisco Especial"
                    className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Precio Normal ($)</label>
                  <input
                    type="number"
                    value={prodForm.originalPrice}
                    onChange={(e) => setProdForm({ ...prodForm, originalPrice: Number(e.target.value) })}
                    className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
                  />
                </div>
              </div>

              {/* Botón Encendible / Apagable para Marcar Sin Stock a Clientes */}
              <div className="bg-[#141414] p-3 rounded-2xl border border-gray-800 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-white uppercase">
                    Disponibilidad para Clientes
                  </label>
                  <p className="text-[11px] text-gray-400">
                    {prodForm.inStock 
                      ? '🟢 En stock: Habilitado para compra en el catálogo' 
                      : '🔴 Sin stock: Deshabilitado y marcado agotado para clientes'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProdForm({ ...prodForm, inStock: !prodForm.inStock })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
                    prodForm.inStock
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                      : 'bg-red-950/80 text-red-300 border-red-600/60'
                  }`}
                >
                  <span>{prodForm.inStock ? 'En stock' : 'Sin stock'}</span>
                  <span className={`w-8 h-4 rounded-full relative flex items-center p-0.5 transition-colors ${prodForm.inStock ? 'bg-emerald-500' : 'bg-stone-700'}`}>
                    <span className={`w-3 h-3 bg-white rounded-full transition-transform ${prodForm.inStock ? 'translate-x-4' : 'translate-x-0'}`}></span>
                  </span>
                </button>
              </div>

              {/* Componente para Cargar Imágenes desde PC con Compresión Sharp y Almacenamiento Cloudflare R2 */}
              <ProductImageUploader
                value={prodForm.image}
                onChange={(newUrl) => setProdForm(prev => ({ ...prev, image: newUrl }))}
                productName={prodForm.name}
                label="Foto del Producto (Cargar desde PC o Enlace)"
                showToast={showToast}
              />

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Variedades (separadas por coma)</label>
                <input
                  type="text"
                  value={prodForm.varieties}
                  onChange={(e) => setProdForm({ ...prodForm, varieties: e.target.value })}
                  placeholder="Ej: Rojo, Azul, Verde"
                  className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="bg-gray-800 text-gray-300 font-bold text-xs px-4 py-2 rounded-xl hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#ffd025] text-[#141414] font-black text-xs px-5 py-2 rounded-xl hover:bg-yellow-400 transition shadow uppercase"
                >
                  Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: CLASIFICACIONES */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-[#1a1a1a] border border-[#ffd025]/30 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <h3 className="text-base font-black uppercase text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-[#ffd025]"></i>
              <span>Crear Nuevo Pasillo</span>
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ej: Cervezas Artesanales & IPAs"
                  className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título de Cabecera</label>
                <input
                  type="text"
                  value={catTitle}
                  onChange={(e) => setCatTitle(e.target.value)}
                  placeholder="Ej: Variedades Lupuladas y Stout"
                  className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">URL Imagen de Banner</label>
                  <span className="text-[10px] text-[#ffd025] font-mono font-bold">1200 × 260 px</span>
                </div>
                <input
                  type="text"
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  💡 Medida exacta óptima: <strong>1200 × 260 píxeles</strong> (proporción 16:4 panorámico).
                </p>
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="bg-gray-800 text-gray-300 font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#ffd025] text-[#141414] font-black text-xs px-5 py-2 rounded-xl uppercase"
                >
                  Crear Pasillo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: DISCOUNT CUPÓN */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="bg-[#1a1a1a] border border-[#ffd025]/30 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setIsDiscountModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <h3 className="text-base font-black uppercase text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-percent text-[#ffd025]"></i>
              <span>Crear Código de Descuento</span>
            </h3>

            <form onSubmit={handleCreateDiscount} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Código del Cupón</label>
                <input
                  type="text"
                  required
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                  placeholder="Ej: FELLAS2026"
                  className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025] font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo</label>
                  <select
                    value={discountForm.type}
                    onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valor</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={discountForm.amount}
                    onChange={(e) => setDiscountForm({ ...discountForm, amount: Number(e.target.value) })}
                    className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mínimo de Compra ($)</label>
                <input
                  type="number"
                  min={0}
                  value={discountForm.minOrder}
                  onChange={(e) => setDiscountForm({ ...discountForm, minOrder: Number(e.target.value) })}
                  className="w-full bg-[#141414] text-white text-xs rounded-xl p-2.5 border border-gray-800 outline-none focus:border-[#ffd025]"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="bg-gray-800 text-gray-300 font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#ffd025] text-[#141414] font-black text-xs px-5 py-2 rounded-xl uppercase"
                >
                  Guardar Cupón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT IA MODAL */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        categories={categories}
        showToast={showToast}
        onImportComplete={(count, megaAdded, updatedCats, updatedMegas) => {
          if (updatedCats) {
            onUpdateCategories(updatedCats);
          }
          if (updatedMegas && onUpdateMegaOffers) {
            onUpdateMegaOffers(updatedMegas);
          }
          if (count > 0) {
            showToast(`¡${count} productos importados exitosamente! (${megaAdded} en Mega Ofertas).`);
          }
          setActiveTab('products');
        }}
      />

      {/* CLEAR ALL PRODUCTS CONFIRMATION MODAL */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-red-900/60 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-800 bg-[#141414] flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center text-lg shrink-0">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black uppercase text-white">
                  Borrar Catálogo Anterior
                </h3>
                <p className="text-[11px] text-gray-400">
                  Eliminación masiva de productos registrados
                </p>
              </div>
              <button
                onClick={() => !isClearingAll && setIsClearAllModalOpen(false)}
                disabled={isClearingAll}
                className="text-gray-400 hover:text-white p-2 rounded-xl text-sm"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-4 text-xs text-red-200 space-y-2 leading-relaxed">
                <p>
                  Estás a punto de borrar todos los <strong>{allProducts.length + megaOffers.length} productos</strong> registrados en el catálogo ({allProducts.length} en pasillos temáticos y {megaOffers.length} en Mega Ofertas de portada).
                </p>
                <p className="text-[11px] text-gray-400">
                  Esta opción te evita tener que eliminarlos uno por uno, dejando la tienda completamente vacía y lista para cargar tu nueva planilla Excel o comenzar desde cero.
                </p>
              </div>

              <div className="text-xs text-gray-300 space-y-1.5 bg-[#141414] p-3.5 rounded-xl border border-gray-800">
                <span className="font-bold text-white block">Detalles de la acción:</span>
                <ul className="list-disc pl-4 space-y-1 text-gray-400 text-[11px]">
                  <li>Los productos se removerán de todas las categorías.</li>
                  <li>Las Mega Ofertas de portada se limpiarán.</li>
                  <li>Tus secciones y pasillos temáticos se conservarán intactos.</li>
                </ul>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-gray-800 bg-[#141414] flex flex-col gap-2">
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isClearingAll}
                  onClick={() => setIsClearAllModalOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isClearingAll}
                  onClick={handleClearAllProducts}
                  className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer active:scale-95 uppercase"
                >
                  {isClearingAll ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin"></i>
                      <span>Borrando productos...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-trash-can"></i>
                      <span>Sí, Borrar Todo el Catálogo</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleRestoreDefaultProducts}
                  className="text-[11px] text-gray-400 hover:text-amber-400 transition underline underline-offset-4 cursor-pointer"
                >
                  O restablecer productos iniciales de demostración
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE DE BANNER Y MEDIDAS DE CLASIFICACIÓN */}
      <CategoryBannerModal
        isOpen={isBannerModalOpen}
        category={selectedBannerCategory}
        onClose={() => {
          setIsBannerModalOpen(false);
          setSelectedBannerCategory(null);
        }}
        onSaveBanner={handleSaveCategoryBanner}
        showToast={showToast}
      />

      {/* MODAL: SELECCIÓN DE LOS 6 PRODUCTOS DESTACADOS POR SECCIÓN */}
      <CategoryFeaturedProductsModal
        isOpen={isFeaturedModalOpen}
        category={selectedFeaturedCategory}
        onClose={() => {
          setIsFeaturedModalOpen(false);
          setSelectedFeaturedCategory(null);
        }}
        onSaveFeaturedProducts={handleSaveCategoryFeaturedProducts}
        showToast={showToast}
      />

    </div>
  );
};
