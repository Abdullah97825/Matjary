'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ProductImageType } from '@/types/products'

interface ProductImageCarouselProps {
  images: ProductImageType[];
  className?: string;
}

export function ProductImageCarousel({ images, className }: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)

  const navigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex(current => 
        current === 0 ? images.length - 1 : current - 1
      )
    } else {
      setCurrentIndex(current => 
        current === images.length - 1 ? 0 : current + 1
      )
    }
  }

  if (!images.length) {
    return (
      <div className={cn("relative aspect-square bg-muted", className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-muted-foreground">No image available</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={cn("group relative aspect-square", className)}>
        {/* Main Image */}
        <div className="relative h-full w-full">
          <img
            src={images[currentIndex].url}
            alt={`Product image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            // priority={currentIndex === 0}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => setShowLightbox(true)}
          >
            <Expand className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full bg-white/80 shadow-lg hover:bg-white opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => navigate('prev')}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full bg-white/80 shadow-lg hover:bg-white opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => navigate('next')}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-black/30 px-3 py-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  currentIndex === index ? "bg-white w-4" : "bg-white/50"
                )}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-3xl border-none bg-background/95 p-4">
          <DialogHeader>
            <DialogTitle className="sr-only">Product Image Gallery</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-square">
            <img
              src={images[currentIndex].url}
              alt={`Product image ${currentIndex + 1}`}
              className="w-full h-full object-contain"
            />
            {images.length > 1 && (
              <>
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
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 