import { CategoryData, HeroSlide, Product, DeliveryLocation, StoreSettings, DaySchedule, StoreScheduleConfig } from '../types';

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    badge: 'Despacho Exprés & Frío',
    icon: 'fa-solid fa-truck-fast',
    title: 'Tus Licores & Cervezas Heladas en Minutos',
    description: 'Pisco, cervezas artesanales, destilados premium y vinos seleccionados directo a tu previa o celebración.',
    ctaText: 'Ver Catálogo',
    ctaLink: '#cat-cervezas',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1600&auto=format&fit=crop'
  },
  {
    id: 2,
    badge: 'Promos de Fin de Semana',
    icon: 'fa-solid fa-fire-flame-curved',
    title: 'Packs de Piscolas, Destilados & Aperitivos',
    description: 'Aprovecha nuestras promos de combos clásicos con bebidas, hielo y snacks incluidos al mejor precio.',
    ctaText: 'Ver Promociones',
    ctaLink: '#cat-destilados',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1600&auto=format&fit=crop'
  },
  {
    id: 3,
    badge: 'Selección Exclusiva',
    icon: 'fa-solid fa-wine-bottle',
    title: 'Vinos Reserva, Gin & Espumantes Premium',
    description: 'Las mejores cepas de los valles chilenos e importados premium para tus momentos especiales.',
    ctaText: 'Explorar Vinos',
    ctaLink: '#cat-vinos',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1600&auto=format&fit=crop'
  }
];

export const MEGA_OFFERS: Product[] = [
  {
    id: 'mega-1',
    name: 'Pack Piscola Mistral Especial 35° 750cc + Coca-Cola 1.5L + Hielo',
    category: 'Destilados & Piscos',
    categoryId: 'cat-destilados',
    subcategory: 'Combos & Packs',
    price: 10990,
    originalPrice: 15990,
    discount: '-31%',
    image: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=600&auto=format&fit=crop',
    description: 'El combo infalible para la previa: Mistral 35°, Coca-Cola Original y bolsa de hielo 1kg.',
    buttonText: 'Comprar',
    isMegaOffer: true
  },
  {
    id: 'mega-2',
    name: 'Pack Corona Extra 24 Botellas 330cc Heladas',
    category: 'Cervezas',
    categoryId: 'cat-cervezas',
    subcategory: 'Cerveza Lager',
    price: 19990,
    originalPrice: 28990,
    discount: '-30%',
    image: 'https://images.unsplash.com/photo-1608270190578-831e51b32d2e?q=80&w=600&auto=format&fit=crop',
    description: 'Caja completa de 24 botellas de Corona Extra, listas y refrigeradas para disfrutar con limón.',
    buttonText: 'Comprar',
    isMegaOffer: true
  }
];

