export default function Diario() {
  const articles = [
    {
      category: 'INGREDIENTES',
      categoryColor: 'text-primary',
      hoverColor: 'group-hover:text-primary',
      date: 'Mayo 15, 2026',
      title: 'El poder regenerativo de la Caléndula',
      excerpt:
        'Descubre por qué esta flor dorada es el pilar de nuestras fórmulas calmantes para pieles sensibles.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB_Cf78ywssjTWCKxvmE8X0_kCLFsJZaROXmSpN-dOhkBvLGY6-YBoaSi5RIXEnipxn7GdXaxWu8rLe_H4abRS0CUrZfjldSIZ3nKdDUmkVF8K3UchpOMpA-wfIgBPbbYMD4W9gwcgPGFaMDNoN_W---Hepav41Gdr2ilQhBDNk70oMBryPyW4E60zHaFvsJ_xuvmrA3T-nOjA6CSFDl2bABMS2mtOIhYyCAVZs7IQ_N8o8Pj3lm_kVZ-NR9bby8SKIehhdF6HXe-wX',
    },
    {
      category: 'RUTINAS',
      categoryColor: 'text-coffee',
      hoverColor: 'group-hover:text-coffee',
      date: 'Junio 10, 2026',
      title: 'Transición de temporada: Cuidados de Verano',
      excerpt:
        'A medida que el aire se enfría, tu piel necesita lípidos más ricos para mantener su barrera protectora intacta.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBCHDU41QFuN0d7ooKgR1RwNKrPSxRTFfdbDqDZR0E_YpsUgVSx_vDBZg4rVEq_RmvOG-_QfQ_eJ7GnYGodouUAZONUfPcTGLVbZ4SObTCkCfNiLqzxp3LxOR7Y1ziVeVxvIhRg9LuLCkmMli4lWgpSdC0XrAPR3T5KC2xgw4aJ_XF56_8i2gRCKFpNr75eEWj1POMfAsm-_BKRVN9zSEATRBjLt7eA2nPgEM1ztmsShlV6WyJNzqBIUmsIbUI6I4BLNHFJjwmdf5VE',
    },
    {
      category: 'TRANSPARENCIA',
      categoryColor: 'text-earth',
      hoverColor: 'group-hover:text-earth',
      date: 'Abril 20, 2026',
      title: 'Leyendo etiquetas: Qué evitar en cosmética',
      excerpt:
        'Una guía práctica para entender los INCI y tomar decisiones más conscientes para tu cuerpo y el planeta.',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDavCoJeRr5uz5_GKgvaX81cfKuJvJTux3lYpoOR7TOff0S0v3fjU-II-iO1y8Fabi6s-QFtFtQxGHd0zY3YRhZ2abr0GhksO0QX-GjCHtPREgh3tWKyya2w1oBad87Nnev-tnjleWevOBGAMkaDtEXBY6fvXHF1xcOFQa9kg7j-nPwv71c1xk9Ix7RNZjIkO_BoEYpjFNRqGzamL5vJ52lQ8sKd1aIHB9xRpqDekn0CApLzqGqIrQB5M0TJWzwesk1neXK_SXTeJvp',
    },
  ];

  return (
    <section
      id="diario"
      className="bg-[#A8B89C]/50 py-20 md:py-32 px-4 sm:px-6 lg:px-8 border-y border-gold-soft"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl md:text-5xl text-primary mb-4">
              Diario Botánico
            </h2>
            <p className="font-sans text-base text-on-surface-variant">
              Reflexiones sobre ingredientes naturales, rutinas conscientes y
              el arte de la formulación artesanal.
            </p>
          </div>
          <a
            href="#"
            className="border-2 border-primary text-primary font-sans text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-primary hover:text-on-primary transition-all duration-300 shrink-0"
          >
            LEER MÁS
          </a>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <article key={index} className="group cursor-pointer">
              {/* Image */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-6 border border-gold-soft">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${article.image}')` }}
                />
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 mb-3">
                <span
                  className={`font-sans text-xs font-bold uppercase tracking-widest ${article.categoryColor}`}
                >
                  {article.category}
                </span>
                <span className="w-1 h-1 rounded-full bg-gold-soft" />
                <span className="font-sans text-sm text-on-surface-variant">
                  {article.date}
                </span>
              </div>

              {/* Title */}
              <h3
                className={`font-serif text-2xl text-primary mb-3 ${article.hoverColor} transition-colors`}
              >
                {article.title}
              </h3>

              {/* Excerpt */}
              <p className="font-sans text-base text-on-surface-variant line-clamp-2">
                {article.excerpt}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
