import { ProductWithImages, ProductThumbnail } from '@/types/products';

interface SearchResponse {
  products: ProductThumbnail[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const productService = {
  async search({
    category,
    brand,
    search,
    page = 1,
    per_page = 12
  }: {
    category?: string;
    brand?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<SearchResponse> {
    const searchParams = new URLSearchParams();
    if (category) searchParams.set('category', category);
    if (brand) searchParams.set('brand', brand);
    if (search) searchParams.set('search', search);
    if (page) searchParams.set('page', page.toString());
    if (per_page) searchParams.set('per_page', per_page.toString());

    const response = await fetch(`/api/products?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return response.json();
  }
}; 