import React, { useState, useMemo } from 'react';
import { CategoryData, Product } from '../types';
import { formatPrice, getDiscountPercentage } from '../data/products';

interface CategoryCatalogViewProps {
  category: CategoryData;
  onAddToCart: (product: Product) => void;
  onBack: () => void;
  allCategories?: CategoryData[];
  onSelectCategory?: (categoryId: string) => void;
}

export const CategoryCatalogView: React.FC<CategoryCatalogViewProps> = ({
  category,
  onAddToCart,
  onBack,
  allCategories = [],
  onSelectCategory
}) => {
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'discount'>('featured');

  // Calculate absolute min & max price from products
  const { categoryMinPrice, categoryMaxPrice } = useMemo(() => {
    if (!category.products || category.products.length === 0) {
      return { categoryMinPrice: 0, categoryMaxPrice: 50000 };
    }
    const prices = category.products.map((p) => p.price);
    return {
      categoryMinPrice: Math.min(...prices),
      categoryMaxPrice: Math.max(...prices)
    };
  }, [category]);

  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  // Mobile filters panel drawer toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Extract unique subcategories with product counts
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    category.products.forEach((p) => {
      const sub = p.subcategory || 'General';
      counts[sub] = (counts[sub] || 0) + 1;
    });
    return counts;
  }, [category]);

  const subcategoryList = useMemo(() => {
    return Object.keys(subcategoryCounts).sort();
  }, [subcategoryCounts]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return category.products
      .filter((p) => {
        // Search query filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(query);
          const matchSub = p.subcategory.toLowerCase().includes(query);
          const matchDesc = p.description.toLowerCase().includes(query);
          const matchBrand = p.brand ? p.brand.toLowerCase().includes(query) : false;
          if (!matchName && !matchSub && !matchDesc && !matchBrand) return false;
        }

        // Subcategory filter
        if (selectedSubcategory !== 'all' && p.subcategory !== selectedSubcategory) {
          return false;
        }

        // Stock filter
        if (onlyInStock && p.inStock === false) {
          return false;
        }

        // Price filter
        if (typeof minPrice === 'number' && p.price < minPrice) {
          return false;
        }
        if (typeof maxPrice === 'number' && p.price > maxPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'discount') {
          const discA = a.discount ? parseInt(a.discount.replace(/[^0-9]/g, ''), 10) : 0;
          const discB = b.discount ? parseInt(b.discount.replace(/[^0-9]/g, ''), 10) : 0;
          return discB - discA;
        }
        return 0; // 'featured' retains original order
      });
  }, [category, searchQuery, selectedSubcategory, onlyInStock, minPrice, maxPrice, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSubcategory('all');
    setOnlyInStock(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('featured');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSubcategory !== 'all' ||
    onlyInStock ||
    minPrice !== '' ||
    maxPrice !== '' ||
    sortBy !== 'featured';

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 md:px-6">
      
      {/* 1. Barra Superior de Navegación & Migas de Pan */}
      <nav aria-label="Migas de pan" className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-bold text-stone-800 hover:text-amber-600 transition cursor-pointer"
          >
            <i className="fa-solid fa-arrow-left text-[11px]"></i>
            <span>Volver a la Tienda</span>
          </button>
          <span>/</span>
          <span className="text-stone-400">Catálogo</span>
          <span>/</span>
          <span className="font-extrabold text-[#141414]">{category.name}</span>
        </div>

        {/* Selector rápido de otras categorías */}
        {allCategories.length > 1 && onSelectCategory && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-400 hidden sm:inline">Cambiar a:</span>
            <select
              value={category.id}
              onChange={(e) => {
                onSelectCategory(e.target.value);
                handleResetFilters();
              }}
              className="bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-semibold text-stone-800 outline-none focus:border-[#ffd129]"
            >
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.products.length})
                </option>
              ))}
            </select>
          </div>
        )}
      </nav>

      {/* 2. Banner de Cabecera de la Categoría */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg bg-stone-900 mb-6">
        <div className="h-36 sm:h-44 md:h-52 relative">
          <img
            src={category.bannerImage}
            alt={category.name}
            className={`w-full h-full object-cover opacity-75 ${
              category.bannerPosition === 'top'
                ? 'object-top'
                : category.bannerPosition === 'bottom'
                ? 'object-bottom'
                : 'object-center'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent"></div>
          
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#ffd129] text-[#141414] flex items-center justify-center text-lg sm:text-xl font-black shadow-lg shrink-0">
                <i className={category.icon}></i>
              </div>
              <div className="min-w-0">
                <div className="inline-block bg-amber-500 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-1">
                  {category.badge || 'Catálogo Oficial'}
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black truncate drop-shadow-sm">
                  {category.name}
                </h1>
                <p className="text-xs text-stone-300 font-light truncate max-w-xl">
                  {category.description}
                </p>
              </div>
            </div>

            <div className="shrink-0 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-semibold text-stone-200">
              Mostrando <strong className="text-[#ffd129]">{filteredProducts.length}</strong> de {category.products.length} productos
            </div>
          </div>
        </div>
      </div>

      {/* Botón Filtros en Pantallas Móviles */}
      <div className="lg:hidden mb-4 flex items-center justify-between gap-2">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-stone-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow cursor-pointer"
        >
          <i className="fa-solid fa-sliders text-[#ffd129]"></i>
          <span>{showMobileFilters ? 'Ocultar Filtros' : 'Filtrar & Buscar Productos'}</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-[#ffd129] animate-pulse"></span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="px-3 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-bold transition"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* 3. Distribución Principal: Productos a la Izquierda + Menú de Filtros a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA PRINCIPAL (Izquierda / Centro en Desktop): Listado de Productos */}
        <main className="lg:col-span-8 xl:col-span-9 order-2 lg:order-1">
          
          {/* Barra de Filtros Activos y Ordenador */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-xs mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-stone-500">Filtros activos:</span>
              {selectedSubcategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded-lg font-bold border border-amber-200">
                  <span>Subsección: {selectedSubcategory}</span>
                  <button onClick={() => setSelectedSubcategory('all')} className="hover:text-red-600">
                    <i className="fa-solid fa-xmark text-[10px]"></i>
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-800 text-xs px-2.5 py-1 rounded-lg font-bold border border-stone-200">
                  <span>Texto: "{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-red-600">
                    <i className="fa-solid fa-xmark text-[10px]"></i>
                  </button>
                </span>
              )}

              {onlyInStock && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 text-xs px-2.5 py-1 rounded-lg font-bold border border-emerald-200">
                  <span>En stock</span>
                  <button onClick={() => setOnlyInStock(false)} className="hover:text-red-600">
                    <i className="fa-solid fa-xmark text-[10px]"></i>
                  </button>
                </span>
              )}

              {(minPrice !== '' || maxPrice !== '') && (
                <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-800 text-xs px-2.5 py-1 rounded-lg font-bold border border-stone-200">
                  <span>
                    Precio: {minPrice ? formatPrice(Number(minPrice)) : '$0'} - {maxPrice ? formatPrice(Number(maxPrice)) : 'Max'}
                  </span>
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="hover:text-red-600">
                    <i className="fa-solid fa-xmark text-[10px]"></i>
                  </button>
                </span>
              )}

              {!hasActiveFilters && (
                <span className="text-xs text-stone-400 italic">Mostrando todos los productos sin filtros</span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-stone-500 hover:text-red-600 underline font-semibold transition"
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>

          {/* Grilla de Productos */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center text-2xl mx-auto mb-3">
                <i className="fa-solid fa-filter-circle-xmark"></i>
              </div>
              <h3 className="text-base font-bold text-stone-800">No encontramos productos con estos filtros</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                Prueba ajustando el rango de precios, seleccionando otra subsección o borrando el término de búsqueda.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 bg-[#ffd129] text-[#141414] px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-yellow-400 transition shadow-sm cursor-pointer"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const autoDiscount = product.discount || getDiscountPercentage(product.price, product.originalPrice);
                const hasDiscount = product.originalPrice && product.originalPrice > product.price;

                return (
                  <div
                    key={product.id}
                    className="bg-white border border-stone-200 hover:border-[#ffd129] rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Imagen con badges */}
                      <div className="h-40 bg-stone-100 rounded-xl mb-3 overflow-hidden relative border border-stone-100">
                        <img
                          src={product.image}
                          alt={product.name}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                            product.inStock === false ? 'opacity-50 grayscale-40' : ''
                          }`}
                          loading="lazy"
                        />

                        {autoDiscount && product.inStock !== false && (
                          <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-md animate-pulse">
                            {autoDiscount}
                          </span>
                        )}

                        {product.inStock === false ? (
                          <span className="absolute top-2 left-2 bg-stone-900/90 text-red-400 border border-red-500/40 text-[9px] font-black px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1">
                            <i className="fa-solid fa-ban text-[8px]"></i> Sin stock
                          </span>
                        ) : (
                          <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded">
                            En stock
                          </span>
                        )}
                      </div>

                      {/* Info del producto */}
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block truncate">
                        {product.subcategory || category.name}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-stone-900 mt-0.5 group-hover:text-amber-600 transition line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 font-light">
                        {product.description}
                      </p>
                    </div>

                    {/* Precios y Botón de Compra */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        {hasDiscount && (
                          <span className="text-[11px] font-bold text-red-600 line-through decoration-red-600 decoration-2 block leading-tight">
                            {formatPrice(product.originalPrice!)}
                          </span>
                        )}
                        <span className="text-sm font-black text-[#141414] block truncate">
                          {formatPrice(product.price)}
                          {product.unit && (
                            <span className="text-[10px] font-normal text-stone-500 ml-1">{product.unit}</span>
                          )}
                        </span>
                      </div>

                      {product.inStock === false ? (
                        <button
                          disabled
                          aria-label={`${product.name} sin stock`}
                          className="bg-stone-200 text-stone-500 text-[11px] font-bold px-3 py-2 rounded-xl cursor-not-allowed flex items-center gap-1 opacity-70 shrink-0"
                        >
                          <i className="fa-solid fa-ban text-[9px]"></i>
                          <span>Agotado</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onAddToCart(product)}
                          className="bg-[#ffd129] text-[#141414] text-xs font-bold px-3 py-2 rounded-xl hover:bg-yellow-400 transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                        >
                          <i className="fa-solid fa-cart-plus text-[10px]"></i>
                          <span>{product.buttonText || 'Comprar'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* COLUMNA DERECHA (Right-side Menu): Subsecciones, Filtros de Precio, Barra de Búsqueda */}
        <aside
          className={`lg:col-span-4 xl:col-span-3 order-1 lg:order-2 ${
            showMobileFilters ? 'block' : 'hidden lg:block'
          }`}
          aria-label="Filtros y navegación lateral"
        >
          <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-sm sticky top-28 space-y-6">
            
            {/* Header del Menú Lateral */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-sliders text-amber-600 text-sm"></i>
                <h2 className="text-sm font-black uppercase text-stone-900 tracking-wider">
                  Filtros & Navegación
                </h2>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-bold underline"
                >
                  Restablecer
                </button>
              )}
            </div>

            {/* 1. BARRA DE BÚSQUEDA DENTRO DE LA CATEGORÍA */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase">
                <i className="fa-solid fa-magnifying-glass text-stone-400 mr-1.5"></i>
                Buscar en {category.name}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Marca, tipo, formato..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-3 pr-8 py-2 text-xs text-stone-900 outline-none focus:border-[#ffd129] focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 text-xs"
                  >
                    <i className="fa-solid fa-circle-xmark"></i>
                  </button>
                )}
              </div>
            </div>

            {/* 2. SUBSECCIONES / SUBCATEGORÍAS */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-700 uppercase">
                <i className="fa-solid fa-layer-group text-stone-400 mr-1.5"></i>
                Subsecciones ({subcategoryList.length})
              </label>

              <div className="space-y-1 max-h-52 overflow-y-auto pr-1 no-scrollbar">
                {/* Opción Todos */}
                <button
                  type="button"
                  onClick={() => setSelectedSubcategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    selectedSubcategory === 'all'
                      ? 'bg-stone-900 text-[#ffd129] font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span>Todas las subsecciones</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedSubcategory === 'all' ? 'bg-[#ffd129] text-stone-950 font-black' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {category.products.length}
                  </span>
                </button>

                {/* Subcategorías individuales */}
                {subcategoryList.map((sub) => {
                  const isSelected = selectedSubcategory === sub;
                  const count = subcategoryCounts[sub] || 0;

                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubcategory(sub)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-stone-900 text-[#ffd129] font-bold shadow-xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <span className="truncate pr-2">{sub}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${
                        isSelected ? 'bg-[#ffd129] text-stone-950 font-black' : 'bg-stone-200 text-stone-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. FILTROS DE PRECIO */}
            <div className="space-y-2.5 pt-2 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-700 uppercase">
                <i className="fa-solid fa-tag text-stone-400 mr-1.5"></i>
                Filtro por Precio (CLP)
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[10px] text-stone-400 mb-0.5">Mínimo</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-stone-400">$</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      placeholder={categoryMinPrice.toString()}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-6 pr-2 py-1.5 text-xs text-stone-900 outline-none focus:border-[#ffd129]"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] text-stone-400 mb-0.5">Máximo</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-stone-400">$</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      placeholder={categoryMaxPrice.toString()}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-6 pr-2 py-1.5 text-xs text-stone-900 outline-none focus:border-[#ffd129]"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de rango rápido */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => { setMinPrice(''); setMaxPrice(10000); }}
                  className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-semibold text-stone-700 transition"
                >
                  Hasta $10.000
                </button>
                <button
                  type="button"
                  onClick={() => { setMinPrice(10000); setMaxPrice(25000); }}
                  className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-semibold text-stone-700 transition"
                >
                  $10k a $25k
                </button>
                <button
                  type="button"
                  onClick={() => { setMinPrice(25000); setMaxPrice(''); }}
                  className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-semibold text-stone-700 transition"
                >
                  Más de $25.000
                </button>
                <button
                  type="button"
                  onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                  className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-semibold text-stone-700 transition"
                >
                  Cualquier precio
                </button>
              </div>
            </div>

            {/* 4. DISPONIBILIDAD & STOCK */}
            <div className="pt-2 border-t border-stone-100">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-stone-300"
                />
                <span className="text-xs font-semibold text-stone-700">
                  Solo productos con stock disponible
                </span>
              </label>
            </div>

            {/* 5. ORDENAR POR */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-700 uppercase">
                <i className="fa-solid fa-arrow-down-short-wide text-stone-400 mr-1.5"></i>
                Ordenar listado por:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 outline-none focus:border-[#ffd129]"
              >
                <option value="featured">Destacados por defecto</option>
                <option value="price-asc">Menor precio primero</option>
                <option value="price-desc">Mayor precio primero</option>
                <option value="discount">Mayor descuento primero</option>
                <option value="name-asc">Nombre A-Z</option>
              </select>
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
};
