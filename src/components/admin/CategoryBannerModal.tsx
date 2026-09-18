import React, { useState, useEffect, useRef } from 'react';
import { CategoryData } from '../../types';

interface CategoryBannerModalProps {
  category: CategoryData | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveBanner: (categoryId: string, bannerUrl: string, bannerPosition: 'center' | 'top' | 'bottom') => Promise<void>;
  showToast: (msg: string) => void;
}

// Banners preconfigurados con resolución óptima y temática para botillería
const PRESET_CATEGORY_BANNERS = [
  {
    label: 'Destilados & Piscolas',
    categoryHint: 'destilados',
    url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=1200&auto=format&fit=crop',
    dimensions: '1200 × 260 px'
  },
  {
    label: 'Cervezas Heladas & Sixpacks',
    categoryHint: 'cervezas',
    url: 'https://images.unsplash.com/photo-1608270190578-831e51b32d2e?q=80&w=1200&auto=format&fit=crop',
    dimensions: '1200 × 260 px'
  },
  {
    label: 'Vinos & Espumantes Reserva',
    categoryHint: 'vinos',
    url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop',
    dimensions: '1200 × 260 px'
  },
  {
    label: 'Whisky, Gin & Coctelería',
    categoryHint: 'destilados',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1200&auto=format&fit=crop',
    dimensions: '1200 × 260 px'
  },
  {
    label: 'Bebidas & Energéticas',
    categoryHint: 'bebidas',
    url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=1200&auto=format&fit=crop',
    dimensions: '1200 × 260 px'
  },
  {
    label: 'Snacks, Hielo & Accesorios',
    categoryHint: 'snacks',
    url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=1200&auto=format&fit=crop',
    dimensions: '1200 × 260 px'
  }
];

