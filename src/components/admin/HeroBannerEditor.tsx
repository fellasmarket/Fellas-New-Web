import React, { useState, useEffect, useRef } from 'react';
import { HeroSlide, StoreSettings } from '../../types';

interface HeroBannerEditorProps {
  heroSlides: HeroSlide[];
  onUpdateHeroSlides: (slides: HeroSlide[]) => void;
  settings?: StoreSettings;
  onUpdateSettings?: (settings: StoreSettings) => void;
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
  showToast
}) => {
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

  // Save Bottom Promo Banner Settings
  const handleSaveBottomBanner = async () => {
    if (!settings || !onUpdateSettings) {
      showToast('Banner inferior actualizado localmente');
      return;
    }
    setIsSavingBottomBanner(true);
    const updatedSettings: StoreSettings = {
      ...settings,
      bottomBannerImage: bottomBannerImage.trim(),
      bottomBannerLink: bottomBannerLink.trim(),
      showBottomBanner
    };

    onUpdateSettings(updatedSettings);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      if (res.ok) {
        showToast('¡Banner inferior (Pre-Footer) guardado y actualizado con éxito!');
      } else {
        showToast('Ajustes del banner guardados localmente');
      }
    } catch (err) {
      console.error('Error saving bottom banner:', err);
      showToast('Ajustes del banner guardados localmente');
    } finally {
      setIsSavingBottomBanner(false);
    }
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
        showToast('Imagen cargada con éxito');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Header del Editor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1a1a1a] p-6 rounded-3xl border border-gray-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#ffd025] mb-1">
            <i className="fa-solid fa-images"></i> Editor de Banner Principal (Hero Slider)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Carrusel de Banners de Inicio
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Edita los títulos, descripciones, botones de compra, insignias e imágenes de fondo de cada slide que ven los clientes al entrar a la botillería.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#ffd025]/20 cursor-pointer uppercase shrink-0"
        >
          <i className="fa-solid fa-plus text-sm"></i>
          <span>Nuevo Banner / Slide</span>
        </button>
      </div>

      {/* Lista de Slides Actuales */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
            Slides Activos en Tienda ({slides.length})
          </h3>
          <span className="text-[11px] text-gray-500">
            {isSaving ? 'Guardando cambios...' : 'Cambios sincronizados con la tienda'}
          </span>
        </div>

        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className="bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden hover:border-[#ffd025]/40 transition group"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-4">
              {/* Vista previa en miniatura de la imagen del banner */}
              <div className="md:col-span-3 h-32 rounded-xl relative overflow-hidden bg-[#141414] border border-gray-700/60 flex items-center justify-center">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#ffd025] text-[#141414] text-[9px] font-black uppercase flex items-center gap-1 shadow">
                  <i className={slide.icon}></i>
                  <span>Slide #{idx + 1}</span>
                </div>
              </div>

              {/* Textos y atributos del Slide */}
              <div className="md:col-span-6 space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-[#ffd025] text-[10px] font-bold border border-gray-700 flex items-center gap-1">
                    <i className={slide.icon}></i> {slide.badge}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Enlace: {slide.ctaLink}
                  </span>
                </div>

                <h4 className="text-base font-black text-white truncate">
                  {slide.title}
                </h4>

                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                  {slide.description}
                </p>

                <div className="pt-1 flex items-center gap-2 text-xs">
                  <span className="text-gray-400 font-medium">Botón CTA:</span>
                  <span className="bg-[#ffd025]/20 text-[#ffd025] px-2 py-0.5 rounded text-[11px] font-bold border border-[#ffd025]/30">
                    {slide.ctaText}
                  </span>
                </div>
              </div>

              {/* Botones de acción y reordenamiento */}
              <div className="md:col-span-3 flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 border-gray-800 pt-3 md:pt-0">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMoveSlide(idx, 'up')}
                    disabled={idx === 0}
                    title="Mover arriba"
                    className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white flex items-center justify-center transition border border-gray-700"
                  >
                    <i className="fa-solid fa-arrow-up text-xs"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSlide(idx, 'down')}
                    disabled={idx === slides.length - 1}
                    title="Mover abajo"
                    className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white flex items-center justify-center transition border border-gray-700"
                  >
                    <i className="fa-solid fa-arrow-down text-xs"></i>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(slide, idx)}
                    className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-[#ffd025] hover:text-yellow-300 font-bold text-xs flex items-center gap-1.5 border border-gray-700 transition cursor-pointer"
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(idx)}
                    disabled={slides.length <= 1}
                    className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 disabled:opacity-30 disabled:cursor-not-allowed text-red-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-red-800/60 transition cursor-pointer"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN: BANNER PROMOCIONAL INFERIOR (PRE-FOOTER - 1/3 ALTURA SOLO IMAGEN) */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase text-[#ffd025] mb-1">
              <i className="fa-solid fa-image"></i> Banner Inferior (Pre-Footer)
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Banner Publicitario de 1/3 de Altura (Solo Imagen)
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Ubicado entre las categorías de productos y el pie de página. Formato apaisado compacto sin textos ni botones sobrepuestos, ideal para afiches, promociones gráficas o marcas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveBottomBanner}
            disabled={isSavingBottomBanner}
            className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#ffd025]/20 cursor-pointer uppercase shrink-0 disabled:opacity-50"
          >
            <i className={`fa-solid ${isSavingBottomBanner ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
            <span>{isSavingBottomBanner ? 'Guardando...' : 'Guardar Banner Inferior'}</span>
          </button>
        </div>

        {/* Interruptor de Visibilidad */}
        <div className="flex items-center justify-between p-4 bg-[#141414] border border-gray-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${showBottomBanner ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'}`}>
              <i className="fa-solid fa-eye"></i>
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase">Estado del Banner Inferior</p>
              <p className="text-[11px] text-gray-400">
                {showBottomBanner ? 'Visible para todos los clientes en la tienda' : 'Oculto actualmente'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showBottomBanner}
              onChange={(e) => setShowBottomBanner(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffd025]"></div>
          </label>
        </div>

        {/* Vista Previa en Vivo con proporción real 1/3 de altura */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1.5">
              <i className="fa-solid fa-desktop text-[#ffd025]"></i> Vista Previa en Vivo (Proporción 1/3)
            </label>
            <span className="text-[11px] text-gray-500">Medida recomendada: 1600 x 400 px o 1200 x 300 px</span>
          </div>

          <div className="w-full relative h-24 sm:h-32 md:h-40 rounded-2xl overflow-hidden bg-[#121214] border-2 border-dashed border-gray-700 shadow-inner group">
            {bottomBannerImage ? (
              <img
                src={bottomBannerImage}
                alt="Vista previa banner inferior"
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-1">
                <i className="fa-solid fa-image text-2xl"></i>
                <span className="text-xs">Sin imagen seleccionada</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuración de la Imagen */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">
              URL de la Imagen del Banner
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={bottomBannerImage}
                onChange={(e) => setBottomBannerImage(e.target.value)}
                placeholder="https://images.unsplash.com/... o enlace de tu imagen"
                className="flex-1 bg-[#141414] border border-gray-800 rounded-xl p-3 text-xs text-white focus:border-[#ffd025]"
              />
              <button
                type="button"
                onClick={() => bottomBannerFileRef.current?.click()}
                className="bg-gray-800 hover:bg-gray-700 text-stone-200 hover:text-white px-4 py-3 rounded-xl text-xs font-bold border border-gray-700 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <i className="fa-solid fa-upload text-[#ffd025]"></i>
                <span>Subir Archivo</span>
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

          {/* Presets recomendados */}
          <div>
            <span className="text-[11px] text-gray-400 block mb-2">
              O elige una de nuestras imágenes temáticas de botillería:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {PRESET_BANNER_IMAGES.map((imgPreset) => (
                <button
                  key={`bottom-${imgPreset.url}`}
                  type="button"
                  onClick={() => setBottomBannerImage(imgPreset.url)}
                  className={`group p-1.5 rounded-xl border text-left transition overflow-hidden cursor-pointer ${
                    bottomBannerImage === imgPreset.url
                      ? 'border-[#ffd025] bg-[#ffd025]/10 shadow'
                      : 'border-gray-800 bg-[#141414] hover:border-gray-700'
                  }`}
                >
                  <div className="h-14 rounded-lg overflow-hidden relative mb-1.5 bg-stone-900">
                    <img
                      src={imgPreset.url}
                      alt={imgPreset.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-gray-300 group-hover:text-white block truncate">
                    {imgPreset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Enlace de destino opcional */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">
              Enlace de Destino al pulsar el Banner (Opcional)
            </label>
            <input
              type="text"
              value={bottomBannerLink}
              onChange={(e) => setBottomBannerLink(e.target.value)}
              placeholder="Ej: #mega-ofertas, #cat-destilados, o https://wa.me/..."
              className="w-full bg-[#141414] border border-gray-800 rounded-xl p-3 text-xs text-white focus:border-[#ffd025]"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Puedes usar anclas como <code className="text-[#ffd025]">#mega-ofertas</code>, <code className="text-[#ffd025]">#cat-piscos</code> o un enlace web externo.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL DE EDICIÓN O CREACIÓN DE SLIDE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-6">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#161616]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#ffd025] text-[#141414] font-black flex items-center justify-center text-sm shadow">
                  <i className="fa-solid fa-images"></i>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white">
                    {editingIndex !== null ? `Editar Slide #${editingIndex + 1}` : 'Agregar Nuevo Slide de Banner'}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Configura la apariencia, textos y acción del banner principal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Previsualización en vivo del Slide que se está editando */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Vista Previa en Vivo
                </label>
                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-[#141414] border border-gray-700 shadow-inner flex flex-col justify-end p-4">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                  <div className="relative z-10 space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffd025] text-[#141414] font-black text-[10px] uppercase">
                      <i className={form.icon}></i> {form.badge || 'INSIGNIA'}
                    </span>
                    <h4 className="text-lg font-black text-white leading-tight drop-shadow">
                      {form.title || 'Título del banner'}
                    </h4>
                    <p className="text-xs text-gray-200 line-clamp-1">
                      {form.description || 'Descripción del banner'}
                    </p>
                    <div className="pt-1">
                      <span className="inline-block px-3 py-1 bg-[#ffd025] text-[#141414] font-black text-xs rounded-lg shadow">
                        {form.ctaText || 'Botón CTA'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Título Principal */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Título del Banner *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: ¡SED DE FIN DE SEMANA?"
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Descripción / Bajada de Texto *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ej: Piscolas heladas, cervezas y destilados directo a tu puerta en Alerce..."
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                />
              </div>

              {/* Insignia / Badge e Ícono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Texto de la Insignia (Badge)
                  </label>
                  <input
                    type="text"
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    placeholder="Ej: DESPACHO EXPRÉS 45 MIN"
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Ícono de la Insignia
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.icon}
                      onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      placeholder="fa-solid fa-bolt"
                      className="flex-1 bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                    />
                    <div className="w-10 h-10 rounded-xl bg-gray-800 text-[#ffd025] flex items-center justify-center text-sm border border-gray-700 shrink-0">
                      <i className={form.icon}></i>
                    </div>
                  </div>

                  {/* Selector rápido de íconos */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {PRESET_ICONS.map((p) => (
                      <button
                        key={p.icon}
                        type="button"
                        onClick={() => setForm({ ...form, icon: p.icon })}
                        className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition ${
                          form.icon === p.icon
                            ? 'bg-[#ffd025] text-[#141414] border-[#ffd025]'
                            : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        <i className={p.icon}></i>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botón CTA y Enlace */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Texto del Botón (CTA)
                  </label>
                  <input
                    type="text"
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                    placeholder="Ej: Pedir Ahora"
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Enlace del Botón
                  </label>
                  <input
                    type="text"
                    value={form.ctaLink}
                    onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                    placeholder="Ej: #cat-destilados o https://..."
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>
              </div>

              {/* Imagen de Fondo */}
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-300 uppercase">
                    Imagen de Fondo del Banner *
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#ffd025] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <i className="fa-solid fa-upload"></i>
                    <span>Subir archivo desde PC</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <input
                  type="text"
                  required
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://images.unsplash.com/... o data:image/..."
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                />

                {/* Presets de imágenes de botillería */}
                <div>
                  <span className="text-[11px] text-gray-400 block mb-1.5">
                    O selecciona una fotografía de estudio recomendada:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {PRESET_BANNER_IMAGES.map((imgPreset) => (
                      <button
                        key={imgPreset.url}
                        type="button"
                        onClick={() => setForm({ ...form, image: imgPreset.url })}
                        className={`group p-1 rounded-xl border text-left transition overflow-hidden ${
                          form.image === imgPreset.url
                            ? 'border-[#ffd025] bg-[#ffd025]/10'
                            : 'border-gray-800 bg-[#141414] hover:border-gray-700'
                        }`}
                      >
                        <div className="h-12 rounded-lg overflow-hidden relative mb-1">
                          <img
                            src={imgPreset.url}
                            alt={imgPreset.label}
                            className="w-full h-full object-cover group-hover:scale-110 transition"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 group-hover:text-white block truncate">
                          {imgPreset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botones de acción del Modal */}
              <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs rounded-xl shadow cursor-pointer uppercase flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Guardar Slide</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
