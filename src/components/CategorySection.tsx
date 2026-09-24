import React, { useState, useRef, useEffect } from 'react';
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
  isEmergencyMode?: boolean;
  titleColor?: string;
  glowColor?: string;
  glowEnabled?: boolean;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  onAddToCart,
  onOpenCategoryCatalog,
  isVisualEditMode = false,
  onQuickEditProduct,
  onQuickEditCategory,
  isEmergencyMode = false,
  titleColor = '#141414',
  glowColor = '#ffd025',
  glowEnabled = false
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // Position scroll container to center copy for seamless infinite effect on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const card = container.querySelector('div');
        if (card) {
          const cardWidth = card.offsetWidth + 16;
          container.scrollLeft = cardWidth * 6;
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [category]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const card = container.querySelector('div');
    if (!card) return;
    const cardWidth = card.offsetWidth + 16;
    const totalSingleSetWidth = cardWidth * 6;

    if (container.scrollLeft >= totalSingleSetWidth * 2) {
      container.scrollLeft -= totalSingleSetWidth;
    } else if (container.scrollLeft <= totalSingleSetWidth * 0.2) {
      container.scrollLeft += totalSingleSetWidth;
    }
  };

  const startAutoScroll = (direction: 'left' | 'right') => {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    scrollIntervalRef.current = setInterval(() => {
      if (scrollContainerRef.current) {
        const step = direction === 'left' ? -10 : 10;
        scrollContainerRef.current.scrollBy({ left: step });
      }
    }, 20);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const displayProducts = React.useMemo(() => {
    if (category.featuredProductIds && category.featuredProductIds.length > 0) {
      const featured = category.featuredProductIds
        .map(id => category.products.find(p => p.id === id))
        .filter((p): p is Product => !!p);
      const remaining = category.products.filter(p => !category.featuredProductIds?.includes(p.id));
      return [...featured, [...featured, ...remaining]].flat().filter((p, index, self) => self.findIndex(t => t.id === p.id) === index).slice(0, 6);
    }
    return category.products.slice(0, 6);
  }, [category]);

  const handleOpenCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isEmergencyMode) return;
    if (onOpenCategoryCatalog) {
      onOpenCategoryCatalog(category.id);
    }
  };

  return (
    <section id={category.id} className="max-w-7xl mx-auto mt-6 sm:mt-10 px-1 sm:px-0 relative">
      {/* Banner de Categoría */}
      <div
        className={`relative w-full h-24 sm:h-[26vh] md:h-[28vh] min-h-[100px] sm:min-h-[200px] max-h-[270px] rounded-xl sm:rounded-3xl overflow-hidden shadow-md sm:shadow-xl bg-stone-900 group ${
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

        {/* Botón Ver Más - Superpuesto en la esquina inferior derecha del banner (más pequeño, discreto y elegante) */}
        {!isEmergencyMode && (
          <a
            id={`ver-mas-${category.id}`}
            href={`#catalogo-${category.id}`}
            onClick={handleOpenCatalog}
            className="absolute bottom-1.5 right-1.5 sm:bottom-3 sm:right-3 z-20 inline-flex items-center gap-1 bg-[#ffd129] hover:bg-yellow-400 text-[#141414] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-wider shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-yellow-500 whitespace-nowrap"
          >
            <span>Ver Colección</span>
            <i className="fa-solid fa-arrow-right text-[7px] sm:text-[8px]"></i>
          </a>
        )}
      </div>

      <div className="mt-4 relative group/carrousel w-screen left-1/2 -translate-x-1/2 overflow-visible">
        {/* Zonas de desplazamiento por hover a la izquierda y derecha (totalmente transparentes y sin degradados en los extremos de la pantalla) */}
        <div 
          onMouseEnter={() => startAutoScroll('left')}
          onMouseLeave={stopAutoScroll}
          className="absolute left-0 top-0 bottom-4 w-16 sm:w-24 z-30 cursor-w-resize bg-transparent pointer-events-auto"
        />

        <div 
          onMouseEnter={() => startAutoScroll('right')}
          onMouseLeave={stopAutoScroll}
          className="absolute right-0 top-0 bottom-4 w-16 sm:w-24 z-30 cursor-e-resize bg-transparent pointer-events-auto"
        />

        {/* Carrusel horizontal configurado para ser infinito y sin marcos */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory touch-pan-x px-4 xl:px-[calc((100vw-80rem)/2+1.5rem)]"
        >
          {[...displayProducts, ...displayProducts, ...displayProducts].map((product, idx) => {
            const autoDiscount = product.discount || getDiscountPercentage(product.price, product.originalPrice);
            const hasDiscount = product.originalPrice && product.originalPrice > product.price;

            return (
              <div
                key={`${product.id}-inf-${idx}`}
                className={`w-[155px] sm:w-[210px] md:w-[220px] min-w-[155px] sm:min-w-[210px] md:min-w-[220px] max-w-[160px] sm:max-w-[210px] md:max-w-[220px] snap-start bg-[#121214]/90 border border-stone-800/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between shrink-0 group relative ${
                  isVisualEditMode ? 'cursor-pointer ring-1 ring-amber-400 ring-dashed hover:ring-2' : ''
                }`}
                onClick={() => {
                  if (isVisualEditMode && onQuickEditProduct) {
                    onQuickEditProduct(product, category.id);
                  }
                }}
              >
                {/* Capa de fondo desenfocado de la misma foto del producto */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-xl sm:rounded-2xl">
                  <img 
                    src={product.image} 
                    alt="" 
                    className="w-full h-full object-cover blur-md scale-125 opacity-30" 
                  />
                  <div className="absolute inset-0 bg-stone-950/75"></div>
                </div>

                {isVisualEditMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onQuickEditProduct) onQuickEditProduct(product, category.id);
                    }}
                    className="absolute top-2 right-2 z-20 bg-stone-900/95 hover:bg-stone-900 text-[#ffd129] text-[9px] font-black px-2 py-0.5 rounded shadow flex items-center gap-1 border border-stone-700 cursor-pointer"
                  >
                    <Emoji3D name="pen" className="w-3 h-3" alt="Editar" />
                    <span>Editar</span>
                  </button>
                )}

                <div className="relative z-10">
                  <div className="aspect-square w-full bg-stone-900 rounded-xl mb-2 sm:mb-2.5 overflow-hidden relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 rounded-xl ${product.inStock === false ? 'opacity-50 grayscale-40' : ''}`}
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
                  {product.subcategory && product.subcategory !== category.name && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-[9px] font-bold text-[#ffd129] uppercase tracking-wider truncate bg-stone-950/60 px-1.5 py-0.5 rounded border border-stone-800">
                        {product.subcategory}
                      </span>
                    </div>
                  )}
                  <h5 className="text-xs font-semibold text-stone-100 mt-0.5 transition line-clamp-2 h-8 leading-snug break-words">
                    {product.name}
                  </h5>
                  <p className="text-[10px] text-stone-400 mt-1 line-clamp-2 font-light">
                    {product.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between gap-1.5 min-w-0 relative z-10">
                  <div className="min-w-0">
                    {hasDiscount && (
                      <span className="text-[10px] font-bold text-red-500 line-through decoration-red-500 decoration-2 block leading-tight">
                        {formatPrice(product.originalPrice!)}
                      </span>
                    )}
                    <span className="text-xs font-black text-white block truncate">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  {product.inStock === false ? (
                    <button
                      disabled
                      aria-label={`${product.name} sin stock`}
                      className="bg-stone-800 text-stone-500 text-[10px] font-bold px-2 py-1.5 rounded-lg cursor-not-allowed flex items-center gap-1 opacity-70 shrink-0"
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
