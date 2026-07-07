import React from 'react';
import type { PlantRecord } from '@/lib/db/repository/plant';

interface PlantCardProps {
  plant: PlantRecord;
}

export default function PlantCard({ plant }: PlantCardProps) {
  const imageUrl = plant.images?.[0]?.url || '/img/placeholder-plant.jpg';
  const imageAlt = plant.images?.[0]?.alt || plant.commonName;

  return (
    <article className="group">
      {/* Imagen */}
      <div className="aspect-square rounded-xl overflow-hidden mb-6 bg-surface-container shadow-sm border border-surface-border/10">
        <img
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          src={imageUrl}
          alt={imageAlt}
          loading="lazy"
        />
      </div>

      {/* Contenido */}
      <div className="space-y-2">
        {/* Badge de familia */}
        <span className="inline-block px-2 py-0.5 bg-surface-container text-on-surface-variant font-sans text-xs rounded-full">
          {plant.family}
        </span>

        {/* Nombre común */}
        <h3 className="font-serif text-2xl text-primary">
          {plant.commonName}
        </h3>

        {/* Nombre científico */}
        <p className="italic font-serif text-primary/70 text-lg">
          {plant.scientificName}
        </p>

        {/* Descripción */}
        {plant.description && (
          <p className="text-on-surface-variant line-clamp-2">
            {plant.description}
          </p>
        )}

        {/* Link Ver más */}
        <a
          href={`/jardin-digital/${plant.slug}`}
          className="inline-flex items-center gap-2 pt-4 text-primary font-sans text-sm font-bold uppercase tracking-wider group-hover:underline underline-offset-8 transition-all"
        >
          Ver más <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
      </div>
    </article>
  );
}
