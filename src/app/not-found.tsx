import NotFoundState from '@/components/ui/not-found-state';

export default function NotFound() {
  return (
    <NotFoundState
      href="/"
      title="Página no encontrada"
      description="No encontramos la página que estás buscando."
      linkLabel="Volver al inicio"
    />
  );
}