export const CATEGORIES: CategoryData[] = [
  {
    id: 'cat-destilados',
    name: 'Destilados & Piscos',
    icon: 'fa-solid fa-whiskey-glass',
    badge: 'Piscos, Whisky, Gin & Vodka',
    title: 'Piscos Chilenos, Whisky & Destilados Premium',
    description: 'La más amplia selección de piscos artesanales y de guarda, whiskies escoceses, gin botánico y vodkas importados.',
    bannerImage: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=1600&auto=format&fit=crop',
    products: [
      {
        id: 'dest-1',
        name: 'Pisco Alto del Carmen 35° Especial 750ml',
        category: 'Destilados & Piscos',
        categoryId: 'cat-destilados',
        subcategory: 'Pisco',
        price: 7490,
        originalPrice: 8990,
        image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=400&auto=format&fit=crop',
        description: 'Pisco añejado en roble americano, sabor balanceado ideal para piscola.',
        buttonText: 'Comprar'
      },
      {
        id: 'dest-2',
        name: 'Whisky Johnnie Walker Black Label 12 Años 750ml',
        category: 'Destilados & Piscos',
        categoryId: 'cat-destilados',
        subcategory: 'Whisky',
        price: 24990,
        originalPrice: 29990,
        image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=400&auto=format&fit=crop',
        description: 'Icónico blended scotch con notas ahumadas, vainilla y frutos oscuros.',
        buttonText: 'Comprar'
      },
      {
        id: 'dest-3',
        name: 'Gin Tanqueray London Dry 750ml',
        category: 'Destilados & Piscos',
        categoryId: 'cat-destilados',
        subcategory: 'Gin',
        price: 16990,
        originalPrice: 19990,
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=400&auto=format&fit=crop',
        description: 'Cuádruple destilación con enebro perfecto para un Gin Tonic refrescante.',
        buttonText: 'Comprar'
      },
      {
        id: 'dest-4',
        name: 'Vodka Absolut Original 750ml',
        category: 'Destilados & Piscos',
        categoryId: 'cat-destilados',
        subcategory: 'Vodka',
        price: 11990,
        originalPrice: 14490,
        image: 'https://images.unsplash.com/photo-1607622750671-6cd9a99eabd1?q=80&w=400&auto=format&fit=crop',
        description: 'Vodka sueco de invierno ultra puro elaborado con trigo natural.',
        buttonText: 'Comprar'
      },
      {
        id: 'dest-5',
        name: 'Pisco Mistral Gran Nobel 40° 700ml',
        category: 'Destilados & Piscos',
        categoryId: 'cat-destilados',
        subcategory: 'Pisco Premium',
        price: 18990,
        originalPrice: 22990,
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=400&auto=format&fit=crop',
        description: 'Destilado en barricas de roble durante largos años en el Valle de Elqui.',
        buttonText: 'Comprar'
      },
      {
        id: 'dest-6',
        name: 'Tequila José Cuervo Especial Reposado 750ml',
        category: 'Destilados & Piscos',
        categoryId: 'cat-destilados',
        subcategory: 'Tequila',
        price: 15490,
        image: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?q=80&w=400&auto=format&fit=crop',
        description: 'El clásico reposado mexicano para shots con limón y sal o margaritas.',
        buttonText: 'Comprar'
      },
      {
        id: 'dest-7',
        name: 'Ron Havana Club Añejo Reserva 750ml',
        category: 'Destilados & Piscos',
        categoryId: 'cat-destilados',
        subcategory: 'Ron',
        price: 12990,
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=400&auto=format&fit=crop',
        description: 'Ron añejo cubano suave para mojitos y cubalibres con mucho sabor.',
        buttonText: 'Comprar'
      },
      {
        id: 'dest-8',
        name: 'Fernet Branca 750ml',
        category: 'Destilados & Piscos',
        categoryId: 'cat-destilados',
        subcategory: 'Aperitivo',
        price: 13990,
        image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=400&auto=format&fit=crop',
        description: 'El amargo de hierbas perfecto para acompañar con cola bien fría.',
        buttonText: 'Comprar'
      }
    ]
  },
  {
    id: 'cat-cervezas',
    name: 'Cervezas & Artesanales',
    icon: 'fa-solid fa-beer-mug-empty',
    badge: 'Lagers, IPAs & Packs',
    title: 'Cervezas Heladas Nacionales & del Mundo',
    description: 'Packs de tus marcas favoritas bien frías, artesanales chilenas con lúpulo fresco y opciones importadas.',
    bannerImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1600&auto=format&fit=crop',
    products: [
      {
        id: 'cer-1',
        name: 'Six Pack Austral Calafate 330ml',
        category: 'Cervezas & Artesanales',
        categoryId: 'cat-cervezas',
        subcategory: 'Cerveza Austral',
        price: 6490,
        originalPrice: 7990,
        image: 'https://images.unsplash.com/photo-1608270190578-831e51b32d2e?q=80&w=400&auto=format&fit=crop',
        description: 'Cerveza patagónica con fruto de calafate, aroma frutal y color ámbar intenso.',
        buttonText: 'Comprar'
      },
      {
        id: 'cer-2',
        name: 'Pack Heineken 12 Latas 350ml Heladas',
        category: 'Cervezas & Artesanales',
        categoryId: 'cat-cervezas',
        subcategory: 'Cerveza Lager',
        price: 9990,
        originalPrice: 12490,
        image: 'https://images.unsplash.com/photo-1618886614638-80e3c153d31a?q=80&w=400&auto=format&fit=crop',
        description: '100% malta pura y lúpulo de alta calidad, perfecta para compartir.',
        buttonText: 'Comprar'
      },
      {
        id: 'cer-3',
        name: 'Kross 5 Ale 330ml',
        category: 'Cervezas & Artesanales',
        categoryId: 'cat-cervezas',
        subcategory: 'Cerveza Artesanal',
        price: 1990,
        image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?q=80&w=400&auto=format&fit=crop',
        description: 'Cerveza madurada con roble tostado con notas a vainilla, caramelo y frutos secos.',
        buttonText: 'Comprar'
      },
      {
        id: 'cer-4',
        name: 'Six Pack Stella Artois 330ml',
        category: 'Cervezas & Artesanales',
        categoryId: 'cat-cervezas',
        subcategory: 'Cerveza Premium',
        price: 6190,
        originalPrice: 7490,
        image: 'https://images.unsplash.com/photo-1567696911980-2eed69a46042?q=80&w=400&auto=format&fit=crop',
        description: 'Lager europea de sabor equilibrado y final crujiente.',
        buttonText: 'Comprar'
      },
      {
        id: 'cer-5',
        name: 'Kunstmann Torobayo 330ml Botella',
        category: 'Cervezas & Artesanales',
        categoryId: 'cat-cervezas',
        subcategory: 'Cerveza Valdiviana',
        price: 1890,
        image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=400&auto=format&fit=crop',
        description: 'La clásica English Pale Ale de Valdivia, aromas a caramelo y cuerpo suave.',
        buttonText: 'Comprar'
      },
      {
        id: 'cer-6',
        name: 'Six Pack Royal Guard Golden Ale 355ml',
        category: 'Cervezas & Artesanales',
        categoryId: 'cat-cervezas',
        subcategory: 'Cerveza Nacional',
        price: 5490,
        image: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?q=80&w=400&auto=format&fit=crop',
        description: 'Doble lúpulo y sabor robusto, refrescante y tradicional.',
        buttonText: 'Comprar'
      },
      {
        id: 'cer-7',
        name: 'Pack Corona 6 Botellas 330ml',
        category: 'Cervezas & Artesanales',
        categoryId: 'cat-cervezas',
        subcategory: 'Cerveza Importada',
        price: 5990,
        image: 'https://images.unsplash.com/photo-1608270190578-831e51b32d2e?q=80&w=400&auto=format&fit=crop',
        description: 'La cerveza mexicana más vendida del mundo para disfrutar con gajo de lima.',
        buttonText: 'Comprar'
      }
    ]
  },
  {
    id: 'cat-vinos',
    name: 'Vinos & Espumantes',
    icon: 'fa-solid fa-wine-glass',
    badge: 'Cepas Chilenas & Champagne',
    title: 'Vinos Reserva, Gran Reserva & Espumantes',
    description: 'Cabernet Sauvignon, Carmenère, Sauvignon Blanc y espumantes Brut para brindar en toda ocasión.',
    bannerImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1600&auto=format&fit=crop',
    products: [
      {
        id: 'vin-1',
        name: 'Vino Casillero del Diablo Cabernet Sauvignon 750ml',
        category: 'Vinos & Espumantes',
        categoryId: 'cat-vinos',
        subcategory: 'Tinto Reserva',
        price: 5490,
        originalPrice: 6990,
        image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400&auto=format&fit=crop',
        description: 'Cuerpo medio a pleno, taninos suaves y notas a ciruela negra y café.',
        buttonText: 'Comprar'
      },
      {
        id: 'vin-2',
        name: 'Espumante Valdivieso Brut 750ml',
        category: 'Vinos & Espumantes',
        categoryId: 'cat-vinos',
        subcategory: 'Espumante',
        price: 4990,
        originalPrice: 6290,
        image: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?q=80&w=400&auto=format&fit=crop',
        description: 'Burbujas finas y persistentes, fresco en boca y perfecto para celebraciones.',
        buttonText: 'Comprar'
      },
      {
        id: 'vin-3',
        name: 'Vino Montes Alpha Carmenère 750ml',
        category: 'Vinos & Espumantes',
        categoryId: 'cat-vinos',
        subcategory: 'Gran Reserva',
        price: 13990,
        originalPrice: 16990,
        image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?q=80&w=400&auto=format&fit=crop',
        description: 'Elegante y estructurado con aromas a frutos negros maduros y pimiento dulce.',
        buttonText: 'Comprar'
      },
      {
        id: 'vin-4',
        name: 'Vino Castillo de Molina Sauvignon Blanc 750ml',
        category: 'Vinos & Espumantes',
        categoryId: 'cat-vinos',
        subcategory: 'Blanco Reserva',
        price: 6490,
        originalPrice: 7990,
        image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400&auto=format&fit=crop',
        description: 'Fresco, cítrico y mineral, ideal para acompañar mariscos o picoteos.',
        buttonText: 'Comprar'
      },
      {
        id: 'vin-5',
        name: 'Espumante Chandon Extra Brut 750ml',
        category: 'Vinos & Espumantes',
        categoryId: 'cat-vinos',
        subcategory: 'Espumante Premium',
        price: 12490,
        image: 'https://images.unsplash.com/photo-1594488518001-08182746c3b6?q=80&w=400&auto=format&fit=crop',
        description: 'Cremoso, elegante y equilibrado con notas cítricas y pan tostado.',
        buttonText: 'Comprar'
      },
      {
        id: 'vin-6',
        name: 'Vino Santa Ema Select Terroir Merlot 750ml',
        category: 'Vinos & Espumantes',
        categoryId: 'cat-vinos',
        subcategory: 'Tinto Reserva',
        price: 4990,
        image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=400&auto=format&fit=crop',
        description: 'Sabor amable y sedoso con toques a frambuesas y ciruelas maduras.',
        buttonText: 'Comprar'
      },
      {
        id: 'vin-7',
        name: 'Vino Marques de Casa Concha Syrah 750ml',
        category: 'Vinos & Espumantes',
        categoryId: 'cat-vinos',
        subcategory: 'Gran Reserva',
        price: 15990,
        image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=400&auto=format&fit=crop',
        description: 'Complejo, profundo y seductor con notas de moras silvestres y pimienta.',
        buttonText: 'Comprar'
      }
    ]
  },
  {
    id: 'cat-bebidas',
    name: 'Bebidas, Aguas & Hielo',
    icon: 'fa-solid fa-bottle-water',
    badge: 'Aguas, Gaseosas & Hielo',
    title: 'Aguas Minerales, Bebidas Heladas & Hielo',
    description: 'Aguas con y sin gas de vertiente, bebidas gaseosas frías, energéticas y hielo purificado en bolsa.',
    bannerImage: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?q=80&w=1600&auto=format&fit=crop',
    products: [
      {
        id: 'beb-1',
        name: 'Agua Mineral Cachantún con Gas 1.6L',
        category: 'Bebidas, Aguas & Hielo',
        categoryId: 'cat-bebidas',
        subcategory: 'Aguas con Gas',
        price: 1490,
        originalPrice: 1890,
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?q=80&w=400&auto=format&fit=crop',
        description: 'Agua mineral de vertiente natural con finas burbujas, pura y refrescante.',
        buttonText: 'Comprar'
      },
      {
        id: 'beb-2',
        name: 'Agua Mineral Vital con Gas 1.5L',
        category: 'Bebidas, Aguas & Hielo',
        categoryId: 'cat-bebidas',
        subcategory: 'Aguas con Gas',
        price: 1390,
        originalPrice: 1690,
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?q=80&w=400&auto=format&fit=crop',
        description: 'Agua mineral gasificada equilibrada ideal para hidratación o aperitivos.',
        buttonText: 'Comprar'
      },
      {
        id: 'beb-3',
        name: 'Agua Mineral Puyehue sin Gas 1.5L',
        category: 'Bebidas, Aguas & Hielo',
        categoryId: 'cat-bebidas',
        subcategory: 'Aguas sin Gas',
        price: 1290,
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?q=80&w=400&auto=format&fit=crop',
        description: 'Agua pura de origen volcánico del sur de Chile sin gas.',
        buttonText: 'Comprar'
      },
      {
        id: 'beb-4',
        name: 'Coca-Cola Original 1.5L Helada',
        category: 'Bebidas, Aguas & Hielo',
        categoryId: 'cat-bebidas',
        subcategory: 'Bebidas Gaseosas',
        price: 1990,
        originalPrice: 2390,
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400&auto=format&fit=crop',
        description: 'La clásica Coca-Cola bien helada para tus combinados o comidas.',
        buttonText: 'Comprar'
      },
      {
        id: 'beb-5',
        name: 'Bebida Energética Red Bull 250ml',
        category: 'Bebidas, Aguas & Hielo',
        categoryId: 'cat-bebidas',
        subcategory: 'Bebidas Energéticas',
        price: 1890,
        image: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?q=80&w=400&auto=format&fit=crop',
        description: 'Te da alas cuando más lo necesitas para continuar la fiesta.',
        buttonText: 'Comprar'
      },
      {
        id: 'beb-6',
        name: 'Bolsa de Hielo Purificado en Cubos 1kg',
        category: 'Bebidas, Aguas & Hielo',
        categoryId: 'cat-bebidas',
        subcategory: 'Hielo & Complementos',
        price: 1490,
        image: 'https://images.unsplash.com/photo-1516959512399-985e5095d311?q=80&w=400&auto=format&fit=crop',
        description: 'Cubos de hielo cristalino elaborados con agua purificada.',
        buttonText: 'Comprar'
      }
    ]
  },
  {
    id: 'cat-snacks',
    name: 'Snacks & Picoteos',
    icon: 'fa-solid fa-cookie-bite',
    badge: 'Papas, Ramitas & Frutos Secos',
    title: 'Snacks Salados, Picoteos & Chocolates',
    description: 'Papas fritas crujientes, ramitas de queso, maní salado y bocados para acompañar tus tragos.',
    bannerImage: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=1600&auto=format&fit=crop',
    products: [
      {
        id: 'snk-1',
        name: "Papas Fritas Lay's Corte Liso 220g",
        category: 'Snacks & Picoteos',
        categoryId: 'cat-snacks',
        subcategory: 'Papas Fritas',
        price: 2490,
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=400&auto=format&fit=crop',
        description: 'Crujientes y doradas con el punto perfecto de sal.',
        buttonText: 'Comprar'
      },
      {
        id: 'snk-2',
        name: 'Ramitas Saladas Evercrisp 250g',
        category: 'Snacks & Picoteos',
        categoryId: 'cat-snacks',
        subcategory: 'Snacks Salados',
        price: 2190,
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=400&auto=format&fit=crop',
        description: 'El clásico sabor de las tradicionales ramitas saladas chilenas.',
        buttonText: 'Comprar'
      },
      {
        id: 'snk-3',
        name: 'Maní Salado Tostado 180g',
        category: 'Snacks & Picoteos',
        categoryId: 'cat-snacks',
        subcategory: 'Frutos Secos',
        price: 1690,
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=400&auto=format&fit=crop',
        description: 'Maní premium tostado y crujiente, el aperitivo infaltable.',
        buttonText: 'Comprar'
      }
    ]
  },
  {
    id: 'cat-aperitivos',
    name: 'Aperitivos & Licores',
    icon: 'fa-solid fa-martini-glass-citrus',
    badge: 'Aperol, Vermouth & Digestivos',
    title: 'Aperitivos Italianos, Vermut & Licores Dulces',
    description: 'Aperol Spritz, Ramazzotti, Fernet Branca, Baileys y licores para comenzar la previa o el postre.',
    bannerImage: 'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=1600&auto=format&fit=crop',
    products: [
      {
        id: 'ap-1',
        name: 'Aperitivo Aperol 750ml',
        category: 'Aperitivos & Licores',
        categoryId: 'cat-aperitivos',
        subcategory: 'Aperitivos',
        price: 11990,
        originalPrice: 13990,
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=400&auto=format&fit=crop',
        description: 'El licor italiano de naranja amarga y hierbas para preparar el mejor Aperol Spritz.',
        buttonText: 'Comprar'
      },
      {
        id: 'ap-2',
        name: 'Ramazzotti Rosato 700ml',
        category: 'Aperitivos & Licores',
        categoryId: 'cat-aperitivos',
        subcategory: 'Aperitivos',
        price: 12490,
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=400&auto=format&fit=crop',
        description: 'Aperitivo con notas a flor de hibisco y azahar, fresco y liviano.',
        buttonText: 'Comprar'
      },
      {
        id: 'ap-3',
        name: 'Licor Baileys Original Irish Cream 750ml',
        category: 'Aperitivos & Licores',
        categoryId: 'cat-aperitivos',
        subcategory: 'Licores & Cremas',
        price: 14990,
        originalPrice: 17990,
        image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?q=80&w=400&auto=format&fit=crop',
        description: 'La crema irlandesa número 1 del mundo, whisky escocés y crema de leche fresca.',
        buttonText: 'Comprar'
      }
    ]
  }
];

