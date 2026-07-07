'use client';

import { useEffect, useRef, useState } from 'react';

export default function Products() {
  const [cardProgress, setCardProgress] = useState<Map<string, number>>(new Map());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const calculateProgress = () => {
      const newProgress = new Map<string, number>();
      
      cardRefs.current.forEach((ref, id) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          
          // Rango de animación: desde que aparece hasta que está en el centro
          const start = windowHeight; // Empieza cuando aparece desde abajo
          const end = windowHeight * 0.3; // Termina cuando está al 30% del viewport
          
          let progress = 0;
          
          if (rect.top < start && rect.top > end) {
            // Entre el borde inferior y el 30% del viewport
            const range = start - end;
            const position = start - rect.top;
            progress = position / range;
          } else if (rect.top <= end) {
            // Ya pasó el punto final de animación
            progress = 1;
          }
          
          newProgress.set(id, progress);
        }
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

  const lines = [
    {
      id: 'facial',
      category: 'CUIDADO DIARIO',
      title: 'Línea Facial',
      description:
        'Serums, tónicos e hidratantes formulados con extractos botánicos activos para restaurar la luminosidad y el equilibrio natural de tu rostro.',
      image: '/img/prd/linea-facial.jpg',
      size: 'large',
    },
    {
      id: 'corporal',
      category: 'NUTRICIÓN PROFUNDA',
      title: 'Línea Corporal',
      description:
        'Mantecas, aceites y exfoliantes que miman tu piel, dejándola suave y revitalizada.',
      image: '/img/prd/linea-corporal.jpg',
      size: 'medium',
    },
    {
      id: 'cabello',
      category: 'ECO-FRIENDLY',
      title: 'Línea Cabello',
      description:
        'Champús sólidos y mascarillas capilares libres de sulfatos y siliconas. Limpieza suave y nutrición intensa que respeta el cuero cabelludo.',
      image: '/img/prd/linea-cabello.jpg',
      size: 'wide',
    },
  ];

  return (
    <section id="productos" className="py-28 md:py-40 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-5xl text-primary mb-4">
            Líneas de Cuidado
          </h2>
          <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
            Nuestros productos están formulados con ingredientes 100% naturales,
            diseñados para nutrir profundamente respetando la fisiología de tu cuerpo.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {lines.map((line) => {
            const progress = cardProgress.get(line.id) || 0;
            
            // Escala: 0 a 0.3 (primer tercio), 0.3 a 0.7 (segundo tercio), 0.7 a 1 (tercer tercio)
            let scale = 0;
            if (progress < 0.3) {
              scale = (progress / 0.3) * 0.3;
            } else if (progress < 0.7) {
              scale = 0.3 + ((progress - 0.3) / 0.4) * 0.4;
            } else {
              scale = 0.7 + ((progress - 0.7) / 0.3) * 0.3;
            }
            
            // Opacidad: aparece gradualmente
            const opacity = Math.min(1, progress * 1.5);
            
            return (
              <div
                key={line.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(line.id, el);
                }}
                className={`
                  ${line.size === 'large' ? 'md:col-span-8' : ''}
                  ${line.size === 'medium' ? 'md:col-span-4' : ''}
                  ${line.size === 'wide' ? 'md:col-span-12' : ''}
                `}
              >
                <div
                  className={`
                    group bg-surface border border-surface-border rounded-2xl overflow-hidden 
                    hover:-translate-y-1 hover:shadow-xl 
                    flex flex-col
                    ${line.size === 'large' ? 'md:flex-row' : ''}
                    ${line.size === 'wide' ? 'md:flex-row-reverse' : ''}
                  `}
                  style={{
                    transform: `scale(${scale})`,
                    opacity: opacity,
                    transition: 'transform 0.05s linear, opacity 0.05s linear',
                  }}
                >
                  {/* Image */}
                  <div
                    className={`relative overflow-hidden
                      ${line.size === 'large' ? 'w-full md:w-1/2 h-64 md:h-auto' : ''}
                      ${line.size === 'medium' ? 'w-full h-48' : ''}
                      ${line.size === 'wide' ? 'w-full md:w-5/12 h-64 md:h-auto' : ''}
                    `}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${line.image}')` }}
                    />
                  </div>

                  {/* Content */}
                  <div
                    className={`p-8 md:p-12 flex flex-col justify-center
                      ${line.size === 'large' ? 'w-full md:w-1/2' : ''}
                      ${line.size === 'wide' ? 'w-full md:w-7/12' : ''}
                      ${line.size === 'medium' ? 'flex-grow' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-sans text-xs font-bold uppercase tracking-widest text-primary">
                        {line.category}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl md:text-3xl text-primary mb-4">
                      {line.title}
                    </h3>
                    <p className="font-sans text-base text-on-surface-variant mb-8 flex-grow">
                      {line.description}
                    </p>
                    <a
                      href={`#${line.id}`}
                      className="font-sans text-sm font-bold uppercase tracking-widest text-primary hover:text-secondary flex items-center gap-2 transition-colors w-fit"
                    >
                      Ver productos
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
