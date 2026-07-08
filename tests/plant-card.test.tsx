import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PlantCard from '@/components/jardin-digital/plant-card';
import type { PublicPlant } from '@/lib/jardin-digital/projection';

const mockPlant: PublicPlant = {
  id: 'plant-1',
  commonName: 'Lavanda',
  scientificName: 'Lavandula angustifolia Mill.',
  family: 'Lamiaceae',
  usedParts: ['Sumidades floridas'],
  compounds: [{ name: 'Linalol', percentage: '20-45%' }],
  properties: {
    oral: ['Ansiolítico'],
    topical: ['Antiinflamatorio'],
  },
  contraindications: ['Hipersensibilidad a la planta'],
  availableExtracts: [{ type: 'Aceite Esencial' }],
  description: 'Planta aromática mediterránea conocida por sus propiedades relajantes',
  slug: 'lavandula-angustifolia-mill',
  images: [
    {
      url: 'https://example.com/lavanda.jpg',
      alt: 'Flores de lavanda',
    },
  ],
};

describe('PlantCard', () => {
  it('renders plant common name', () => {
    const html = renderToStaticMarkup(<PlantCard plant={mockPlant} />);
    expect(html).toContain('Lavanda');
  });

  it('renders scientific name in italic', () => {
    const html = renderToStaticMarkup(<PlantCard plant={mockPlant} />);
    expect(html).toContain('Lavandula angustifolia Mill.');
    expect(html).toContain('italic');
  });

  it('renders family badge', () => {
    const html = renderToStaticMarkup(<PlantCard plant={mockPlant} />);
    expect(html).toContain('Lamiaceae');
  });

  it('renders description', () => {
    const html = renderToStaticMarkup(<PlantCard plant={mockPlant} />);
    expect(html).toContain('Planta aromática mediterránea');
  });

  it('renders plant image with alt text', () => {
    const html = renderToStaticMarkup(<PlantCard plant={mockPlant} />);
    expect(html).toContain('src="https://example.com/lavanda.jpg"');
    expect(html).toContain('alt="Flores de lavanda"');
  });

  it('renders "Ver más" link', () => {
    const html = renderToStaticMarkup(<PlantCard plant={mockPlant} />);
    expect(html).toContain('Ver más');
  });

  it('handles plant without images gracefully', () => {
    const plantWithoutImages: PublicPlant = {
      ...mockPlant,
      images: [],
    };
    const html = renderToStaticMarkup(<PlantCard plant={plantWithoutImages} />);
    expect(html).toContain('Lavanda');
  });

  it('handles plant without description gracefully', () => {
    const plantWithoutDescription: PublicPlant = {
      ...mockPlant,
      description: undefined,
    };
    const html = renderToStaticMarkup(<PlantCard plant={plantWithoutDescription} />);
    expect(html).toContain('Lavanda');
  });
});
