'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { PlantRecord } from '@/lib/db/repository/plant';

interface PlantDetailProps {
  plant: PlantRecord;
}

export default function PlantDetail({ plant }: PlantDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <article>
      {/* Header */}
      <header className="mb-12">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-sans text-xs font-bold uppercase tracking-widest rounded-full mb-4">
          {plant.family}
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-primary mb-3">
          {plant.commonName}
        </h1>
        <p className="font-sans text-lg text-on-surface-variant italic">
          {plant.scientificName}
        </p>
      </header>

      {/* Image Gallery */}
      {plant.images && plant.images.length > 0 && (
        <div className="mb-16">
          {/* Main Image */}
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-4 bg-surface-container">
            <img
              src={plant.images[selectedImage].url}
              alt={plant.images[selectedImage].alt}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {plant.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {plant.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    idx === selectedImage
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Description */}
          {plant.description && (
            <section>
              <h2 className="font-serif text-2xl text-primary mb-4">Descripción</h2>
              <p className="font-sans text-on-surface-variant leading-relaxed">
                {plant.description}
              </p>
            </section>
          )}

          {/* Properties */}
          {(plant.properties.oral.length > 0 || plant.properties.topical.length > 0) && (
            <section>
              <h2 className="font-serif text-2xl text-primary mb-6">Propiedades</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {plant.properties.oral.length > 0 && (
                  <div className="bg-surface-container/50 rounded-xl p-6">
                    <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-primary mb-3">
                      Uso Oral
                    </h3>
                    <ul className="space-y-2">
                      {plant.properties.oral.map((prop) => (
                        <li key={prop} className="font-sans text-sm text-on-surface-variant flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {prop}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {plant.properties.topical.length > 0 && (
                  <div className="bg-surface-container/50 rounded-xl p-6">
                    <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-primary mb-3">
                      Uso Tópico
                    </h3>
                    <ul className="space-y-2">
                      {plant.properties.topical.map((prop) => (
                        <li key={prop} className="font-sans text-sm text-on-surface-variant flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {prop}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Compounds */}
          {plant.compounds.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl text-primary mb-4">Compuestos Activos</h2>
              <div className="bg-surface-container/50 rounded-xl p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plant.compounds.map((compound) => (
                    <div key={compound.name} className="font-sans text-sm text-on-surface-variant flex items-baseline gap-2">
                      <span className="text-primary font-bold">{compound.name}</span>
                      {compound.percentage && (
                        <span className="text-on-surface-variant/60 text-xs">
                          {compound.percentage}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Extracts */}
          {plant.availableExtracts.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl text-primary mb-4">Extractos Disponibles</h2>
              <div className="space-y-3">
                {plant.availableExtracts.map((extract) => (
                  <div
                    key={extract.type}
                    className="bg-surface-container/50 rounded-xl p-4"
                  >
                    <h3 className="font-sans text-sm font-bold text-primary mb-1">
                      {extract.type}
                    </h3>
                    {extract.description && (
                      <p className="font-sans text-sm text-on-surface-variant">
                        {extract.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          {/* Quick Facts */}
          <div className="bg-surface-container/50 rounded-xl p-6 sticky top-24">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-primary mb-4">
              Ficha Técnica
            </h3>

            <dl className="space-y-4">
              <div>
                <dt className="font-sans text-xs font-bold uppercase tracking-wider text-on-surface-variant/60">
                  Familia
                </dt>
                <dd className="font-sans text-sm text-on-surface mt-1">{plant.family}</dd>
              </div>

              {plant.species && (
                <div>
                  <dt className="font-sans text-xs font-bold uppercase tracking-wider text-on-surface-variant/60">
                    Especie
                  </dt>
                  <dd className="font-sans text-sm text-on-surface mt-1 italic">{plant.species}</dd>
                </div>
              )}

              <div>
                <dt className="font-sans text-xs font-bold uppercase tracking-wider text-on-surface-variant/60">
                  Partes Usadas
                </dt>
                <dd className="font-sans text-sm text-on-surface mt-1">
                  {plant.usedParts.join(', ')}
                </dd>
              </div>
            </dl>

            {/* Contraindications */}
            {plant.contraindications.length > 0 && (
              <div className="mt-6 pt-6 border-t border-surface-border/50">
                <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-red-600 mb-3">
                  Contraindicaciones
                </h4>
                <ul className="space-y-2">
                  {plant.contraindications.map((contra) => (
                    <li
                      key={contra}
                      className="font-sans text-xs text-on-surface-variant flex items-start gap-2"
                    >
                      <span className="text-red-400 mt-0.5 flex-shrink-0">⚠</span>
                      {contra}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
