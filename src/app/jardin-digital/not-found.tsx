import NotFoundState from '@/components/ui/not-found-state';

export default function NotFound() {
  return (
    <NotFoundState
      href="/jardin-digital"
      title="Planta no encontrada"
      description="La planta que buscás no existe o ya no está disponible en el jardín digital."
      linkLabel="Volver al jardín digital"
    />
  );
}
