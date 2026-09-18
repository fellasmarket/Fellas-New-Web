import React, { useState } from 'react';

interface NewsletterProps {
  onSubscribe: (email: string) => void;
}

export const Newsletter: React.FC<NewsletterProps> = ({ onSubscribe }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onSubscribe(email);
    setEmail('');
  };

  return (
    <section className="max-w-7xl mx-auto mt-4">
      <div className="bg-[#141414] border border-stone-800 rounded-2xl px-5 py-2 md:py-2.5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 text-white">
        
        {/* Textos alineados con icono compacto */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="w-7 h-7 rounded-lg bg-[#ffd129]/10 border border-[#ffd129]/30 text-[#ffd129] flex items-center justify-center text-xs shrink-0">
            <i className="fa-solid fa-envelope-open-text"></i>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h3 className="text-xs md:text-sm font-bold text-white whitespace-nowrap">
              ¡Suscríbete y recibe ofertas imperdibles!
            </h3>
            <p className="text-[11px] text-stone-400 font-light hidden sm:inline">
              Promociones exclusivas directo a tu email.
            </p>
          </div>
        </div>

        {/* Formulario de Suscripción Compacto */}
        <form onSubmit={handleSubmit} className="flex w-full md:w-auto gap-2 items-center">
          <div className="relative flex-1 md:w-64">
            <i className="fa-solid fa-at absolute left-3 top-2 text-stone-500 text-[11px]"></i>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu correo..."
              className="w-full bg-stone-900 text-white text-xs rounded-lg pl-8 pr-3 py-1.5 border border-stone-700 outline-none focus:border-[#ffd129] transition placeholder-stone-500"
            />
          </div>
          <button
            id="newsletter-submit-btn"
            type="submit"
            className="bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-bold text-xs px-4 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1.5 shadow"
          >
            <span>Suscribirse</span>
            <i className="fa-solid fa-paper-plane text-[9px]"></i>
          </button>
        </form>

      </div>
    </section>
  );
};
