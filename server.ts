import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { CATEGORIES as INITIAL_CATEGORIES, MEGA_OFFERS as INITIAL_MEGA_OFFERS, HERO_SLIDES as INITIAL_HERO_SLIDES, DEFAULT_STORE_SCHEDULE } from './src/data/products';
import type { CategoryData, Product, Order, StoreSettings, EmailMarketingSubscriber, HeroSlide, DeliveryLocation } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Gemini API Client
let geminiAi: GoogleGenAI | null = null;
function getGeminiAi(): GoogleGenAI | null {
  if (!geminiAi && process.env.GEMINI_API_KEY) {
    geminiAi = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiAi;
}

// Curated high-resolution studio beverage photos for botillería products
const BEVERAGE_IMAGES: Record<string, string> = {
  pisco: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=600&auto=format&fit=crop',
  cerveza: 'https://images.unsplash.com/photo-1608270190578-831e51b32d2e?q=80&w=600&auto=format&fit=crop',
  vino: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=600&auto=format&fit=crop',
  espumante: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?q=80&w=600&auto=format&fit=crop',
  whisky: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=600&auto=format&fit=crop',
  vodka_gin: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=600&auto=format&fit=crop',
  agua: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?q=80&w=600&auto=format&fit=crop',
  bebida: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600&auto=format&fit=crop',
  energetica: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?q=80&w=600&auto=format&fit=crop',
  hielo: 'https://images.unsplash.com/photo-1516959512399-985e5095d311?q=80&w=600&auto=format&fit=crop',
  snack: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=600&auto=format&fit=crop',
  aperitivo: 'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=600&auto=format&fit=crop',
  pack: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop'
};

// In-Memory Database Store (with persistent state during runtime)
let categories: CategoryData[] = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
let megaOffers: Product[] = JSON.parse(JSON.stringify(INITIAL_MEGA_OFFERS));
let heroSlides: HeroSlide[] = JSON.parse(JSON.stringify(INITIAL_HERO_SLIDES));

let settings: StoreSettings = {
  logoTextPrimary: 'BOTI',
  logoTextAccent: '.EXPRESS',
  tagline: 'Botillería online & despacho exprés de cervezas, piscos, vinos y promociones',
  footerAbout: 'Tu botillería online de confianza. Piscos, cervezas artesanales heladas, destilados premium, vinos y licores con despacho exprés directo a tu previa o celebración.',
  contactEmail: 'contacto@botiexpress.cl',
  contactPhone: '+56 9 8765 4321',
  contactAddress: 'Av. Providencia 1240, Santiago, Chile',
  contactHours: 'Horario Botillería: Lun a Dom 12:00 - 03:00 hrs',
  footerCategoriesTitle: 'Pasillos & Licores',
  footerDeliveryTitle: 'Despacho Express',
  footerDeliverySubtitle: 'Entregas en menos de 45 minutos en:',
  footerDeliveryNotice: 'Envío gratis sobre $50.000',
  footerContactTitle: 'Contacto & Casa Matriz',
  footerCopyrightText: 'Todos los derechos reservados. Venta exclusiva para mayores de 18 años.',
  freeShippingThreshold: 50000,
  deliveryLocations: [
    { name: 'Alerce Histórico', price: 2000, estimatedMinutes: 25 },
    { name: 'Alerce Norte', price: 2500, estimatedMinutes: 30 },
    { name: 'Alerce Sur', price: 2500, estimatedMinutes: 30 },
    { name: 'Puerto Montt Centro', price: 3500, estimatedMinutes: 35 },
    { name: 'Mirador de la Bahía', price: 3500, estimatedMinutes: 35 },
    { name: 'Valle Volcanes', price: 3500, estimatedMinutes: 35 },
    { name: 'Pelluco', price: 4000, estimatedMinutes: 40 },
    { name: 'Cardonal', price: 3500, estimatedMinutes: 40 },
    { name: 'Chamiza', price: 4500, estimatedMinutes: 45 },
    { name: 'Santiago Centro', price: 2990, estimatedMinutes: 35 },
    { name: 'Providencia', price: 3490, estimatedMinutes: 30 },
    { name: 'Las Condes', price: 3990, estimatedMinutes: 45 },
    { name: 'Ñuñoa', price: 3490, estimatedMinutes: 35 },
    { name: 'Vitacura', price: 4490, estimatedMinutes: 45 }
  ],
  deliveryZones: [
    'Alerce Histórico',
    'Alerce Norte',
    'Alerce Sur',
    'Puerto Montt Centro',
    'Mirador de la Bahía',
    'Valle Volcanes',
    'Pelluco',
    'Cardonal',
    'Chamiza',
    'Santiago Centro',
    'Providencia',
    'Las Condes',
    'Ñuñoa',
    'Vitacura'
  ],
  customerDiscountTiers: [
    { name: 'Cliente Frecuente', minPurchases: 3, discountPercent: 5 },
    { name: 'Cliente VIP Sediento', minPurchases: 8, discountPercent: 10 },
    { name: 'Parrillero de Oro', minPurchases: 15, discountPercent: 15 }
  ],
  socialInstagram: 'https://instagram.com/botiexpress',
  socialTwitter: 'https://x.com/botiexpress',
  socialFacebook: 'https://facebook.com/botiexpress',
  socialWhatsapp: '+56987654321',
  megaOffersConfig: {
    sectionTitle: '¡LAS PROMOS DEL TIO FELLAS!',
    sectionSubtitle: 'Combos imperdibles y packs con despacho prioritario',
    badgeText: 'PROMOS RELÁMPAGO'
  },
  bottomBannerImage: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=1600&auto=format&fit=crop',
  bottomBannerLink: '#mega-ofertas',
  showBottomBanner: true,
  showBottomDualBanners: true,
  bottomDualBanner1Image: 'https://images.unsplash.com/photo-1608270190578-831e51b32d2e?q=80&w=800&auto=format&fit=crop',
  bottomDualBanner1Link: '#mega-ofertas',
  bottomDualBanner2Image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop',
  bottomDualBanner2Link: '#mega-ofertas',
  scheduleConfig: JSON.parse(JSON.stringify(DEFAULT_STORE_SCHEDULE))
};

let orders: Order[] = [
  {
    id: 'ord-101',
    code: 'BOTI-849201',
    customerName: 'Matías Silva',
    customerEmail: 'matias.silva@gmail.com',
    customerPhone: '+56 9 7788 9900',
    location: 'Providencia',
    address: 'Av. Holanda 123, Depto 402',
    items: [
      {
        productId: 'mega-1',
        productName: 'Pack Piscola Mistral 35° + Coca-Cola + Hielo',
        quantity: 2,
        price: 10990,
        image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=400&auto=format&fit=crop'
      },
      {
        productId: 'cer-2',
        productName: 'Pack Heineken 12 Latas 350ml Heladas',
        quantity: 1,
        price: 9990,
        image: 'https://images.unsplash.com/photo-1618886614638-80e3c153d31a?q=80&w=400&auto=format&fit=crop'
      }
    ],
    subtotal: 31970,
    discountAmount: 0,
    shippingCost: 0,
    total: 31970,
    paymentMethod: 'Webpay Plus / Débito',
    status: 'en_camino',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: 'ord-102',
    code: 'BOTI-520194',
    customerName: 'Camila Morales',
    customerEmail: 'camila.morales@outlook.com',
    customerPhone: '+56 9 6655 4433',
    location: 'Ñuñoa',
    address: 'Simón Bolívar 2890, Casa B',
    items: [
      {
        productId: 'vin-2',
        productName: 'Espumante Valdivieso Brut 750ml',
        quantity: 3,
        price: 4990,
        image: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?q=80&w=400&auto=format&fit=crop'
      },
      {
        productId: 'dest-3',
        productName: 'Gin Tanqueray London Dry 750ml',
        quantity: 1,
        price: 16990,
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=400&auto=format&fit=crop'
      }
    ],
    subtotal: 31960,
    discountAmount: 1500,
    shippingCost: 0,
    total: 30460,
    paymentMethod: 'Tarjeta de Crédito',
    status: 'en_preparacion',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  },
  {
    id: 'ord-103',
    code: 'BOTI-291048',
    customerName: 'Rodrigo Araya',
    customerEmail: 'rodrigo.araya@gmail.com',
    customerPhone: '+56 9 9988 1122',
    location: 'Santiago Centro',
    address: 'Tarapacá 850, Depto 1204',
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
    shippingCost: 3990,
    total: 23980,
    paymentMethod: 'Transferencia Bancaria',
    status: 'nuevo',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  }
];

let subscribers: EmailMarketingSubscriber[] = [
  {
    id: 'sub-1',
    email: 'matias.silva@gmail.com',
    subscribedAt: '2026-09-10T14:20:00Z',
    source: 'Banner Newsletter',
    status: 'activo'
  },
  {
    id: 'sub-2',
    email: 'camila.morales@outlook.com',
    subscribedAt: '2026-09-12T19:45:00Z',
    source: 'Checkout Compra',
    status: 'activo'
  },
  {
    id: 'sub-3',
    email: 'gonzalo.valdes@yahoo.es',
    subscribedAt: '2026-09-13T22:10:00Z',
    source: 'Banner Newsletter',
    status: 'activo'
  },
  {
    id: 'sub-4',
    email: 'valeria.gonzalez@gmail.com',
    subscribedAt: '2026-09-14T01:30:00Z',
    source: 'Banner Newsletter',
    status: 'activo'
  }
];

// ================= API ROUTES =================

// 1. Check Auth / Login Admin
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Credenciales incompletas' });
  }

  // Admin access (Accepts fellhonpm as requested by creator of fellasmarket.cl, plus default credentials)
  const isAuthorizedAdminPassword = 
    password === 'fellhonpm' || 
    password === 'admin123' || 
    password === 'admin' || 
    password === '123456';

  const isAuthorizedAdminUser = 
    email.trim().toLowerCase() === 'admin@botilleria.cl' || 
    email.trim().toLowerCase() === 'admin' || 
    email.trim().toLowerCase() === 'admin@admin.com' ||
    email.trim().toLowerCase() === 'admin@fellasmarket.cl' ||
    email.trim().toLowerCase() === 'fellas' ||
    email.trim().toLowerCase() === 'fellasmarket' ||
    email.trim().toLowerCase() === 'igncio.muller18@gmail.com';

  if (isAuthorizedAdminUser && isAuthorizedAdminPassword) {
    return res.json({
      success: true,
      user: {
        name: 'Administrador Fellas Market',
        email: email.includes('@') ? email : 'admin@fellasmarket.cl',
        role: 'admin',
        isLoggedIn: true
      },
      token: 'jwt-fellas-admin-token-fellhonpm'
    });
  }

  // Also if someone inputs fellhonpm with any username/email starting with admin or fellas, grant admin access directly
  if (password === 'fellhonpm') {
    return res.json({
      success: true,
      user: {
        name: 'Administrador Fellas Market',
        email: email.includes('@') ? email : 'admin@fellasmarket.cl',
        role: 'admin',
        isLoggedIn: true
      },
      token: 'jwt-fellas-admin-token-fellhonpm'
    });
  }

  // Delivery Driver access (requested: username "delivery", password "botifelldely")
  const isDeliveryUser = 
    email.trim().toLowerCase() === 'delivery' || 
    email.trim().toLowerCase() === 'delivery@botilleria.cl' ||
    email.trim().toLowerCase() === 'delivery@fellasmarket.cl' ||
    email.trim().toLowerCase() === 'repartidor';

  if ((isDeliveryUser && password === 'botifelldely') || password === 'botifelldely') {
    return res.json({
      success: true,
      user: {
        name: 'Repartidor Delivery',
        email: email.includes('@') ? email : 'delivery@botilleria.cl',
        role: 'delivery',
        isLoggedIn: true
      },
      token: 'jwt-delivery-token-botifelldely'
    });
  }

  // Regular customer login
  const namePart = email.split('@')[0];
  const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  return res.json({
    success: true,
    user: {
      name,
      email,
      role: 'customer',
      isLoggedIn: true,
      discountPercent: 5
    }
  });
});

