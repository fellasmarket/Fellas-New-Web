import React, { useState, useEffect } from 'react';

interface FloatingActionsProps {
  whatsappNumber?: string;
  storeName?: string;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  whatsappNumber = '+56958866754',
  storeName = "Fella's Market"
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial position
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleOpenWhatsApp = () => {
    const cleanNumber = (whatsappNumber || '+56958866754').replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `¡Hola ${storeName}! Me comunico desde la tienda online. Quisiera hacer una consulta o pedido.`
    );
    const url = `https://wa.me/${cleanNumber}?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside
      aria-label="Acciones rápidas flotantes"
      className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2.5 pointer-events-none"
    >
      {/* Botón 1: Atajo para Volver Arriba */}
      <div
        className={`transition-all duration-300 transform ${
          showScrollTop
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-75 pointer-events-none'
        }`}
      >
        <button
          id="btn-scroll-top"
          onClick={scrollToTop}
          className="group relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#141414] hover:bg-stone-900 text-[#ffd129] border border-stone-700 shadow-xl hover:shadow-2xl transition duration-200 cursor-pointer hover:scale-105 active:scale-95"
          title="Volver al inicio de la página"
          aria-label="Volver arriba"
        >
          <i className="fa-solid fa-arrow-up text-base sm:text-lg group-hover:-translate-y-0.5 transition-transform duration-200"></i>
          
          {/* Tooltip flotante a la izquierda */}
          <span className="absolute right-full mr-3 px-2.5 py-1 bg-stone-900 text-stone-200 text-[11px] font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-stone-700">
            Volver arriba
          </span>
        </button>
      </div>

      {/* Botón 2: Contacto a WhatsApp */}
      <div className="pointer-events-auto">
        <button
          id="btn-whatsapp-floating"
          onClick={handleOpenWhatsApp}
          className="group relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-[0_8px_25px_rgba(37,211,102,0.45)] hover:shadow-[0_10px_30px_rgba(37,211,102,0.6)] transition duration-300 cursor-pointer hover:scale-108 active:scale-95"
          title="Chatear por WhatsApp con el negocio"
          aria-label="Contacto directo por WhatsApp"
        >
          {/* Anillo de pulso animado */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-300 border-2 border-[#141414]"></span>
          </span>

          <i className="fa-brands fa-whatsapp text-2xl sm:text-3xl drop-shadow-sm group-hover:rotate-6 transition-transform duration-200"></i>

          {/* Tooltip flotante a la izquierda */}
          <span className="absolute right-full mr-3.5 px-3 py-1.5 bg-[#141414]/95 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none border border-stone-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
            <span>¡Pedir por WhatsApp!</span>
          </span>
        </button>
      </div>
    </aside>
  );
};
