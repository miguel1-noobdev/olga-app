import { FlaskIcon, RecycleIcon, WrenchIcon } from '@/components/ui/icons';

export default function Metodos() {
  const principles = [
    {
      icon: <WrenchIcon className="w-6 h-6" />,
      title: 'Hecho a Mano',
      text: 'Hago lotes pequeños para garantizar la máxima frescura y potencia de cada ingrediente.',
    },
    {
      icon: <FlaskIcon className="w-6 h-6" />,
      title: 'Ciencia Botánica',
      text: 'Fusiono saberes ancestrales con métodos modernos de extracción ecológica.',
    },
    {
      icon: <RecycleIcon className="w-6 h-6" />,
      title: 'Sin Huella',
      text: 'Uso envases de vidrio infinitamente reciclables y embalajes libres de plástico.',
    },
  ];

  return (
    <section
      id="metodos"
      className="bg-surface-container/30 min-h-[750px] flex flex-col justify-center px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
        {/* Content */}
        <div className="flex-1 order-2 md:order-1">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="font-serif text-4xl md:text-5xl text-primary leading-tight">
                La Belleza del Proceso Lento y Artesanal
              </h2>
          <p className="font-sans text-xl text-on-surface-variant">
            Cada producto de Botánica Esencial nace en mi pequeño taller,
            donde el tiempo se detiene para dejar que la naturaleza actúe.
            No soy una fábrica; soy artesana del bienestar.
          </p>
            </div>
            <ul className="space-y-6">
              {principles.map((principle, index) => (
                <li key={index} className="flex items-start gap-4">
                  <span className="text-primary bg-primary/10 p-3 rounded-full">
                    {principle.icon}
                  </span>
                  <div>
                    <h4 className="font-bold text-on-surface font-sans text-sm font-bold uppercase tracking-wider">
                      {principle.title}
                    </h4>
                    <p className="text-on-surface-variant font-sans text-lg">
                      {principle.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 order-1 md:order-2">
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 border border-secondary rounded-full -z-10 opacity-50" />
            <img
              className="w-full h-auto rounded-[40px] shadow-xl rotate-2 hover:rotate-0 transition-all duration-500"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAh_nP1yecGnKz7jaGsTgtIiNLPty1bvg1qNEd5PbXszbbX6Sw72CQyF3gmeDxvBUa83UE1tRu3abwiWtB552uRwjJkoY51ZUUvg6vV85qkLlI_S3Q_2cy6geeRE4jADgpVl0nE45G2rsV7eU7Pt-l7gF8T88vwS3spCNhZEDTRFr9bhzQ5DXbs_DDeyUTuib4l030XV4iLchxh6kk_X2atVFViJvuDiXZRJ73ffERq6o9Mq2wH7JARCa1mzJYLZeEQT5fP5cIg6UbU"
              alt="Manos artesanas mezclando ingredientes botánicos en un mortero"
            />
            <div className="absolute bottom-10 -left-10 glass-card p-6 rounded-2xl max-w-[240px]">
              <p className="font-serif text-primary text-2xl italic">
                &quot;Desde la semilla hasta tu piel&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
