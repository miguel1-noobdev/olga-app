import ResilientImage from '@/components/ui/resilient-image';

export default function Olga() {
  return (
    <section id="olga" className="min-h-[750px] flex flex-col justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* Content */}
        <div className="order-2 md:order-1 space-y-6">
          <span className="font-sans text-sm font-bold uppercase tracking-widest text-secondary">
            Detrás de mis fórmulas
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-primary">
            Soy Olga, tu alquimista botánica
          </h2>
          <p className="font-sans text-xl text-on-surface-variant">
            Botánica Esencial OB nació de mi pasión por las plantas y mi deseo
            de ofrecer una alternativa honesta al cuidado de la piel
            tradicional. Después de años estudiando herbología, decidí crear
            este pequeño taller donde la ciencia y la naturaleza se encuentran.
          </p>
          <p className="font-sans text-xl text-on-surface-variant italic border-l-4 border-secondary p-4 bg-secondary/10">
            &quot;Creo firmemente que lo que pongo en mi piel debe ser tan
            nutritivo como lo que como.&quot;
          </p>
        </div>

        {/* Image */}
        <div className="order-1 md:order-2">
          <div className="relative">
            <ResilientImage
              className="w-full aspect-square object-cover rounded-full border-8 border-white shadow-2xl"
              alt="Olga, fundadora de Botánica Esencial OB"
            />
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full flex items-center justify-center -rotate-12 border-4 border-white shadow-xl">
              <span className="text-white text-center font-bold text-sm">
                Desde
                <br />
                2018
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
