"use client";

import { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { ProductThumbnail } from '@/types/products';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PaginationState } from '@/types/pagination';
import { productService } from '@/services/product';

interface ProductGridProps {
  initialProducts: ProductThumbnail[];
  categoryId?: string;
  brandId?: string;
  searchTerm?: string;
  initialPagination?: PaginationState;
}

export function ProductGrid({
  initialProducts,
  categoryId,
  brandId,
  searchTerm,
  initialPagination
}: ProductGridProps) {
  const [products, setProducts] = useState<ProductThumbnail[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination ?? {
      pageIndex: 0,
      pageSize: 12,
      pageCount: Math.ceil(initialProducts.length / 12),
      total: initialProducts.length
    }
  );


  const fetchProducts = async () => {
    console.log("########### Refetching ###############")
    setIsLoading(true);
    setError(null);
    try {
      const { products, meta } = await productService.search({
        category: categoryId,
        brand: brandId,
        search: searchTerm,
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize
      });

      setProducts(products);
      setPagination(prev => ({
        ...prev,
        pageCount: Math.ceil(meta.total / pagination.pageSize),
        total: meta.total
      }));
    } catch (error) {
      setError('Failed to fetch products. Please try again.');
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // console.log("[Received Serialized Products in Grid]: ", products);

  useEffect(() => {
    // alert(JSON.stringify(products[products.length - 2]))
    if (pagination.pageIndex === 0 && !categoryId && !brandId && !searchTerm && products === initialProducts) {
      // Only use initial products for first load with no filters
      return;
    }
    fetchProducts();
  }, [categoryId, brandId, searchTerm, pagination.pageIndex]);

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-gray-600">No products found</p>
        {(categoryId || brandId || searchTerm) && (
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm">
            <div className="rounded-lg bg-white/90 p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <LoadingSpinner size="sm" />
                <span className="text-sm font-medium">Loading Products...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {pagination.pageCount > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.pageIndex === 0 || isLoading}
            onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.pageIndex + 1} of {pagination.pageCount}
          </span>
          <Button
            variant="outline"
            disabled={pagination.pageIndex === pagination.pageCount - 1 || isLoading}
            onClick={() => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
} 