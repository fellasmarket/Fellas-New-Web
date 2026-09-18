import React from 'react';
import { Product } from '../types';
import { MEGA_OFFERS, formatPrice, getDiscountPercentage } from '../data/products';
import fireworksSolidBg from '../assets/images/fireworks_blue_solid_1789491291395.jpg';

interface MegaOffersProps {
  onAddToCart: (product: Product) => void;
  megaOffers?: Product[];
  settings?: import('../types').StoreSettings;
}

export const MegaOffers: React.FC<MegaOffersProps> = ({ onAddToCart, megaOffers, settings }) => {
  const offersToDisplay = (megaOffers && megaOffers.length > 0) ? megaOffers : MEGA_OFFERS;
  const config = settings?.megaOffersConfig;
  const sectionTitle = config?.sectionTitle || '¡LAS PROMOS DEL TIO FELLAS!';
  const sectionSubtitle = config?.sectionSubtitle;
  const badgeText = config?.badgeText;
  const bgImg = config?.bgImage || fireworksSolidBg;

  return (
    <section className="max-w-7xl mx-auto mt-6 px-1 sm:px-0">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl text-white bg-[#002b7f]">
        {/* Imagen de fondo */}
        <img
          src={bgImg}
          alt="Fondo promociones"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-screen"
        />

        {/* Destellos vectoriales adicionales de fuegos artificiales rojos y blancos (sin ciudades ni edificios) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="white-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="red-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff2233" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#e11d48" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Fuego artificial 1 (Rojo principal - arriba a la derecha) */}
          <g transform="translate(750, 45)">
            <circle cx="0" cy="0" r="16" fill="url(#red-glow)" />
            <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x1 = Math.cos(rad) * 6;
              const y1 = Math.sin(rad) * 6;
              const x2 = Math.cos(rad) * (i % 2 === 0 ? 28 : 20);
              const y2 = Math.sin(rad) * (i % 2 === 0 ? 28 : 20);
              const dotX = Math.cos(rad) * (i % 2 === 0 ? 33 : 24);
              const dotY = Math.sin(rad) * (i % 2 === 0 ? 33 : 24);
              return (
                <g key={deg}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={i % 2 === 0 ? '#ff3b47' : '#ffffff'}
                    strokeWidth={i % 2 === 0 ? '1.8' : '1.2'}
                    strokeLinecap="round"
                    strokeOpacity="0.85"
                  />
                  <circle
                    cx={dotX}
                    cy={dotY}
                    r={i % 2 === 0 ? 2 : 1.5}
                    fill={i % 2 === 0 ? '#ffffff' : '#ff4d5a'}
                  />
                </g>
              );
            })}
          </g>

          {/* Fuego artificial 2 (Blanco brillante - arriba al centro/izquierda) */}
          <g transform="translate(240, 35)">
            <circle cx="0" cy="0" r="14" fill="url(#white-glow)" />
            <circle cx="0" cy="0" r="3" fill="#ffffff" />
            {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const len = i % 2 === 0 ? 24 : 16;
              const x1 = Math.cos(rad) * 5;
              const y1 = Math.sin(rad) * 5;
              const x2 = Math.cos(rad) * len;
              const y2 = Math.sin(rad) * len;
              return (
                <g key={deg}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#ffffff"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeOpacity="0.9"
                  />
                  <circle
                    cx={Math.cos(rad) * (len + 4)}
                    cy={Math.sin(rad) * (len + 4)}
                    r="1.5"
                    fill={i % 3 === 0 ? '#ff4d5a' : '#ffffff'}
                  />
                </g>
              );
            })}
          </g>

          {/* Fuego artificial 3 (Rojo y blanco - abajo izquierda) */}
          <g transform="translate(110, 140)">
            <circle cx="0" cy="0" r="12" fill="url(#red-glow)" />
            <circle cx="0" cy="0" r="2" fill="#ffffff" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <line
                  key={deg}
                  x1={Math.cos(rad) * 4}
                  y1={Math.sin(rad) * 4}
                  x2={Math.cos(rad) * 18}
                  y2={Math.sin(rad) * 18}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeOpacity="0.8"
                />
              );
            })}
          </g>

          {/* Fuego artificial 4 (Rojo chispeante - derecha centro) */}
          <g transform="translate(980, 120)">
            <circle cx="0" cy="0" r="15" fill="url(#red-glow)" />
            <circle cx="0" cy="0" r="2.5" fill="#ff4d5a" />
            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const len = i % 2 === 0 ? 22 : 15;
              return (
                <g key={deg}>
                  <line
                    x1={Math.cos(rad) * 4}
                    y1={Math.sin(rad) * 4}
                    x2={Math.cos(rad) * len}
                    y2={Math.sin(rad) * len}
                    stroke={i % 2 === 0 ? '#ff2a3a' : '#ffffff'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle
                    cx={Math.cos(rad) * (len + 3)}
                    cy={Math.sin(rad) * (len + 3)}
                    r="1.2"
                    fill="#ffffff"
                  />
                </g>
              );
            })}
          </g>

          {/* Chispitas dispersas rojas y blancas */}
          <circle cx="480" cy="25" r="1.8" fill="#ffffff" opacity="0.9" />
          <circle cx="520" cy="40" r="1.5" fill="#ff3b47" opacity="0.85" />
          <circle cx="640" cy="30" r="2" fill="#ffffff" opacity="0.9" />
          <circle cx="410" cy="55" r="1.5" fill="#ffffff" opacity="0.8" />
          <circle cx="890" cy="35" r="2" fill="#ff3b47" opacity="0.8" />
          <circle cx="60" cy="65" r="1.8" fill="#ffffff" opacity="0.8" />
          <circle cx="1060" cy="60" r="1.5" fill="#ffffff" opacity="0.9" />
        </svg>

        {/* Capa de degradado azul semitransparente para máxima distinción de textos */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#001742]/85 via-[#002b7f]/70 to-[#001742]/85 pointer-events-none z-[1]" />

        {/* Contenido en primer plano */}
        <div className="relative z-10">
          {/* Encabezado Banner Mega Oferta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-white/25">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#ffd129] text-red-600 flex items-center justify-center text-sm shadow-md shrink-0">
                <i className="fa-solid fa-bolt text-red-600"></i>
              </div>
              <div>
                <h3 className="text-base md:text-lg font-black text-white drop-shadow tracking-wide">
                  {sectionTitle}
                </h3>
                {sectionSubtitle && (
                  <p className="text-xs text-blue-100 font-medium">
                    {sectionSubtitle}
                  </p>
                )}
              </div>
            </div>
            {badgeText && (
              <span className="self-start sm:self-center px-3 py-1 bg-[#ffd129] text-[#141414] text-[11px] font-black rounded-full uppercase tracking-wider shadow">
                {badgeText}
              </span>
            )}
          </div>

          {/* Espacio para productos en láminas blancas con textos #141414 y sin descripción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
              {offersToDisplay.map((offer) => {
                const autoDiscount = offer.discount || getDiscountPercentage(offer.price, offer.originalPrice);
                const hasDiscount = offer.originalPrice && offer.originalPrice > offer.price;

                return (
                  <div
                    key={offer.id}
                    className="bg-white rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 group transition-all duration-300 shadow-xl border border-white hover:border-[#ffd129] text-[#141414] min-w-0"
                  >
                    <div className="relative w-full sm:w-36 h-36 rounded-xl overflow-hidden bg-stone-50 shrink-0 border border-stone-200/70 flex items-center justify-center p-2.5">
                      <img
                        src={offer.image}
                        alt={offer.name}
                        referrerPolicy="no-referrer"
                        className={`max-w-full max-h-full w-auto h-auto object-contain aspect-auto group-hover:scale-105 transition-transform duration-300 ${offer.inStock === false ? 'opacity-50 grayscale-40' : ''}`}
                      />
                      {autoDiscount && offer.inStock !== false && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md animate-pulse">
                          {autoDiscount}
                        </span>
                      )}
                      {offer.inStock === false && (
                        <span className="absolute top-2 left-2 bg-stone-900/90 text-red-400 border border-red-500/40 text-[9px] font-black px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1">
                          <i className="fa-solid fa-ban text-[8px]"></i> Sin stock
                        </span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between w-full h-full min-w-0">
                      <div>
                        <span className="block text-[10px] text-stone-500 font-extrabold uppercase tracking-wider leading-none truncate">
                          {offer.subcategory}
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-[#141414] mt-1 leading-tight line-clamp-2 break-words group-hover:text-amber-600 transition">
                          {offer.name}
                        </h4>
                      </div>
                      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          {hasDiscount && (
                            <span className="block text-[11px] font-extrabold text-red-600 line-through decoration-red-600 decoration-2 leading-tight">
                              {formatPrice(offer.originalPrice!)}
                            </span>
                          )}
                          <span className="text-base font-black text-[#141414] block truncate">
                            {formatPrice(offer.price)}
                          </span>
                        </div>
                        {offer.inStock === false ? (
                          <button
                            disabled
                            aria-label={`${offer.name} sin stock`}
                            className="bg-stone-200 text-stone-500 text-xs font-black px-4 py-2 rounded-xl cursor-not-allowed flex items-center gap-1.5 opacity-70 shrink-0"
                          >
                            <i className="fa-solid fa-ban"></i> Sin stock
                          </button>
                        ) : (
                          <button
                            id={`buy-mega-${offer.id}`}
                            onClick={() => onAddToCart(offer)}
                            className="bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow active:scale-95 cursor-pointer shrink-0"
                          >
                            <i className="fa-solid fa-cart-plus"></i> Comprar
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