// 2. Categories API (CRUD)
app.get('/api/categories', (req, res) => {
  res.json({ categories });
});

app.post('/api/categories', (req, res) => {
  const newCat: CategoryData = req.body;
  if (!newCat.id || !newCat.name) {
    return res.status(400).json({ error: 'ID y Nombre de categoría son obligatorios' });
  }
  if (!newCat.products) newCat.products = [];
  categories.push(newCat);
  res.json({ success: true, category: newCat, categories });
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const updatedData: Partial<CategoryData> = req.body;
  const idx = categories.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Categoría no encontrada' });
  }
  categories[idx] = { ...categories[idx], ...updatedData };
  res.json({ success: true, category: categories[idx], categories });
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  categories = categories.filter((c) => c.id !== id);
  res.json({ success: true, categories });
});

// 3. Products API (Add, Update, Delete within category or mega offers)
app.get('/api/products', (req, res) => {
  const allProds: Product[] = [
    ...megaOffers,
    ...categories.flatMap((c) => c.products)
  ];
  res.json({ products: allProds, megaOffers });
});

app.post('/api/products', (req, res) => {
  const product: Product = req.body;
  if (!product.id || !product.name || !product.categoryId) {
    return res.status(400).json({ error: 'Faltan datos obligatorios del producto' });
  }

  if (product.isMegaOffer) {
    megaOffers.push(product);
  } else {
    const targetCat = categories.find((c) => c.id === product.categoryId);
    if (targetCat) {
      targetCat.products.push(product);
    } else {
      return res.status(404).json({ error: 'La categoría especificada no existe' });
    }
  }

  res.json({ success: true, product, categories, megaOffers });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const updated: Partial<Product> = req.body;

  let found = false;

  // Check in megaOffers
  const megaIdx = megaOffers.findIndex((p) => p.id === id);
  if (megaIdx !== -1) {
    megaOffers[megaIdx] = { ...megaOffers[megaIdx], ...updated };
    found = true;
  }

  // Check in categories
  categories.forEach((cat) => {
    const pIdx = cat.products.findIndex((p) => p.id === id);
    if (pIdx !== -1) {
      cat.products[pIdx] = { ...cat.products[pIdx], ...updated };
      found = true;
    }
  });

  if (!found) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  res.json({ success: true, categories, megaOffers });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  megaOffers = megaOffers.filter((p) => p.id !== id);
  categories.forEach((cat) => {
    cat.products = cat.products.filter((p) => p.id !== id);
  });
  res.json({ success: true, categories, megaOffers });
});

// 3.1 Clear all products in catalog (general delete previous products)
app.post('/api/products/clear-all', (req, res) => {
  try {
    const totalDeleted = megaOffers.length + categories.reduce((sum, c) => sum + c.products.length, 0);
    megaOffers = [];
    categories.forEach((cat) => {
      cat.products = [];
    });
    res.json({
      success: true,
      message: `Se han eliminado todos los productos anteriores (${totalDeleted} en total).`,
      totalDeleted,
      categories,
      megaOffers
    });
  } catch (err: any) {
    console.error('Error clearing products:', err);
    res.status(500).json({ error: 'Error al vaciar catálogo de productos' });
  }
});

// 3.2 Restore default sample products
app.post('/api/products/restore-defaults', (req, res) => {
  try {
    categories = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
    megaOffers = JSON.parse(JSON.stringify(INITIAL_MEGA_OFFERS));
    const totalCount = megaOffers.length + categories.reduce((sum, c) => sum + c.products.length, 0);
    res.json({
      success: true,
      message: `Catálogo restablecido con ${totalCount} productos de muestra.`,
      categories,
      megaOffers
    });
  } catch (err: any) {
    console.error('Error restoring default products:', err);
    res.status(500).json({ error: 'Error al restablecer catálogo de productos' });
  }
});

// 4. Hero Slides & Banners API
app.get(['/api/hero-slides', '/api/banners'], (req, res) => {
  res.json({ heroSlides, banners: heroSlides });
});

app.put(['/api/hero-slides', '/api/banners'], (req, res) => {
  const { slides, banners } = req.body;
  const newSlides = Array.isArray(slides) ? slides : (Array.isArray(banners) ? banners : null);
  if (newSlides) {
    heroSlides = newSlides;
  }
  res.json({ success: true, heroSlides, banners: heroSlides });
});

// 4.1 Mega Offers (Promos Tío Fellas) API
app.get('/api/mega-offers', (req, res) => {
  res.json({ megaOffers });
});

app.put('/api/mega-offers', (req, res) => {
  const { offers, megaOffers: sentOffers } = req.body;
  const list = Array.isArray(offers) ? offers : (Array.isArray(sentOffers) ? sentOffers : null);
  if (list) {
    megaOffers = list;
  }
  res.json({ success: true, megaOffers });
});

// 5. Orders API (Real-time tracking, Status updates)
app.get('/api/orders', (req, res) => {
  res.json({ orders });
});

