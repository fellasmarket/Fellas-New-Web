import React from 'react';
import { StoreSettings, CategoryData } from '../types';
import { Emoji3D } from './Emoji3D';

interface FooterProps {
  settings: StoreSettings;
  categories: CategoryData[];
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  return (
    <footer className="bg-[#141414] text-white border-t border-stone-800 mt-1 sm:mt-1.5 pt-3 sm:pt-8 pb-3 sm:pb-6 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 gap-3 sm:gap-12 mb-3 sm:mb-8">
        {/* Columna 1: Info Marca */}
        <div className="col-span-1 max-w-md">
          <a href="#" className="inline-block mb-1 sm:mb-3">
            {settings.logoImage ? (
              <img
                src={settings.logoImage}
                alt={settings.logoTextPrimary || 'Logo'}
                className="h-5 sm:h-9 max-w-full object-contain"
              />
            ) : (
              <span className="text-sm sm:text-2xl font-extrabold tracking-wider text-white">
                {settings.logoTextPrimary}<span className="text-[#ffd129]">{settings.logoTextAccent}</span>
              </span>
            )}
          </a>
          <p className="text-[10px] sm:text-sm text-stone-400 font-light leading-tight sm:leading-relaxed mb-2 sm:mb-4 line-clamp-3 sm:line-clamp-none">
            {settings.footerAbout}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-stone-400">
            {settings.socialInstagram && (
              <a href={settings.socialInstagram} target="_blank" rel="noreferrer" className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-stone-800 hover:bg-[#ffd129] hover:text-[#141414] flex items-center justify-center transition text-[11px] sm:text-sm" aria-label="Instagram">
                <i className="fa-brands fa-instagram"></i>
              </a>
            )}
            {settings.socialTwitter && (
              <a href={settings.socialTwitter} target="_blank" rel="noreferrer" className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-stone-800 hover:bg-[#ffd129] hover:text-[#141414] flex items-center justify-center transition text-[11px] sm:text-sm" aria-label="Twitter">
                <i className="fa-brands fa-x-twitter"></i>
              </a>
            )}
            {settings.socialFacebook && (
              <a href={settings.socialFacebook} target="_blank" rel="noreferrer" className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-stone-800 hover:bg-[#ffd129] hover:text-[#141414] flex items-center justify-center transition text-[11px] sm:text-sm" aria-label="Facebook">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
            )}
            {settings.socialWhatsapp && (
              <a href={`https://wa.me/${settings.socialWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-stone-800 hover:bg-green-500 hover:text-white flex items-center justify-center transition text-[11px] sm:text-sm" aria-label="WhatsApp">
                <i className="fa-brands fa-whatsapp"></i>
              </a>
            )}
          </div>
        </div>

        {/* Columna 2: Contacto & Casa Matriz */}
        <div className="col-span-1 md:justify-self-end max-w-md w-full">
          <h4 className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-[#ffd129] mb-1.5 sm:mb-4">
            Contacto
          </h4>
          <ul className="space-y-1.5 sm:space-y-2.5 text-[10px] sm:text-sm text-stone-400">
            <li className="flex items-start sm:items-center gap-1.5 sm:gap-2">
              <Emoji3D name="pin" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" alt="Ubicación" />
              <span className="line-clamp-2 sm:line-clamp-none leading-tight sm:leading-normal" title={settings.contactAddress}>{settings.contactAddress}</span>
            </li>
            <li className="flex items-center gap-1.5 sm:gap-2">
              <Emoji3D name="phone" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" alt="Teléfono" />
              <span className="truncate">{settings.contactPhone}</span>
            </li>
            <li className="flex items-center gap-1.5 sm:gap-2">
              <Emoji3D name="mail" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" alt="Correo" />
              <span className="truncate">{settings.contactEmail}</span>
            </li>
            <li className="flex items-center gap-1.5 sm:gap-2">
              <Emoji3D name="clock" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" alt="Horario" />
              <span className="truncate">{settings.contactHours || '12:00 - 03:00 hrs'}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-stone-800/80 pt-3 sm:pt-5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-stone-500 text-[9px] sm:text-xs">
        <p className="text-center sm:text-left">© 2026 {settings.logoTextPrimary}{settings.logoTextAccent}. Mayor 18 años.</p>
        <div className="flex items-center gap-1.5 text-stone-400 shrink-0">
          <span className="text-stone-500 font-medium">Desarrollado por</span>
          {settings.agencyLogoImage ? (
            settings.agencyLink ? (
              <a
                href={settings.agencyLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center bg-stone-900/90 hover:bg-stone-800 hover:border-[#ffd129]/50 transition px-2 sm:px-2.5 py-1 rounded-lg border border-stone-800 shadow-sm"
                title={settings.agencyName || 'Muller Ads and Design'}
              >
                <img
                  src={settings.agencyLogoImage}
                  alt={settings.agencyName || 'Muller Ads and Design'}
                  className="h-4 sm:h-5 max-w-[110px] sm:max-w-[140px] object-contain"
                />
              </a>
            ) : (
              <span className="inline-flex items-center bg-stone-900/90 px-2 sm:px-2.5 py-1 rounded-lg border border-stone-800 shadow-sm">
                <img
                  src={settings.agencyLogoImage}
                  alt={settings.agencyName || 'Muller Ads and Design'}
                  className="h-4 sm:h-5 max-w-[110px] sm:max-w-[140px] object-contain"
                />
              </span>
            )
          ) : (
            settings.agencyLink ? (
              <a
                href={settings.agencyLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-stone-200 bg-stone-900/90 hover:border-[#ffd129]/50 transition px-2.5 py-1 rounded-lg border border-stone-800 tracking-wide text-[10px] sm:text-xs shadow-sm"
              >
                <Emoji3D name="sparkles" className="w-3 h-3" alt="Agencia" />
                <span>{settings.agencyName || 'Muller Ads and Design'}</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold text-stone-200 bg-stone-900/90 hover:border-[#ffd129]/50 transition px-2.5 py-1 rounded-lg border border-stone-800 tracking-wide text-[10px] sm:text-xs shadow-sm">
                <Emoji3D name="sparkles" className="w-3 h-3" alt="Agencia" />
                <span>{settings.agencyName || 'Muller Ads and Design'}</span>
              </span>
            )
          )}
        </div>
      </div>
    </footer>
  );
};