export const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(value);
};

export const getDiscountPercentage = (price: number, originalPrice?: number): string | null => {
  if (!originalPrice || originalPrice <= price) return null;
  const pct = Math.round(((originalPrice - price) / originalPrice) * 100);
  return pct > 0 ? `-${pct}%` : null;
};

export const DEFAULT_DELIVERY_LOCATIONS: DeliveryLocation[] = [
  { id: 'loc-1', name: 'Alerce Histórico', price: 2000, estimatedMinutes: 25 },
  { id: 'loc-2', name: 'Alerce Norte', price: 2500, estimatedMinutes: 30 },
  { id: 'loc-3', name: 'Alerce Sur', price: 2500, estimatedMinutes: 30 },
  { id: 'loc-4', name: 'Puerto Montt Centro', price: 3500, estimatedMinutes: 35 },
  { id: 'loc-5', name: 'Mirador de la Bahía', price: 3500, estimatedMinutes: 35 },
  { id: 'loc-6', name: 'Valle Volcanes', price: 3500, estimatedMinutes: 35 },
  { id: 'loc-7', name: 'Pelluco', price: 4000, estimatedMinutes: 40 },
  { id: 'loc-8', name: 'Cardonal', price: 3500, estimatedMinutes: 40 },
  { id: 'loc-9', name: 'Chamiza', price: 4500, estimatedMinutes: 45 },
  { id: 'loc-10', name: 'Santiago Centro', price: 2990, estimatedMinutes: 35 },
  { id: 'loc-11', name: 'Providencia', price: 3490, estimatedMinutes: 30 },
  { id: 'loc-12', name: 'Las Condes', price: 3990, estimatedMinutes: 45 },
  { id: 'loc-13', name: 'Ñuñoa', price: 3490, estimatedMinutes: 35 },
  { id: 'loc-14', name: 'Vitacura', price: 4490, estimatedMinutes: 45 }
];

