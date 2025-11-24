import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MemorialSlideshowProps {
  photos: string[];
  autoPlayInterval?: number;
}

export default function MemorialSlideshow({ photos, autoPlayInterval = 5000 }: MemorialSlideshowProps) {
  const safePhotos = photos || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (safePhotos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % safePhotos.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [safePhotos.length, autoPlayInterval]);

  if (safePhotos.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + safePhotos.length) % safePhotos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % safePhotos.length);
  };

  return (
    <div 
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}
    >
      <h2 className="text-lg font-semibold text-foreground mb-4">Memorial Photos</h2>
      
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/10">
        <img
          src={safePhotos[currentIndex]}
          alt={`Memorial photo ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: 1 }}
        />
        
        {safePhotos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all hover:bg-white/30"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)'
              }}
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all hover:bg-white/30"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)'
              }}
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
            
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {safePhotos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: index === currentIndex 
                      ? '#2DB5A8' 
                      : 'rgba(255, 255, 255, 0.4)'
                  }}
                  aria-label={`Go to photo ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {safePhotos.length > 1 && (
        <p className="text-xs text-center text-foreground/60 mt-3">
          {currentIndex + 1} of {safePhotos.length}
        </p>
      )}
    </div>
  );
}