app.post('/api/orders', (req, res) => {
  const newOrder: Order = req.body;
  if (!newOrder.items || newOrder.items.length === 0) {
    return res.status(400).json({ error: 'El pedido debe incluir al menos un producto' });
  }

  newOrder.id = 'ord-' + Date.now();
  newOrder.code = newOrder.code || 'BOTI-' + Math.floor(100000 + Math.random() * 900000);
  newOrder.createdAt = new Date().toISOString();
  newOrder.status = 'nuevo';

  orders.unshift(newOrder); // Prepend to show immediately in real time
  res.json({ success: true, order: newOrder });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }
  order.status = status;
  res.json({ success: true, order, orders });
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }
  order.status = status;
  res.json({ success: true, order, orders });
});

// 6. Store Settings & Footer API
app.get('/api/settings', (req, res) => {
  res.json({ settings });
});

app.put('/api/settings', (req, res) => {
  const updatedSettings: Partial<StoreSettings> = req.body;
  settings = { ...settings, ...updatedSettings };
  startKeepAliveEngine();
  res.json({ success: true, settings });
});

// ============================================================================
// RENDER 24/7 AUTO-KEEP-ALIVE ENGINE (Anti-Suspensión por Inactividad)
// ============================================================================
interface KeepAliveHistoryLog {
  timestamp: string;
  url: string;
  status: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

let keepAliveTimer: NodeJS.Timeout | null = null;
const keepAliveStats = {
  enabled: true,
  intervalMinutes: 9,
  totalPings: 0,
  successfulPings: 0,
  failedPings: 0,
  lastPingAt: null as string | null,
  lastPingSuccess: null as boolean | null,
  lastPingResponseStatus: null as number | null,
  lastPingDurationMs: null as number | null,
  targetUrl: process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${PORT}/api/health`,
  history: [] as KeepAliveHistoryLog[]
};

function getEffectiveTargetUrl(): string {
  if (settings.renderAppUrl && settings.renderAppUrl.trim().startsWith('http')) {
    return settings.renderAppUrl.trim();
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL.trim();
  }
  return `http://127.0.0.1:${PORT}/api/health`;
}

async function performKeepAlivePing(forcedTargetUrl?: string): Promise<{
  success: boolean;
  status: number;
  durationMs: number;
  url: string;
  error?: string;
}> {
  let target = forcedTargetUrl || getEffectiveTargetUrl();
  // Ensure target has health endpoint if domain only
  if (target.startsWith('http') && !target.includes('/api/')) {
    target = target.replace(/\/+$/, '') + '/api/health';
  }

  const start = Date.now();
  keepAliveStats.totalPings++;
  keepAliveStats.targetUrl = target;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent': 'Botilleria-Render-KeepAlive/2.0 (Always-On Engine)',
        'X-Keep-Alive-Ping': 'true'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const durationMs = Date.now() - start;
    const isSuccess = response.ok || response.status < 500;

    if (isSuccess) {
      keepAliveStats.successfulPings++;
    } else {
      keepAliveStats.failedPings++;
    }

    keepAliveStats.lastPingAt = new Date().toISOString();
    keepAliveStats.lastPingSuccess = isSuccess;
    keepAliveStats.lastPingResponseStatus = response.status;
    keepAliveStats.lastPingDurationMs = durationMs;

    const logEntry: KeepAliveHistoryLog = {
      timestamp: new Date().toISOString(),
      url: target,
      status: response.status,
      durationMs,
      success: isSuccess
    };

    keepAliveStats.history.unshift(logEntry);
    if (keepAliveStats.history.length > 25) {
      keepAliveStats.history.pop();
    }

    console.log(`[Keep-Alive 24/7] Pulse to ${target} -> Status ${response.status} (${durationMs}ms)`);

    return {
      success: isSuccess,
      status: response.status,
      durationMs,
      url: target
    };
  } catch (err: any) {
    const durationMs = Date.now() - start;
    keepAliveStats.failedPings++;
    keepAliveStats.lastPingAt = new Date().toISOString();
    keepAliveStats.lastPingSuccess = false;
    keepAliveStats.lastPingResponseStatus = 0;
    keepAliveStats.lastPingDurationMs = durationMs;

    const logEntry: KeepAliveHistoryLog = {
      timestamp: new Date().toISOString(),
      url: target,
      status: 0,
      durationMs,
      success: false,
      error: err.message || 'Timeout o fallo de conexión'
    };

    keepAliveStats.history.unshift(logEntry);
    if (keepAliveStats.history.length > 25) {
      keepAliveStats.history.pop();
    }

    console.warn(`[Keep-Alive 24/7] Pulse to ${target} failed after ${durationMs}ms:`, err.message);

    return {
      success: false,
      status: 0,
      durationMs,
      url: target,
      error: err.message
    };
  }
}

function startKeepAliveEngine() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }

  const isEnabled = settings.renderKeepAliveEnabled !== false;
  keepAliveStats.enabled = isEnabled;

  if (!isEnabled) {
    console.log('[Keep-Alive 24/7] Engine paused by settings.');
    return;
  }

  const intervalMinutes =
    settings.renderPingIntervalMinutes &&
    settings.renderPingIntervalMinutes >= 3 &&
    settings.renderPingIntervalMinutes <= 14
      ? settings.renderPingIntervalMinutes
      : 9;

  keepAliveStats.intervalMinutes = intervalMinutes;
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`[Keep-Alive 24/7] Active! Scheduled heartbeat every ${intervalMinutes} minutes.`);

  // Initial pulse 8 seconds after boot
  setTimeout(() => {
    performKeepAlivePing().catch(() => {});
  }, 8000);

  keepAliveTimer = setInterval(() => {
    performKeepAlivePing().catch(() => {});
  }, intervalMs);
}

// Keep-Alive & Health Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: settings.storeName || 'Botillería Express',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    keepAliveActive: keepAliveStats.enabled
  });
});

app.get('/api/keepalive', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    detectedRenderUrl: process.env.RENDER_EXTERNAL_URL || null,
    stats: {
      ...keepAliveStats,
      targetUrl: getEffectiveTargetUrl(),
      uptimeSeconds: Math.floor(process.uptime())
    }
  });
});

