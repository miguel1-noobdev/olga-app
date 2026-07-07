'use client';

import React, { useState } from 'react';

interface PlantImage {
  url: string;
  alt: string;
}

interface ImageGalleryProps {
  images: PlantImage[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div className="mb-16">
      {/* Main Image */}
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-4 bg-surface-container">
        <img
          src={images[selectedImage].url}
          alt={images[selectedImage].alt}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
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
  );
}
