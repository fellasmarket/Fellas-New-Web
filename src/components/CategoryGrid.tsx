import React from 'react';

interface CategoryCardItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  targetId: string;
}

const CATEGORY_ITEMS: CategoryCardItem[] = [
  {
    id: 'piscos',
    title: 'Piscos & Destilados',
    subtitle: 'Nacionales y Premiums',
    image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=600&auto=format&fit=crop',
    targetId: '#cat-destilados'
  },
  {
    id: 'cervezas',
    title: 'Cervezas Heladas',
    subtitle: 'Lagers, IPAs y Packs',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600&auto=format&fit=crop',
    targetId: '#cat-cervezas'
  },
  {
    id: 'vinos',
    title: 'Vinos & Tintos',
    subtitle: 'Reserva & Valles Chilenos',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=600&auto=format&fit=crop',
    targetId: '#cat-vinos'
  },
  {
    id: 'espumantes',
    title: 'Espumantes & Cavas',
    subtitle: 'Brut, Demi-Sec y Rosé',
    image: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?q=80&w=600&auto=format&fit=crop',
    targetId: '#cat-vinos'
  },
  {
    id: 'whisky',
    title: 'Whiskies & Bourbons',
    subtitle: 'Escoceses, Irlandeses y Japoneses',
    image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=600&auto=format&fit=crop',
    targetId: '#cat-destilados'
  },
  {
    id: 'gin-vodka',
    title: 'Gin, Vodka & Tequilas',
    subtitle: 'Para coctelería y combinados',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=600&auto=format&fit=crop',
    targetId: '#cat-destilados'
  },
  {
    id: 'bebidas-hielo',
    title: 'Bebidas, Jugos & Hielo',
    subtitle: 'Tónicas, colas y bolsas de hielo',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=600&auto=format&fit=crop',
    targetId: '#cat-destilados'
  },
  {
    id: 'snacks',
    title: 'Snacks & Picoteos',
    subtitle: 'Papas fritas, frutos secos y salsas',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=600&auto=format&fit=crop',
    targetId: '#cat-cervezas'
  }
];

export const CategoryGrid: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto mt-8 px-1 sm:px-0">
      <div className="mb-4 px-2">
        <h3 className="text-base font-bold text-[#141414] flex items-center gap-2">
          <span>🍾</span> Explorar Colecciones & Áreas
        </h3>
        <p className="text-xs text-stone-600 font-light mt-0.5">
          Encuentra tus licores favoritos, cervezas heladas, vinos y acompañamientos para cada ocasión.
        </p>
      </div>

      {/* 2 filas horizontales de 4 columnas (2x4 = 8 colecciones) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-5">
        {CATEGORY_ITEMS.map((item) => (
          <div
            key={item.id}
            className="relative group overflow-hidden rounded-xl sm:rounded-2xl bg-stone-900 border border-stone-300 h-32 sm:h-48 md:h-56 flex flex-col justify-end p-2 sm:p-4 md:p-5 transition-all duration-500 hover:border-[#ffd129] hover:shadow-[0_10px_30px_rgba(255,209,41,0.2)]"
          >
            <img
              src={item.image}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
            />
            {/* Solo degradado inferior para contrastar el texto y el botón */}
            <div className="absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex items-end justify-between gap-1.5 sm:gap-2.5">
              <div className="flex-1 min-w-0">
                <span className="text-[8px] sm:text-[10px] text-[#ffd129] font-medium block leading-none truncate mb-0.5 sm:mb-1">
                  {item.subtitle}
                </span>
                <h4 className="text-[11px] sm:text-sm font-bold text-white group-hover:text-[#ffd129] transition line-clamp-1 sm:line-clamp-2 leading-tight">
                  {item.title}
                </h4>
              </div>
              <a
                href={item.targetId}
                className="shrink-0 bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-bold text-[9px] sm:text-xs py-1 sm:py-2 px-1.5 sm:px-3 rounded-lg sm:rounded-xl transition flex items-center justify-center gap-0.5 sm:gap-1 shadow active:scale-95 whitespace-nowrap"
              >
                <span>Ver</span> <span>👉</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
