'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ArticleFormData {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image: string;
  imageAlt: string;
}

export default function ArticleForm({ successHref = '/admin/contenido' }: { successHref?: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    category: '',
    excerpt: '',
    content: '',
    image: '',
    imageAlt: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear artículo');
      }

      router.push(successHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-4xl text-on-surface mb-8">
          Nuevo Artículo
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block font-sans text-sm font-semibold text-on-surface mb-2">
              Título
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-lg font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block font-sans text-sm font-semibold text-on-surface mb-2">
              Categoría
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-lg font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block font-sans text-sm font-semibold text-on-surface mb-2">
              Extracto
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-lg font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="block font-sans text-sm font-semibold text-on-surface mb-2">
              Contenido
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-lg font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              rows={12}
              required
            />
            <p className="mt-1 text-xs text-on-surface-variant">
              Usá **texto** para negritas, ### para subtítulos, y - para listas
            </p>
          </div>

          <div>
            <label className="block font-sans text-sm font-semibold text-on-surface mb-2">
              URL de Imagen
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-lg font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block font-sans text-sm font-semibold text-on-surface mb-2">
              Descripción de Imagen (alt text)
            </label>
            <input
              type="text"
              value={formData.imageAlt}
              onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
              className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-lg font-sans text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-primary text-white rounded-full font-sans text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Crear borrador'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 bg-white/50 text-on-surface rounded-full font-sans text-sm font-bold uppercase tracking-wider hover:bg-white/70 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
