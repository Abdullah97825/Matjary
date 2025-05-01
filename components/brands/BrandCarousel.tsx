'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandType } from '@/types/brand'
import { cn } from '@/lib/utils'

interface BrandCarouselProps {
    brands: BrandType[]
    className?: string
}

export function BrandCarousel({ brands, className }: BrandCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [showLeftButton, setShowLeftButton] = useState(false)
    const [showRightButton, setShowRightButton] = useState(false)

    const checkScrollButtons = () => {
        if (!scrollContainerRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
        setShowLeftButton(scrollLeft > 0)
        setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10)
    }

    useEffect(() => {
        const container = scrollContainerRef.current
        if (container) {
            checkScrollButtons()
            container.addEventListener('scroll', checkScrollButtons)
            window.addEventListener('resize', checkScrollButtons)
            return () => {
                container.removeEventListener('scroll', checkScrollButtons)
                window.removeEventListener('resize', checkScrollButtons)
            }
        }
    }, [])

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return
        const container = scrollContainerRef.current
        const scrollAmount = container.clientWidth * 0.8
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        })
    }

    return (
        <div className={cn("relative w-full", className)}>
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

            <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
                style={{
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    msOverflowStyle: 'none'
                }}
            >
                {brands.map((brand) => (
                    <Link
                        key={brand.id}
                        href={`/products?brand=${brand.id}`}
                        className="group relative aspect-square w-[200px] flex-shrink-0 snap-start overflow-hidden rounded-lg bg-muted"
                    >
                        {brand.imageUrl ? (
                            <img
                                src={brand.imageUrl}
                                alt={brand.name}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                                <span className="text-4xl text-primary/40">
                                    {brand.name.charAt(0)}
                                </span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                            <h3 className="text-lg font-semibold text-white">{brand.name}</h3>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
} 