export const getDeliveryLocations = (settings?: StoreSettings | null): DeliveryLocation[] => {
  if (settings?.deliveryLocations && settings.deliveryLocations.length > 0) {
    return settings.deliveryLocations;
  }
  if (settings?.deliveryZones && settings.deliveryZones.length > 0) {
    return settings.deliveryZones.map((zone, idx) => {
      const matched = DEFAULT_DELIVERY_LOCATIONS.find(
        d => d.name.toLowerCase().trim() === zone.toLowerCase().trim()
      );
      return {
        id: `loc-${idx + 1}`,
        name: zone,
        price: matched ? matched.price : (zone.toLowerCase().includes('alerce') ? 2000 : 3500),
        estimatedMinutes: matched?.estimatedMinutes || 35
      };
    });
  }
  return DEFAULT_DELIVERY_LOCATIONS;
};

export const getLocationPrice = (locationName: string, settings?: StoreSettings | null): number => {
  if (!locationName) return 3500;
  const locations = getDeliveryLocations(settings);
  const found = locations.find(
    l => l.name.toLowerCase().trim() === locationName.toLowerCase().trim()
  );
  if (found) return found.price;
  return locationName.toLowerCase().includes('alerce') ? 2000 : 3500;
};

export const getLocationEstimatedTime = (locationName: string, settings?: StoreSettings | null): number => {
  if (!locationName) return 35;
  const locations = getDeliveryLocations(settings);
  const found = locations.find(
    l => l.name.toLowerCase().trim() === locationName.toLowerCase().trim()
  );
  return found?.estimatedMinutes || 35;
};

