import React, { useState, useRef } from 'react';
import { CategoryData, Product } from '../types';
import { formatPrice, getDiscountPercentage } from '../data/products';

interface CategorySectionProps {
  category: CategoryData;
  onAddToCart: (product: Product) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({ category, onAddToCart }) => {
  const [showAllModal, setShowAllModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id={category.id} className="max-w-7xl mx-auto mt-6 sm:mt-8 pt-4 border-t border-stone-200">
      {/* Banner de Categoría: altura a 2/3 del alto previo (~33vh, min 230px, max 305px) y textos centrados en 1/3 de su alto */}
      <div className="relative w-full h-[33vh] min-h-[230px] max-h-[305px] rounded-3xl overflow-hidden shadow-2xl bg-[#141414] flex items-center justify-center">
        <img
          src={category.bannerImage}
          alt={category.title}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/90 via-[#141414]/75 to-[#141414]/90"></div>

        {/* Textos ocupan 1/3 del alto del banner y están centrados justo en medio */}
        <div className="relative z-10 w-full max-w-2xl h-1/3 min-h-[76px] max-h-[102px] flex flex-col justify-center items-center text-center px-6 text-white">
          <span className="inline-flex items-center gap-1.5 text-[#ffd129] font-bold text-xs uppercase tracking-widest mb-1">
            <i className={category.icon}></i> {category.badge}
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold leading-tight text-white line-clamp-1">
            {category.title}
          </h2>
          <p className="text-xs md:text-sm text-stone-300 font-light leading-snug mt-1 line-clamp-2 max-w-xl">
            {category.description}
          </p>
        </div>
      </div>

      {/* Franja Carrusel (máximo 5 productos) con botón de Ver Más */}
      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
          <div className="flex items-center gap-3">
            <h4 className="text-sm md:text-base font-bold text-[#141414] flex items-center gap-2">
              <i className="fa-solid fa-wine-bottle text-yellow-600"></i> {category.name}
            </h4>
            <span className="text-[11px] text-stone-500 font-normal hidden sm:inline">
              ({category.products.length} productos disponibles)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón Ver Más */}
            <button
              id={`ver-mas-${category.id}`}
              onClick={() => setShowAllModal(true)}
              className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-[#141414] text-[#ffd129] hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold border border-stone-800 transition shadow-sm active:scale-95"
            >
              <span>Ver más</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </button>

            {/* Controles del Carrusel */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scroll('left')}
                className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-[#ffd129] text-stone-700 hover:text-[#141414] transition flex items-center justify-center text-xs shadow-sm"
                title="Desplazar a la izquierda"
                aria-label="Desplazar productos a la izquierda"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-7 h-7 rounded-lg bg-stone-200 hover:bg-[#ffd129] text-stone-700 hover:text-[#141414] transition flex items-center justify-center text-xs shadow-sm"
                title="Desplazar a la derecha"
                aria-label="Desplazar productos a la derecha"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Carrusel horizontal con máximo 5 productos */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth"
        >
          {category.products.slice(0, 5).map((product) => {
            const autoDiscount = product.discount || getDiscountPercentage(product.price, product.originalPrice);
            const hasDiscount = product.originalPrice && product.originalPrice > product.price;

            return (
              <div
                key={product.id}
                className="min-w-[210px] max-w-[210px] bg-white border border-stone-200 hover:border-[#ffd129] rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between shrink-0 group"
              >
                <div>
                  <div className="h-32 bg-stone-100 rounded-xl mb-2.5 overflow-hidden relative">
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
                        <i className="fa-solid fa-ban text-[8px]"></i> Sin stock
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
                      className="bg-stone-200 text-stone-500 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-not-allowed flex items-center gap-1 opacity-70 shrink-0"
                    >
                      <i className="fa-solid fa-ban text-[8px]"></i>
                      <span>Sin stock</span>
                    </button>
                  ) : (
                    <button
                      id={`buy-btn-${product.id}`}
                      onClick={() => onAddToCart(product)}
                      className="bg-[#ffd129] text-[#141414] text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <i className="fa-solid fa-cart-plus text-[9px]"></i>
                      <span>Comprar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Ver Más: Catálogo completo de la subdivisión */}
      {showAllModal && (
        <div
          id={`modal-ver-mas-${category.id}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto border border-stone-200">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg border border-amber-200">
                  <i className={category.icon}></i>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-stone-900">
                    Catálogo Completo: {category.name}
                  </h3>
                  <p className="text-xs text-stone-500 font-light">
                    Mostrando todos los {category.products.length} productos del catálogo.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Grid con todos los productos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {category.products.map((product) => {
                const autoDiscount = product.discount || getDiscountPercentage(product.price, product.originalPrice);
                const hasDiscount = product.originalPrice && product.originalPrice > product.price;

                return (
                  <div
                    key={product.id}
                    className="bg-stone-50 border border-stone-200 hover:border-[#ffd129] rounded-2xl p-3.5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-36 bg-white rounded-xl mb-2.5 overflow-hidden relative border border-stone-100">
                        <img
                          src={product.image}
                          alt={product.name}
                          className={`w-full h-full object-cover ${product.inStock === false ? 'opacity-50 grayscale-40' : ''}`}
                          loading="lazy"
                        />
                        {autoDiscount && product.inStock !== false && (
                          <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-md animate-pulse">
                            {autoDiscount}
                          </span>
                        )}
                        {product.inStock === false && (
                          <span className="absolute top-2 left-2 bg-stone-900/90 text-red-400 border border-red-500/40 text-[9px] font-black px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1">
                            <i className="fa-solid fa-ban text-[8px]"></i> Sin stock
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block truncate">
                        {product.subcategory}
                      </span>
                      <h5 className="text-xs font-bold text-stone-900 mt-0.5 line-clamp-2 h-8 leading-snug break-words">
                        {product.name}
                      </h5>
                      <p className="text-[10px] text-stone-500 mt-1 line-clamp-2 font-light">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between gap-1.5 min-w-0">
                      <div className="min-w-0">
                        {hasDiscount && (
                          <span className="text-[10px] font-bold text-red-600 line-through decoration-red-600 decoration-2 block leading-tight">
                            {formatPrice(product.originalPrice!)}
                          </span>
                        )}
                        <span className="text-xs font-black text-stone-900 block truncate">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      {product.inStock === false ? (
                        <button
                          disabled
                          aria-label={`${product.name} sin stock`}
                          className="bg-stone-200 text-stone-500 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-not-allowed flex items-center gap-1 opacity-70 shrink-0"
                        >
                          <i className="fa-solid fa-ban text-[8px]"></i>
                          <span>Sin stock</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onAddToCart(product);
                          }}
                          className="bg-[#ffd129] text-[#141414] text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <i className="fa-solid fa-cart-plus text-[9px]"></i>
                          <span>Agregar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Modal */}
            <div className="mt-6 pt-4 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setShowAllModal(false)}
                className="bg-stone-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-stone-800 transition"
              >
                Cerrar Catálogo
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
