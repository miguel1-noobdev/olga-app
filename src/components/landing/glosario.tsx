'use client';

import React, { useEffect, useRef, useState } from 'react';
import ResilientImage from '@/components/ui/resilient-image';

const INGREDIENTS = [
  {
    name: 'Lavanda',
    image: null,
  },
  {
    name: 'Caléndula',
    image: null,
  },
  {
    name: 'Aloe Vera',
    image: null,
  },
  {
    name: 'Café Puro',
    image: null,
  },
];

const CARD_WIDTH = 300;
const CARD_HEIGHT = 400;
const CARD_GAP = 24;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
const REVEAL_SEGMENT = 0.3;

export default function Glosario() {
  const desktopTrackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      const track = desktopTrackRef.current;

      if (!track) return;

      const rect = track.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const start = viewportHeight * 0.5 - CARD_HEIGHT / 2;
      const end = -rect.height + viewportHeight * 0.45;
      const range = start - end;
      const progress = Math.min(1, Math.max(0, (start - rect.top) / range));

      setScrollProgress(progress);
    };

    const handleScroll = () => requestAnimationFrame(calculateProgress);

    calculateProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', calculateProgress);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateProgress);
    };
  }, []);

  return (
    <section
      id="glosario"
      className="py-20 md:py-32 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center md:text-left">
          <div>
            <h2 className="font-serif text-3xl md:text-5xl text-primary mb-4">
              Aprendé sobre mi despensa botánica
            </h2>
            <p className="font-sans text-xl text-on-surface-variant">
              Solo ingredientes que la tierra me ofrece generosamente.
            </p>
          </div>
        </div>

        <div className="relative lg:hidden">
          {INGREDIENTS.map((ingredient, index) => {
            const stickyTop = index * 80;

            return (
              <a
                key={index}
                href="/jardin-digital"
                className="glass-card rounded-3xl overflow-hidden relative group mb-8 block"
                style={{
                  position: 'sticky',
                  top: `${stickyTop}px`,
                  height: '400px',
                  zIndex: index,
                }}
              >
                <ResilientImage
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={ingredient.image}
                  alt={ingredient.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-transparent flex items-end p-6">
                  <span className="text-white font-serif text-3xl">
                    {ingredient.name}
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        <div ref={desktopTrackRef} className="relative hidden h-[1500px] lg:block">
          <div className="sticky top-[calc(50vh-200px)] h-[400px] overflow-visible">
            <div className="relative h-full w-full">
              {INGREDIENTS.map((ingredient, index) => {
                const segmentStart = Math.max(0, index - 1) * REVEAL_SEGMENT;
                const cardProgress =
                  index === 0
                    ? 1
                    : Math.min(
                        1,
                        Math.max(
                          0,
                          (scrollProgress - segmentStart) / REVEAL_SEGMENT,
                        ),
                      );
                const easedProgress = 1 - Math.pow(1 - cardProgress, 3);
                const appearanceProgress = Math.min(1, cardProgress / 0.12);
                const startX = Math.max(0, index - 1) * CARD_STEP;
                const endX = index * CARD_STEP;
                const x = startX + (endX - startX) * easedProgress;
                const y = index === 0 ? 0 : (1 - easedProgress) * 120;
                const scale = index === 0 ? 1 : 0.72 + easedProgress * 0.28;
                const opacity = index === 0 ? 1 : appearanceProgress;

                return (
                  <a
                    key={ingredient.name}
                    href="/jardin-digital"
                    className="glass-card group absolute left-0 top-0 h-[400px] w-[300px] overflow-hidden rounded-3xl shadow-xl block"
                    style={{
                      transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                      opacity,
                      zIndex: INGREDIENTS.length - index,
                    }}
                  >
                    <ResilientImage
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src={ingredient.image}
                      alt={ingredient.name}
                    />
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-on-surface/60 via-transparent to-transparent p-6">
                      <span className="font-serif text-3xl text-white">
                        {ingredient.name}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-center mt-8 lg:mt-12">
          <a
            href="/jardin-digital"
            className="inline-block border-2 border-primary text-primary font-sans text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-primary hover:text-white transition-all duration-300"
          >
            LEER MÁS
          </a>
        </div>
      </div>
    </section>
  );
}
