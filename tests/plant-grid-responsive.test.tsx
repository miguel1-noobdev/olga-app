import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import PlantGrid from '@/components/jardin-digital/plant-grid';

describe('PlantGrid - Responsive and States', () => {
  it('shows empty state message when no plants', () => {
    const html = renderToStaticMarkup(<PlantGrid plants={[]} />);
    expect(html).toContain('No hay plantas');
  });

  it('uses responsive grid classes for mobile, tablet, desktop', () => {
    const html = renderToStaticMarkup(
      <PlantGrid
        plants={[
          {
            id: '1',
            commonName: 'Test',
            scientificName: 'Test',
            family: 'Test',
            usedParts: [],
            compounds: [],
            properties: { oral: [], topical: [] },
            contraindications: [],
            availableExtracts: [],
            slug: 'test',
          },
        ]}
      />
    );
    expect(html).toContain('grid-cols-1');
    expect(html).toContain('sm:grid-cols-2');
    expect(html).toContain('lg:grid-cols-3');
  });
});
