import NotFoundState from '@/components/ui/not-found-state';

export default function NotFound() {
  return (
    <NotFoundState
      href="/admin"
      title="Recurso no encontrado"
      description="El recurso de administración que buscás no existe o ya no está disponible."
      linkLabel="Volver al panel"
    />
  );
}
