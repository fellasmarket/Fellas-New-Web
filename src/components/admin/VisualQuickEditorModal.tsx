import React, { useState, useEffect, useRef } from 'react';
import { Product, CategoryData, HeroSlide, StoreSettings } from '../../types';
import { formatPrice } from '../../data/products';

export type QuickEditTarget =
  | { type: 'product'; product: Product; categoryId?: string }
  | { type: 'hero_slide'; slide: HeroSlide; index: number }
  | { type: 'category'; category: CategoryData }
  | { type: 'bottom_promo_banner' }
  | { type: 'bottom_dual_banners'; whichBanner?: 1 | 2 }
  | { type: 'mega_offers_section' }
  | { type: 'store_settings'; section?: 'brand' | 'contact' | 'footer' };

interface VisualQuickEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: QuickEditTarget | null;
  categories: CategoryData[];
  settings: StoreSettings;
  heroSlides: HeroSlide[];
  onUpdateProduct: (product: Product, categoryId?: string) => Promise<void> | void;
  onUpdateCategory: (category: CategoryData) => Promise<void> | void;
  onUpdateHeroSlide: (slide: HeroSlide, index: number) => Promise<void> | void;
  onUpdateSettings: (settings: StoreSettings) => Promise<void> | void;
  showToast: (msg: string) => void;
}

