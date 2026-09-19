import React, { useState, useRef } from 'react';
import { CategoryData, Product } from '../types';
import { formatPrice, getDiscountPercentage } from '../data/products';
import { Emoji3D, getCategoryEmoji3DKey } from './Emoji3D';

interface CategorySectionProps {
  category: CategoryData;
  onAddToCart: (product: Product) => void;
  onOpenCategoryCatalog?: (categoryId: string) => void;
  isVisualEditMode?: boolean;
  onQuickEditProduct?: (product: Product, categoryId: string) => void;
  onQuickEditCategory?: (category: CategoryData) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  onAddToCart,
  onOpenCategoryCatalog,
  isVisualEditMode = false,
  onQuickEditProduct,
  onQuickEditCategory
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const card = container.querySelector('div');
      const cardWidth = card ? card.offsetWidth + 16 : 230;
      const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenCategoryCatalog) {
      onOpenCategoryCatalog(category.id);
    }
  };

  return (
    <section id={category.id} className="max-w-7xl mx-auto mt-4 sm:mt-8 pt-2 sm:pt-4 border-t border-stone-200 px-1 sm:px-0 relative">
      {/* Banner de Categoría */}
      <div
        className={`relative w-full h-20 sm:h-[26vh] md:h-[28vh] min-h-[80px] sm:min-h-[200px] max-h-[270px] rounded-xl sm:rounded-3xl overflow-hidden shadow-md sm:shadow-xl bg-stone-900 group ${
          isVisualEditMode ? 'ring-2 ring-blue-400 ring-dashed cursor-pointer' : ''
        }`}
        onClick={() => {
          if (isVisualEditMode && onQuickEditCategory) {
            onQuickEditCategory(category);
          }
        }}
      >
        {isVisualEditMode && (
          <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onQuickEditCategory) onQuickEditCategory(category);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] sm:text-xs font-black px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-lg sm:rounded-xl shadow-xl flex items-center gap-1 sm:gap-1.5 transition uppercase tracking-wider cursor-pointer"
            >
              <Emoji3D name="image" className="w-3.5 h-3.5" alt="Imagen" />
              <span className="hidden xs:inline">Editar Portada de {category.name}</span>
            </button>
          </div>
        )}

        <img
          src={category.bannerImage}
          alt={category.name || category.title}
          className={`w-full h-full object-cover group-hover:scale-101 transition-transform duration-500 ${
            category.bannerPosition === 'top'
              ? 'object-top'
              : category.bannerPosition === 'bottom'
              ? 'object-bottom'
              : 'object-center'
          }`}
        />
      </div>

      {/* Franja Carrusel (6 productos) con botón de Ver Más */}
      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-3 px-1">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h4 className="text-sm md:text-base font-bold text-[#141414] flex items-center gap-2 truncate">
              <Emoji3D name={getCategoryEmoji3DKey(category.id, category.name)} className="w-5 h-5 shrink-0" alt={category.name} /> 
              <span className="truncate">{category.name}</span>
            </h4>
            <span className="text-[11px] text-stone-500 font-normal hidden sm:inline shrink-0">
              ({category.products.length} productos)
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Botón Ver Más */}
            <a
              id={`ver-mas-${category.id}`}
              href={`#catalogo-${category.id}`}
              onClick={handleOpenCatalog}
              className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-[#141414] text-[#ffd129] hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold border border-stone-800 transition shadow-sm active:scale-95 cursor-pointer"
            >
              <span>Ver más</span>
              <Emoji3D name="right" className="w-3.5 h-3.5" alt="Ver más" />
            </a>

            {/* Controles del Carrusel */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-[#ffd129] text-stone-700 hover:text-[#141414] transition flex items-center justify-center text-xs font-bold shadow-sm cursor-pointer"
                title="Desplazar a la izquierda"
                aria-label="Desplazar productos a la izquierda"
              >
                ◀
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-[#ffd129] text-stone-700 hover:text-[#141414] transition flex items-center justify-center text-xs font-bold shadow-sm cursor-pointer"
                title="Desplazar a la derecha"
                aria-label="Desplazar productos a la derecha"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* Carrusel horizontal configurado exactamente a 6 productos */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory touch-pan-x"
        >
          {category.products.slice(0, 6).map((product) => {
            const autoDiscount = product.discount || getDiscountPercentage(product.price, product.originalPrice);
            const hasDiscount = product.originalPrice && product.originalPrice > product.price;

            return (
              <div
                key={product.id}
                className={`w-[155px] sm:w-[210px] md:w-[220px] min-w-[155px] sm:min-w-[210px] md:min-w-[220px] max-w-[160px] sm:max-w-[210px] md:max-w-[220px] snap-start bg-white border border-stone-200 hover:border-[#ffd129] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between shrink-0 group relative ${
                  isVisualEditMode ? 'cursor-pointer ring-1 ring-amber-400 ring-dashed hover:ring-2' : ''
                }`}
                onClick={() => {
                  if (isVisualEditMode && onQuickEditProduct) {
                    onQuickEditProduct(product, category.id);
                  }
                }}
              >
                {isVisualEditMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onQuickEditProduct) onQuickEditProduct(product, category.id);
                    }}
                    className="absolute top-2 right-2 z-20 bg-stone-900/90 hover:bg-stone-900 text-[#ffd129] text-[9px] font-black px-2 py-0.5 rounded shadow flex items-center gap-1 border border-stone-700 cursor-pointer"
                  >
                    <Emoji3D name="pen" className="w-3 h-3" alt="Editar" />
                    <span>Editar</span>
                  </button>
                )}

                <div>
                  <div className="h-28 sm:h-32 bg-stone-100 rounded-xl mb-2 sm:mb-2.5 overflow-hidden relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ${product.inStock === false ? 'opacity-50 grayscale-40' : ''}`}
                      loading="lazy"
                    />
                    {autoDiscount && product.inStock !== false && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md animate-pulse">
                        {autoDiscount}
                      </span>
                    )}
                    {product.inStock === false && (
                      <span className="absolute top-2 left-2 bg-stone-900/90 text-red-400 border border-red-500/40 text-[9px] font-black px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1">
                        <Emoji3D name="prohibited" className="w-3 h-3" alt="Sin stock" />
                        <span>Sin stock</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block truncate">
                    {product.subcategory}
                  </span>
                  <h5 className="text-xs font-semibold text-stone-900 mt-0.5 group-hover:text-amber-700 transition line-clamp-2 h-8 leading-snug break-words">
                    {product.name}
                  </h5>
                  <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 font-light">
                    {product.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-1.5 min-w-0">
                  <div className="min-w-0">
                    {hasDiscount && (
                      <span className="text-[10px] font-bold text-red-600 line-through decoration-red-600 decoration-2 block leading-tight">
                        {formatPrice(product.originalPrice!)}
                      </span>
                    )}
                    <span className="text-xs font-black text-[#141414] block truncate">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  {product.inStock === false ? (
                    <button
                      disabled
                      aria-label={`${product.name} sin stock`}
                      className="bg-stone-200 text-stone-500 text-[10px] font-bold px-2 py-1.5 rounded-lg cursor-not-allowed flex items-center gap-1 opacity-70 shrink-0"
                    >
                      <Emoji3D name="prohibited" className="w-3 h-3" alt="Sin stock" />
                      <span>Sin stock</span>
                    </button>
                  ) : (
                    <button
                      id={`buy-btn-${product.id}`}
                      onClick={(e) => {
                        if (!isVisualEditMode) {
                          onAddToCart(product);
                        }
                      }}
                      className="bg-[#ffd129] text-[#141414] text-[10px] font-bold px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Emoji3D name="cart" className="w-3.5 h-3.5" alt="Comprar" />
                      <span>Comprar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
