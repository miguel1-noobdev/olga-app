import React from 'react';

export default function JardinFilters() {
  return (
    <section className="bg-surface-container/50 h-20 px-6 md:px-16 sticky top-0 z-40 backdrop-blur-sm border-y border-surface-border/10 flex items-center">
      <div className="max-w-[1280px] mx-auto w-full flex items-center justify-center gap-6">
        {/* Filtros por propiedad */}
        <div className="flex items-center gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
          <button className="whitespace-nowrap px-6 py-2 rounded-full font-sans text-sm font-bold uppercase tracking-wider
                             bg-primary text-surface
                             shadow-[0_3px_0_#1a5c2a,0_5px_10px_rgba(26,47,35,0.2)]
                             hover:-translate-y-0.5 hover:shadow-[0_4px_0_#1a5c2a,0_7px_14px_rgba(26,47,35,0.25)]
                             active:translate-y-0.5 active:shadow-[0_1px_0_#1a5c2a,0_2px_4px_rgba(26,47,35,0.2)]
                             transition-all duration-100">
            Todas
          </button>
          <button className="whitespace-nowrap px-6 py-2 rounded-full font-sans text-sm font-bold uppercase tracking-wider
                             bg-white text-on-surface-variant
                             shadow-[0_3px_0_#c7d6c4,0_5px_10px_rgba(26,47,35,0.1)]
                             hover:-translate-y-0.5 hover:shadow-[0_4px_0_#c7d6c4,0_7px_14px_rgba(26,47,35,0.15)]
                             active:translate-y-0.5 active:shadow-[0_1px_0_#c7d6c4,0_2px_4px_rgba(26,47,35,0.1)]
                             transition-all duration-100">
            Digestivas
          </button>
          <button className="whitespace-nowrap px-6 py-2 rounded-full font-sans text-sm font-bold uppercase tracking-wider
                             bg-white text-on-surface-variant
                             shadow-[0_3px_0_#c7d6c4,0_5px_10px_rgba(26,47,35,0.1)]
                             hover:-translate-y-0.5 hover:shadow-[0_4px_0_#c7d6c4,0_7px_14px_rgba(26,47,35,0.15)]
                             active:translate-y-0.5 active:shadow-[0_1px_0_#c7d6c4,0_2px_4px_rgba(26,47,35,0.1)]
                             transition-all duration-100">
            Relajantes
          </button>
          <button className="whitespace-nowrap px-6 py-2 rounded-full font-sans text-sm font-bold uppercase tracking-wider
                             bg-white text-on-surface-variant
                             shadow-[0_3px_0_#c7d6c4,0_5px_10px_rgba(26,47,35,0.1)]
                             hover:-translate-y-0.5 hover:shadow-[0_4px_0_#c7d6c4,0_7px_14px_rgba(26,47,35,0.15)]
                             active:translate-y-0.5 active:shadow-[0_1px_0_#c7d6c4,0_2px_4px_rgba(26,47,35,0.1)]
                             transition-all duration-100">
            Respiratorias
          </button>
          <button className="whitespace-nowrap px-6 py-2 rounded-full font-sans text-sm font-bold uppercase tracking-wider
                             bg-white text-on-surface-variant
                             shadow-[0_3px_0_#c7d6c4,0_5px_10px_rgba(26,47,35,0.1)]
                             hover:-translate-y-0.5 hover:shadow-[0_4px_0_#c7d6c4,0_7px_14px_rgba(26,47,35,0.15)]
                             active:translate-y-0.5 active:shadow-[0_1px_0_#c7d6c4,0_2px_4px_rgba(26,47,35,0.1)]
                             transition-all duration-100">
            Antiinflamatorias
          </button>
        </div>
      </div>
    </section>
  );
}