export const VisualQuickEditorModal: React.FC<VisualQuickEditorModalProps> = ({
  isOpen,
  onClose,
  target,
  categories,
  settings,
  heroSlides,
  onUpdateProduct,
  onUpdateCategory,
  onUpdateHeroSlide,
  onUpdateSettings,
  showToast
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for Product
  const [prodForm, setProdForm] = useState<Product | null>(null);

  // Form states for Hero Slide
  const [slideForm, setSlideForm] = useState<HeroSlide | null>(null);

  // Form states for Category
  const [catForm, setCatForm] = useState<CategoryData | null>(null);

  // Form states for Bottom Promo Banner
  const [bottomPromoImage, setBottomPromoImage] = useState('');
  const [bottomPromoLink, setBottomPromoLink] = useState('');
  const [showBottomPromo, setShowBottomPromo] = useState(true);

  // Form states for Bottom Dual Banners
  const [dual1Image, setDual1Image] = useState('');
  const [dual1Link, setDual1Link] = useState('');
  const [dual2Image, setDual2Image] = useState('');
  const [dual2Link, setDual2Link] = useState('');
  const [showDualBanners, setShowDualBanners] = useState(true);

  // Form states for Mega Offers Header
  const [megaTitle, setMegaTitle] = useState('');
  const [megaSubtitle, setMegaSubtitle] = useState('');
  const [megaBadge, setMegaBadge] = useState('');
  const [megaBgImage, setMegaBgImage] = useState('');

  // Form states for Store Settings
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);

  // Populate form on target change
  useEffect(() => {
    if (!target) return;

    if (target.type === 'product') {
      setProdForm({ ...target.product });
    } else if (target.type === 'hero_slide') {
      setSlideForm({ ...target.slide });
    } else if (target.type === 'category') {
      setCatForm({ ...target.category });
    } else if (target.type === 'bottom_promo_banner') {
      setBottomPromoImage(settings.bottomBannerImage || '');
      setBottomPromoLink(settings.bottomBannerLink || '');
      setShowBottomPromo(settings.showBottomBanner !== false);
    } else if (target.type === 'bottom_dual_banners') {
      setDual1Image(settings.bottomDualBanner1Image || '');
      setDual1Link(settings.bottomDualBanner1Link || '');
      setDual2Image(settings.bottomDualBanner2Image || '');
      setDual2Link(settings.bottomDualBanner2Link || '');
      setShowDualBanners(settings.showBottomDualBanners !== false);
    } else if (target.type === 'mega_offers_section') {
      setMegaTitle(settings.megaOffersConfig?.sectionTitle || '¡MEGA OFERTAS DEL TÍO FELLAS!');
      setMegaSubtitle(settings.megaOffersConfig?.sectionSubtitle || 'Promociones brutales por tiempo limitado');
      setMegaBadge(settings.megaOffersConfig?.badgeText || 'OFERTAS ACTIVAS');
      setMegaBgImage(settings.megaOffersConfig?.bgImage || '');
    } else if (target.type === 'store_settings') {
      setSettingsForm({ ...settings });
    }
  }, [target, settings]);

  if (!isOpen || !target) return null;

  // File Upload Helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldSetter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsSaving(true);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al subir imagen');
      
      const { url } = await response.json();
      fieldSetter(url);
      showToast('Imagen subida con éxito');
    } catch (err) {
      console.error(err);
      showToast('Error al subir imagen');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (target.type === 'product' && prodForm) {
        await onUpdateProduct(prodForm, target.categoryId);
        showToast(`¡Producto "${prodForm.name}" actualizado con éxito!`);
      } else if (target.type === 'hero_slide' && slideForm) {
        await onUpdateHeroSlide(slideForm, target.index);
        showToast('¡Slide de banner principal actualizado con éxito!');
      } else if (target.type === 'category' && catForm) {
        await onUpdateCategory(catForm);
        showToast(`¡Pasillo "${catForm.name}" actualizado con éxito!`);
      } else if (target.type === 'bottom_promo_banner') {
        const updated = {
          ...settings,
          bottomBannerImage: bottomPromoImage.trim(),
          bottomBannerLink: bottomPromoLink.trim(),
          showBottomBanner: showBottomPromo
        };
        await onUpdateSettings(updated);
        showToast('¡Banner promocional inferior actualizado con éxito!');
      } else if (target.type === 'bottom_dual_banners') {
        const updated = {
          ...settings,
          bottomDualBanner1Image: dual1Image.trim(),
          bottomDualBanner1Link: dual1Link.trim(),
          bottomDualBanner2Image: dual2Image.trim(),
          bottomDualBanner2Link: dual2Link.trim(),
          showBottomDualBanners: showDualBanners
        };
        await onUpdateSettings(updated);
        showToast('¡Banners dobles lado a lado actualizados con éxito!');
      } else if (target.type === 'mega_offers_section') {
        const updated = {
          ...settings,
          megaOffersConfig: {
            sectionTitle: megaTitle.trim(),
            sectionSubtitle: megaSubtitle.trim(),
            badgeText: megaBadge.trim(),
            bgImage: megaBgImage.trim()
          }
        };
        await onUpdateSettings(updated);
        showToast('¡Configuración de Mega Ofertas actualizada con éxito!');
      } else if (target.type === 'store_settings') {
        await onUpdateSettings(settingsForm);
        showToast('¡Ajustes de tienda actualizados con éxito!');
      }

      onClose();
    } catch (err) {
      console.error('Error saving quick edit:', err);
      showToast('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  // Get Title and Badge for Modal
  const getModalMeta = () => {
    switch (target.type) {
      case 'product':
        return {
          title: 'Editar Producto en Vivo',
          icon: 'fa-solid fa-bottle-droplet',
          badge: 'PRODUCTO'
        };
      case 'hero_slide':
        return {
          title: 'Editar Slide de Banner Principal',
          icon: 'fa-solid fa-images',
          badge: 'HERO SLIDE'
        };
      case 'category':
        return {
          title: 'Editar Pasillo / Categoría',
          icon: 'fa-solid fa-tags',
          badge: 'CATEGORÍA'
        };
      case 'bottom_promo_banner':
        return {
          title: 'Editar Banner Promocional Ancho',
          icon: 'fa-solid fa-rectangle-ad',
          badge: 'BANNER PRE-FOOTER'
        };
      case 'bottom_dual_banners':
        return {
          title: 'Editar Banners Dobles Lado a Lado',
          icon: 'fa-solid fa-table-columns',
          badge: '2 BANNERS PRE-FOOTER'
        };
      case 'mega_offers_section':
        return {
          title: 'Editar Encabezado de Mega Ofertas',
          icon: 'fa-solid fa-fire',
          badge: 'MEGA OFERTAS'
        };
      case 'store_settings':
        return {
          title: 'Editar Datos de la Tienda',
          icon: 'fa-solid fa-sliders',
          badge: 'AJUSTES TIENDA'
        };
      default:
        return {
          title: 'Edición Rápida',
          icon: 'fa-solid fa-pen-to-square',
          badge: 'MODO ADMIN'
        };
    }
  };

  const meta = getModalMeta();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#141416] border border-amber-500/40 rounded-3xl shadow-2xl text-white overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente dorado */}
        <div className="bg-gradient-to-r from-stone-900 via-[#1c1a14] to-stone-900 border-b border-amber-500/30 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffd129]/20 text-[#ffd129] border border-[#ffd129]/40 flex items-center justify-center text-lg shadow-inner">
              <i className={meta.icon}></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#ffd129] text-stone-950">
                  {meta.badge}
                </span>
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i> Editor Visual
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                {meta.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center text-sm transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* =================================================== */}
          {/* CASO 1: EDITAR PRODUCTO */}
          {/* =================================================== */}
          {target.type === 'product' && prodForm && (
            <div className="space-y-4">
              {/* Preview & Image Upload */}
              <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#1c1c20] p-4 rounded-2xl border border-stone-800">
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-stone-900 border border-stone-700 relative shrink-0">
                  <img
                    src={prodForm.image}
                    alt={prodForm.name}
                    className="w-full h-full object-cover"
                  />
                  {prodForm.discount && (
                    <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                      {prodForm.discount}
                    </span>
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <label className="block text-xs font-bold text-gray-300 uppercase">
                    Imagen del Producto
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={prodForm.image}
                      onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 bg-[#141416] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#ffd129] hover:bg-yellow-400 text-stone-950 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <i className="fa-solid fa-upload text-xs"></i>
                      <span>Subir</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) =>
                        handleFileUpload(e, (url) => setProdForm({ ...prodForm, image: url }))
                      }
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Pega una URL o sube una foto desde tu computador o celular.
                  </p>
                </div>
              </div>

              {/* Nombre y Subcategoría */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:border-[#ffd129] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Subcategoría
                  </label>
                  <input
                    type="text"
                    value={prodForm.subcategory}
                    onChange={(e) => setProdForm({ ...prodForm, subcategory: e.target.value })}
                    placeholder="Ej: Pisco, Whisky, Cerveza"
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:border-[#ffd129] outline-none"
                  />
                </div>
              </div>

              {/* Precios y Descuentos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Precio de Venta ($ CLP) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-sm font-bold text-[#ffd129] focus:border-[#ffd129] outline-none"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    {formatPrice(prodForm.price)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Precio Original (Tachado)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={prodForm.originalPrice || 0}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, originalPrice: Number(e.target.value) })
                    }
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-300 focus:border-[#ffd129] outline-none"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    {prodForm.originalPrice ? formatPrice(prodForm.originalPrice) : 'Sin tachado'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Etiqueta Descuento
                  </label>
                  <input
                    type="text"
                    value={prodForm.discount || ''}
                    onChange={(e) => setProdForm({ ...prodForm, discount: e.target.value })}
                    placeholder="Ej: -20%, 2x1, OFERTA"
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-sm text-red-400 font-bold focus:border-[#ffd129] outline-none"
                  />
                </div>
              </div>

              {/* Stock y Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Pasillo / Categoría
                  </label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => {
                      const selectedCat = categories.find((c) => c.id === e.target.value);
                      setProdForm({
                        ...prodForm,
                        categoryId: e.target.value,
                        category: selectedCat?.name || prodForm.category
                      });
                    }}
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Unidades en Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={prodForm.stock ?? 10}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:border-[#ffd129] outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#1c1c20] border border-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodForm.inStock !== false}
                      onChange={(e) => setProdForm({ ...prodForm, inStock: e.target.checked })}
                      className="w-4 h-4 rounded text-[#ffd129] focus:ring-0 bg-stone-900 border-stone-600"
                    />
                    <span className="text-xs font-bold text-stone-200">
                      {prodForm.inStock !== false ? '✅ En Stock' : '❌ Agotado'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Descripción Corta
                </label>
                <textarea
                  rows={2}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  placeholder="Detalles sobre el formato, grados, origen o maridaje..."
                  className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                />
              </div>
            </div>
          )}

          {/* =================================================== */}
          {/* CASO 2: EDITAR SLIDE DE HERO BANNER */}
          {/* =================================================== */}
          {target.type === 'hero_slide' && slideForm && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative h-40 rounded-2xl overflow-hidden bg-stone-900 border border-stone-700 shadow-md">
                <img
                  src={slideForm.image}
                  alt={slideForm.title}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-y-0 left-0 w-2/4 bg-gradient-to-r from-stone-950 via-stone-950/70 to-transparent p-4 flex flex-col justify-center">
                  <span className="text-[#ffd129] text-[10px] font-bold uppercase tracking-wider">
                    <i className={slideForm.icon || 'fa-solid fa-bolt'}></i> {slideForm.badge}
                  </span>
                  <h4 className="text-base font-black text-white">{slideForm.title}</h4>
                  <p className="text-xs text-stone-300 line-clamp-1">{slideForm.description}</p>
                </div>
              </div>

              {/* Imagen */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  URL o Subida de Imagen
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={slideForm.image}
                    onChange={(e) => setSlideForm({ ...slideForm, image: e.target.value })}
                    className="flex-1 bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#ffd129] hover:bg-yellow-400 text-stone-950 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-upload"></i> Subir
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) =>
                      handleFileUpload(e, (url) => setSlideForm({ ...slideForm, image: url }))
                    }
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Insignia Superior (Badge)
                  </label>
                  <input
                    type="text"
                    value={slideForm.badge}
                    onChange={(e) => setSlideForm({ ...slideForm, badge: e.target.value })}
                    placeholder="Ej: DESPACHO EXPRÉS 45 MIN"
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Título Principal
                  </label>
                  <input
                    type="text"
                    value={slideForm.title}
                    onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Texto Descriptivo
                </label>
                <textarea
                  rows={2}
                  value={slideForm.description}
                  onChange={(e) => setSlideForm({ ...slideForm, description: e.target.value })}
                  className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Texto del Botón CTA
                  </label>
                  <input
                    type="text"
                    value={slideForm.ctaText}
                    onChange={(e) => setSlideForm({ ...slideForm, ctaText: e.target.value })}
                    placeholder="Ej: Pedir Ahora"
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Enlace de Destino
                  </label>
                  <input
                    type="text"
                    value={slideForm.ctaLink}
                    onChange={(e) => setSlideForm({ ...slideForm, ctaLink: e.target.value })}
                    placeholder="Ej: #cat-destilados o https://..."
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =================================================== */}
          {/* CASO 3: EDITAR CATEGORÍA / PASILLO */}
          {/* =================================================== */}
          {target.type === 'category' && catForm && (
            <div className="space-y-4">
              {/* Preview Banner de Categoría */}
              <div className="relative h-28 rounded-2xl overflow-hidden bg-stone-900 border border-stone-700 shadow-md">
                <img
                  src={catForm.bannerImage}
                  alt={catForm.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center px-4">
                  <h4 className="text-base font-black text-white drop-shadow">
                    {catForm.name} ({catForm.products.length} productos)
                  </h4>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Banner Fotográfico de la Categoría
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={catForm.bannerImage}
                    onChange={(e) => setCatForm({ ...catForm, bannerImage: e.target.value })}
                    className="flex-1 bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#ffd129] hover:bg-yellow-400 text-stone-950 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-upload"></i> Subir
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) =>
                      handleFileUpload(e, (url) => setCatForm({ ...catForm, bannerImage: url }))
                    }
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Nombre del Pasillo / Categoría
                  </label>
                  <input
                    type="text"
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Posición de Imagen
                  </label>
                  <select
                    value={catForm.bannerPosition || 'center'}
                    onChange={(e) =>
                      setCatForm({
                        ...catForm,
                        bannerPosition: e.target.value as 'center' | 'top' | 'bottom'
                      })
                    }
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  >
                    <option value="center">Centrada</option>
                    <option value="top">Superior (Top)</option>
                    <option value="bottom">Inferior (Bottom)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* =================================================== */}
          {/* CASO 4: BANNER PROMOCIONAL ANCHO (PRE-FOOTER) */}
          {/* =================================================== */}
          {target.type === 'bottom_promo_banner' && (
            <div className="space-y-4">
              <div className="h-32 rounded-2xl overflow-hidden bg-[#121214] border border-stone-700 relative">
                <img
                  src={bottomPromoImage}
                  alt="Banner Pre-footer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  URL o Subida de Imagen
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bottomPromoImage}
                    onChange={(e) => setBottomPromoImage(e.target.value)}
                    className="flex-1 bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#ffd129] hover:bg-yellow-400 text-stone-950 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-upload"></i> Subir
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e, setBottomPromoImage)}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Enlace al pulsar
                </label>
                <input
                  type="text"
                  value={bottomPromoLink}
                  onChange={(e) => setBottomPromoLink(e.target.value)}
                  placeholder="Ej: #mega-ofertas o https://..."
                  className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                />
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-[#1c1c20] border border-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBottomPromo}
                  onChange={(e) => setShowBottomPromo(e.target.checked)}
                  className="w-4 h-4 rounded text-[#ffd129] focus:ring-0 bg-stone-900 border-stone-600"
                />
                <span className="text-xs font-bold text-stone-200">
                  Mostrar este banner en la tienda pública
                </span>
              </label>
            </div>
          )}

          {/* =================================================== */}
          {/* CASO 5: BANNERS DOBLES LADO A LADO */}
          {/* =================================================== */}
          {target.type === 'bottom_dual_banners' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="h-24 rounded-xl overflow-hidden bg-stone-900 border border-stone-700 relative">
                  <img src={dual1Image} alt="Banner 1" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-bold">
                    Banner 1 (Izq)
                  </span>
                </div>
                <div className="h-24 rounded-xl overflow-hidden bg-stone-900 border border-stone-700 relative">
                  <img src={dual2Image} alt="Banner 2" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-bold">
                    Banner 2 (Der)
                  </span>
                </div>
              </div>

              {/* Banner 1 */}
              <div className="p-3.5 bg-[#1c1c20] rounded-xl border border-stone-800 space-y-2">
                <h4 className="text-xs font-bold text-orange-400 uppercase">Banner Izquierdo (1)</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dual1Image}
                    onChange={(e) => setDual1Image(e.target.value)}
                    placeholder="URL imagen 1"
                    className="flex-1 bg-[#141416] border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-stone-700 hover:bg-stone-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-upload text-[#ffd129]"></i> Subir
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload(e, setDual1Image)}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <input
                  type="text"
                  value={dual1Link}
                  onChange={(e) => setDual1Link(e.target.value)}
                  placeholder="Enlace al hacer click (ej: #mega-ofertas)"
                  className="w-full bg-[#141416] border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#ffd129] outline-none"
                />
              </div>

              {/* Banner 2 */}
              <div className="p-3.5 bg-[#1c1c20] rounded-xl border border-stone-800 space-y-2">
                <h4 className="text-xs font-bold text-orange-400 uppercase">Banner Derecho (2)</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dual2Image}
                    onChange={(e) => setDual2Image(e.target.value)}
                    placeholder="URL imagen 2"
                    className="flex-1 bg-[#141416] border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                </div>
                <input
                  type="text"
                  value={dual2Link}
                  onChange={(e) => setDual2Link(e.target.value)}
                  placeholder="Enlace al hacer click"
                  className="w-full bg-[#141416] border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#ffd129] outline-none"
                />
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-[#1c1c20] border border-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDualBanners}
                  onChange={(e) => setShowDualBanners(e.target.checked)}
                  className="w-4 h-4 rounded text-[#ffd129] focus:ring-0 bg-stone-900 border-stone-600"
                />
                <span className="text-xs font-bold text-stone-200">
                  Mostrar estos 2 banners en la tienda
                </span>
              </label>
            </div>
          )}

          {/* =================================================== */}
          {/* CASO 6: EDITAR MEGA OFERTAS SECTION */}
          {/* =================================================== */}
          {target.type === 'mega_offers_section' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Título de la Sección
                </label>
                <input
                  type="text"
                  value={megaTitle}
                  onChange={(e) => setMegaTitle(e.target.value)}
                  className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={megaSubtitle}
                    onChange={(e) => setMegaSubtitle(e.target.value)}
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Insignia (Badge)
                  </label>
                  <input
                    type="text"
                    value={megaBadge}
                    onChange={(e) => setMegaBadge(e.target.value)}
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =================================================== */}
          {/* CASO 7: EDITAR AJUSTES GENERALES & CONTACTO */}
          {/* =================================================== */}
          {target.type === 'store_settings' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Nombre de la Tienda
                  </label>
                  <input
                    type="text"
                    value={settingsForm.storeName || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Slogan / Bajada
                  </label>
                  <input
                    type="text"
                    value={settingsForm.tagline || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Teléfono / WhatsApp de Pedidos
                  </label>
                  <input
                    type="text"
                    value={settingsForm.socialWhatsapp || settingsForm.contactPhone || ''}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        socialWhatsapp: e.target.value,
                        contactPhone: e.target.value
                      })
                    }
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Dirección del Local
                  </label>
                  <input
                    type="text"
                    value={settingsForm.contactAddress || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contactAddress: e.target.value })
                    }
                    className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd129] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-white bg-stone-800/60 hover:bg-stone-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#ffd129] hover:bg-yellow-400 text-stone-950 transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <i className="fa-solid fa-floppy-disk"></i>
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
