import React, { useState } from 'react';

const TS = [
  '/images/hero_trio.png',
  '/assets/hero_trio-B1Hofrw0.png',
  'https://hero-workshop-ax.ai.studio/assets/hero_trio-B1Hofrw0.png',
  '/images/hero_trio_clean.png',
];

interface ImageWithFallbackProps {
  sources: string[];
  alt: string;
  className?: string;
}

export function ImageWithFallback({ sources, alt, className = '' }: ImageWithFallbackProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentSrc = sources[sourceIndex] || sources[0];

  const handleError = () => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((prev) => prev + 1);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      onLoad={() => setIsLoaded(true)}
      onError={handleError}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-90'} transition-opacity duration-200`}
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}

export function HeroTrioVisual({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses =
    size === 'sm' ? 'h-44 sm:h-52' : size === 'lg' ? 'h-72 sm:h-84' : 'h-56 sm:h-64';

  return (
    <div
      className={`relative ${sizeClasses} w-full mx-auto flex items-center justify-center select-none ${className}`}
    >
      <div className="absolute -bottom-2 w-5/6 h-6 bg-gradient-to-r from-transparent via-blue-500/25 to-transparent blur-lg rounded-full pointer-events-none" />
      <ImageWithFallback
        sources={TS}
        alt="Hero Workshop 2.0 Trio"
        className="w-full h-full max-w-xl object-contain drop-shadow-2xl select-none pointer-events-none transition-transform hover:scale-[1.03]"
      />
    </div>
  );
}
