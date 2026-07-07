'use client';

import { useEffect, useRef, useState } from 'react';

export default function Glosario() {
  const [cardProgress, setCardProgress] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const calculateProgress = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // The section triggers when its top reaches the bottom of the viewport
      // and finishes when its bottom leaves the top
      const sectionTop = rect.top;
      const sectionHeight = rect.height;

      // How far into the section we've scrolled (0 = not yet, 1 = fully through)
      const sectionProgress = Math.max(0, Math.min(1,
        (windowHeight - sectionTop) / (windowHeight + sectionHeight)
      ));

      // Distribute 4 cards across the section's scroll range (0 to ~0.7)
      // Each card gets 0.175 of the progress range (0.7 / 4)
      const newProgress = [0, 1, 2, 3].map((i) => {
        const cardStart = i * 0.17;
        const cardRange = 0.18;
        return Math.max(0, Math.min(1, (sectionProgress - cardStart) / cardRange));
      });

      setCardProgress(newProgress);
    };

    const handleScroll = () => {
      requestAnimationFrame(calculateProgress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    calculateProgress();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ingredients = [
    {
      name: 'Lavanda',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBvonsaIF_H8eA7Nh9FlqGAnyrN28Tynwu_V5OGSFQcKkDNByBuS1QzfacyFK0S9H29a6mc6q_Yg8Bm1Nug9ajLghW9jTHK_xXtP8KWEOsRCfZCdYQTcuYqjAdLcrI0TEKFA-6mj_ZkTAZR8pCHRZ5IsUcQQaROGgZ7R5DlmJaopsSvPFPNPoqGqLCxyb48pl0isE5MZAEsPohourpmd_2Z94R27iIjQZC8-w46qnF5o0a915ClyyAyKfAn-O_1TmQed9QonTMgPumL',
    },
    {
      name: 'Caléndula',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC2W6mht2mHlJ5DXw9flObGXWpOis3oQTjeSK0qyePFlukUaOpZApuSeejGM6XGmDJsVkqt1wwbd69UC-URajh_tlatWctmLbXmVN4XlL7jwVutVd-B9xb1FDMIpw4oVbgneuCLC3XHLhXniPaK5SHdb5xXnwzlgpcfMcy83Bjm0PxAeqRnOt-9jR8ESaeAhwfp-fy5_IrDnUQKRR-1HmWslGIrpD6SMvszcF9Uyl5Wj0Zsdz6PD2m9UhWPTdKsCOY1rolnhAhNHiP4',
    },
    {
      name: 'Aloe Vera',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBX1rOzc23GoWbccOtxVVGkGPQ3w9VCGdh4iGac5m_9j8P-Bo_WO86DL8Rl-G85cJL3gKTBvD0oG_l2LQ1ZRih2s6wCGKN95dPhwp1Wn7v9Udm_9WI4lCcceZr_DOWypQHLio6kAM6-Sj1uT1OOZBXeMNqFZv4AZVMlwkMr81xW3Aii6CkiObsCRz0trv1jufYOKdyOBiWQ5NB1tu6V4YNIBIGzr4HAHM7bUlnr1jNI_8Mz788hQ2oUKKeOibtfVYd3e7wRHq5seLwS',
    },
    {
      name: 'Café Puro',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB78FNoPibgoOV6g4RW6u6vn7-mvepdHJPd9cULjHvt1ChuiyQLE2A2lw2aEZZIvLClH3sVuM9K5lEpLJADdbBG7btHnC5VC0qJX-U9Mm-036di6XA2DbSYfYwK_ZT2_nYzq1_beaqIzXYXjefvMDYRSVO_Bj4qTwPqmatSnZjdoncian85OHwk3BUucPKKhbloFvdJUCegA0591DOykfb30JPT8aNvVthPbzMWbRlw7SMzBtgtiG9QYciiDUy8dO60DM_pAfzvL0Qf',
    },
  ];

  return (
    <section
      id="glosario"
      ref={sectionRef}
      className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Extra height so there's enough scroll room to reveal all cards */}
      <div className="h-[50vh]" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-16">
          <div className="text-center md:text-left flex-1">
            <h2 className="font-serif text-3xl md:text-5xl text-primary mb-4">
              Aprende sobre nuestra despensa botánica
            </h2>
            <p className="font-sans text-xl text-on-surface-variant">
              Solo ingredientes que la tierra nos ofrece generosamente.
            </p>
          </div>
          <a
            href="/jardin-digital"
            className="hidden md:inline-block border-2 border-primary text-primary font-sans text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-primary hover:text-white transition-all duration-300 shrink-0 ml-8"
          >
            LEER MÁS
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {ingredients.map((ingredient, index) => {
            const progress = cardProgress[index] || 0;

            return (
              <div
                key={index}
                className="glass-card aspect-square rounded-3xl overflow-hidden relative group"
                style={{
                  opacity: progress,
                  transform: `translateY(${(1 - progress) * 60}px) scale(${0.85 + progress * 0.15})`,
                  transition: 'none',
                }}
              >
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src={ingredient.image}
                  alt={ingredient.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-earth/60 to-transparent flex items-end p-6">
                  <span className="text-white font-serif text-xl">
                    {ingredient.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extra bottom space to finish the last card reveal */}
      <div className="h-[30vh]" />
    </section>
  );
}
