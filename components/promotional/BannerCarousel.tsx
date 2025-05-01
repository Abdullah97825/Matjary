"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageIcon } from 'lucide-react';
import { Banner } from "@/types/banner";

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((current) => 
        current === banners.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const navigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex(current => 
        current === 0 ? banners.length - 1 : current - 1
      );
    } else {
      setCurrentIndex(current => 
        current === banners.length - 1 ? 0 : current + 1
      );
    }
  };

  if (!banners.length) {
    return (
      <div className="relative h-[500px] w-full bg-gray-100">
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 px-4 text-center">
          <div className="rounded-full bg-gray-200 p-4">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">No Promotional Banners</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are currently no promotional banners to display.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[500px] w-full overflow-hidden">
      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full bg-white/80 shadow-lg hover:bg-white"
        onClick={() => navigate('prev')}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full bg-white/80 shadow-lg hover:bg-white"
        onClick={() => navigate('next')}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Banners */}
      <div className="flex h-full transition-transform duration-500 ease-in-out" 
           style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {banners.map((banner) => (
          <div key={banner.id} className="relative h-full w-full flex-shrink-0">
            {banner.link ? (
              <Link href={banner.link} className="relative block h-full w-full">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  // priority
                />
              </Link>
            ) : (
              <div className="relative h-full w-full">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  // priority
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-black/30 px-3 py-2">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
} 