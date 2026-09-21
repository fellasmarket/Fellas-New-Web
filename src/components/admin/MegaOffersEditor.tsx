import React, { useState, useEffect, useRef } from 'react';
import { Product, StoreSettings, CategoryData, MegaOffersConfig } from '../../types';
import { formatPrice, getDiscountPercentage } from '../../data/products';
import fireworksSolidBg from '../../assets/images/fireworks_blue_solid_1789491291395.jpg';
import { ProductImageUploader } from './ProductImageUploader';

interface MegaOffersEditorProps {
  megaOffers: Product[];
  onUpdateMegaOffers: (offers: Product[]) => void;
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  categories: CategoryData[];
  showToast: (msg: string) => void;
}

const PRESET_PROMO_BACKGROUNDS = [
  { label: 'Fuegos Artificiales (Clásico Fellas)', url: fireworksSolidBg },
  { label: 'Azul Noche Gradiente', url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop' },
  { label: 'Bar & Celebración', url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=1200&auto=format&fit=crop' }
];

export const MegaOffersEditor: React.FC<MegaOffersEditorProps> = ({
  megaOffers,
  onUpdateMegaOffers,
  settings,
  onUpdateSettings,
  categories,
  showToast
}) => {
  const [promos, setPromos] = useState<Product[]>(megaOffers);
  const [config, setConfig] = useState<MegaOffersConfig>({
    sectionTitle: settings.megaOffersConfig?.sectionTitle || '¡LAS PROMOS DEL TIO FELLAS!',
    sectionSubtitle: settings.megaOffersConfig?.sectionSubtitle || 'Combos imperdibles y packs con despacho prioritario',
    badgeText: settings.megaOffersConfig?.badgeText || 'PROMOS RELÁMPAGO',
    bgImage: settings.megaOffersConfig?.bgImage || fireworksSolidBg
  });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const promoImageInputRef = useRef<HTMLInputElement>(null);

  const [productForm, setProductForm] = useState<Product>({
    id: 'mega-' + Date.now(),
    name: '',
    category: 'Destilados & Piscos',
    categoryId: 'destilados',
    subcategory: 'Pack Promo',
    price: 9990,
    originalPrice: 12990,
    discount: '-23%',
    image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=400&auto=format&fit=crop',
    description: '',
    buttonText: 'Comprar',
    isMegaOffer: true,
    inStock: true
  });

  useEffect(() => {
    setPromos(megaOffers);
  }, [megaOffers]);

  useEffect(() => {
    if (settings.megaOffersConfig) {
      setConfig({
        sectionTitle: settings.megaOffersConfig.sectionTitle || '¡LAS PROMOS DEL TIO FELLAS!',
        sectionSubtitle: settings.megaOffersConfig.sectionSubtitle || 'Combos imperdibles y packs con despacho prioritario',
        badgeText: settings.megaOffersConfig.badgeText || 'PROMOS RELÁMPAGO',
        bgImage: settings.megaOffersConfig.bgImage || fireworksSolidBg
      });
    }
  }, [settings.megaOffersConfig]);

  // Persist promos list to backend
  const persistPromos = async (newPromos: Product[]) => {
    setPromos(newPromos);
    onUpdateMegaOffers(newPromos);
    try {
      const res = await fetch('/api/mega-offers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offers: newPromos })
      });
      if (res.ok) {
        showToast('Promos del Tío Fellas guardadas con éxito');
      } else {
        showToast('Guardado localmente en la sesión activa');
      }
    } catch (e) {
      console.error(e);
      showToast('Guardado localmente en la sesión activa');
    }
  };

  // Persist header config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: StoreSettings = {
      ...settings,
      megaOffersConfig: config
    };
    onUpdateSettings(updatedSettings);

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      showToast('¡Encabezado de Las Promos del Tío Fellas actualizado!');
    } catch (err) {
      console.error(err);
      showToast('Encabezado guardado localmente');
    }
  };

  const handleOpenAddProduct = () => {
    setEditingIndex(null);
    setProductForm({
      id: 'mega-' + Date.now(),
      name: '',
      category: 'Promos Tío Fellas',
      categoryId: 'destilados',
      subcategory: 'Pack Promo',
      price: 10990,
      originalPrice: 13990,
      discount: '-21%',
      image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=400&auto=format&fit=crop',
      description: 'Pack con despacho prioritario',
      buttonText: 'Comprar',
      isMegaOffer: true,
      inStock: true
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product, index: number) => {
    setEditingIndex(index);
    setProductForm({ ...prod });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      showToast('El nombre del producto no puede estar vacío');
      return;
    }

    const calculatedDiscount = productForm.discount || getDiscountPercentage(productForm.price, productForm.originalPrice);
    const finalizedProduct: Product = {
      ...productForm,
      discount: calculatedDiscount,
      isMegaOffer: true
    };

    let updatedList: Product[];
    if (editingIndex !== null && editingIndex >= 0) {
      updatedList = [...promos];
      updatedList[editingIndex] = finalizedProduct;
      showToast('Producto de promo actualizado');
    } else {
      updatedList = [...promos, finalizedProduct];
      showToast('Nueva promo agregada a Las Promos del Tío Fellas');
    }

    persistPromos(updatedList);
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (index: number) => {
    const updated = promos.filter((_, i) => i !== index);
    persistPromos(updated);
    showToast('Producto quitado de Las Promos del Tío Fellas');
  };

  const handleToggleStock = (index: number) => {
    const updated = [...promos];
    const current = updated[index];
    updated[index] = {
      ...current,
      inStock: current.inStock === false ? true : false
    };
    persistPromos(updated);
    showToast(updated[index].inStock ? 'Marcado EN STOCK' : 'Marcado SIN STOCK');
  };

  const handleMoveProduct = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= promos.length) return;

    const updated = [...promos];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    persistPromos(updated);
    showToast('Orden de las promos actualizado');
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setProductForm(prev => ({ ...prev, image: dataUrl }));
        showToast('Imagen del producto cargada');
      }
    };
    reader.readAsDataURL(file);
  };

  // Convert catalog product into promo with 1 click
  const handleImportFromCatalog = (sourceProduct: Product) => {
    // Check if already in promos
    const existing = promos.find(p => p.id === sourceProduct.id || p.name === sourceProduct.name);
    if (existing) {
      showToast('Este producto ya forma parte de las Promos del Tío Fellas');
      return;
    }

    const offerPrice = Math.round(sourceProduct.price * 0.85); // 15% off by default
    const newPromo: Product = {
      ...sourceProduct,
      id: 'mega-' + Date.now(),
      originalPrice: sourceProduct.price,
      price: offerPrice,
      discount: '-15%',
      isMegaOffer: true,
      buttonText: 'Comprar'
    };

    persistPromos([...promos, newPromo]);
    showToast(`"${sourceProduct.name}" agregado a Las Promos del Tío Fellas con 15% OFF`);
    setIsCatalogPickerOpen(false);
  };

  const allCatalogProducts = categories.flatMap(c => c.products);
  const filteredCatalogProducts = catalogSearch.trim()
    ? allCatalogProducts.filter(p => p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || p.subcategory.toLowerCase().includes(catalogSearch.toLowerCase()))
    : allCatalogProducts;

  return (
    <div className="space-y-6">
      {/* Header del Editor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1a1a1a] p-6 rounded-3xl border border-gray-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#ffd025] mb-1">
            <i className="fa-solid fa-bolt"></i> Editor de "Las Promos del Tío Fellas"
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Mega Ofertas & Promociones Destacadas
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Modifica el título principal de la sección, subtítulos, insignias, y agrega, edita o quita productos de las promos con sus respectivos precios de oferta y fotografías.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCatalogPickerOpen(true)}
            className="bg-gray-800 hover:bg-gray-700 text-[#ffd025] border border-gray-700 font-bold text-xs px-4 py-3 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-layer-group"></i>
            <span>Importar de Catálogo</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddProduct}
            className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-5 py-3 rounded-xl transition flex items-center gap-2 shadow-lg shadow-[#ffd025]/20 cursor-pointer uppercase"
          >
            <i className="fa-solid fa-plus text-sm"></i>
            <span>Nueva Promo</span>
          </button>
        </div>
      </div>

      {/* 1. CONFIGURACIÓN DEL ENCABEZADO Y FONDO DE LA SECCIÓN */}
      <form onSubmit={handleSaveConfig} className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">
              <i className="fa-solid fa-heading"></i>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-white">
                Cabecera y Título de la Sección
              </h3>
              <p className="text-[11px] text-gray-400">
                Personaliza cómo se titula y presenta este bloque en la tienda.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs px-4 py-2 rounded-xl transition shadow cursor-pointer uppercase flex items-center gap-1.5"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>Guardar Encabezado</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Título Principal de la Sección *
            </label>
            <input
              type="text"
              required
              value={config.sectionTitle}
              onChange={(e) => setConfig({ ...config, sectionTitle: e.target.value })}
              placeholder="¡LAS PROMOS DEL TIO FELLAS!"
              className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Subtítulo / Bajada
            </label>
            <input
              type="text"
              value={config.sectionSubtitle || ''}
              onChange={(e) => setConfig({ ...config, sectionSubtitle: e.target.value })}
              placeholder="Combos imperdibles y packs con despacho prioritario"
              className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Texto de Insignia (Badge)
            </label>
            <input
              type="text"
              value={config.badgeText || ''}
              onChange={(e) => setConfig({ ...config, badgeText: e.target.value })}
              placeholder="PROMOS RELÁMPAGO"
              className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
            Imagen de Fondo o Presets
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={config.bgImage || ''}
              onChange={(e) => setConfig({ ...config, bgImage: e.target.value })}
              placeholder="URL de imagen de fondo"
              className="flex-1 bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
            />
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMO_BACKGROUNDS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setConfig({ ...config, bgImage: preset.url })}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition ${
                    config.bgImage === preset.url
                      ? 'bg-[#ffd025] text-[#141414] border-[#ffd025]'
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>

      {/* 2. LISTA DE PRODUCTOS DE LAS PROMOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
            Productos en "Las Promos del Tío Fellas" ({promos.length})
          </h3>
          <span className="text-[11px] text-gray-500">
            Se muestran en formato lámina destacada en la página principal
          </span>
        </div>

        {promos.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-12 text-center space-y-3">
            <i className="fa-solid fa-bolt text-4xl text-gray-600"></i>
            <h4 className="text-sm font-bold text-gray-300">No hay productos en esta sección</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Haz clic en "Nueva Promo" o "Importar de Catálogo" para destacar productos en Las Promos del Tío Fellas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promos.map((prod, idx) => {
              const discount = prod.discount || getDiscountPercentage(prod.price, prod.originalPrice);
              const hasDiscount = prod.originalPrice && prod.originalPrice > prod.price;

              return (
                <div
                  key={prod.id || idx}
                  className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between hover:border-[#ffd025]/40 transition group"
                >
                  <div className="flex items-start gap-4">
                    {/* Imagen con badge */}
                    <div className="w-24 h-24 rounded-xl bg-[#141414] border border-gray-800 overflow-hidden relative shrink-0 p-1 flex items-center justify-center">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className={`max-w-full max-h-full object-contain ${prod.inStock === false ? 'opacity-40 grayscale' : ''}`}
                      />
                      {discount && prod.inStock !== false && (
                        <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                          {discount}
                        </span>
                      )}
                    </div>

                    {/* Información del producto */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#ffd025] uppercase tracking-wider truncate">
                          {prod.subcategory || 'Pack Promo'}
                        </span>

                        {/* Toggle Stock rápido */}
                        <button
                          type="button"
                          onClick={() => handleToggleStock(idx)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                            prod.inStock === false
                              ? 'bg-red-950/80 text-red-300 border-red-800'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${prod.inStock === false ? 'bg-red-500' : 'bg-emerald-400 animate-pulse'}`}></span>
                          <span>{prod.inStock === false ? 'Sin stock' : 'En stock'}</span>
                        </button>
                      </div>

                      <h4 className="text-sm font-black text-white line-clamp-2">
                        {prod.name}
                      </h4>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-base font-black text-emerald-400">
                          {formatPrice(prod.price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs font-bold text-gray-500 line-through">
                            {formatPrice(prod.originalPrice!)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="pt-3 mt-3 border-t border-gray-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveProduct(idx, 'up')}
                        disabled={idx === 0}
                        title="Subir posición"
                        className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 flex items-center justify-center border border-gray-700 text-xs"
                      >
                        <i className="fa-solid fa-arrow-up"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveProduct(idx, 'down')}
                        disabled={idx === promos.length - 1}
                        title="Bajar posición"
                        className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 flex items-center justify-center border border-gray-700 text-xs"
                      >
                        <i className="fa-solid fa-arrow-down"></i>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditProduct(prod, idx)}
                        className="px-3 py-1 rounded-xl bg-gray-800 hover:bg-gray-700 text-[#ffd025] text-xs font-bold border border-gray-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(idx)}
                        className="px-3 py-1 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold border border-red-800/60 flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        <span>Quitar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: EDITAR O CREAR PRODUCTO DE PROMO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-6">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#161616]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#ffd025] text-[#141414] font-black flex items-center justify-center text-sm shadow">
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white">
                    {editingIndex !== null ? 'Editar Promo del Tío Fellas' : 'Agregar Nueva Promo'}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Configura el nombre, foto, precio de oferta y descuento tachado.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Nombre / Título */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Nombre de la Promo / Producto *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ej: Pack Piscola Mistral 35° + Coca-Cola + Hielo"
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                />
              </div>

              {/* Subcategoría */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Subcategoría o Etiqueta
                </label>
                <input
                  type="text"
                  value={productForm.subcategory}
                  onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                  placeholder="Ej: Pack Piscola, Whisky Premium, Cerveza Helada..."
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                />
              </div>

              {/* Precios y Descuento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Precio Oferta ($CLP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => {
                      const newPrice = Number(e.target.value);
                      const autoDisc = getDiscountPercentage(newPrice, productForm.originalPrice);
                      setProductForm({ ...productForm, price: newPrice, discount: autoDisc });
                    }}
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Precio Normal / Tachado
                  </label>
                  <input
                    type="number"
                    value={productForm.originalPrice || 0}
                    onChange={(e) => {
                      const newOrig = Number(e.target.value);
                      const autoDisc = getDiscountPercentage(productForm.price, newOrig);
                      setProductForm({ ...productForm, originalPrice: newOrig, discount: autoDisc });
                    }}
                    placeholder="Ej: 14990"
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Badge de Descuento
                  </label>
                  <input
                    type="text"
                    value={productForm.discount || ''}
                    onChange={(e) => setProductForm({ ...productForm, discount: e.target.value })}
                    placeholder="Ej: -20%"
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>
              </div>

              {/* Imagen del Producto con subida desde PC, Sharp y Cloudflare R2 */}
              <ProductImageUploader
                value={productForm.image}
                onChange={(newUrl) => setProductForm(prev => ({ ...prev, image: newUrl }))}
                productName={productForm.name}
                label="Imagen del Producto Promo (Cargar desde PC o Enlace)"
                showToast={showToast}
              />

              {/* Botón y Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={productForm.buttonText || 'Comprar'}
                    onChange={(e) => setProductForm({ ...productForm, buttonText: e.target.value })}
                    placeholder="Comprar"
                    className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-[#141414] rounded-xl border border-gray-800 hover:border-gray-700">
                    <input
                      type="checkbox"
                      checked={productForm.inStock !== false}
                      onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                      className="w-4 h-4 rounded text-[#ffd025] focus:ring-[#ffd025] bg-gray-900 border-gray-700"
                    />
                    <span className="text-xs font-bold text-white">Disponible en Stock</span>
                  </label>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs rounded-xl shadow cursor-pointer uppercase flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Guardar Promo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTAR DESDE CATÁLOGO EXISTENTE */}
      {isCatalogPickerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-6">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#161616]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#ffd025] text-[#141414] font-black flex items-center justify-center text-sm shadow">
                  <i className="fa-solid fa-layer-group"></i>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white">
                    Seleccionar Producto del Catálogo
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Convierte cualquier producto existente a "Promo del Tío Fellas" con un solo clic.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogPickerOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-500 text-xs"></i>
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Buscar producto por nombre o subcategoría..."
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-[#ffd025]"
                />
              </div>

              <div className="space-y-2">
                {filteredCatalogProducts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No se encontraron productos coincidentes.
                  </div>
                ) : (
                  filteredCatalogProducts.slice(0, 20).map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 bg-[#141414] border border-gray-800 rounded-xl flex items-center justify-between gap-3 hover:border-gray-700 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-12 h-12 object-contain rounded-lg bg-black/40 p-1 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] text-[#ffd025] font-bold uppercase block truncate">
                            {prod.subcategory || prod.category}
                          </span>
                          <h5 className="text-xs font-bold text-white truncate">
                            {prod.name}
                          </h5>
                          <span className="text-xs font-black text-emerald-400">
                            {formatPrice(prod.price)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleImportFromCatalog(prod)}
                        className="px-3.5 py-1.5 bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs rounded-xl shadow transition shrink-0 uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <i className="fa-solid fa-plus text-[10px]"></i>
                        <span>Añadir a Promos</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
