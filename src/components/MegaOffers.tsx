import React from 'react';
import { Product } from '../types';
import { MEGA_OFFERS, formatPrice, getDiscountPercentage } from '../data/products';
import fireworksSolidBg from '../assets/images/fireworks_blue_solid_1789491291395.jpg';
import { Emoji3D } from './Emoji3D';

interface MegaOffersProps {
  onAddToCart: (product: Product) => void;
  megaOffers?: Product[];
  settings?: import('../types').StoreSettings;
  isVisualEditMode?: boolean;
  onQuickEditProduct?: (product: Product) => void;
  onQuickEditSection?: () => void;
}

export const MegaOffers: React.FC<MegaOffersProps> = ({
  onAddToCart,
  megaOffers,
  settings,
  isVisualEditMode = false,
  onQuickEditProduct,
  onQuickEditSection
}) => {
  const offersToDisplay = (megaOffers && megaOffers.length > 0) ? megaOffers : MEGA_OFFERS;
  const config = settings?.megaOffersConfig;
  const sectionTitle = config?.sectionTitle || '¡LAS PROMOS DEL TIO FELLAS!';
  const sectionSubtitle = config?.sectionSubtitle;
  const badgeText = config?.badgeText;
  const bgImg = config?.bgImage || fireworksSolidBg;

  return (
    <section className="max-w-7xl mx-auto mt-2.5 sm:mt-6 px-1 sm:px-0 relative">
      <div
        className={`relative overflow-hidden rounded-xl sm:rounded-3xl p-2 sm:p-6 shadow-xl sm:shadow-2xl text-white bg-[#141414] ${
          isVisualEditMode ? 'ring-2 ring-red-400 ring-dashed' : ''
        }`}
      >
        {/* Imagen de fondo */}
        <img
          src={bgImg}
          alt="Fondo promociones"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-100"
        />

        {/* Capa de degradado */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/80 pointer-events-none z-[1]" />

        {/* Contenido en primer plano */}
        <div className="relative z-10">
          {/* Encabezado Banner Mega Oferta */}
          <div className="flex flex-row items-center justify-between gap-1.5 mb-1.5 sm:mb-5 pb-1 sm:pb-3 border-b border-white/20">
            <div className="flex items-center gap-1 sm:gap-2.5 min-w-0">
              <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-[#ffd129] flex items-center justify-center shadow-md shrink-0 select-none">
                <Emoji3D name="fire" className="w-3.5 h-3.5 sm:w-5 sm:h-5" alt="Mega Oferta" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[11px] sm:text-base md:text-lg font-black text-white drop-shadow tracking-wide truncate">
                  {sectionTitle}
                </h3>
                {sectionSubtitle && (
                  <p className="text-[9px] sm:text-xs text-blue-100 font-medium truncate hidden sm:block">
                    {sectionSubtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isVisualEditMode && (
                <button
                  type="button"
                  onClick={() => onQuickEditSection && onQuickEditSection()}
                  className="px-1.5 sm:px-3 py-0.5 sm:py-1 bg-red-600 hover:bg-red-500 text-white text-[8px] sm:text-[11px] font-black rounded sm:rounded-xl shadow-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <Emoji3D name="pen" className="w-3 h-3" alt="Editar" />
                  <span className="hidden xs:inline">Editar Fondo</span>
                </button>
              )}

              {badgeText && (
                <span className="px-1.5 sm:px-3 py-0.5 sm:py-1 bg-[#ffd129] text-[#141414] text-[8px] sm:text-[11px] font-black rounded-full uppercase tracking-wider shadow">
                  {badgeText}
                </span>
              )}
            </div>
          </div>

          {/* Espacio para productos: 2 columnas compactas en móvil */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-4 md:gap-5">
            {offersToDisplay.map((offer) => {
              const autoDiscount = offer.discount || getDiscountPercentage(offer.price, offer.originalPrice);
              const hasDiscount = offer.originalPrice && offer.originalPrice > offer.price;

              return (
                <div
                  key={offer.id}
                  className={`bg-[#121214]/90 rounded-lg sm:rounded-2xl p-1.5 sm:p-3.5 md:p-4 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3.5 md:gap-4 group transition-all duration-300 shadow-lg border border-stone-800 hover:border-[#ffd129] text-white min-w-0 relative ${
                    isVisualEditMode ? 'cursor-pointer ring-2 ring-amber-400 ring-dashed hover:shadow-2xl' : ''
                  }`}
                  onClick={() => {
                    if (isVisualEditMode && onQuickEditProduct) {
                      onQuickEditProduct(offer);
                    }
                  }}
                >
                  {/* Capa de fondo desenfocado de la misma foto del producto */}
                  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-lg sm:rounded-2xl">
                    <img 
                      src={offer.image} 
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
                        if (onQuickEditProduct) onQuickEditProduct(offer);
                      }}
                      className="absolute top-1 right-1 z-20 bg-stone-900 hover:bg-stone-800 text-[#ffd129] text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5 border border-stone-700 cursor-pointer"
                    >
                      <Emoji3D name="pen" className="w-3 h-3" alt="Editar" /> <span className="hidden xs:inline">Editar</span>
                    </button>
                  )}

                  <div className="relative z-10 aspect-square w-full sm:w-28 md:w-36 rounded-md sm:rounded-xl overflow-hidden bg-stone-900 shrink-0 border border-stone-800 flex items-center justify-center p-0.5 sm:p-2.5">
                    <img
                      src={offer.image}
                      alt={offer.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-md sm:rounded-xl ${offer.inStock === false ? 'opacity-50 grayscale-40' : ''}`}
                    />
                    {autoDiscount && offer.inStock !== false && (
                      <span className="absolute top-0.5 left-0.5 sm:top-2 sm:left-2 bg-red-600 text-white text-[7px] sm:text-[10px] font-extrabold px-1 sm:px-2 py-0.2 rounded shadow-md animate-pulse">
                        {autoDiscount}
                      </span>
                    )}
                    {offer.inStock === false && (
                      <span className="absolute top-0.5 left-0.5 sm:top-2 sm:left-2 bg-stone-900/90 text-red-400 border border-red-500/40 text-[7px] sm:text-[9px] font-black px-1 py-0.2 rounded shadow uppercase tracking-wider flex items-center gap-0.5">
                        <Emoji3D name="prohibited" className="w-3 h-3" alt="Sin stock" /> Sin stock
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between w-full h-full min-w-0 relative z-10">
                    <div>
                      <span className="block text-[7px] sm:text-[10px] text-[#ffd129]/90 font-extrabold uppercase tracking-wider leading-none truncate">
                        {offer.subcategory}
                      </span>
                      <h4 className="text-[10px] sm:text-sm md:text-base font-black text-stone-100 mt-0.5 leading-tight line-clamp-1 sm:line-clamp-2 break-words group-hover:text-[#ffd129] transition">
                        {offer.name}
                      </h4>
                    </div>
                    <div className="mt-1 sm:mt-3 pt-1 sm:pt-3 border-t border-stone-800/80 flex items-center justify-between gap-1 sm:gap-2">
                      <div className="min-w-0">
                        {hasDiscount && (
                          <span className="block text-[8px] sm:text-[11px] font-extrabold text-red-500 line-through decoration-red-500 decoration-2 leading-tight">
                            {formatPrice(offer.originalPrice!)}
                          </span>
                        )}
                        <span className="text-[11px] sm:text-base font-black text-white block truncate">
                          {formatPrice(offer.price)}
                        </span>
                      </div>
                      {offer.inStock === false ? (
                        <button
                          disabled
                          aria-label={`${offer.name} sin stock`}
                          className="bg-stone-850 text-stone-500 text-[9px] sm:text-xs font-black px-1.5 sm:px-4 py-0.5 sm:py-2 rounded sm:rounded-xl cursor-not-allowed flex items-center gap-0.5 opacity-70 shrink-0"
                        >
                          <Emoji3D name="prohibited" className="w-3 h-3" alt="Agotado" /> <span className="hidden xs:inline">Agotado</span>
                        </button>
                      ) : (
                        <button
                          id={`buy-mega-${offer.id}`}
                          onClick={(e) => {
                            if (!isVisualEditMode) {
                              onAddToCart(offer);
                            }
                          }}
                          className="bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-black text-[9px] sm:text-xs px-2 sm:px-4 py-0.5 sm:py-2 rounded sm:rounded-xl transition flex items-center gap-1 shadow active:scale-95 cursor-pointer shrink-0"
                        >
                          <Emoji3D name="cart" className="w-3.5 h-3.5" alt="Comprar" /> <span>Comprar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
