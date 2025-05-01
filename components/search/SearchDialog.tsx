"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useDebounce } from '@/hooks/useDebounce';
import { productService } from '@/services/product';
import { convertPrice } from '@/utils/cart';
import { ProductThumbnail } from '@/types/products';
import { calculateDiscountedPrice, getDiscountLabel } from '@/utils/price';
import { formatPrice } from '@/utils/format';

interface SearchResult extends Omit<ProductThumbnail, 'discountType'> {
  price: number;
  discountType: 'FLAT' | 'PERCENTAGE' | 'BOTH' | 'NONE' | null;
}

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const searchProducts = async () => {
      if (!debouncedSearch.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { products } = await productService.search({
          search: debouncedSearch,
          per_page: 5
        });
        setResults(products.map(product => ({
          ...product,
          price: convertPrice(product.price)
        })));
      } catch (error) {
        console.error('Failed to fetch search results:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchProducts();
  }, [debouncedSearch]);

  const handleSearch = () => {
    router.push(`/products?search=${encodeURIComponent(search)}`);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selected = results[selectedIndex];
          router.push(`/products/${selected.id}`);
          setOpen(false);
        } else {
          handleSearch();
        }
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-9 md:w-80 md:justify-start text-muted-foreground">
          <SearchIcon className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Search products...</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[600px] flex flex-col gap-0">
        <DialogHeader className="px-4 py-2">
          <DialogTitle>Search Products</DialogTitle>
          <DialogDescription>
            Search for products by name or description
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden px-4">
          <div className="flex items-center gap-2 py-2">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              variant="secondary"
              size="icon"
              onClick={handleSearch}
            >
              <SearchIcon className="h-4 w-4" />
            </Button>
            {isLoading && <LoadingSpinner size="sm" />}
          </div>

          <div className="overflow-y-auto h-[calc(600px-180px)] rounded-md border">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" />
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y">
                {results.map((product, index) => {
                  const discountedPrice = calculateDiscountedPrice(product);
                  const discountLabel = getDiscountLabel(product);

                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "flex items-center gap-4 p-4 cursor-pointer hover:bg-accent",
                        selectedIndex === index && "bg-accent"
                      )}
                      onClick={() => {
                        router.push(`/products/${product.id}`);
                        setOpen(false);
                      }}
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-md">
                        <img
                          src={product.thumbnail?.url || '/images/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <div className="flex items-center gap-2">
                          {product.hidePrice ? (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                              Contact for Price
                            </span>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-gray-900">
                                {formatPrice(discountedPrice)}
                              </p>
                              {discountedPrice < product.price && (
                                <p className="text-sm text-gray-500 line-through">
                                  {formatPrice(product.price)}
                                </p>
                              )}
                              {discountLabel && (
                                <span className="text-xs text-red-500">
                                  {discountLabel}
                                </span>
                              )}
                              {product.negotiablePrice && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md font-medium">
                                  Negotiable
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : search ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No products found
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Start typing to search products
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 