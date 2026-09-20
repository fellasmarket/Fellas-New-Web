export interface Product {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  subcategory: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  unit?: string;
  buttonText?: string;
  discount?: string;
  isMegaOffer?: boolean;
  stock?: number;
  inStock?: boolean;
  publishedSocial?: boolean;
  brand?: string;
  varieties?: string[];
}

export interface BackupStoreConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  bannerNotice: string;
  whatsappNumber: string;
  deliveryCost: number;
  selectedProductIds: string[];
}

export interface SubscriptionPopupConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  discountBadge: string;
  buttonText: string;
  image?: string;
}

export interface FeedbackItem {
  id: string;
  type: 'felicitacion' | 'sugerencia' | 'reclamo' | 'consulta';
  name: string;
  email: string;
  phone?: string;
  orderNumber?: string;
  message: string;
  status: 'pendiente' | 'revisado' | 'resuelto';
  createdAt: string;
}

export interface CustomerDiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  amount: number;
  customerId?: string | null;
  minOrder?: number;
  usesLeft?: number | null;
  active: boolean;
  expiresAt?: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariety?: string;
}

export interface ClassifiedExcelProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  categoryName: string;
  subcategory: string;
  offerType: 'mega_offer' | 'regular_offer' | 'standard';
  discount?: string;
  description: string;
  image: string;
  stock: number;
  inStock?: boolean;
  brand?: string;
  aiReason?: string;
  selected: boolean;
}

export interface CategoryData {
  id: string;
  name: string;
  icon: string;
  badge: string;
  title: string;
  description: string;
  bannerImage: string;
  bannerPosition?: 'center' | 'top' | 'bottom';
  products: Product[];
  subcategories?: string[];
  featuredProductIds?: string[];
}

export interface HeroSlide {
  id: number;
  badge: string;
  icon: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  image: string;
}

export interface UserAccount {
  name: string;
  email: string;
  isLoggedIn: boolean;
  role?: 'admin' | 'customer' | 'delivery';
  discountPercent?: number;
  phone?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
  selectedVariety?: string;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  location: string;
  address?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  status: 'nuevo' | 'confirmado_preparacion' | 'listo_retirar' | 'delivery_camino' | 'entregado' | 'en_preparacion' | 'en_camino' | 'cancelado';
  createdAt: string;
}

export interface DeliveryLocation {
  id?: string;
  name: string;
  price: number;
  estimatedMinutes?: number;
}

export interface DaySchedule {
  day: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  label: string;
  isOpen: boolean;
  openTime: string; // ej. '12:00'
  closeTime: string; // ej. '03:00'
}

export interface StoreScheduleConfig {
  enabled: boolean;
  manualOverride?: 'auto' | 'force_open' | 'force_closed';
  closedMessage?: string;
  days: DaySchedule[];
}

export interface MegaOffersConfig {
  sectionTitle: string;
  sectionSubtitle?: string;
  badgeText?: string;
  bgImage?: string;
}

export interface StoreSettings {
  isEmergencyMode?: boolean;
  storeName?: string;
  logoImage?: string;
  logoTextPrimary: string;
  logoTextAccent: string;
  tagline: string;
  footerAbout: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactHours?: string;
  footerCategoriesTitle?: string;
  footerDeliveryTitle?: string;
  footerDeliverySubtitle?: string;
  footerDeliveryNotice?: string;
  footerContactTitle?: string;
  footerCopyrightText?: string;
  deliveryZones: string[];
  deliveryLocations?: DeliveryLocation[];
  freeShippingThreshold?: number;
  scheduleConfig?: StoreScheduleConfig;
  customerDiscountPercent?: number;
  customerDiscountTiers: {
    name: string;
    minPurchases: number;
    discountPercent: number;
  }[];
  socialInstagram: string;
  socialTwitter: string;
  socialFacebook: string;
  socialWhatsapp: string;
  megaOffersConfig?: MegaOffersConfig;
  bottomBannerImage?: string;
  bottomBannerLink?: string;
  showBottomBanner?: boolean;
  showBottomDualBanners?: boolean;
  bottomDualBanner1Image?: string;
  bottomDualBanner1Link?: string;
  bottomDualBanner2Image?: string;
  bottomDualBanner2Link?: string;
  renderKeepAliveEnabled?: boolean;
  renderAppUrl?: string;
  renderPingIntervalMinutes?: number;
  agencyLogoImage?: string;
  agencyName?: string;
  agencyLink?: string;
  bankTransferConfig?: {
    bankName: string;
    accountType: string;
    accountNumber: string;
    rut: string;
    accountHolder: string;
    email: string;
    instructions?: string;
  };
}

export interface KeepAliveLog {
  timestamp: string;
  url: string;
  status: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface KeepAliveStats {
  enabled: boolean;
  intervalMinutes: number;
  totalPings: number;
  successfulPings: number;
  failedPings: number;
  lastPingAt: string | null;
  lastPingSuccess: boolean | null;
  lastPingResponseStatus: number | null;
  lastPingDurationMs: number | null;
  targetUrl: string;
  uptimeSeconds: number;
  history: KeepAliveLog[];
}

export interface EmailMarketingSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  source: string;
  status: 'activo' | 'desuscrito';
}
