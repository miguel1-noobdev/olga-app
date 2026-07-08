import React from 'react';
import PlantCard from './plant-card';
import type { PublicPlant } from '@/lib/jardin-digital/projection';

interface PlantGridProps {
  plants: PublicPlant[];
}

export default function PlantGrid({ plants }: PlantGridProps) {
  if (plants.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-on-surface-variant text-lg">
          No hay plantas disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {plants.map((plant) => (
        <PlantCard key={plant.id} plant={plant} />
      ))}
    </div>
  );
}
