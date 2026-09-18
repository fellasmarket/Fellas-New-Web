import React, { useState, useEffect, useRef } from 'react';
import { HeroSlide, StoreSettings, CategoryData } from '../../types';

interface HeroBannerEditorProps {
  heroSlides: HeroSlide[];
  onUpdateHeroSlides: (slides: HeroSlide[]) => void;
  settings?: StoreSettings;
  onUpdateSettings?: (settings: StoreSettings) => void;
  categories?: CategoryData[];
  onUpdateCategories?: (categories: CategoryData[]) => void;
  showToast: (msg: string) => void;
}

const PRESET_BANNER_IMAGES = [
  {
    label: 'Previa & Piscos',
    url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=1200&auto=format&fit=crop'
  },
  {
    label: 'Cervezas Heladas',
    url: 'https://images.unsplash.com/photo-1608270190578-831e51b32d2e?q=80&w=1200&auto=format&fit=crop'
  },
  {
    label: 'Vinos & Espumantes',
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop'
  },
  {
    label: 'Destilados & Gin Bar',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1200&auto=format&fit=crop'
  },
  {
    label: 'Celebración & Noche',
    url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop'
  }
];

const PRESET_ICONS = [
  { icon: 'fa-solid fa-bolt', label: 'Rayo' },
  { icon: 'fa-solid fa-truck-fast', label: 'Despacho Rápido' },
  { icon: 'fa-solid fa-fire', label: 'Fuego / Oferta' },
  { icon: 'fa-solid fa-wine-bottle', label: 'Botella' },
  { icon: 'fa-solid fa-beer-mug-empty', label: 'Cerveza' },
  { icon: 'fa-solid fa-star', label: 'Estrella' },
  { icon: 'fa-solid fa-tag', label: 'Etiqueta' }
];

