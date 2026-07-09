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
            "Creo firmemente que lo que pongo en mi piel debe ser tan
            nutritivo como lo que como."
          </p>
        </div>

        {/* Image */}
        <div className="order-1 md:order-2">
          <div className="relative">
            <img
              className="w-full aspect-square object-cover rounded-full border-8 border-white shadow-2xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa0E6x3SeZtdTSApD0kdxT9N-e0NY6V8p4xVrUgj-y8w9-nJg7LLT3--gF9Bd3gJaXtp072C5tv9IZgvA1gCl8fHbmgOM4pEYtlMDarSss9ZiklVM9dD5Mj2HOF7_ThrSU0SZwI2oOHlEmv_eccUuByDhtH5fLKjU2FB89W6WaNA_RkIrGWGElxn-RxuNhpGaQoffyWvHQsitxYvKnwQqIU7uGeC5oQ08hH-Q61Wr7GJ0nxOsJFegVCgcEg_5MZ6rUSgryM98-I0Y2"
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