export const DEFAULT_STORE_SCHEDULE: StoreScheduleConfig = {
  enabled: true,
  manualOverride: 'auto',
  closedMessage: 'Nuestra botillería se encuentra cerrada en este momento. Revisa nuestro horario semanal de atención.',
  days: [
    { day: 'lunes', label: 'Lunes', isOpen: true, openTime: '12:00', closeTime: '02:00' },
    { day: 'martes', label: 'Martes', isOpen: true, openTime: '12:00', closeTime: '02:00' },
    { day: 'miercoles', label: 'Miércoles', isOpen: true, openTime: '12:00', closeTime: '02:00' },
    { day: 'jueves', label: 'Jueves', isOpen: true, openTime: '12:00', closeTime: '03:00' },
    { day: 'viernes', label: 'Viernes', isOpen: true, openTime: '12:00', closeTime: '04:00' },
    { day: 'sabado', label: 'Sábado', isOpen: true, openTime: '12:00', closeTime: '04:00' },
    { day: 'domingo', label: 'Domingo', isOpen: true, openTime: '12:00', closeTime: '01:00' }
  ]
};

const DAY_KEYS: Array<DaySchedule['day']> = [
  'domingo', // 0
  'lunes',   // 1
  'martes',  // 2
  'miercoles', // 3
  'jueves',  // 4
  'viernes', // 5
  'sabado'   // 6
];

