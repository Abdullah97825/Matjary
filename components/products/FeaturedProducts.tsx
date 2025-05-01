"use client";

import { useRef, useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductThumbnail } from '@/types/products';

interface FeaturedProductsProps {
  products: ProductThumbnail[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  // Check scroll buttons visibility
  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10); // 10px threshold
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollButtons();
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);

      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (products.length === 0) {
    return null; // Or return a message if you prefer
  }

  return (
    <div className="relative w-full">
      {/* Navigation Buttons */}
      {showLeftButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -left-4 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full bg-white/80 shadow-lg hover:bg-white"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}

      {showRightButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-4 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full bg-white/80 shadow-lg hover:bg-white"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}

      {/* Products Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none'
        }}
      >
        {products.map((product) => (
          <div 
            key={product.id} 
            className="w-[280px] flex-shrink-0 snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
} 