export const HeroBannerEditor: React.FC<HeroBannerEditorProps> = ({
  heroSlides,
  onUpdateHeroSlides,
  settings,
  onUpdateSettings,
  categories = [],
  onUpdateCategories,
  showToast
}) => {
  // Sub-tabs in the Central Banners Manager
  const [activeBannerTab, setActiveBannerTab] = useState<
    'all' | 'hero' | 'bottom_promo' | 'bottom_dual' | 'categories' | 'mega_offers'
  >('all');

  const [slides, setSlides] = useState<HeroSlide[]>(heroSlides);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomBannerFileRef = useRef<HTMLInputElement>(null);

  // Bottom Banner local state
  const [bottomBannerImage, setBottomBannerImage] = useState(
    settings?.bottomBannerImage || PRESET_BANNER_IMAGES[0].url
  );
  const [bottomBannerLink, setBottomBannerLink] = useState(
    settings?.bottomBannerLink || '#mega-ofertas'
  );
  const [showBottomBanner, setShowBottomBanner] = useState(
    settings?.showBottomBanner !== false
  );
  const [isSavingBottomBanner, setIsSavingBottomBanner] = useState(false);

  // Bottom Dual Banners (2 Banners Lado a Lado Pre-Footer)
  const dualBanner1FileRef = useRef<HTMLInputElement>(null);
  const dualBanner2FileRef = useRef<HTMLInputElement>(null);
  const [bottomDualBanner1Image, setBottomDualBanner1Image] = useState(
    settings?.bottomDualBanner1Image || 'https://images.unsplash.com/photo-1608270190578-831e51b32d2e?q=80&w=800&auto=format&fit=crop'
  );
  const [bottomDualBanner1Link, setBottomDualBanner1Link] = useState(
    settings?.bottomDualBanner1Link || '#mega-ofertas'
  );
  const [bottomDualBanner2Image, setBottomDualBanner2Image] = useState(
    settings?.bottomDualBanner2Image || 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop'
  );
  const [bottomDualBanner2Link, setBottomDualBanner2Link] = useState(
    settings?.bottomDualBanner2Link || '#mega-ofertas'
  );
  const [showBottomDualBanners, setShowBottomDualBanners] = useState(
    settings?.showBottomDualBanners !== false
  );

  // Mega Offers background local state
  const megaBgFileRef = useRef<HTMLInputElement>(null);
  const [megaOffersTitle, setMegaOffersTitle] = useState(
    settings?.megaOffersConfig?.sectionTitle || '¡MEGA OFERTAS DEL TÍO FELLAS!'
  );
  const [megaOffersSubtitle, setMegaOffersSubtitle] = useState(
    settings?.megaOffersConfig?.sectionSubtitle || 'Promociones brutales por tiempo limitado y hasta agotar stock'
  );
  const [megaOffersBgImage, setMegaOffersBgImage] = useState(
    settings?.megaOffersConfig?.bgImage || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1600&auto=format&fit=crop'
  );

  // Category Banner Editor Modal State
  const [selectedCatForBanner, setSelectedCatForBanner] = useState<CategoryData | null>(null);
  const [catBannerImage, setCatBannerImage] = useState('');
  const [catBannerPos, setCatBannerPos] = useState<'center' | 'top' | 'bottom'>('center');
  const catBannerFileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<HeroSlide>({
    id: Date.now(),
    badge: 'DESPACHO EXPRÉS 45 MIN',
    icon: 'fa-solid fa-bolt',
    title: '¡SED DE FIN DE SEMANA?',
    description: 'Piscolas heladas, cervezas y destilados directo a tu puerta en Alerce y Puerto Montt.',
    ctaText: 'Pedir Ahora',
    ctaLink: '#cat-destilados',
    image: PRESET_BANNER_IMAGES[0].url
  });

  useEffect(() => {
    setSlides(heroSlides);
  }, [heroSlides]);

  useEffect(() => {
    if (settings) {
      if (settings.bottomBannerImage) setBottomBannerImage(settings.bottomBannerImage);
      if (settings.bottomBannerLink !== undefined) setBottomBannerLink(settings.bottomBannerLink);
      if (settings.showBottomBanner !== undefined) setShowBottomBanner(settings.showBottomBanner);
      if (settings.bottomDualBanner1Image) setBottomDualBanner1Image(settings.bottomDualBanner1Image);
      if (settings.bottomDualBanner1Link !== undefined) setBottomDualBanner1Link(settings.bottomDualBanner1Link);
      if (settings.bottomDualBanner2Image) setBottomDualBanner2Image(settings.bottomDualBanner2Image);
      if (settings.bottomDualBanner2Link !== undefined) setBottomDualBanner2Link(settings.bottomDualBanner2Link);
      if (settings.showBottomDualBanners !== undefined) setShowBottomDualBanners(settings.showBottomDualBanners);
      if (settings.megaOffersConfig?.sectionTitle) setMegaOffersTitle(settings.megaOffersConfig.sectionTitle);
      if (settings.megaOffersConfig?.sectionSubtitle) setMegaOffersSubtitle(settings.megaOffersConfig.sectionSubtitle);
      if (settings.megaOffersConfig?.bgImage) setMegaOffersBgImage(settings.megaOffersConfig.bgImage);
    }
  }, [settings]);

  // Persist updated slides to backend and parent state
  const persistSlides = async (newSlides: HeroSlide[]) => {
    setSlides(newSlides);
    onUpdateHeroSlides(newSlides);
    setIsSaving(true);
    try {
      const res = await fetch('/api/hero-slides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: newSlides })
      });
      if (res.ok) {
        showToast('Banners del carrusel guardados y actualizados');
      } else {
        showToast('Guardado localmente en la sesión activa');
      }
    } catch (err) {
      console.error('Error saving hero slides:', err);
      showToast('Guardado localmente en la sesión activa');
    } finally {
      setIsSaving(false);
    }
  };

  // Save All Bottom Banners & Settings
  const handleSaveSettingsBanners = async () => {
    if (!settings || !onUpdateSettings) {
      showToast('Ajustes actualizados localmente');
      return;
    }
    setIsSavingBottomBanner(true);
    const updatedSettings: StoreSettings = {
      ...settings,
      bottomBannerImage: bottomBannerImage.trim(),
      bottomBannerLink: bottomBannerLink.trim(),
      showBottomBanner,
      bottomDualBanner1Image: bottomDualBanner1Image.trim(),
      bottomDualBanner1Link: bottomDualBanner1Link.trim(),
      bottomDualBanner2Image: bottomDualBanner2Image.trim(),
      bottomDualBanner2Link: bottomDualBanner2Link.trim(),
      showBottomDualBanners,
      megaOffersConfig: {
        ...(settings.megaOffersConfig || { sectionTitle: '', sectionSubtitle: '', badgeText: '' }),
        sectionTitle: megaOffersTitle.trim(),
        sectionSubtitle: megaOffersSubtitle.trim(),
        bgImage: megaOffersBgImage.trim()
      }
    };

    onUpdateSettings(updatedSettings);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      if (res.ok) {
        showToast('¡Configuración de banners guardada y actualizada con éxito!');
      } else {
        showToast('Ajustes guardados localmente');
      }
    } catch (err) {
      console.error('Error saving banners:', err);
      showToast('Ajustes guardados localmente');
    } finally {
      setIsSavingBottomBanner(false);
    }
  };

  // Category Banner Save
  const handleSaveCategoryBanner = async () => {
    if (!selectedCatForBanner || !onUpdateCategories) return;
    const updatedCategories = categories.map((cat) =>
      cat.id === selectedCatForBanner.id
        ? {
            ...cat,
            bannerImage: catBannerImage.trim(),
            bannerPosition: catBannerPos
          }
        : cat
    );

    onUpdateCategories(updatedCategories);

    try {
      await fetch(`/api/categories/${selectedCatForBanner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedCatForBanner,
          bannerImage: catBannerImage.trim(),
          bannerPosition: catBannerPos
        })
      });
      showToast(`¡Banner de "${selectedCatForBanner.name}" actualizado con éxito!`);
    } catch (err) {
      console.error('Error updating category banner:', err);
      showToast('Banner de categoría actualizado localmente');
    }

    setSelectedCatForBanner(null);
  };

  const handleBottomBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBottomBannerImage(dataUrl);
        showToast('Imagen del banner inferior cargada');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDualBanner1FileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBottomDualBanner1Image(dataUrl);
        showToast('Imagen del Banner Izquierdo cargada');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDualBanner2FileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBottomDualBanner2Image(dataUrl);
        showToast('Imagen del Banner Derecho cargada');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMegaBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setMegaOffersBgImage(dataUrl);
        showToast('Fondo de Mega Ofertas cargado');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddModal = () => {
    setEditingIndex(null);
    setForm({
      id: Date.now(),
      badge: 'PROMO DESTACADA',
      icon: 'fa-solid fa-bolt',
      title: 'NUEVA PROMOCIÓN EXCLUSIVA',
      description: 'Añade una descripción atractiva para los clientes que visitan la botillería.',
      ctaText: 'Ver Ofertas',
      ctaLink: '#cat-cervezas',
      image: PRESET_BANNER_IMAGES[1].url
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slide: HeroSlide, index: number) => {
    setEditingIndex(index);
    setForm({ ...slide });
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('El título del banner no puede estar vacío');
      return;
    }

    let updatedList: HeroSlide[];
    if (editingIndex !== null && editingIndex >= 0) {
      updatedList = [...slides];
      updatedList[editingIndex] = { ...form };
      showToast('Slide de banner actualizado');
    } else {
      updatedList = [...slides, { ...form, id: Date.now() }];
      showToast('Nuevo slide de banner agregado');
    }

    persistSlides(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) {
      showToast('Debe haber al menos 1 banner activo en la tienda');
      return;
    }
    const updated = slides.filter((_, i) => i !== index);
    persistSlides(updated);
    showToast('Slide eliminado del banner principal');
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    const updated = [...slides];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    persistSlides(updated);
    showToast('Orden del carrusel actualizado');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setForm(prev => ({ ...prev, image: dataUrl }));
        showToast('Imagen cargada');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* HUB HEADER: TÍTULO Y DESCRIPCIÓN */}
      <div className="bg-gradient-to-r from-[#18181b] via-[#221f19] to-[#18181b] p-6 rounded-3xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ffd025] text-black font-black text-[10px] tracking-wider uppercase">
              CENTRO DE CONTROL
            </span>
            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
              <i className="fa-solid fa-sparkles"></i> Todos los Banners en un solo lugar
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
            <i className="fa-solid fa-images text-[#ffd025]"></i>
            <span>Gestor Integral de Banners</span>
          </h2>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
            Personaliza desde aquí todos los banners visuales de la tienda: el carrusel principal superior, el banner promocional ancho inferior, los 2 banners lado a lado y las portadas de cada pasillo de productos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveSettingsBanners}
            disabled={isSavingBottomBanner}
            className="bg-[#ffd025] hover:bg-yellow-400 disabled:opacity-50 text-[#141414] font-black text-xs px-5 py-2.5 rounded-2xl transition shadow-lg flex items-center gap-2 cursor-pointer uppercase shrink-0 active:scale-95"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>{isSavingBottomBanner ? 'Guardando...' : 'Guardar Todos'}</span>
          </button>
        </div>
      </div>

      {/* SUB-BARRA DE PESTAÑAS RÁPIDAS PARA NO PERDERSE */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setActiveBannerTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeBannerTab === 'all'
              ? 'bg-[#ffd025] text-[#141414] shadow'
              : 'bg-[#18181b] text-stone-300 hover:bg-stone-800 border border-stone-800'
          }`}
        >
          <i className="fa-solid fa-layer-group"></i>
          <span>Todos los Banners</span>
        </button>

        <button
          onClick={() => setActiveBannerTab('hero')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeBannerTab === 'hero'
              ? 'bg-[#ffd025] text-[#141414] shadow'
              : 'bg-[#18181b] text-stone-300 hover:bg-stone-800 border border-stone-800'
          }`}
        >
          <i className="fa-solid fa-sliders"></i>
          <span>1. Carrusel Principal ({slides.length})</span>
        </button>

        <button
          onClick={() => setActiveBannerTab('bottom_promo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeBannerTab === 'bottom_promo'
              ? 'bg-[#ffd025] text-[#141414] shadow'
              : 'bg-[#18181b] text-stone-300 hover:bg-stone-800 border border-stone-800'
          }`}
        >
          <i className="fa-solid fa-rectangle-ad"></i>
          <span>2. Promo Ancho Pre-Footer</span>
        </button>

        <button
          onClick={() => setActiveBannerTab('bottom_dual')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeBannerTab === 'bottom_dual'
              ? 'bg-[#ffd025] text-[#141414] shadow'
              : 'bg-[#18181b] text-stone-300 hover:bg-stone-800 border border-stone-800'
          }`}
        >
          <i className="fa-solid fa-table-columns"></i>
          <span>3. Banners Dobles Pre-Footer</span>
        </button>

        <button
          onClick={() => setActiveBannerTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeBannerTab === 'categories'
              ? 'bg-[#ffd025] text-[#141414] shadow'
              : 'bg-[#18181b] text-stone-300 hover:bg-stone-800 border border-stone-800'
          }`}
        >
          <i className="fa-solid fa-tags"></i>
          <span>4. Banners de Pasillos ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveBannerTab('mega_offers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeBannerTab === 'mega_offers'
              ? 'bg-[#ffd025] text-[#141414] shadow'
              : 'bg-[#18181b] text-stone-300 hover:bg-stone-800 border border-stone-800'
          }`}
        >
          <i className="fa-solid fa-fire text-red-400"></i>
          <span>5. Fondo Mega Ofertas</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 1: CARRUSEL PRINCIPAL (HERO SLIDES) */}
      {/* ========================================================================= */}
      {(activeBannerTab === 'all' || activeBannerTab === 'hero') && (
        <div className="bg-[#141416] border border-stone-800 rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ffd025]/20 text-[#ffd025] border border-[#ffd025]/30 flex items-center justify-center text-lg shrink-0">
                <i className="fa-solid fa-sliders"></i>
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>1. Carrusel Principal Superior (Hero Slider)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 font-bold border border-stone-700">
                    {slides.length} SLIDES ACTIVOS
                  </span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Banners deslizantes en la cabecera con promociones, textos de llamada a la acción y botones.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2 cursor-pointer uppercase shrink-0"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Nuevo Slide</span>
            </button>
          </div>

          {/* Grid de slides actuales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((slide, index) => (
              <div
                key={slide.id || index}
                className="bg-[#1c1c20] border border-stone-800 hover:border-[#ffd025]/50 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition group"
              >
                <div className="relative h-36 overflow-hidden bg-stone-900">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#ffd025] uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded-md flex items-center gap-1.5 backdrop-blur-xs">
                        <i className={slide.icon}></i> {slide.badge}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400 bg-black/60 px-2 py-0.5 rounded">
                        Slide #{index + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white drop-shadow line-clamp-1">
                        {slide.title}
                      </h4>
                      <p className="text-[11px] text-stone-300 font-light line-clamp-1">
                        {slide.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#18181b] border-t border-stone-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(index, 'up')}
                      disabled={index === 0}
                      title="Mover arriba"
                      className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-30 flex items-center justify-center text-xs transition cursor-pointer"
                    >
                      <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(index, 'down')}
                      disabled={index === slides.length - 1}
                      title="Mover abajo"
                      className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-30 flex items-center justify-center text-xs transition cursor-pointer"
                    >
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(slide, index)}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <i className="fa-solid fa-pen text-[#ffd025]"></i>
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(index)}
                      className="w-7 h-7 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 flex items-center justify-center text-xs transition cursor-pointer"
                      title="Eliminar slide"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 2: BANNER PROMOCIONAL ANCHO PRE-FOOTER */}
      {/* ========================================================================= */}
      {(activeBannerTab === 'all' || activeBannerTab === 'bottom_promo') && (
        <div className="bg-[#141416] border border-stone-800 rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-[#ffd025] border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                <i className="fa-solid fa-rectangle-ad"></i>
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>2. Banner Promocional Ancho (Pre-Footer)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 font-bold border border-stone-700">
                    ANCHO COMPLETO
                  </span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Gran banner horizontal con imagen, llamado a la acción y botón de WhatsApp o catálogo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-300">
                <input
                  type="checkbox"
                  checked={showBottomBanner}
                  onChange={(e) => setShowBottomBanner(e.target.checked)}
                  className="w-4 h-4 rounded text-[#ffd025] focus:ring-0 bg-stone-900 border-stone-700 cursor-pointer"
                />
                <span>Mostrar en Tienda</span>
              </label>

              <button
                type="button"
                onClick={handleSaveSettingsBanners}
                disabled={isSavingBottomBanner}
                className="bg-[#ffd025] hover:bg-yellow-400 disabled:opacity-50 text-[#141414] font-black text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2 cursor-pointer uppercase shrink-0"
              >
                <i className="fa-solid fa-floppy-disk"></i>
                <span>{isSavingBottomBanner ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>

          {/* Vista previa en vivo */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-300 uppercase flex items-center gap-1.5">
              <i className="fa-solid fa-eye text-[#ffd025]"></i> Vista Previa en Vivo
            </label>
            <div className="h-36 sm:h-44 rounded-2xl overflow-hidden bg-[#121214] shadow-md group relative">
              <img
                src={bottomBannerImage}
                alt="Banner Inferior"
                className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-center max-w-md">
                <span className="text-[#ffd025] text-xs font-bold uppercase tracking-wider">
                  🔥 PROMOCIONES DEL DÍA
                </span>
                <h4 className="text-lg font-black text-white">LOS MEJORES PRECIOS DE ALERCE</h4>
                <p className="text-xs text-stone-300">Despacho exprés a tu puerta.</p>
              </div>
            </div>
          </div>

          {/* Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase mb-1">
                URL de Imagen del Banner
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bottomBannerImage}
                  onChange={(e) => setBottomBannerImage(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd025] outline-none"
                />
                <button
                  type="button"
                  onClick={() => bottomBannerFileRef.current?.click()}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-700 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-upload text-[#ffd025]"></i>
                  <span>Subir</span>
                </button>
                <input
                  type="file"
                  ref={bottomBannerFileRef}
                  onChange={handleBottomBannerFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase mb-1">
                Enlace al pulsar (Opcional)
              </label>
              <input
                type="text"
                value={bottomBannerLink}
                onChange={(e) => setBottomBannerLink(e.target.value)}
                placeholder="Ej: #mega-ofertas o https://..."
                className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd025] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 3: 2 BANNERS LADO A LADO PRE-FOOTER */}
      {/* ========================================================================= */}
      {(activeBannerTab === 'all' || activeBannerTab === 'bottom_dual') && (
        <div className="bg-[#141416] border border-stone-800 rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center text-lg shrink-0">
                <i className="fa-solid fa-table-columns"></i>
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>3. Dos Banners Lado a Lado (Pre-Footer)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                    SOLO IMAGEN • SIN MARCOS
                  </span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Dos banners colocados uno al lado del otro con separación ultra reducida respecto al pie de página.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-300">
                <input
                  type="checkbox"
                  checked={showBottomDualBanners}
                  onChange={(e) => setShowBottomDualBanners(e.target.checked)}
                  className="w-4 h-4 rounded text-[#ffd025] focus:ring-0 bg-stone-900 border-stone-700 cursor-pointer"
                />
                <span>Mostrar en Tienda</span>
              </label>

              <button
                type="button"
                onClick={handleSaveSettingsBanners}
                disabled={isSavingBottomBanner}
                className="bg-[#ffd025] hover:bg-yellow-400 disabled:opacity-50 text-[#141414] font-black text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2 cursor-pointer uppercase shrink-0"
              >
                <i className="fa-solid fa-floppy-disk"></i>
                <span>{isSavingBottomBanner ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>

          {/* Vista previa 2 banners */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-300 uppercase flex items-center gap-1.5">
              <i className="fa-solid fa-desktop text-orange-400"></i> Vista Previa en Vivo (2 Columnas)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="h-28 sm:h-36 rounded-2xl overflow-hidden bg-[#121214] shadow-md group relative">
                <img
                  src={bottomDualBanner1Image}
                  alt="Banner 1"
                  className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                  Banner Izquierdo (1)
                </div>
              </div>
              <div className="h-28 sm:h-36 rounded-2xl overflow-hidden bg-[#121214] shadow-md group relative">
                <img
                  src={bottomDualBanner2Image}
                  alt="Banner 2"
                  className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                  Banner Derecho (2)
                </div>
              </div>
            </div>
          </div>

          {/* Configuración Banner 1 y 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-800">
            {/* Banner 1 */}
            <div className="space-y-3 bg-[#1c1c20] p-4 rounded-2xl border border-stone-800">
              <h4 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Banner Izquierdo</span>
              </h4>
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">
                  URL de Imagen
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bottomDualBanner1Image}
                    onChange={(e) => setBottomDualBanner1Image(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-[#141416] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd025] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => dualBanner1FileRef.current?.click()}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-2 rounded-xl text-xs font-bold border border-stone-700 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-upload text-[#ffd025]"></i>
                    <span>Subir</span>
                  </button>
                  <input
                    type="file"
                    ref={dualBanner1FileRef}
                    onChange={handleDualBanner1FileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">
                  Enlace al pulsar (Opcional)
                </label>
                <input
                  type="text"
                  value={bottomDualBanner1Link}
                  onChange={(e) => setBottomDualBanner1Link(e.target.value)}
                  placeholder="Ej: #mega-ofertas o https://..."
                  className="w-full bg-[#141416] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd025] outline-none"
                />
              </div>
            </div>

            {/* Banner 2 */}
            <div className="space-y-3 bg-[#1c1c20] p-4 rounded-2xl border border-stone-800">
              <h4 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Banner Derecho</span>
              </h4>
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">
                  URL de Imagen
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bottomDualBanner2Image}
                    onChange={(e) => setBottomDualBanner2Image(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-[#141416] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd025] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => dualBanner2FileRef.current?.click()}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-2 rounded-xl text-xs font-bold border border-stone-700 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-upload text-[#ffd025]"></i>
                    <span>Subir</span>
                  </button>
                  <input
                    type="file"
                    ref={dualBanner2FileRef}
                    onChange={handleDualBanner2FileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">
                  Enlace al pulsar (Opcional)
                </label>
                <input
                  type="text"
                  value={bottomDualBanner2Link}
                  onChange={(e) => setBottomDualBanner2Link(e.target.value)}
                  placeholder="Ej: #cat-piscos o https://..."
                  className="w-full bg-[#141416] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd025] outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 4: BANNERS DE CATEGORÍAS & PASILLOS */}
      {/* ========================================================================= */}
      {(activeBannerTab === 'all' || activeBannerTab === 'categories') && (
        <div className="bg-[#141416] border border-stone-800 rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-lg shrink-0">
                <i className="fa-solid fa-tags"></i>
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>4. Banners de Pasillos y Categorías</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-blue-300 font-bold border border-stone-700">
                    {categories.length} PASILLOS
                  </span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Cambia la fotografía de portada de cada categoría directamente desde esta lista centralizada.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-[#1c1c20] border border-stone-800 hover:border-blue-500/50 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between group"
              >
                <div className="relative h-28 bg-stone-900 overflow-hidden">
                  <img
                    src={cat.bannerImage}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-black/50 p-3 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded w-fit backdrop-blur-xs">
                      <i className={cat.icon || 'fa-solid fa-wine-bottle'}></i> {cat.name}
                    </span>
                    <span className="text-[11px] text-stone-300 font-medium">
                      {cat.products.length} productos asociados
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#18181b] border-t border-stone-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-300 truncate max-w-[150px]">
                    {cat.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatForBanner(cat);
                      setCatBannerImage(cat.bannerImage);
                      setCatBannerPos(cat.bannerPosition || 'center');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-blue-600 text-stone-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-image text-blue-400 group-hover:text-white"></i>
                    <span>Editar Foto</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 5: FONDO DE MEGA OFERTAS */}
      {/* ========================================================================= */}
      {(activeBannerTab === 'all' || activeBannerTab === 'mega_offers') && (
        <div className="bg-[#141416] border border-stone-800 rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center text-lg shrink-0">
                <i className="fa-solid fa-fire"></i>
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>5. Banner y Fondo de Mega Ofertas</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                    OFERTAS BRUTALES
                  </span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Imagen de fondo y títulos de la sección destacada de ofertas.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSettingsBanners}
              disabled={isSavingBottomBanner}
              className="bg-[#ffd025] hover:bg-yellow-400 disabled:opacity-50 text-[#141414] font-black text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2 cursor-pointer uppercase shrink-0"
            >
              <i className="fa-solid fa-floppy-disk"></i>
              <span>{isSavingBottomBanner ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">
                  Título de la Sección
                </label>
                <input
                  type="text"
                  value={megaOffersTitle}
                  onChange={(e) => setMegaOffersTitle(e.target.value)}
                  className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd025] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">
                  Subtítulo / Bajada
                </label>
                <input
                  type="text"
                  value={megaOffersSubtitle}
                  onChange={(e) => setMegaOffersSubtitle(e.target.value)}
                  className="w-full bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd025] outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">
                  Fondo de la Sección (Imagen o Gradiente)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={megaOffersBgImage}
                    onChange={(e) => setMegaOffersBgImage(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-[#1c1c20] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd025] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => megaBgFileRef.current?.click()}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-700 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-upload text-[#ffd025]"></i>
                    <span>Subir</span>
                  </button>
                  <input
                    type="file"
                    ref={megaBgFileRef}
                    onChange={handleMegaBgFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="h-16 rounded-xl overflow-hidden bg-stone-900 border border-stone-800 relative">
                <img
                  src={megaOffersBgImage}
                  alt="Fondo Mega Ofertas"
                  className="w-full h-full object-cover opacity-60"
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                  {megaOffersTitle}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PARA EDITAR BANNER DE CATEGORÍA INDIVIDUAL */}
      {/* ========================================================================= */}
      {selectedCatForBanner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-stone-700 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <i className="fa-solid fa-image text-blue-400"></i>
                <span>Banner de {selectedCatForBanner.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCatForBanner(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="h-32 rounded-2xl overflow-hidden bg-stone-900 border border-stone-800">
              <img
                src={catBannerImage}
                alt="Vista previa"
                className={`w-full h-full object-cover ${
                  catBannerPos === 'top'
                    ? 'object-top'
                    : catBannerPos === 'bottom'
                    ? 'object-bottom'
                    : 'object-center'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase mb-1">
                URL de Imagen
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={catBannerImage}
                  onChange={(e) => setCatBannerImage(e.target.value)}
                  className="flex-1 bg-[#141416] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd025] outline-none"
                />
                <button
                  type="button"
                  onClick={() => catBannerFileRef.current?.click()}
                  className="bg-[#ffd025] hover:bg-yellow-400 text-stone-950 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-upload"></i> Subir
                </button>
                <input
                  type="file"
                  ref={catBannerFileRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const res = ev.target?.result as string;
                        if (res) setCatBannerImage(res);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase mb-1">
                Posición del Encuadre
              </label>
              <select
                value={catBannerPos}
                onChange={(e) => setCatBannerPos(e.target.value as 'center' | 'top' | 'bottom')}
                className="w-full bg-[#141416] border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#ffd025] outline-none"
              >
                <option value="center">Centrado (Recomendado)</option>
                <option value="top">Superior (Top)</option>
                <option value="bottom">Inferior (Bottom)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedCatForBanner(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-white bg-stone-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCategoryBanner}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase bg-[#ffd025] hover:bg-yellow-400 text-[#141414] transition cursor-pointer"
              >
                Guardar Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE EDICIÓN O CREACIÓN DE SLIDE HERO */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#18181b] border border-stone-700 rounded-3xl max-w-2xl w-full p-6 text-white space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ffd025]/20 text-[#ffd025] flex items-center justify-center text-base">
                  <i className={editingIndex !== null ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-plus'}></i>
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-white">
                    {editingIndex !== null ? 'Editar Slide de Banner' : 'Crear Nuevo Slide'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Ajusta los textos, botón e imagen del carrusel.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-300 uppercase">
                  Imagen del Banner
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="URL de imagen https://..."
                    className="flex-1 bg-[#141416] border border-stone-700 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <i className="fa-solid fa-upload"></i>
                    <span>Subir</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                    Insignia Superior (Badge)
                  </label>
                  <input
                    type="text"
                    required
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    placeholder="Ej: DESPACHO EXPRÉS 45 MIN"
                    className="w-full bg-[#141416] border border-stone-700 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                    Ícono de la Insignia
                  </label>
                  <select
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full bg-[#141416] border border-stone-700 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025] outline-none"
                  >
                    {PRESET_ICONS.map((p) => (
                      <option key={p.icon} value={p.icon}>
                        {p.label} ({p.icon})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                  Título del Banner *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: ¡SED DE FIN DE SEMANA?"
                  className="w-full bg-[#141416] border border-stone-700 rounded-xl p-2.5 text-sm font-bold text-white focus:border-[#ffd025] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Texto descriptivo para incentivar la compra..."
                  className="w-full bg-[#141416] border border-stone-700 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    required
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                    placeholder="Ej: Pedir Ahora"
                    className="w-full bg-[#141416] border border-stone-700 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                    Enlace de Destino
                  </label>
                  <input
                    type="text"
                    required
                    value={form.ctaLink}
                    onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                    placeholder="Ej: #cat-piscos o https://..."
                    className="w-full bg-[#141416] border border-stone-700 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-400 hover:text-white bg-stone-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase bg-[#ffd025] hover:bg-yellow-400 text-[#141414] transition shadow flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  <span>{isSaving ? 'Guardando...' : 'Guardar Slide'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
