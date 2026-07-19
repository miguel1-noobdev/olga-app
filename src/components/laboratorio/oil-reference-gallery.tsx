'use client';

import { useEffect, useState } from 'react';

interface OilImage {
  url: string;
  alt: string;
}

export default function OilReferenceGallery({ images }: { images: OilImage[] }) {
  const [selectedImage, setSelectedImage] = useState<OilImage | null>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedImage(null);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  if (images.length === 0) {
    return <p className="rounded-lg border border-dashed border-outline-variant p-4 font-body text-sm text-on-surface-variant">No hay imágenes de referencia cargadas para este aceite.</p>;
  }

  return <>
    <div className="grid grid-cols-1 gap-4" aria-label="Galería de referencia">
      {images.map((image) => <button key={image.url} type="button" onClick={() => setSelectedImage(image)} aria-label={`Ampliar ${image.alt}`} className="block aspect-video overflow-hidden"><img src={image.url} alt={image.alt} className="h-full w-full object-cover" /></button>)}
    </div>
    {selectedImage && <div role="dialog" aria-modal="true" aria-label={`Vista ampliada de ${selectedImage.alt}`} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
      <button type="button" aria-label="Cerrar imagen ampliada" onClick={() => setSelectedImage(null)} className="absolute right-6 top-6 rounded-full border border-outline-variant/30 bg-surface-container/50 p-2 text-on-surface-variant hover:text-on-surface"><span aria-hidden="true" className="material-symbols-outlined text-3xl">close</span></button>
      <img src={selectedImage.url} alt={selectedImage.alt} className="max-h-full max-w-full rounded border border-outline-variant/20 object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
    </div>}
  </>;
}
