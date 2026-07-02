'use client';

import { useEffect, useState } from 'react';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Parallax */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/img/hero-img2.png')",
            transform: `translateY(${scrollY * 0.3}px) scale(1.1)`,
          }}
        />
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-surface/20 to-surface/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24">
        <div className="max-w-3xl">
          {/* Badge */}
          <div
            className={`inline-block mb-6 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <span className="px-4 py-2 bg-primary/90 backdrop-blur-glass text-surface text-xs font-bold uppercase tracking-widest rounded-full">
              100% Natural · Sin Químicos
            </span>
          </div>

          {/* Title */}
          <h1
            className={`font-serif text-5xl md:text-7xl lg:text-8xl text-primary mb-8 leading-tight transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            Belleza Consciente,
            <br />
            <span className="italic font-light">Ciencia Natural</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`font-sans text-lg md:text-xl text-on-surface-variant mb-12 max-w-2xl leading-relaxed transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            Cosmética artesanal elaborada con plantas cultivadas respetando sus ciclos naturales. 
            Cada fórmula es pura esencia botánica, sin procesos químicos ni aditivos artificiales.
          </p>

          {/* Decorative element */}
          <div
            className={`flex items-center gap-4 transition-all duration-1000 delay-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="h-px w-16 bg-primary/40" />
            <span className="text-xs uppercase tracking-widest text-on-surface-variant/70">
              Hecho con amor y plantas
            </span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - hidden on mobile to avoid overlap */}
      <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs uppercase tracking-widest text-on-surface-variant/60">
            Descubrir
          </span>
          <svg
            className="w-6 h-6 text-primary/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
