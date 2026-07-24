import NotFoundState from '@/components/ui/not-found-state';

export default function NotFound() {
  return (
    <NotFoundState
      href="/blog"
      title="Artículo no encontrado"
      description="El artículo que buscás no existe o ya no está disponible."
      linkLabel="Volver al blog"
    />
  );
}
