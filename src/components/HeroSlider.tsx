import React, { useState, useEffect, useRef } from 'react';
import { HeroSlide } from '../types';

interface HeroSliderProps {
  slides?: HeroSlide[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ slides = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeSlides = slides && slides.length > 0 ? slides : [];

  const startTimer = () => {
    stopTimer();
    if (activeSlides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeSlides.length);
    }, 5000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [activeSlides.length]);

  const changeSlide = (direction: number) => {
    if (activeSlides.length <= 1) return;
    setCurrentSlide(prev => {
      const next = prev + direction;
      if (next >= activeSlides.length) return 0;
      if (next < 0) return activeSlides.length - 1;
      return next;
    });
    startTimer();
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    startTimer();
  };

  if (activeSlides.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto mt-2 px-1 sm:px-0">
      <div
        id="hero-banner-carousel"
        onMouseEnter={stopTimer}
        onMouseLeave={startTimer}
        className="relative w-full h-[40vh] sm:h-[48vh] md:h-[52vh] min-h-[290px] sm:min-h-[360px] max-h-[480px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-[#141414]"
      >
        {/* Slides */}
        {activeSlides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`slide absolute inset-0 transition-opacity duration-700 ease-in-out flex flex-col justify-center ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/90 sm:via-[#141414]/80 to-transparent"></div>

              {/* Contenedor de texto adaptativo para móviles, tablets y escritorio */}
              <div className="relative z-10 w-full sm:w-2/3 md:w-1/2 lg:w-5/12 flex flex-col justify-center px-4 sm:px-8 md:px-14 text-white py-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[#ffd129] font-bold text-[11px] sm:text-xs uppercase tracking-widest mb-1 sm:mb-1.5">
                    <i className={slide.icon}></i> {slide.badge}
                  </span>
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold leading-tight text-white line-clamp-2">
                    {slide.title}
                  </h2>
                  <p className="text-[11px] sm:text-xs md:text-sm text-stone-300 font-light leading-snug mt-1 line-clamp-2">
                    {slide.description}
                  </p>
                </div>
                <div className="pt-2 sm:pt-3">
                  <a
                    href={slide.ctaLink}
                    className="inline-flex items-center gap-2 bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-bold text-xs px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl transition shadow-lg w-fit active:scale-95"
                  >
                    {slide.ctaText} <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </a>
                </div>
              </div>
            </div>
          );
        })}

        {/* Controles Slider */}
        {activeSlides.length > 1 && (
          <>
            <button
              id="hero-prev-btn"
              onClick={() => changeSlide(-1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/50 hover:bg-[#ffd129] hover:text-[#141414] text-white rounded-full flex items-center justify-center transition border border-white/20 shadow-md"
              aria-label="Slide anterior"
            >
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <button
              id="hero-next-btn"
              onClick={() => changeSlide(1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/50 hover:bg-[#ffd129] hover:text-[#141414] text-white rounded-full flex items-center justify-center transition border border-white/20 shadow-md"
              aria-label="Siguiente slide"
            >
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {activeSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'w-8 bg-[#ffd129]' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Ir al slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