export const CategoryBannerModal: React.FC<CategoryBannerModalProps> = ({
  category,
  isOpen,
  onClose,
  onSaveBanner,
  showToast
}) => {
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerPosition, setBannerPosition] = useState<'center' | 'top' | 'bottom'>('center');
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  // Dimensiones detectadas en tiempo real de la imagen ingresada
  const [detectedDimensions, setDetectedDimensions] = useState<{ width: number; height: number; ratio: number } | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (category && isOpen) {
      setBannerUrl(category.bannerImage || '');
      setBannerPosition(category.bannerPosition || 'center');
      detectImageSize(category.bannerImage || '');
    }
  }, [category, isOpen]);

  // Medir dimensiones exactas de la imagen mediante Image() de JS
  const detectImageSize = (url: string) => {
    if (!url || !url.trim()) {
      setDetectedDimensions(null);
      setImageLoadError(false);
      return;
    }

    setIsLoadingImage(true);
    setImageLoadError(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const ratio = h > 0 ? parseFloat((w / h).toFixed(2)) : 1;
      setDetectedDimensions({ width: w, height: h, ratio });
      setIsLoadingImage(false);
    };

    img.onerror = () => {
      setIsLoadingImage(false);
      setImageLoadError(true);
      setDetectedDimensions(null);
    };
  };

  const handleUrlChange = (newUrl: string) => {
    setBannerUrl(newUrl);
    detectImageSize(newUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen válido (.jpg, .png, .webp)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setBannerUrl(result);
        detectImageSize(result);
        showToast('¡Imagen cargada! Analizando dimensiones exactas...');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor arrastra un archivo de imagen (.jpg, .png o .webp)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setBannerUrl(result);
        detectImageSize(result);
        showToast('¡Imagen soltada con éxito! Dimensiones detectadas.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!category) return;
    if (!bannerUrl.trim()) {
      showToast('Por favor ingresa una URL o sube una imagen de banner.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveBanner(category.id, bannerUrl, bannerPosition);
      showToast(`¡Banner de "${category.name}" actualizado con éxito!`);
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Error al guardar el banner.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#141414] border border-stone-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffd129]/10 text-[#ffd129] flex items-center justify-center text-lg shrink-0 border border-[#ffd129]/20">
              <i className="fa-solid fa-image"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#ffd129] text-[#141414] px-2 py-0.5 rounded">
                  Ajuste de Banner
                </span>
                <span className="text-xs font-mono text-stone-400">Pasillo: #{category.id}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Banner de {category.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* 1. SECCIÓN GUÍA: MEDIDAS EXACTAS DEL BANNER */}
          <div className="bg-[#1a1a1a] border border-yellow-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-xs sm:text-sm font-black uppercase text-[#ffd129] flex items-center gap-2">
                <i className="fa-solid fa-ruler-combined"></i>
                <span>Medidas Exactas del Banner de Pasillo</span>
              </h4>
              <span className="text-[10px] font-bold text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-full">
                Especificaciones Oficiales
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#141414] border border-stone-800 rounded-xl p-3">
                <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">
                  Resolución Óptima
                </span>
                <span className="text-sm font-black text-white font-mono block">
                  1200 × 260 px
                </span>
                <span className="text-[10px] text-emerald-400">
                  Ideal para tienda
                </span>
              </div>

              <div className="bg-[#141414] border border-stone-800 rounded-xl p-3">
                <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">
                  Proporción (Ratio)
                </span>
                <span className="text-sm font-black text-[#ffd129] font-mono block">
                  16:4 / 4.6:1
                </span>
                <span className="text-[10px] text-stone-400">
                  Ultra-Panorámico
                </span>
              </div>

              <div className="bg-[#141414] border border-stone-800 rounded-xl p-3">
                <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">
                  Alto en Pantalla
                </span>
                <span className="text-sm font-black text-white font-mono block">
                  200 a 270 px
                </span>
                <span className="text-[10px] text-stone-400">
                  Adaptable responsive
                </span>
              </div>

              <div className="bg-[#141414] border border-stone-800 rounded-xl p-3">
                <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">
                  Peso Máximo
                </span>
                <span className="text-sm font-black text-white font-mono block">
                  ≤ 1.5 MB
                </span>
                <span className="text-[10px] text-stone-400">
                  JPG / WEBP / PNG
                </span>
              </div>
            </div>

            {/* Diagnóstico en tiempo real de la imagen seleccionada */}
            <div className="mt-3 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-stone-400 font-bold text-[11px]">Medidas Imagen Actual:</span>
                {isLoadingImage ? (
                  <span className="text-yellow-400 text-xs flex items-center gap-1.5">
                    <i className="fa-solid fa-spinner animate-spin"></i> Leyendo dimensiones...
                  </span>
                ) : imageLoadError ? (
                  <span className="text-red-400 text-xs font-bold flex items-center gap-1">
                    <i className="fa-solid fa-triangle-exclamation"></i> Error al cargar URL
                  </span>
                ) : detectedDimensions ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-white bg-stone-900 px-2 py-0.5 rounded border border-stone-700">
                      {detectedDimensions.width} × {detectedDimensions.height} px
                    </span>
                    <span className="text-stone-400 text-[10px]">
                      (Relación {detectedDimensions.ratio}:1)
                    </span>
                    {detectedDimensions.ratio >= 3.0 ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <i className="fa-solid fa-circle-check"></i> Proporción panorámica óptima
                      </span>
                    ) : detectedDimensions.ratio >= 1.8 ? (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <i className="fa-solid fa-circle-info"></i> Buen tamaño (se adaptará al ancho)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-orange-400 bg-orange-950/60 border border-orange-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <i className="fa-solid fa-triangle-exclamation"></i> Formato vertical/cuadrado (ajustar enfoque)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-stone-500 text-xs">Sin imagen seleccionada</span>
                )}
              </div>

              <div className="text-[11px] text-stone-400">
                <span>Contenedor tienda: </span>
                <code className="text-[#ffd129] font-mono text-[10px]">rounded-3xl object-cover</code>
              </div>
            </div>
          </div>

          {/* 2. PREVISUALIZADOR EN TIEMPO REAL CON REGLA Y MOCKUP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-stone-300 flex items-center gap-2">
                <i className="fa-solid fa-eye text-[#ffd129]"></i>
                <span>Vista Previa en Vivo (Como se ve en la Tienda)</span>
              </span>

              <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    previewMode === 'desktop'
                      ? 'bg-[#ffd129] text-[#141414]'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-desktop text-[10px]"></i>
                  <span>Escritorio (1200px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    previewMode === 'mobile'
                      ? 'bg-[#ffd129] text-[#141414]'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-mobile-screen text-[10px]"></i>
                  <span>Celular</span>
                </button>
              </div>
            </div>

            {/* Contenedor del Banner a Escala Real */}
            <div className={`mx-auto transition-all duration-300 ${previewMode === 'mobile' ? 'max-w-xs' : 'w-full'}`}>
              <div className="relative w-full h-44 sm:h-52 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-stone-900 border-2 border-dashed border-stone-700 group">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt={category.name}
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      bannerPosition === 'top'
                        ? 'object-top'
                        : bannerPosition === 'bottom'
                        ? 'object-bottom'
                        : 'object-center'
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 gap-2">
                    <i className="fa-solid fa-image text-3xl"></i>
                    <span className="text-xs">Sin imagen de banner asignada</span>
                  </div>
                )}

                {/* Overlay con Regla y Medidas Superpuestas */}
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-xs border border-stone-700 text-stone-200 text-[10px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-2 shadow">
                  <i className="fa-solid fa-ruler text-yellow-400"></i>
                  <span>{previewMode === 'desktop' ? '1200 × 260 px' : '390 × 180 px'}</span>
                  <span className="text-stone-400">• Enfoque: {bannerPosition === 'top' ? 'Superior' : bannerPosition === 'bottom' ? 'Inferior' : 'Centro'}</span>
                </div>

                {/* Badge de Categoría Simulado */}
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-[#ffd129] border border-[#ffd129]/30 text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow">
                  <i className={category.icon || 'fa-solid fa-wine-bottle'}></i>
                  <span>{category.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. CONTROLES DE AJUSTE: URL, ARCHIVO Y ENFOQUE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            
            {/* Control A: Ingreso de URL y Subir Archivo */}
            <div className="bg-[#1a1a1a] border border-stone-800 rounded-2xl p-4 space-y-3">
              <label className="block text-xs font-black uppercase text-white">
                1. Seleccionar o Pegar Imagen del Banner:
              </label>

              {/* Input URL */}
              <div className="space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase block">
                  URL directa de la imagen:
                </span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://images.unsplash.com/... o tu enlace"
                    className="flex-1 bg-[#141414] border border-stone-700 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd129] outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => detectImageSize(bannerUrl)}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs px-3 py-2 rounded-xl transition cursor-pointer"
                    title="Verificar imagen y calcular medidas"
                  >
                    <i className="fa-solid fa-rotate-right"></i>
                  </button>
                </div>
              </div>

              {/* Zona Drag & Drop o Selector Local */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                  isDragging
                    ? 'border-[#ffd129] bg-[#ffd129]/10'
                    : 'border-stone-700 hover:border-stone-500 bg-[#141414]/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <i className="fa-solid fa-cloud-arrow-up text-2xl text-[#ffd129] mb-1.5 block"></i>
                <p className="text-xs font-bold text-white">
                  Arrastra tu banner aquí o haz clic para subir
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Soporta JPG, PNG, WEBP (Medida exacta sugerida: 1200 x 260 px)
                </p>
              </div>
            </div>

            {/* Control B: Ajuste de Enfoque y Presets con Medidas */}
            <div className="bg-[#1a1a1a] border border-stone-800 rounded-2xl p-4 space-y-3">
              <label className="block text-xs font-black uppercase text-white">
                2. Ajustar Enfoque Vertical del Banner:
              </label>

              {/* Botones de Enfoque Vertical */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBannerPosition('top')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                    bannerPosition === 'top'
                      ? 'bg-[#ffd129] text-[#141414] border-[#ffd129] shadow font-black'
                      : 'bg-[#141414] text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  <i className="fa-solid fa-arrow-up text-sm"></i>
                  <span>Superior</span>
                  <span className="text-[9px] opacity-75 font-normal">object-top</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBannerPosition('center')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                    bannerPosition === 'center'
                      ? 'bg-[#ffd129] text-[#141414] border-[#ffd129] shadow font-black'
                      : 'bg-[#141414] text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  <i className="fa-solid fa-arrows-to-dot text-sm"></i>
                  <span>Centrado</span>
                  <span className="text-[9px] opacity-75 font-normal">object-center</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBannerPosition('bottom')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                    bannerPosition === 'bottom'
                      ? 'bg-[#ffd129] text-[#141414] border-[#ffd129] shadow font-black'
                      : 'bg-[#141414] text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  <i className="fa-solid fa-arrow-down text-sm"></i>
                  <span>Inferior</span>
                  <span className="text-[9px] opacity-75 font-normal">object-bottom</span>
                </button>
              </div>

              {/* Banners Recomendados de Botillería */}
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase block mb-1.5">
                  Presets de Botillería (1200 x 260 px):
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {PRESET_CATEGORY_BANNERS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleUrlChange(preset.url)}
                      className={`text-left p-2 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-1 truncate ${
                        bannerUrl === preset.url
                          ? 'bg-[#ffd129]/20 border-[#ffd129] text-[#ffd129]'
                          : 'bg-[#141414] border-stone-800 text-stone-300 hover:border-stone-600'
                      }`}
                    >
                      <span className="truncate font-semibold text-[11px]">{preset.label}</span>
                      <span className="text-[9px] font-mono text-stone-400 shrink-0 font-bold">1200px</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Pie del Modal con Acciones */}
        <div className="p-4 sm:p-5 border-t border-stone-800 flex items-center justify-between bg-[#1a1a1a] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !bannerUrl.trim()}
              className="bg-[#ffd129] hover:bg-yellow-400 disabled:opacity-50 text-[#141414] font-black text-xs px-6 py-2.5 rounded-xl transition shadow-lg cursor-pointer flex items-center gap-2 uppercase tracking-wide active:scale-95"
            >
              {isSaving ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  <span>Guardar Banner ({category.name})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
