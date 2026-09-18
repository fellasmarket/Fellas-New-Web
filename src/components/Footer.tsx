import React from 'react';
import { StoreSettings, CategoryData } from '../types';

interface FooterProps {
  settings: StoreSettings;
  categories: CategoryData[];
}

export const Footer: React.FC<FooterProps> = ({ settings, categories }) => {
  return (
    <footer className="bg-[#141414] text-white border-t border-stone-800 mt-20 pt-12 pb-8 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Columna 1: Info Marca */}
        <div>
          <a href="#" className="text-2xl font-extrabold tracking-wider text-white inline-block mb-3">
            {settings.logoTextPrimary}<span className="text-[#ffd129]">{settings.logoTextAccent}</span>
          </a>
          <p className="text-xs text-stone-400 font-light leading-relaxed mb-4">
            {settings.footerAbout}
          </p>
          <div className="flex items-center gap-3 text-stone-400">
            {settings.socialInstagram && (
              <a href={settings.socialInstagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-[#ffd129] hover:text-[#141414] flex items-center justify-center transition text-sm">
                <i className="fa-brands fa-instagram"></i>
              </a>
            )}
            {settings.socialTwitter && (
              <a href={settings.socialTwitter} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-[#ffd129] hover:text-[#141414] flex items-center justify-center transition text-sm">
                <i className="fa-brands fa-x-twitter"></i>
              </a>
            )}
            {settings.socialFacebook && (
              <a href={settings.socialFacebook} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-[#ffd129] hover:text-[#141414] flex items-center justify-center transition text-sm">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
            )}
            {settings.socialWhatsapp && (
              <a href={`https://wa.me/${settings.socialWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-green-500 hover:text-white flex items-center justify-center transition text-sm">
                <i className="fa-brands fa-whatsapp"></i>
              </a>
            )}
          </div>
        </div>

        {/* Columna 2: Categorías Dinámicas */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#ffd129] mb-4">
            Pasillos & Licores
          </h4>
          <ul className="space-y-2.5 text-xs text-stone-400">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <a href={`#${cat.id}`} className="hover:text-white transition flex items-center gap-2">
                  <i className={`${cat.icon} text-[10px] text-[#ffd129]`}></i>
                  <span>{cat.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 3: Cobertura de Delivery */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#ffd129] mb-4">
            Despacho Express
          </h4>
          <p className="text-[11px] text-stone-400 mb-2">Entregas en menos de 45 minutos en:</p>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-stone-300">
            {settings.deliveryZones.map((zone) => (
              <span key={zone} className="bg-stone-800/90 px-2 py-0.5 rounded-md border border-stone-700/60">
                {zone}
              </span>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-stone-800/80 text-[11px] text-green-400 flex items-center gap-1.5 font-semibold">
            <i className="fa-solid fa-bolt"></i> Envío gratis sobre $50.000
          </div>
        </div>

        {/* Columna 4: Contacto */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#ffd129] mb-4">
            Contacto & Casa Matriz
          </h4>
          <ul className="space-y-2.5 text-xs text-stone-400">
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-location-dot text-[#ffd129]"></i>
              <span>{settings.contactAddress}</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-phone text-[#ffd129]"></i>
              <span>{settings.contactPhone}</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-envelope text-[#ffd129]"></i>
              <span>{settings.contactEmail}</span>
            </li>
            <li className="flex items-center gap-2">
              <i className="fa-solid fa-clock text-[#ffd129]"></i>
              <span>Horario Botillería: Lun a Dom 12:00 - 03:00 hrs</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-stone-800/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-stone-500 text-[11px]">
        <p>© 2026 {settings.logoTextPrimary}{settings.logoTextAccent}. Todos los derechos reservados. Venta exclusiva para mayores de 18 años.</p>
        <div className="flex items-center gap-4 text-stone-400 text-base">
          <i className="fa-brands fa-cc-visa" title="Visa"></i>
          <i className="fa-brands fa-cc-mastercard" title="Mastercard"></i>
          <i className="fa-solid fa-credit-card" title="Webpay Plus"></i>
          <i className="fa-solid fa-shield-halved text-[#ffd129]" title="Pago Seguro SSL"></i>
        </div>
      </div>
    </footer>
  );
};