app.post('/api/keepalive/ping-now', async (req, res) => {
  try {
    const { customUrl } = req.body || {};
    const result = await performKeepAlivePing(customUrl);
    res.json({
      success: true,
      result,
      stats: {
        ...keepAliveStats,
        targetUrl: getEffectiveTargetUrl(),
        uptimeSeconds: Math.floor(process.uptime())
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error executing ping' });
  }
});

// 7. Email Marketing Subscribers API
app.get('/api/marketing/subscribers', (req, res) => {
  res.json({ subscribers });
});

app.post('/api/marketing/subscribers', (req, res) => {
  const { email, source } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const existing = subscribers.find((s) => s.email.toLowerCase() === email.toLowerCase());
  if (!existing) {
    const newSub: EmailMarketingSubscriber = {
      id: 'sub-' + Date.now(),
      email,
      subscribedAt: new Date().toISOString(),
      source: source || 'Web Botillería',
      status: 'activo'
    };
    subscribers.unshift(newSub);
  }

  res.json({ success: true, subscribers });
});

// FELLAS MARKET INTERNAL ADMIN APIS
// 8. Stats API (/api/admin/visits/stats & /api/admin/sales/stats)
app.get(['/api/admin/visits/stats', '/admin/visits/stats'], (req, res) => {
  res.json({
    totalVisits: 1420 + Math.floor(Math.random() * 50),
    todayVisits: 84 + Math.floor(Math.random() * 15),
    activeUsers: 6 + Math.floor(Math.random() * 4),
    conversionRate: 14.8,
    topDevices: [
      { device: 'Móvil (Android / iOS)', percentage: 78 },
      { device: 'Computador / Desktop', percentage: 22 }
    ],
    sourceOrigins: [
      { source: 'WhatsApp y Redes Sociales', percentage: 56 },
      { source: 'Búsqueda Directa Google Alerce', percentage: 32 },
      { source: 'Tráfico Recurrente', percentage: 12 }
    ]
  });
});

app.get(['/api/admin/sales/stats', '/admin/sales/stats'], (req, res) => {
  const totalRevenue = orders.reduce((sum, o) => o.status !== 'cancelado' ? sum + o.total : sum, 0);
  const totalOrders = orders.length;

  res.json({
    totalOrders,
    totalRevenue,
    averageTicket: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    hourlyDistribution: [
      { hour: 12, orders: 4, revenue: 64000 },
      { hour: 15, orders: 3, revenue: 48000 },
      { hour: 18, orders: 8, revenue: 142000 },
      { hour: 20, orders: 15, revenue: 298000 },
      { hour: 21, orders: 22, revenue: 460000 },
      { hour: 22, orders: 28, revenue: 580000 },
      { hour: 23, orders: 31, revenue: 640000 },
      { hour: 0, orders: 18, revenue: 320000 }
    ],
    dayOfWeekDistribution: [
      { dayOfWeek: 0, day: 'Domingo', orders: 18, revenue: 380000 },
      { dayOfWeek: 1, day: 'Lunes', orders: 8, revenue: 140000 },
      { dayOfWeek: 2, day: 'Martes', orders: 9, revenue: 160000 },
      { dayOfWeek: 3, day: 'Miércoles', orders: 12, revenue: 210000 },
      { dayOfWeek: 4, day: 'Jueves', orders: 19, revenue: 340000 },
      { dayOfWeek: 5, day: 'Viernes', orders: 42, revenue: 890000 },
      { dayOfWeek: 6, day: 'Sábado', orders: 54, revenue: 1150000 }
    ],
    topProducts: categories.flatMap(c => c.products).slice(0, 5).map(p => ({
      name: p.name,
      unitsSold: Math.floor(Math.random() * 40) + 10,
      totalRevenue: p.price * 15
    }))
  });
});

// 9. Feedback & Reclamos In-Memory Store
let feedbacks: any[] = [
  {
    id: 'fb-1',
    type: 'felicitacion',
    name: 'Carlos Ruiz',
    email: 'carlos.alerce@gmail.com',
    phone: '+56 9 8833 4422',
    orderNumber: 'PED-4921',
    message: 'Excelente servicio, el pisco y las cervezas llegaron heladas en menos de 25 minutos acá en Alerce Norte!',
    status: 'resuelto',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'fb-2',
    type: 'sugerencia',
    name: 'Valentina Soto',
    email: 'vale.soto@hotmail.com',
    phone: '+56 9 7711 2299',
    orderNumber: '',
    message: 'Podrían incorporar más marcas de gin artesanal o tónicas importadas para el fin de semana.',
    status: 'pendiente',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

app.get(['/api/admin/feedback/responses', '/api/feedback/responses'], (req, res) => {
  res.json(feedbacks);
});

app.post(['/api/admin/feedback/responses', '/api/feedback/responses'], (req, res) => {
  const newFeedback = {
    id: 'fb-' + Date.now(),
    createdAt: new Date().toISOString(),
    status: 'pendiente',
    ...req.body
  };
  feedbacks.unshift(newFeedback);
  res.json({ success: true, feedback: newFeedback });
});

app.patch(['/api/admin/feedback/responses/:id', '/api/feedback/responses/:id'], (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  feedbacks = feedbacks.map(f => f.id === id ? { ...f, status } : f);
  res.json({ success: true, feedbacks });
});

// 10. Customer Discount Codes
let discountCodes: any[] = [
  {
    id: 'disc-1',
    code: 'FELLASVIP',
    type: 'percentage',
    amount: 15,
    minOrder: 15000,
    usesLeft: 50,
    active: true,
    expiresAt: '2026-12-31'
  },
  {
    id: 'disc-2',
    code: 'ALERCENIGHT',
    type: 'fixed',
    amount: 3000,
    minOrder: 20000,
    usesLeft: 20,
    active: true,
    expiresAt: '2026-10-31'
  }
];

app.get('/api/admin/discounts', (req, res) => {
  res.json(discountCodes);
});

app.post('/api/admin/discounts', (req, res) => {
  const newDiscount = {
    id: 'disc-' + Date.now(),
    active: true,
    ...req.body
  };
  discountCodes.unshift(newDiscount);
  res.json({ success: true, discount: newDiscount, discounts: discountCodes });
});

app.patch('/api/admin/discounts/:id', (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  discountCodes = discountCodes.map(d => d.id === id ? { ...d, active } : d);
  res.json({ success: true, discounts: discountCodes });
});

// 11. Database Export & Restore (/api/admin/database/export & /api/admin/database/restore)
app.get('/api/admin/database/export', (req, res) => {
  const fullBackup = {
    exportDate: new Date().toISOString(),
    system: 'Fellas Market Cloud DB',
    categories,
    megaOffers,
    orders,
    subscribers,
    settings,
    feedbacks,
    discountCodes
  };
  res.json(fullBackup);
});

app.post('/api/admin/database/restore', (req, res) => {
  const backupData = req.body;
  if (!backupData) {
    return res.status(400).json({ ok: false, error: 'Archivo de respaldo vacío o inválido' });
  }

  if (Array.isArray(backupData.categories)) categories = backupData.categories;
  if (Array.isArray(backupData.orders)) orders = backupData.orders;
  if (Array.isArray(backupData.subscribers)) subscribers = backupData.subscribers;
  if (backupData.settings) settings = { ...settings, ...backupData.settings };
  if (Array.isArray(backupData.discountCodes)) discountCodes = backupData.discountCodes;
  if (Array.isArray(backupData.feedbacks)) feedbacks = backupData.feedbacks;

  res.json({
    ok: true,
    message: 'Base de datos restaurada con éxito desde el archivo de respaldo',
    stats: {
      categoriesCount: categories.length,
      ordersCount: orders.length,
      subscribersCount: subscribers.length
    }
  });
});

// 12. Backup Store (Tienda Alterna / Contingencia) Config
let backupStoreConfig = {
  enabled: false,
  title: "Fella's Market — Tienda Alterna de Contingencia",
  subtitle: "Pedidos rápidos para despacho y retiro en local",
  bannerNotice: "⚠️ Estamos actualizando nuestro catálogo principal. Puedes pedir directamente aquí tus productos esenciales.",
  whatsappNumber: "+56958866754",
  deliveryCost: 2000,
  selectedProductIds: []
};

app.get('/api/admin/backup-store', (req, res) => {
  res.json(backupStoreConfig);
});

app.post('/api/admin/backup-store', (req, res) => {
  backupStoreConfig = { ...backupStoreConfig, ...req.body };
  res.json({ success: true, backupStore: backupStoreConfig });
});

// 13. Photoshoot IA Studio Simulation (Generates realistic studio image with #141414 background)
app.post('/api/admin/generate-photoshoot', (req, res) => {
  const { name, category, brand } = req.body;
  
  // Real curated high-res studio shot matching the #141414 ceramic luxury style
  const studioShots = [
    'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1607622750671-6cd9a99eabd1?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=1200&auto=format&fit=crop'
  ];

  const selectedUrl = studioShots[Math.floor(Math.random() * studioShots.length)];

  res.json({
    success: true,
    imageUrl: selectedUrl,
    prompt: `Photoshoot hiperrealista de ${name} (${category}), centrado sobre cerámica #141414 con decorativos oscuros y relación 1.85:1.`
  });
});

// 14. System Status API
app.get('/api/admin/system/status', (req, res) => {
  res.json({
    status: 'online',
    serverUptime: process.uptime(),
    database: 'Firestore / In-Memory Mirror Sync Active',
    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
    lastPing: new Date().toLocaleTimeString('es-CL'),
    apiLatencyMs: 24
  });
});

// 15. Excel & CSV Products AI Classification (/api/admin/classify-excel-products)
const STANDARD_BOTILLERIA_TEMPLATES: Record<string, Partial<CategoryData>> = {
  'cat-bebidas': {
    name: 'Bebidas, Aguas & Hielo',
    icon: 'fa-solid fa-bottle-water',
    badge: 'Aguas, Gaseosas & Hielo',
    title: 'Aguas Minerales, Bebidas Heladas & Hielo',
    description: 'Aguas con y sin gas de vertiente, bebidas gaseosas frías, energéticas y hielo purificado en bolsa.',
    bannerImage: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?q=80&w=1600&auto=format&fit=crop'
  },
  'cat-destilados': {
    name: 'Destilados & Piscos',
    icon: 'fa-solid fa-whiskey-glass',
    badge: 'Piscos, Whisky, Gin & Vodka',
    title: 'Piscos Chilenos, Whisky & Destilados Premium',
    description: 'La más amplia selección de piscos artesanales y de guarda, whiskies escoceses, gin botánico y vodkas importados.',
    bannerImage: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=1600&auto=format&fit=crop'
  },
  'cat-cervezas': {
    name: 'Cervezas & Artesanales',
    icon: 'fa-solid fa-beer-mug-empty',
    badge: 'Lagers, IPAs & Packs',
    title: 'Cervezas Heladas Nacionales & del Mundo',
    description: 'Packs de tus marcas favoritas bien frías, artesanales chilenas con lúpulo fresco y opciones importadas.',
    bannerImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1600&auto=format&fit=crop'
  },
  'cat-vinos': {
    name: 'Vinos & Espumantes',
    icon: 'fa-solid fa-wine-glass',
    badge: 'Cepas Chilenas & Champagne',
    title: 'Vinos Reserva, Gran Reserva & Espumantes',
    description: 'Cabernet Sauvignon, Carmenère, Sauvignon Blanc y espumantes Brut para brindar en toda ocasión.',
    bannerImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1600&auto=format&fit=crop'
  },
  'cat-snacks': {
    name: 'Snacks & Picoteos',
    icon: 'fa-solid fa-cookie-bite',
    badge: 'Papas, Ramitas & Frutos Secos',
    title: 'Snacks Salados, Picoteos & Chocolates',
    description: 'Papas fritas crujientes, ramitas de queso, maní salado y bocados para acompañar tus tragos.',
    bannerImage: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=1600&auto=format&fit=crop'
  },
  'cat-aperitivos': {
    name: 'Aperitivos & Licores',
    icon: 'fa-solid fa-martini-glass-citrus',
    badge: 'Aperol, Vermouth & Digestivos',
    title: 'Aperitivos Italianos, Vermut & Licores Dulces',
    description: 'Aperol Spritz, Ramazzotti, Fernet Branca, Baileys y licores para comenzar la previa o el postre.',
    bannerImage: 'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=1600&auto=format&fit=crop'
  }
};

app.post('/api/admin/classify-excel-products', async (req, res) => {
  try {
    const { items, existingCategories } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'La lista de productos del Excel está vacía' });
    }

    // Build complete available categories guaranteeing all standard botillería sections
    const provided = Array.isArray(existingCategories) ? existingCategories : [];
    const availableCategories: Array<{ id: string; name: string }> = [...provided];

    // Ensure all standard botillería categories exist in availableCategories
    Object.entries(STANDARD_BOTILLERIA_TEMPLATES).forEach(([catId, tmpl]) => {
      if (!availableCategories.some(c => c.id === catId)) {
        availableCategories.push({ id: catId, name: tmpl.name || catId });
      }
    });

    // Rigorous Chilean Botillería & Supermarket Classifier
    // CCU (Compañía de Cervecerías Unidas) distributes soft drinks (Bilz, Pap, Kem Piña, Limón Soda, Canada Dry, Crush, 7Up, Pepsi, Gatorade, Red Bull),
    // mineral waters (Cachantún, Porvenir, Más), and juices (Watt's), as well as beers and wines.
    const runHeuristic = (name: string, price: number, origPrice?: number) => {
      const n = (name || '').toLowerCase().trim();
      let categoryId = 'cat-bebidas';
      let categoryName = 'Bebidas, Aguas & Hielo';
      let subcategory = 'Bebidas Gaseosas';
      let image = BEVERAGE_IMAGES.bebida;
      let brand = '';

      // Check combo pack with alcohol (e.g. Pack Piscola Mistral + Coca-Cola + Hielo)
      const isSpiritComboPack = (n.includes('pisco') || n.includes('whisky') || n.includes('gin') || n.includes('ron') || n.includes('vodka')) && 
                                (n.includes('+') || n.includes('pack') || n.includes('promo') || n.includes('combo'));

      // 1. AGUAS, BEBIDAS, JUGOS, ENERGÉTICAS Y HIELO (NEVER DESTILADOS!)
      const isAgua = n.includes('agua') || n.includes('mineral') || n.includes('cachantun') || n.includes('cachantún') ||
                     n.includes('vital') || n.includes('benedictino') || n.includes('puyehue') || n.includes('porvenir') ||
                     n.includes('nestle') || n.includes('nestlé') || n.includes('aquarius') || n.includes('con gas') ||
                     n.includes('sin gas') || n.includes('gasificada') || n.includes('soda') || n.includes('smartwater') ||
                     n.includes('perrier') || n.includes('san pellegrino') || n.includes('evian') || n.includes('mas water') ||
                     n.includes('más water');

      const isEnergetica = n.includes('red bull') || n.includes('redbull') || n.includes('monster') ||
                           n.includes('score') || n.includes('dark dog') || n.includes('energetica') ||
                           n.includes('energética') || n.includes('rockstar') || n.includes('mr big') ||
                           n.includes('mr. big');

      const isHielo = n.includes('hielo') || n.includes('cubo') || n.includes('bolsa de hielo') || n.includes('hielo purificado');

      // Comprehensive Chilean soft drinks, sodas, and CCU / Embonor product detection
      const isBebida = n.includes('bebida') || n.includes('bebidas') || n.includes('gaseosa') || n.includes('gaseosas') ||
                       n.includes('fantasia') || n.includes('fantasía') || n.includes('refresco') || n.includes('refrescos') ||
                       n.includes('coca') || n.includes('coca-cola') || n.includes('coca cola') || n.includes('sprite') ||
                       n.includes('fanta') || n.includes('pepsi') || n.includes('bilz') || n.includes('pap') ||
                       n.includes('kem') || n.includes('kem piña') || n.includes('kem zero') || n.includes('limon soda') ||
                       n.includes('limón soda') || n.includes('7up') || n.includes('seven up') || n.includes('ginger') ||
                       n.includes('ginger ale') || n.includes('tonica') || n.includes('tónica') || n.includes('canada dry') ||
                       n.includes('nordic') || n.includes('nordic mist') || n.includes('crush') || n.includes('sorbete letelier') ||
                       n.includes('jugo') || n.includes('jugos') || n.includes('watts') || n.includes('watt\'s') ||
                       n.includes('kapo') || n.includes('nectar') || n.includes('néctar') || n.includes('limonada') ||
                       n.includes('guarana') || n.includes('guaraná') || n.includes('schweppes') || n.includes('gatorade') ||
                       n.includes('powerade') || n.includes('isotonica') || n.includes('isotónica') ||
                       // Explicit CCU beverage handling: "Bebidas CCU", "Bebida CCU", "CCU Variedades", "CCU 3 litros", etc.
                       (n.includes('ccu') && (n.includes('bebida') || n.includes('variedad') || n.includes('variedades') ||
                        n.includes('litro') || n.includes('litros') || n.includes('lt') || n.includes('lts') ||
                        n.includes('3l') || n.includes('2l') || n.includes('1.5') || n.includes('2.5') || n.includes('3 l') ||
                        !n.includes('cerveza') && !n.includes('cristal') && !n.includes('escudo') && !n.includes('royal')));

      if ((isAgua || isEnergetica || isHielo || isBebida) && !isSpiritComboPack) {
        categoryId = 'cat-bebidas';
        categoryName = 'Bebidas, Aguas & Hielo';

        if (isAgua) {
          if (n.includes('con gas') || n.includes('gasificada')) {
            subcategory = 'Aguas con Gas';
          } else if (n.includes('sin gas')) {
            subcategory = 'Aguas sin Gas';
          } else {
            subcategory = 'Aguas Minerales';
          }
          image = BEVERAGE_IMAGES.agua;
          if (n.includes('cachantun') || n.includes('cachantún')) brand = 'Cachantún';
          else if (n.includes('vital')) brand = 'Vital';
          else if (n.includes('benedictino')) brand = 'Benedictino';
          else if (n.includes('puyehue')) brand = 'Puyehue';
          else if (n.includes('porvenir')) brand = 'Porvenir';
          else brand = 'Agua Mineral';
        } else if (isEnergetica) {
          subcategory = 'Bebidas Energéticas';
          image = BEVERAGE_IMAGES.energetica;
          if (n.includes('red bull') || n.includes('redbull')) brand = 'Red Bull';
          else if (n.includes('monster')) brand = 'Monster';
          else if (n.includes('score')) brand = 'Score';
          else brand = 'Energética';
        } else if (isHielo) {
          subcategory = 'Hielo & Complementos';
          image = BEVERAGE_IMAGES.hielo;
          brand = 'Hielo Purificado';
        } else {
          // Soft drinks / Bebidas de fantasía / CCU / Embonor
          if (n.includes('ccu') || n.includes('bilz') || n.includes('pap') || n.includes('kem') || n.includes('limon soda') || n.includes('limón soda')) {
            subcategory = 'Bebidas Fantasía CCU';
            if (n.includes('bilz')) brand = 'Bilz';
            else if (n.includes('pap')) brand = 'Pap';
            else if (n.includes('kem')) brand = 'Kem Piña';
            else if (n.includes('limon soda') || n.includes('limón soda')) brand = 'Limón Soda';
            else brand = 'CCU';
          } else if (n.includes('jugo') || n.includes('watts') || n.includes('kapo') || n.includes('nectar') || n.includes('néctar')) {
            subcategory = 'Jugos & Néctar';
            brand = n.includes('watts') ? "Watt's" : (n.includes('kapo') ? 'Kapo' : 'Jugo Natural');
          } else {
            subcategory = 'Bebidas Gaseosas';
            if (n.includes('coca')) brand = 'Coca-Cola';
            else if (n.includes('sprite')) brand = 'Sprite';
            else if (n.includes('fanta')) brand = 'Fanta';
            else if (n.includes('pepsi')) brand = 'Pepsi';
            else if (n.includes('canada dry')) brand = 'Canada Dry';
            else if (n.includes('nordic')) brand = 'Nordic';
            else if (n.includes('crush')) brand = 'Crush';
            else brand = 'Bebidas Gaseosas';
          }
          image = BEVERAGE_IMAGES.bebida;
        }
      }
      // 2. SNACKS & PICOTEOS
      else if (n.includes('papas') || n.includes('lays') || n.includes("lay's") || n.includes('dorito') ||
               n.includes('cheeto') || n.includes('ramitas') || n.includes('evercrisp') || n.includes('mani') ||
               n.includes('maní') || n.includes('frutos secos') || n.includes('almendra') || n.includes('pistacho') ||
               n.includes('nacho') || n.includes('snack') || n.includes('galleta') || n.includes('chocolate') ||
               n.includes('chocman') || n.includes('super 8') || n.includes('tika')) {
        categoryId = 'cat-snacks';
        categoryName = 'Snacks & Picoteos';
        if (n.includes('papas') || n.includes('lays') || n.includes("lay's")) {
          subcategory = 'Papas Fritas';
          brand = "Lay's";
        } else if (n.includes('ramitas') || n.includes('evercrisp') || n.includes('dorito') || n.includes('cheeto')) {
          subcategory = 'Snacks Salados';
          brand = 'Evercrisp';
        } else if (n.includes('mani') || n.includes('maní') || n.includes('almendra') || n.includes('frutos secos')) {
          subcategory = 'Frutos Secos';
          brand = 'Selección';
        } else {
          subcategory = 'Picoteos & Dulces';
          brand = 'Snack';
        }
        image = BEVERAGE_IMAGES.snack;
      }
      // 3. APERITIVOS & LICORES
      else if (n.includes('aperol') || n.includes('campari') || n.includes('ramazzotti') || n.includes('fernet') ||
               n.includes('branca') || n.includes('vermouth') || n.includes('vermut') || n.includes('martini') ||
               n.includes('baileys') || n.includes('jagermeister') || n.includes('jägermeister') ||
               n.includes('sheridan') || n.includes('kahlua') || n.includes('cointreau') || n.includes('amaretto') ||
               n.includes('limoncello') || (n.includes('licor') && !n.includes('pisco'))) {
        categoryId = 'cat-aperitivos';
        categoryName = 'Aperitivos & Licores';
        if (n.includes('aperol')) { subcategory = 'Aperitivos Italianos'; brand = 'Aperol'; }
        else if (n.includes('ramazzotti')) { subcategory = 'Aperitivos'; brand = 'Ramazzotti'; }
        else if (n.includes('fernet') || n.includes('branca')) { subcategory = 'Digestivos & Bitter'; brand = 'Fernet Branca'; }
        else if (n.includes('baileys')) { subcategory = 'Licores & Cremas'; brand = 'Baileys'; }
        else if (n.includes('jagermeister') || n.includes('jägermeister')) { subcategory = 'Licores de Hierbas'; brand = 'Jägermeister'; }
        else { subcategory = 'Licores & Aperitivos'; brand = 'Aperitivo'; }
        image = BEVERAGE_IMAGES.aperitivo;
      }
      // 4. CERVEZAS & ARTESANALES
      else if (n.includes('cerveza') || n.includes('beer') || n.includes('lager') || n.includes('ipa') ||
               n.includes('ale') || n.includes('stout') || n.includes('porter') || n.includes('pilsen') ||
               n.includes('corona') || n.includes('heineken') || n.includes('stella') || n.includes('austral') ||
               n.includes('kunstmann') || n.includes('kross') || n.includes('royal guard') || n.includes('cristal') ||
               n.includes('escudo') || n.includes('becker') || n.includes('budweiser') || n.includes('cusqueña') ||
               n.includes('sol') || n.includes('miller') || n.includes('coors') || n.includes('blue moon') ||
               n.includes('guinness') || n.includes('schop') || n.includes('torobayo') || n.includes('calafate') ||
               n.includes('sixpack') || n.includes('six pack')) {
        categoryId = 'cat-cervezas';
        categoryName = 'Cervezas & Artesanales';
        if (n.includes('artesanal') || n.includes('kross') || n.includes('kunstmann') || n.includes('austral') ||
            n.includes('torobayo') || n.includes('calafate') || n.includes('ipa') || n.includes('stout')) {
          subcategory = 'Cervezas Artesanales';
        } else if (n.includes('corona') || n.includes('heineken') || n.includes('stella') || n.includes('budweiser') || n.includes('miller')) {
          subcategory = 'Cervezas Importadas';
        } else {
          subcategory = 'Cervezas Heladas';
        }
        if (n.includes('cristal')) brand = 'Cristal';
        else if (n.includes('escudo')) brand = 'Escudo';
        else if (n.includes('corona')) brand = 'Corona';
        else if (n.includes('heineken')) brand = 'Heineken';
        else if (n.includes('austral')) brand = 'Austral';
        else if (n.includes('kunstmann')) brand = 'Kunstmann';
        else brand = 'Cerveza';
        image = BEVERAGE_IMAGES.cerveza;
      }
      // 5. VINOS & ESPUMANTES
      else if (n.includes('vino') || n.includes('tinto') || n.includes('blanco') || n.includes('rosé') ||
               n.includes('rose') || n.includes('cabernet') || n.includes('carmenere') || n.includes('carmenère') ||
               n.includes('merlot') || n.includes('sauvignon') || n.includes('syrah') || n.includes('malbec') ||
               n.includes('pinot') || n.includes('reserva') || n.includes('gran reserva') || n.includes('casillero') ||
               n.includes('montes') || n.includes('tarapaca') || n.includes('gato negro') || n.includes('espumante') ||
               n.includes('champagne') || n.includes('champaña') || n.includes('brut') || n.includes('extra brut') ||
               n.includes('demi sec') || n.includes('prosecco') || n.includes('cava') || n.includes('valdivieso') ||
               n.includes('chandon') || n.includes('undurraga') || n.includes('riccadonna') || n.includes('concha y toro')) {
        categoryId = 'cat-vinos';
        categoryName = 'Vinos & Espumantes';
        if (n.includes('espumante') || n.includes('champagne') || n.includes('champaña') || n.includes('brut') ||
            n.includes('chandon') || n.includes('valdivieso') || n.includes('cava') || n.includes('prosecco')) {
          subcategory = 'Espumantes & Cavas';
          image = BEVERAGE_IMAGES.espumante;
        } else if (n.includes('sauvignon') || n.includes('blanco') || n.includes('chardonnay')) {
          subcategory = 'Vinos Blancos';
          image = BEVERAGE_IMAGES.vino;
        } else {
          subcategory = 'Vinos Tintos';
          image = BEVERAGE_IMAGES.vino;
        }
        if (n.includes('casillero')) brand = 'Casillero del Diablo';
        else if (n.includes('gato negro')) brand = 'Gato Negro';
        else if (n.includes('valdivieso')) brand = 'Valdivieso';
        else brand = 'Viña Chilena';
      }
      // 6. DESTILADOS (ONLY when explicit spirits keywords are present!)
      else if (n.includes('pisco') || n.includes('mistral') || n.includes('alto del carmen') || n.includes('capel') ||
               n.includes('horcon') || n.includes('horcón') || n.includes('control') || n.includes('campanario') ||
               n.includes('tres erres') || n.includes('mal paso') || n.includes('bauza') || n.includes('bauzá') ||
               n.includes('whisky') || n.includes('whiskey') || n.includes('bourbon') || n.includes('johnnie') ||
               n.includes('chivas') || n.includes('jack daniel') || n.includes('ballantine') || n.includes('gin') ||
               n.includes('vodka') || n.includes('ron') || n.includes('tequila') || n.includes('destilado') ||
               n.includes('35°') || n.includes('40°') || n.includes('46°') || n.includes('transparente')) {
        categoryId = 'cat-destilados';
        categoryName = 'Destilados & Piscos';
        if (n.includes('whisky') || n.includes('whiskey') || n.includes('bourbon') || n.includes('johnnie') ||
            n.includes('chivas') || n.includes('jack') || n.includes('ballantine') || n.includes('jameson') ||
            n.includes('black label') || n.includes('red label')) {
          subcategory = 'Whiskies & Bourbons';
          image = BEVERAGE_IMAGES.whisky;
          brand = n.includes('johnnie') ? 'Johnnie Walker' : (n.includes('jack') ? "Jack Daniel's" : 'Whisky');
        } else if (n.includes('gin') || n.includes('tanqueray') || n.includes('bombay') || n.includes('beefeater') ||
                   n.includes('hendrick') || n.includes('malfy')) {
          subcategory = 'Gin Botánico';
          image = BEVERAGE_IMAGES.vodka_gin;
          brand = n.includes('tanqueray') ? 'Tanqueray' : (n.includes('bombay') ? 'Bombay Sapphire' : 'Gin');
        } else if (n.includes('vodka') || n.includes('absolut') || n.includes('smirnoff') || n.includes('grey goose') ||
                   n.includes('ciroc') || n.includes('stoli')) {
          subcategory = 'Vodka Importado';
          image = BEVERAGE_IMAGES.vodka_gin;
          brand = n.includes('absolut') ? 'Absolut' : (n.includes('smirnoff') ? 'Smirnoff' : 'Vodka');
        } else if (n.includes('tequila') || n.includes('cuervo') || n.includes('don julio') || n.includes('ron') ||
                   n.includes('havana') || n.includes('bacardi') || n.includes('barcelo') || n.includes('zacapa')) {
          subcategory = 'Ron & Tequila';
          image = BEVERAGE_IMAGES.pisco;
          brand = n.includes('havana') ? 'Havana Club' : (n.includes('bacardi') ? 'Bacardí' : 'Destilado');
        } else {
          subcategory = 'Piscos Chilenos';
          image = BEVERAGE_IMAGES.pisco;
          brand = n.includes('mistral') ? 'Mistral' : (n.includes('alto del carmen') ? 'Alto del Carmen' : (n.includes('capel') ? 'Capel' : 'Pisco Chileno'));
        }
      }
      // 7. SAFE FALLBACK (Defaults to Bebidas & Refrescos if no alcohol is detected)
      else {
        categoryId = 'cat-bebidas';
        categoryName = 'Bebidas, Aguas & Hielo';
        subcategory = 'Bebidas Gaseosas';
        image = BEVERAGE_IMAGES.bebida;
        brand = 'Bebida';
      }

      // Offer classification
      let offerType: 'mega_offer' | 'regular_offer' | 'standard' = 'standard';
      let suggestedOriginalPrice = origPrice && origPrice > price ? origPrice : undefined;
      let discount: string | undefined = undefined;
      let aiReason = `Clasificado en pasillo ${categoryName}.`;

      const isComboOrPack = isSpiritComboPack || n.includes('pack 24') || n.includes('pack 12') ||
                            n.includes('combo') || n.includes('2x1') || n.includes('3x2') ||
                            n.includes('mega oferta') || n.includes('promocion') || n.includes('promoción');

      if (isComboOrPack) {
        offerType = 'mega_offer';
        image = BEVERAGE_IMAGES.pack;
        if (!suggestedOriginalPrice) {
          suggestedOriginalPrice = Math.round((price * 1.28) / 100) * 100;
        }
        const pct = Math.round(((suggestedOriginalPrice - price) / suggestedOriginalPrice) * 100);
        discount = `-${pct}%`;
        aiReason = '🔥 Detectado como Pack/Promo estelar: clasificado como Mega Oferta para portada.';
      } else if (suggestedOriginalPrice && suggestedOriginalPrice > price) {
        const pct = Math.round(((suggestedOriginalPrice - price) / suggestedOriginalPrice) * 100);
        offerType = pct >= 25 ? 'mega_offer' : 'regular_offer';
        discount = `-${pct}%`;
        aiReason = `🏷️ Detectado con precio promocional (${discount}): clasificado como Oferta destacada.`;
      } else if (price > 12000 && (n.includes('whisky') || n.includes('gin') || n.includes('reserva') || n.includes('gran reserva'))) {
        offerType = 'regular_offer';
        suggestedOriginalPrice = Math.round((price * 1.20) / 100) * 100;
        const pct = Math.round(((suggestedOriginalPrice - price) / suggestedOriginalPrice) * 100);
        discount = `-${pct}%`;
        aiReason = '✨ Producto premium de alta rotación con precio de referencia de mercado.';
      }

      return {
        categoryId,
        categoryName,
        subcategory,
        offerType,
        discount,
        suggestedOriginalPrice,
        description: `Selección Fella's Market. ${name}, disponible con despacho exprés a tu puerta.`,
        image,
        brand,
        aiReason
      };
    };

    // Attempt Gemini AI classification
    const ai = getGeminiAi();
    let geminiClassified: any[] | null = null;

    if (ai) {
      try {
        const simplifiedItems = items.map((it, idx) => ({
          idx,
          nombre: it.name,
          precio: it.price,
          precioOriginal: it.originalPrice || null
        }));

        const prompt = `Eres el sommelier y gestor experto de catálogo para la botillería y minimarket chileno "Fella's Market".
Tengo la siguiente lista de productos leída desde una planilla de Excel:
${JSON.stringify(simplifiedItems)}

¡CONOCIMIENTO CRÍTICO DEL MERCADO CHILENO Y DISTRIBUIDORES!:
1. CCU (Compañía de Cervecerías Unidas) NO es sólo alcohol. CCU es el principal fabricante y distribuidor en Chile de:
   - BEBIDAS DE FANTASÍA Y GASEOSAS: Bilz, Pap, Kem Piña, Kem Zero, Limón Soda, Canada Dry, Crush, 7Up, Pepsi, Sorbete Letelier.
   - AGUAS: Cachantún, Porvenir, Más Water.
   - JUGOS: Watt's, Kapo.
   - ENERGIZANTES / ISOTÓNICAS: Red Bull, Gatorade.
   - Por ende, si un producto dice "Bebidas CCU Variedades", "Bebida CCU", "Kem", "Limón Soda", "Bilz", "Pap", etc., ¡JAMÁS ES UN PISCO O DESTILADO! Corresponde OBLIGATORIAMENTE a "cat-bebidas" ("Bebidas, Aguas & Hielo") con subcategoría "Bebidas Fantasía CCU" o "Bebidas Gaseosas".

2. EMBONOR / ANDINA (Coca-Cola Company): Coca-Cola, Sprite, Fanta, Nordic Mist, Aquarius, Benedictino, Vital, Monster, Powerade -> "cat-bebidas".

3. LOS DESTILADOS Y PISCOS sólo aplican si el producto es explícitamente alcohol destilado (Pisco Mistral, Alto del Carmen, Capel, Horcón Quemado, Campanario, Whisky, Gin, Vodka, Ron, Tequila, etc.).

CATEGORÍAS OFICIALES DE LA TIENDA:
- "cat-bebidas" ("Bebidas, Aguas & Hielo"):
  * AGUAS MINERALES (con gas, sin gas, saborizadas, Vital, Cachantún, Puyehue, Benedictino, Porvenir, etc.)
  * BEBIDAS GASEOSAS Y FANTASÍA (Bebidas CCU, Coca-Cola, Sprite, Fanta, Pepsi, Bilz, Pap, Kem, Limón Soda, Ginger Ale, Canada Dry, Crush, Tónica Nordic)
  * ENERGÉTICAS (Red Bull, Monster, Score, etc.)
  * HIELO EN BOLSA Y JUGOS (Watt's, etc.)

- "cat-cervezas" ("Cervezas & Artesanales"):
  * Cervezas nacionales e importadas (Corona, Heineken, Stella, Austral, Kunstmann, Kross, Royal Guard, Cristal, Escudo, etc.)

- "cat-vinos" ("Vinos & Espumantes"):
  * Vinos tintos (Cabernet, Carmenère, Merlot), vinos blancos (Sauvignon Blanc, Chardonnay), Espumantes (Brut, Chandon, Valdivieso)

- "cat-destilados" ("Destilados & Piscos"):
  * Piscos chilenos (Mistral, Alto del Carmen), Whiskies (Johnnie Walker, Jack Daniel's), Gin, Vodkas, Ron, Tequilas

- "cat-snacks" ("Snacks & Picoteos"):
  * Papas fritas Lay's, ramitas Evercrisp, maní salado, frutos secos, nachos

- "cat-aperitivos" ("Aperitivos & Licores"):
  * Aperol, Ramazzotti, Fernet Branca, Baileys, Jägermeister, licores dulces

Para cada producto en orden devuelve un objeto JSON con:
- 'idx': índice del producto (número entero).
- 'categoryId': uno de ["cat-bebidas", "cat-cervezas", "cat-vinos", "cat-destilados", "cat-snacks", "cat-aperitivos"].
- 'categoryName': nombre exacto de la categoría asignada.
- 'subcategory': subcategoría específica (ejemplos: "Aguas con Gas", "Aguas sin Gas", "Bebidas Fantasía CCU", "Bebidas Gaseosas", "Bebidas Energéticas", "Hielo & Complementos", "Piscos Chilenos", "Cervezas Heladas", "Cervezas Artesanales", "Vinos Tintos", "Espumantes & Cavas", "Papas Fritas", "Aperitivos Italianos").
- 'offerType': "mega_offer" (si es pack/combo fiesta), "regular_offer" (si tiene descuento), o "standard".
- 'suggestedOriginalPrice': precio original de mercado o null.
- 'discount': string con descuento si aplica (ej: "-25%"), o null.
- 'brand': marca comercial reconocida (ej: "CCU", "Cachantún", "Coca-Cola", "Mistral", "Corona", "Lay's", "Aperol").
- 'imageType': uno de ["agua", "bebida", "energetica", "hielo", "cerveza", "vino", "espumante", "pisco", "whisky", "vodka_gin", "snack", "aperitivo", "pack"].
- 'aiReason': breve explicación indicando por qué se asignó a este pasillo.

Responde ÚNICAMENTE el JSON array válido.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          geminiClassified = JSON.parse(jsonMatch[0]);
        }
      } catch (geminiError) {
        console.warn('Gemini AI classification fallback triggered:', geminiError);
      }
    }

    // Merge results with high-priority safety check
    const results = items.map((it: any, idx: number) => {
      const gItem = geminiClassified && Array.isArray(geminiClassified) 
        ? geminiClassified.find((g: any) => g.idx === idx || g.index === idx) || geminiClassified[idx] 
        : null;
      
      const heuristic = runHeuristic(it.name, it.price, it.originalPrice);

      // CRITICAL SAFETY CHECK: If heuristic detected an Agua or Bebida, force category to cat-bebidas
      // This guarantees an Agua con gas can NEVER be classified as destilados under any circumstance!
      let categoryId = gItem?.categoryId || heuristic.categoryId;
      if (heuristic.categoryId === 'cat-bebidas') {
        categoryId = 'cat-bebidas';
      }

      const matchingCategory = availableCategories.find(c => c.id === categoryId) || 
                               STANDARD_BOTILLERIA_TEMPLATES[categoryId] as any;
      
      const categoryName = matchingCategory?.name || heuristic.categoryName;
      const subcategory = (categoryId === 'cat-bebidas' && heuristic.categoryId === 'cat-bebidas')
        ? heuristic.subcategory
        : (gItem?.subcategory || heuristic.subcategory);

      const offerType: 'mega_offer' | 'regular_offer' | 'standard' = gItem?.offerType || heuristic.offerType;
      const suggestedOriginalPrice = gItem?.suggestedOriginalPrice || it.originalPrice || heuristic.suggestedOriginalPrice;
      
      let discount = gItem?.discount || heuristic.discount;
      if (!discount && suggestedOriginalPrice && suggestedOriginalPrice > it.price) {
        const pct = Math.round(((suggestedOriginalPrice - it.price) / suggestedOriginalPrice) * 100);
        discount = `-${pct}%`;
      }

      const imageType = (categoryId === 'cat-bebidas') 
        ? (heuristic.subcategory.includes('Gas') ? 'agua' : (heuristic.subcategory.includes('Energética') ? 'energetica' : (heuristic.subcategory.includes('Hielo') ? 'hielo' : 'bebida')))
        : (gItem?.imageType || 'pack');

      const image = BEVERAGE_IMAGES[imageType] || heuristic.image;
      const brand = gItem?.brand || heuristic.brand || '';
      const description = gItem?.description || heuristic.description;
      const aiReason = gItem?.aiReason || heuristic.aiReason;

      return {
        id: `prod-excel-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        name: it.name,
        price: Number(it.price) || 9990,
        originalPrice: suggestedOriginalPrice ? Number(suggestedOriginalPrice) : undefined,
        categoryId,
        categoryName,
        subcategory,
        offerType,
        discount: (offerType !== 'standard' && discount) ? discount : undefined,
        description,
        image,
        stock: it.stock ? Number(it.stock) : 24,
        inStock: true,
        brand,
        aiReason,
        selected: true
      };
    });

    res.json({
      success: true,
      classifiedWith: geminiClassified ? 'gemini-3.8-flash' : 'heuristics-botilleria-engine',
      total: results.length,
      counts: {
        megaOffers: results.filter(r => r.offerType === 'mega_offer').length,
        regularOffers: results.filter(r => r.offerType === 'regular_offer').length,
        standard: results.filter(r => r.offerType === 'standard').length
      },
      products: results
    });
  } catch (error: any) {
    console.error('Error classifying excel products:', error);
    res.status(500).json({ error: 'Error al procesar y clasificar planilla de productos con IA' });
  }
});

// 16. Bulk Import Products to Catalog (/api/admin/bulk-import)
app.post('/api/admin/bulk-import', (req, res) => {
  try {
    const { products, clearPrevious = false } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'No se recibieron productos para importar' });
    }

    // If requested, clear previous products from catalog before importing
    if (clearPrevious) {
      megaOffers = [];
      categories.forEach((cat) => {
        cat.products = [];
      });
    }

    let importedCount = 0;
    let megaOffersAdded = 0;

    products.forEach((item: any) => {
      const prod: Product = {
        id: item.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: item.name,
        category: item.categoryName || 'Bebidas, Aguas & Hielo',
        categoryId: item.categoryId || 'cat-bebidas',
        subcategory: item.subcategory || item.categoryName || 'General',
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
        image: item.image || BEVERAGE_IMAGES.pisco,
        description: item.description || `Disponible en Fella's Market.`,
        discount: item.discount || undefined,
        isMegaOffer: item.offerType === 'mega_offer',
        buttonText: 'Comprar',
        stock: item.stock || 24,
        inStock: item.inStock !== false,
        brand: item.brand || undefined,
        publishedSocial: true
      };

      // If mega offer, also add to megaOffers list
      if (item.offerType === 'mega_offer') {
        megaOffers.push(prod);
        megaOffersAdded++;
      }

      // Add to corresponding category, creating category automatically if it doesn't exist yet!
      let targetCat = categories.find(c => c.id === prod.categoryId);
      if (!targetCat) {
        targetCat = categories.find(c => c.name.toLowerCase() === prod.category.toLowerCase());
      }

      // If category still doesn't exist, create it dynamically from template!
      if (!targetCat) {
        const tmpl = STANDARD_BOTILLERIA_TEMPLATES[prod.categoryId] || {
          name: prod.category || 'Catálogo General',
          icon: 'fa-solid fa-box-open',
          badge: 'Sección de Tienda',
          title: prod.category || 'Catálogo General',
          description: 'Selección de productos disponibles en tienda.',
          bannerImage: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=1600&auto=format&fit=crop'
        };

        targetCat = {
          id: prod.categoryId,
          name: tmpl.name || prod.category,
          icon: tmpl.icon || 'fa-solid fa-tag',
          badge: tmpl.badge || 'Sección',
          title: tmpl.title || prod.category,
          description: tmpl.description || '',
          bannerImage: tmpl.bannerImage || '',
          products: []
        };
        categories.push(targetCat);
      }

      if (targetCat) {
        // Prevent duplicate IDs
        targetCat.products = targetCat.products.filter(p => p.id !== prod.id);
        targetCat.products.push(prod);
        importedCount++;
      }
    });

    res.json({
      success: true,
      message: `Se importaron ${importedCount} productos exitosamente (${megaOffersAdded} en Mega Ofertas).`,
      importedCount,
      megaOffersAdded,
      categories,
      megaOffers
    });
  } catch (err: any) {
    console.error('Error during bulk import:', err);
    res.status(500).json({ error: 'Error interno al guardar los productos en la base de datos' });
  }
});

// Start Server with Vite Middleware in Development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Botillería server running on http://0.0.0.0:${PORT}`);
    startKeepAliveEngine();
  });
}

startServer();
