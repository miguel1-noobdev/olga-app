import React from 'react';
import JardinHero from './jardin-hero';
import JardinFilters from './jardin-filters';
import PlantGrid from './plant-grid';
import JardinCompromiso from './jardin-compromiso';
import type { PublicPlant } from '@/lib/jardin-digital/projection';

interface JardinHomepageProps {
  plants: PublicPlant[];
}

export default function JardinHomepage({ plants }: JardinHomepageProps) {
  return (
    <main className="pt-24">
      <JardinHero />
      <JardinFilters />
      <section className="py-20 px-6 md:px-16 max-w-[1280px] mx-auto">
        <PlantGrid plants={plants} />
      </section>
      <JardinCompromiso />
    </main>
  );
}
