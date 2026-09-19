import React from 'react';
import { StoreSettings } from '../types';

interface BottomDualBannersProps {
  settings: StoreSettings;
  isVisualEditMode?: boolean;
  onQuickEdit?: () => void;
  onExploreProducts?: () => void;
}

const DEFAULT_BANNER_1_IMAGE =
  'https://images.unsplash.com/photo-1608270190578-831e51b32d2e?q=80&w=800&auto=format&fit=crop';
const DEFAULT_BANNER_2_IMAGE =
  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop';

export const BottomDualBanners: React.FC<BottomDualBannersProps> = ({
  settings,
  isVisualEditMode = false,
  onQuickEdit,
  onExploreProducts
}) => {
  if (settings.showBottomDualBanners === false) {
    return null;
  }

  const banner1Img = settings.bottomDualBanner1Image?.trim() || DEFAULT_BANNER_1_IMAGE;
  const banner1Link = settings.bottomDualBanner1Link?.trim() || '';

  const banner2Img = settings.bottomDualBanner2Image?.trim() || DEFAULT_BANNER_2_IMAGE;
  const banner2Link = settings.bottomDualBanner2Link?.trim() || '';

  const handleClick = (e: React.MouseEvent, link: string) => {
    if (isVisualEditMode && onQuickEdit) {
      e.preventDefault();
      onQuickEdit();
      return;
    }

    if (!link) {
      if (onExploreProducts) {
        e.preventDefault();
        onExploreProducts();
      }
      return;
    }

    if (link.startsWith('#')) {
      e.preventDefault();
      const targetEl = document.querySelector(link);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      } else if (onExploreProducts) {
        onExploreProducts();
      }
    }
  };

  return (
    <section
      id="bottom-dual-banners"
      className="max-w-7xl mx-auto mt-1 sm:mt-3 mb-0 pb-0 px-2 sm:px-4 md:px-0 relative"
      aria-label="Banners promocionales adicionales"
    >
      {isVisualEditMode && (
        <div className="absolute top-0 right-3 z-30 flex items-center gap-2 -translate-y-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickEdit) onQuickEdit();
            }}
            className="bg-orange-500 hover:bg-orange-400 text-white text-xs font-black px-3 py-1 rounded-lg shadow-xl flex items-center gap-1.5 transition uppercase tracking-wider cursor-pointer"
          >
            <i className="fa-solid fa-pen-to-square"></i>
            <span>Editar 2 Banners Dobles</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-3.5">
        {/* Banner 1 (Solo imagen, sin marcos, sin textos ni botones) */}
        <div
          className={`w-full relative rounded-xl sm:rounded-3xl overflow-hidden bg-[#121214] shadow-md group ${
            isVisualEditMode ? 'ring-2 ring-orange-400 ring-dashed' : ''
          }`}
        >
          <a
            href={banner1Link || '#'}
            onClick={(e) => handleClick(e, banner1Link)}
            className="block relative w-full h-20 sm:h-32 md:h-44 overflow-hidden cursor-pointer"
          >
            <img
              src={banner1Img}
              alt="Promoción 1"
              className="w-full h-full object-cover object-center transform group-hover:scale-102 transition-transform duration-500 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-white/5 transition-colors duration-300 pointer-events-none"></div>
          </a>
        </div>

        {/* Banner 2 (Solo imagen, sin marcos, sin textos ni botones) */}
        <div
          className={`w-full relative rounded-xl sm:rounded-3xl overflow-hidden bg-[#121214] shadow-md group ${
            isVisualEditMode ? 'ring-2 ring-orange-400 ring-dashed' : ''
          }`}
        >
          <a
            href={banner2Link || '#'}
            onClick={(e) => handleClick(e, banner2Link)}
            className="block relative w-full h-20 sm:h-32 md:h-44 overflow-hidden cursor-pointer"
          >
            <img
              src={banner2Img}
              alt="Promoción 2"
              className="w-full h-full object-cover object-center transform group-hover:scale-102 transition-transform duration-500 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-white/5 transition-colors duration-300 pointer-events-none"></div>
          </a>
        </div>
      </div>
    </section>
  );
};
