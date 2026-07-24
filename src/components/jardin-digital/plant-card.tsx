import React from 'react';
import Link from 'next/link';
import type { PublicPlantCard } from '@/lib/jardin-digital/projection';
import ResilientImage from '@/components/ui/resilient-image';

interface PlantCardProps {
  plant: PublicPlantCard;
}

export default function PlantCard({ plant }: PlantCardProps) {
  const image = plant.images?.[0];

  return (
    <article className="group">
      {/* Imagen */}
      <div className="aspect-square rounded-xl overflow-hidden mb-6 bg-surface-container shadow-sm border border-surface-border/10">
        <ResilientImage
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          src={image?.url}
          alt={image?.alt || plant.commonName}
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
        <Link
          href={`/jardin-digital/${plant.slug}`}
          className="inline-flex items-center gap-2 pt-4 text-primary font-sans text-sm font-bold uppercase tracking-wider group-hover:underline underline-offset-8 transition-all"
        >
          Ver más
        </Link>
      </div>
    </article>
  );
}
