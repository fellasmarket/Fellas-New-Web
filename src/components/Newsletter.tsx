import React, { useState } from 'react';
import { Emoji3D } from './Emoji3D';

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
    <section className="max-w-7xl mx-auto mt-1 sm:mt-2.5 px-1 sm:px-0">
      <div className="bg-[#141414] border border-stone-800 rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-lg text-white">
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2 max-w-xl mx-auto">
          {/* Emoji 3D de buzón de correo / ofertas */}
          <div className="shrink-0 flex items-center justify-center">
            <Emoji3D name="mailbox" className="w-5 h-5 sm:w-6 sm:h-6" alt="Buzón de ofertas" />
          </div>

          <div className="relative flex-1 min-w-0">
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu correo para ofertas..."
              className="w-full bg-stone-900 text-white text-[11px] sm:text-xs rounded-lg px-3 py-1.5 sm:py-2 border border-stone-700 outline-none focus:border-[#ffd129] transition placeholder-stone-500"
            />
          </div>
          <button
            id="newsletter-submit-btn"
            type="submit"
            className="bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-extrabold text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition shrink-0 flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
          >
            <span>Suscribirse</span>
            <Emoji3D name="rocket" className="w-3.5 h-3.5 sm:w-4 sm:h-4" alt="Enviar" />
          </button>
        </form>
      </div>
    </section>
  );
};
