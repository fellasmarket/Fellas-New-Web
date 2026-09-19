import React from 'react';
import { StoreSettings, CategoryData } from '../types';

interface FooterProps {
  settings: StoreSettings;
  categories: CategoryData[];
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  return (
    <footer className="bg-[#141414] text-white border-t border-stone-800 mt-1 sm:mt-1.5 pt-4 sm:pt-8 pb-4 sm:pb-6 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12 mb-4 sm:mb-8">
        {/* Columna 1: Info Marca */}
        <div className="max-w-md">
          <a href="#" className="inline-block mb-1.5 sm:mb-3">
            {settings.logoImage ? (
              <img
                src={settings.logoImage}
                alt={settings.logoTextPrimary || 'Logo'}
                className="h-6 sm:h-9 max-w-full object-contain"
              />
            ) : (
              <span className="text-base sm:text-2xl font-extrabold tracking-wider text-white">
                {settings.logoTextPrimary}<span className="text-[#ffd129]">{settings.logoTextAccent}</span>
              </span>
            )}
          </a>
          <p className="text-xs sm:text-sm text-stone-400 font-light leading-snug sm:leading-relaxed mb-3 sm:mb-4">
            {settings.footerAbout}
          </p>
          <div className="flex items-center gap-2 sm:gap-3 text-stone-400">
            {settings.socialInstagram && (
              <a href={settings.socialInstagram} target="_blank" rel="noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-800 hover:bg-[#ffd129] hover:text-[#141414] flex items-center justify-center transition text-xs sm:text-sm" aria-label="Instagram">
                <i className="fa-brands fa-instagram"></i>
              </a>
            )}
            {settings.socialTwitter && (
              <a href={settings.socialTwitter} target="_blank" rel="noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-800 hover:bg-[#ffd129] hover:text-[#141414] flex items-center justify-center transition text-xs sm:text-sm" aria-label="Twitter">
                <i className="fa-brands fa-x-twitter"></i>
              </a>
            )}
            {settings.socialFacebook && (
              <a href={settings.socialFacebook} target="_blank" rel="noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-800 hover:bg-[#ffd129] hover:text-[#141414] flex items-center justify-center transition text-xs sm:text-sm" aria-label="Facebook">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
            )}
            {settings.socialWhatsapp && (
              <a href={`https://wa.me/${settings.socialWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-800 hover:bg-green-500 hover:text-white flex items-center justify-center transition text-xs sm:text-sm" aria-label="WhatsApp">
                <i className="fa-brands fa-whatsapp"></i>
              </a>
            )}
          </div>
        </div>

        {/* Columna 2: Contacto & Casa Matriz */}
        <div className="md:justify-self-end max-w-md w-full">
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#ffd129] mb-2 sm:mb-4">
            Contacto
          </h4>
          <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-stone-400">
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-location-dot text-[#ffd129] text-xs sm:text-sm shrink-0"></i>
              <span title={settings.contactAddress}>{settings.contactAddress}</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-phone text-[#ffd129] text-xs sm:text-sm shrink-0"></i>
              <span>{settings.contactPhone}</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-envelope text-[#ffd129] text-xs sm:text-sm shrink-0"></i>
              <span>{settings.contactEmail}</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-clock text-[#ffd129] text-xs sm:text-sm shrink-0"></i>
              <span>{settings.contactHours || '12:00 - 03:00 hrs'}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-stone-800/80 pt-3 sm:pt-5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-stone-500 text-[9px] sm:text-xs">
        <p className="text-center sm:text-left">© 2026 {settings.logoTextPrimary}{settings.logoTextAccent}. Mayor 18 años.</p>
        <div className="flex items-center gap-1.5 text-stone-400 shrink-0">
          <span className="text-stone-500 font-medium">Desarrollado por</span>
          <span className="inline-flex items-center gap-1.5 font-bold text-stone-200 bg-stone-900/90 hover:border-[#ffd129]/50 transition px-2.5 py-1 rounded-lg border border-stone-800 tracking-wide text-[10px] sm:text-xs shadow-sm">
            <i className="fa-solid fa-wand-magic-sparkles text-[#ffd129] text-[10px]"></i>
            <span>Muller Ads and Design</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
