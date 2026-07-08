import React from 'react';
import JardinNavbar from '@/components/jardin-digital/jardin-navbar';
import JardinHomepage from '@/components/jardin-digital/jardin-homepage';
import JardinFooter from '@/components/jardin-digital/jardin-footer';
import { connectToDatabase } from '@/lib/db/connect';
import { createPlantRepository } from '@/lib/db/repository/plant';
import { toPublicPlantCard } from '@/lib/jardin-digital/projection';

export default async function JardinDigitalPage() {
  await connectToDatabase();
  const repo = createPlantRepository();
  const plants = await repo.findAll();
  const cardPlants = plants.map(toPublicPlantCard);

  return (
    <>
      <JardinNavbar />
      <JardinHomepage plants={cardPlants} />
      <JardinFooter />
    </>
  );
}