// Helper to convert "HH:MM" string to minutes from start of day (0 - 1439)
const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(n => parseInt(n, 10) || 0);
  return h * 60 + m;
};

export interface StoreOpenStatus {
  isOpen: boolean;
  statusText: string;
  badgeColor: 'green' | 'amber' | 'red';
  currentDayLabel: string;
  todayHoursText: string;
  nextOpenText?: string;
  reason?: string;
}

export const checkStoreOpenStatus = (
  scheduleConfig?: StoreScheduleConfig | null,
  mockDate?: Date
): StoreOpenStatus => {
  const config = scheduleConfig || DEFAULT_STORE_SCHEDULE;

  if (config.enabled === false || config.manualOverride === 'force_open') {
    return {
      isOpen: true,
      statusText: 'Abierto Ahora (Recepción de pedidos activa)',
      badgeColor: 'green',
      currentDayLabel: 'Atención Continua',
      todayHoursText: 'Abierto 24/7 o forzado administrativamente'
    };
  }

  if (config.manualOverride === 'force_closed') {
    return {
      isOpen: false,
      statusText: 'Cerrado Temporalmente',
      badgeColor: 'red',
      currentDayLabel: 'Cerrado por Administración',
      todayHoursText: 'No se reciben pedidos en este momento',
      reason: config.closedMessage || 'El local se encuentra cerrado temporalmente por el administrador.'
    };
  }

  const now = mockDate || new Date();
  const currentDayIndex = now.getDay(); // 0 = domingo, 1 = lunes, ...
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const daysList = config.days && config.days.length === 7 ? config.days : DEFAULT_STORE_SCHEDULE.days;

  const getDaySchedule = (idx: number): DaySchedule => {
    const key = DAY_KEYS[idx];
    return daysList.find(d => d.day === key) || daysList[idx];
  };

  const todaySchedule = getDaySchedule(currentDayIndex);
  const prevDayIndex = (currentDayIndex + 6) % 7;
  const yesterdaySchedule = getDaySchedule(prevDayIndex);

  // Check if still open from yesterday's night shift (e.g. yesterday openTime=12:00, closeTime=04:00, and it is 02:30 AM today)
  if (yesterdaySchedule.isOpen) {
    const yOpenM = parseTimeToMinutes(yesterdaySchedule.openTime);
    const yCloseM = parseTimeToMinutes(yesterdaySchedule.closeTime);

    // If closeTime < openTime, it spans past midnight into today
    if (yCloseM < yOpenM && currentMinutes < yCloseM) {
      return {
        isOpen: true,
        statusText: 'Abierto Ahora (Turno Nocturno)',
        badgeColor: 'green',
        currentDayLabel: yesterdaySchedule.label,
        todayHoursText: `${yesterdaySchedule.openTime} a ${yesterdaySchedule.closeTime} hrs (Cierra a las ${yesterdaySchedule.closeTime})`
      };
    }
  }

  // Check today's schedule
  if (todaySchedule.isOpen) {
    const openM = parseTimeToMinutes(todaySchedule.openTime);
    const closeM = parseTimeToMinutes(todaySchedule.closeTime);

    // If close spans past midnight (closeM < openM)
    if (closeM < openM) {
      if (currentMinutes >= openM) {
        return {
          isOpen: true,
          statusText: 'Abierto Ahora',
          badgeColor: 'green',
          currentDayLabel: todaySchedule.label,
          todayHoursText: `Hoy ${todaySchedule.label}: ${todaySchedule.openTime} a ${todaySchedule.closeTime} hrs (madrugada)`
        };
      }
    } else {
      // Normal same-day shift
      if (currentMinutes >= openM && currentMinutes < closeM) {
        return {
          isOpen: true,
          statusText: 'Abierto Ahora',
          badgeColor: 'green',
          currentDayLabel: todaySchedule.label,
          todayHoursText: `Hoy ${todaySchedule.label}: ${todaySchedule.openTime} a ${todaySchedule.closeTime} hrs`
        };
      }
    }
  }

  // If we reach here, the store is closed right now
  let nextOpenMsg = '';
  if (todaySchedule.isOpen) {
    const openM = parseTimeToMinutes(todaySchedule.openTime);
    if (currentMinutes < openM) {
      nextOpenMsg = `Hoy ${todaySchedule.label} abrimos a las ${todaySchedule.openTime} hrs`;
    }
  }

  if (!nextOpenMsg) {
    // Find next day that is open
    for (let i = 1; i <= 7; i++) {
      const nextIdx = (currentDayIndex + i) % 7;
      const nextSched = getDaySchedule(nextIdx);
      if (nextSched.isOpen) {
        nextOpenMsg = `${nextSched.label} abrimos a las ${nextSched.openTime} hrs`;
        break;
      }
    }
  }

  return {
    isOpen: false,
    statusText: 'Cerrado Actualmente',
    badgeColor: 'amber',
    currentDayLabel: todaySchedule.label,
    todayHoursText: todaySchedule.isOpen ? `Horario hoy: ${todaySchedule.openTime} a ${todaySchedule.closeTime} hrs` : 'Hoy: Cerrado',
    nextOpenText: nextOpenMsg || 'Consulte horarios de atención',
    reason: config.closedMessage || 'No se reciben pedidos fuera del horario de atención comercial.'
  };
};

export function getCategoryEmoji(catIdOrIcon?: string, name?: string): string {
  const query = `${catIdOrIcon || ''} ${name || ''}`.toLowerCase();
  if (query.includes('destilad') || query.includes('pisco') || query.includes('whiskey') || query.includes('whisky') || query.includes('gin') || query.includes('vodka') || query.includes('ron')) return '🥃';
  if (query.includes('cerveza') || query.includes('beer') || query.includes('artesanal') || query.includes('ipa') || query.includes('lager')) return '🍺';
  if (query.includes('vino') || query.includes('wine') || query.includes('espumante') || query.includes('champagne') || query.includes('tinto') || query.includes('blanco')) return '🍷';
  if (query.includes('promo') || query.includes('mega') || query.includes('oferta') || query.includes('fire') || query.includes('bolt')) return '🔥';
  if (query.includes('bebida') || query.includes('jugo') || query.includes('energetica') || query.includes('cola')) return '🥤';
  if (query.includes('hielo') || query.includes('ice')) return '🧊';
  if (query.includes('snack') || query.includes('papa') || query.includes('picoteo')) return '🍟';
  if (query.includes('aperitivo') || query.includes('cocktail') || query.includes('trago')) return '🍸';
  return '🍾';
}



