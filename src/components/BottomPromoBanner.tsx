import React from 'react';
import { StoreSettings } from '../types';

interface BottomPromoBannerProps {
  settings: StoreSettings;
  onOpenWhatsApp?: () => void;
  onExploreProducts?: () => void;
}

const DEFAULT_BANNER_IMAGE =
  'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=1600&auto=format&fit=crop';

export const BottomPromoBanner: React.FC<BottomPromoBannerProps> = ({
  settings,
  onOpenWhatsApp,
  onExploreProducts
}) => {
  if (settings.showBottomBanner === false) {
    return null;
  }

  const bannerImage = settings.bottomBannerImage?.trim() || DEFAULT_BANNER_IMAGE;
  const bannerLink = settings.bottomBannerLink?.trim() || '';

  const handleClick = (e: React.MouseEvent) => {
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
      className="max-w-7xl mx-auto my-6 sm:my-8 px-2 sm:px-4 md:px-0"
      aria-label="Banner promocional"
    >
      <div className="w-full relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-[#121214] group">
        <a
          href={bannerLink || '#'}
          onClick={handleClick}
          className="block relative w-full h-24 sm:h-32 md:h-40 overflow-hidden cursor-pointer"
        >
          <img
            src={bannerImage}
            alt={settings.storeName ? `${settings.storeName} Banner` : 'Banner Promocional'}
            className="w-full h-full object-cover object-center transform group-hover:scale-102 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          {/* Sutil overlay brillante en hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-white/5 transition-colors duration-300 pointer-events-none"></div>
        </a>
      </div>
    </section>
  );
};

