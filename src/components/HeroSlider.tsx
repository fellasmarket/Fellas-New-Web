import React, { useState, useEffect, useRef } from 'react';
import { HeroSlide } from '../types';
import { Emoji3D } from './Emoji3D';

interface HeroSliderProps {
  slides?: HeroSlide[];
  isVisualEditMode?: boolean;
  onQuickEditSlide?: (slide: HeroSlide, index: number) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides = [],
  isVisualEditMode = false,
  onQuickEditSlide
}) => {
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
    <section className="max-w-7xl mx-auto mt-1.5 sm:mt-2 px-1 sm:px-0">
      <div
        id="hero-banner-carousel"
        onMouseEnter={stopTimer}
        onMouseLeave={startTimer}
        className={`relative w-full h-[150px] sm:h-[44vh] md:h-[50vh] min-h-[140px] sm:min-h-[320px] max-h-[460px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl bg-[#141414] ${
          isVisualEditMode
            ? 'ring-2 ring-[#ffd129] ring-dashed cursor-pointer group/hero'
            : ''
        }`}
        onClick={() => {
          if (isVisualEditMode && onQuickEditSlide && activeSlides[currentSlide]) {
            onQuickEditSlide(activeSlides[currentSlide], currentSlide);
          }
        }}
      >
        {/* Floating Quick Edit Badge in Visual Mode */}
        {isVisualEditMode && (
          <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onQuickEditSlide && activeSlides[currentSlide]) {
                  onQuickEditSlide(activeSlides[currentSlide], currentSlide);
                }
              }}
              className="bg-[#ffd129] hover:bg-yellow-400 text-stone-950 text-[9px] sm:text-xs font-black px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-lg sm:rounded-xl shadow-xl flex items-center gap-1 sm:gap-1.5 transition uppercase tracking-wider cursor-pointer"
            >
              <Emoji3D name="pen" className="w-3.5 h-3.5" alt="Editar" />
              <span className="hidden xs:inline">Editar Banner</span>
            </button>
          </div>
        )}

        {/* Slides */}
        {activeSlides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`slide absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover opacity-80 sm:opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/95 via-[#141414]/70 sm:via-[#141414]/80 to-transparent"></div>

              {/* Contenedor de texto y botón: reducido en celular a 2/3 de tamaño para no tapar la imagen del banner */}
              <div className="relative z-10 w-[50%] xs:w-[52%] sm:w-2/3 md:w-1/2 lg:w-5/12 flex flex-col justify-center px-2.5 sm:px-8 md:px-14 text-white py-1.5 sm:py-4">
                <div>
                  <span className="inline-flex items-center gap-1 text-[#ffd129] font-bold text-[7px] sm:text-xs uppercase tracking-wider mb-0.5 sm:mb-1.5">
                    <Emoji3D name="sparkles" className="w-3 h-3 sm:w-3.5 sm:h-3.5" alt="Destacado" />
                    <span>{slide.badge}</span>
                  </span>
                  <h2 className="text-[11px] sm:text-2xl md:text-3xl font-extrabold leading-tight text-white line-clamp-2">
                    {slide.title}
                  </h2>
                  <p className="text-[8px] sm:text-xs md:text-sm text-stone-300 font-light leading-tight mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2">
                    {slide.description}
                  </p>
                </div>
                <div className="pt-1 sm:pt-3">
                  <a
                    href={slide.ctaLink}
                    className="inline-flex items-center gap-1 sm:gap-2 bg-[#ffd129] hover:bg-yellow-400 text-[#141414] font-bold text-[8px] sm:text-xs px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-md sm:rounded-xl transition shadow-md w-fit active:scale-95 whitespace-nowrap"
                  >
                    <span>{slide.ctaText}</span>
                    <Emoji3D name="right" className="w-3 h-3 sm:w-3.5 sm:h-3.5" alt="Ir" />
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
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/50 hover:bg-[#ffd129] hover:text-[#141414] text-white font-bold rounded-full items-center justify-center transition border border-white/20 shadow-md text-xs cursor-pointer"
              aria-label="Slide anterior"
            >
              ◀
            </button>
            <button
              id="hero-next-btn"
              onClick={() => changeSlide(1)}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-black/50 hover:bg-[#ffd129] hover:text-[#141414] text-white font-bold rounded-full items-center justify-center transition border border-white/20 shadow-md text-xs cursor-pointer"
              aria-label="Siguiente slide"
            >
              ▶
            </button>

            <div className="absolute bottom-1.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2">
              {activeSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'w-5 sm:w-8 bg-[#ffd129]' : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
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
