import React from 'react';
import { StoreSettings } from '../types';

interface BottomPromoBannerProps {
  settings: StoreSettings;
  isVisualEditMode?: boolean;
  onQuickEdit?: () => void;
  onOpenWhatsApp?: () => void;
  onExploreProducts?: () => void;
}

const DEFAULT_BANNER_IMAGE =
  'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=1600&auto=format&fit=crop';

export const BottomPromoBanner: React.FC<BottomPromoBannerProps> = ({
  settings,
  isVisualEditMode = false,
  onQuickEdit,
  onOpenWhatsApp,
  onExploreProducts
}) => {
  if (settings.showBottomBanner === false) {
    return null;
  }

  const bannerImage = settings.bottomBannerImage?.trim() || DEFAULT_BANNER_IMAGE;
  const bannerLink = settings.bottomBannerLink?.trim() || '';

  const handleClick = (e: React.MouseEvent) => {
    if (isVisualEditMode && onQuickEdit) {
      e.preventDefault();
      onQuickEdit();
      return;
    }

    if (!bannerLink) {
      if (onExploreProducts) {
        e.preventDefault();
        onExploreProducts();
      }
      return;
    }

    if (bannerLink.startsWith('#')) {
      e.preventDefault();
      const targetEl = document.querySelector(bannerLink);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      } else if (onExploreProducts) {
        onExploreProducts();
      }
    } else if (bannerLink.startsWith('http') || bannerLink.startsWith('https') || bannerLink.startsWith('wa.me')) {
      // standard link
    }
  };

  return (
    <section
      id="bottom-promo-banner"
      className="max-w-7xl mx-auto mt-6 sm:mt-8 mb-2 sm:mb-3 px-2 sm:px-4 md:px-0 relative"
      aria-label="Banner promocional"
    >
      <div
        className={`w-full relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-[#121214] group ${
          isVisualEditMode ? 'ring-2 ring-[#ffd025] ring-dashed' : ''
        }`}
      >
        {isVisualEditMode && (
          <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onQuickEdit) onQuickEdit();
              }}
              className="bg-[#ffd025] hover:bg-yellow-400 text-stone-950 text-xs font-black px-3 py-1 rounded-lg shadow-xl flex items-center gap-1.5 transition uppercase tracking-wider cursor-pointer"
            >
              <i className="fa-solid fa-pen-to-square"></i>
              <span>Editar Banner Promo</span>
            </button>
          </div>
        )}

        <a
          href={bannerLink || '#'}
          onClick={handleClick}
          className="block relative w-full h-24 sm:h-32 md:h-40 overflow-hidden cursor-pointer"
        >
          <img
            src={bannerImage}
            alt="Promoción Especial Botillería Fellas"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 group-hover:opacity-60 transition-opacity"></div>
        </a>
      </div>
    </section>
  );
};
