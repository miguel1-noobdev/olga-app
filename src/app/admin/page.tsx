import Link from 'next/link';

export default function AdminPage() {
  return (
      <main className="min-h-full bg-surface px-6 py-10 md:px-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-4xl text-on-surface mb-8">
            Panel de Administración
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/admin/blog"
              className="bg-white/50 backdrop-blur-[10px] border border-white/20 rounded-xl p-8 hover:bg-white/70 transition-all"
            >
              <h2 className="font-serif text-2xl text-on-surface mb-2">
                Artículos del Blog
              </h2>
              <p className="font-sans text-base text-on-surface-variant">
                Crear, editar y gestionar artículos
              </p>
            </Link>

            <Link
              href="/admin/blog/nuevo"
              className="bg-primary/10 backdrop-blur-[10px] border border-primary/20 rounded-xl p-8 hover:bg-primary/20 transition-all"
            >
              <h2 className="font-serif text-2xl text-primary mb-2">
                Nuevo Artículo
              </h2>
              <p className="font-sans text-base text-on-surface-variant">
                Crear un nuevo artículo para el blog
              </p>
            </Link>

            <Link
              href="/admin/salud"
              className="bg-white/50 backdrop-blur-[10px] border border-white/20 rounded-xl p-8 hover:bg-white/70 transition-all"
            >
              <h2 className="font-serif text-2xl text-on-surface mb-2">
                Salud del sistema
              </h2>
              <p className="font-sans text-base text-on-surface-variant">
                Ver el estado seguro de las capacidades esenciales
              </p>
            </Link>

            <div className="bg-white/30 backdrop-blur-[10px] border border-white/20 rounded-xl p-8 opacity-50">
              <h2 className="font-serif text-2xl text-on-surface mb-2">
                Productos
              </h2>
              <p className="font-sans text-base text-on-surface-variant">
                Próximamente
              </p>
            </div>

            <div className="bg-white/30 backdrop-blur-[10px] border border-white/20 rounded-xl p-8 opacity-50">
              <h2 className="font-serif text-2xl text-on-surface mb-2">
                Laboratorio
              </h2>
              <p className="font-sans text-base text-on-surface-variant">
                Próximamente
              </p>
            </div>
          </div>
        </div>
      </main>
  );
}
