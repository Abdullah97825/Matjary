import { CategoryType, CategoryFormData, CategoryUpdateData } from "@/types/category"
import { PaginatedResponse } from "@/types/pagination";
import { serializeCategory } from '@/utils/serialization';

export const categoryService = {
  getAll: async (page: number, perPage: number): Promise<PaginatedResponse<CategoryType>> => {
    const res = await fetch(`/api/admin/categories?page=${page}&per_page=${perPage}`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    return {
      data: data.items.map(serializeCategory),
      meta: {
        current_page: page,
        last_page: Math.ceil(data.total / perPage),
        per_page: perPage,
        total: data.total
      }
    };
  },

  getById: async (id: string): Promise<CategoryType> => {
    const res = await fetch(`/api/admin/categories/${id}`);
    if (!res.ok) throw new Error("Failed to fetch category");
    return res.json();
  },

  create: async (data: CategoryFormData): Promise<CategoryType> => {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to create category");
    }

    if (data.imageUrl) {
      await clearTracking([data.imageUrl]);
    }

    return res.json();
  },

  update: async (id: string, data: CategoryUpdateData): Promise<CategoryType> => {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to update category");
    }

    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to delete category");
    }
  },

  uploadImage: async (categoryId: string | null, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', categoryId || '');

    const res = await fetch('/api/admin/categories/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to upload category image");
    }

    const { url } = await res.json();

    await clearTracking([url]);

    return url;
  }
}

const clearTracking = async (urls: string[]) => {
  await fetch('/api/admin/uploads/clear-tracking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls })
  });
}; 