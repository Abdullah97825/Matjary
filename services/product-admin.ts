import { ProductFormData, ProductUpdateData, ProductWithImages } from "@/types/products";
import { PaginatedResponse } from "@/types/pagination";
import { Tag } from "@prisma/client";


export const productAdminService = {
  getAll: async (
    page: number,
    perPage: number,
    search?: string
  ): Promise<PaginatedResponse<ProductWithImages>> => {
    const searchParam = search ? `&search=${search}` : '';
    const res = await fetch(
      `/api/admin/products?page=${page}&per_page=${perPage}${searchParam}`
    );
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
  },

  getById: async (id: string): Promise<ProductWithImages> => {
    const res = await fetch(`/api/admin/products/${id}`);
    if (!res.ok) throw new Error("Failed to fetch product");
    return res.json();
  },

  create: async (data: ProductFormData): Promise<ProductWithImages> => {
    console.log('[CREATE_PRODUCT] Creating product with data:', data)

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        categoryId: data.categoryId,
        brandId: data.brandId,
        images: data.images,
        attachments: data.attachments,
        tags: data.tags,
        discountType: data.discountType,
        discountAmount: data.discountAmount,
        discountPercent: data.discountPercent,
        thumbnailId: data.thumbnailId,
        public: data.public,
        isFeatured: data.isFeatured,
        negotiablePrice: data.negotiablePrice,
        hidePrice: data.hidePrice,
        hideStock: data.hideStock,
        useStock: data.useStock
      })
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "Failed to create product")
    }

    await clearTracking([...(data.images || []), ...(data.attachments?.map(a => a.url) || [])]);

    return res.json()
  },

  update: async (id: string, data: ProductFormData): Promise<ProductWithImages> => {
    console.log('[UPDATE_PRODUCT] Sending update request:', {
      id,
      data,
      endpoint: `/api/admin/products/${id}`
    });

    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('[UPDATE_PRODUCT] Error response:', errorData);
      throw new Error(errorData.message || "Failed to update product");
    }

    const updatedProduct = await res.json();
    console.log('[UPDATE_PRODUCT] Successfully updated:', updatedProduct);
    return updatedProduct;
  },

  delete: async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete product");
    return res.json();
  },

  uploadImage: async (productId: string | null, file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('productId', productId || '')

    const res = await fetch('/api/admin/products/upload', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "Failed to upload image")
    }
    const { url } = await res.json()

    await clearTracking([url]);

    return url
  },

  deleteImage: async (url: string): Promise<{ fileDeleted: boolean }> => {
    const filename = url.split('/').pop()
    console.log('Deleting image with filename:', filename)
    if (!filename) throw new Error("Invalid image URL")

    const res = await fetch(`/api/admin/products/upload/${filename}`, {
      method: 'DELETE'
    })
    console.log('Delete image response status:', res.status)
    if (!res.ok) {
      const errorData = await res.json()
      console.error('Delete image error:', errorData)
      throw new Error("Failed to delete image")
    }
    const data = await res.json()
    console.log('Delete image response:', data)
    return data
  },

  uploadAttachment: async (productId: string | null, file: File): Promise<{ url: string; name: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    if (productId) {
      formData.append('productId', productId)
    }

    console.log('[UPLOAD_ATTACHMENT] Uploading file:', file.name)
    const res = await fetch('/api/admin/products/attachment', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const errorData = await res.json()
      console.error('[UPLOAD_ATTACHMENT] Error:', errorData)
      throw new Error("Failed to upload attachment")
    }
    const data = await res.json()
    console.log('[UPLOAD_ATTACHMENT] Response:', data)
    return data
  },

  deleteAttachment: async (url: string): Promise<{ fileDeleted: boolean; databaseDeleted: boolean }> => {
    const filename = url.split('/').pop()
    console.log('[DELETE_ATTACHMENT] Deleting with filename:', filename)
    if (!filename) throw new Error("Invalid attachment URL")

    const res = await fetch(`/api/admin/products/attachment/${filename}`, {
      method: 'DELETE'
    })
    console.log('[DELETE_ATTACHMENT] Response status:', res.status)
    if (!res.ok) {
      const errorData = await res.json()
      console.error('[DELETE_ATTACHMENT] Error:', errorData)
      throw new Error("Failed to delete attachment")
    }
    const data = await res.json()
    console.log('[DELETE_ATTACHMENT] Response:', data)
    return data
  },

  get: async (id: string): Promise<ProductWithImages | null> => {
    const res = await fetch(`/api/admin/products/${id}`)
    if (!res.ok) throw new Error("Failed to fetch product")
    const data = await res.json()
    return data
  },

  deleteProduct: async (id: string): Promise<void> => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => {
        // Handle case where response isn't valid JSON
        return { error: "Failed to delete product" };
      });

      if (errorData.type === "referenced_in_orders") {
        throw new Error("This product cannot be deleted because it's referenced in customer orders.");
      } else if (errorData.type === "has_reviews") {
        throw new Error("This product cannot be deleted because it has customer reviews.");
      } else {
        throw new Error(errorData.error || "Failed to delete product");
      }
    }
  },

  archiveProduct: async (id: string): Promise<{ success: boolean; warning?: string; affectedOrders?: string[] }> => {
    const res = await fetch(`/api/admin/products/${id}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => {
        return { error: "Failed to archive product" };
      });
      throw new Error(errorData.error || "Failed to archive product");
    }

    return res.json();
  },

  unarchiveProduct: async (id: string): Promise<void> => {
    const res = await fetch(`/api/admin/products/${id}/unarchive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => {
        return { error: "Failed to unarchive product" };
      });
      throw new Error(errorData.error || "Failed to unarchive product");
    }
  },

  getAllTags: async (): Promise<Tag[]> => {
    const res = await fetch('/api/admin/products/tags')
    if (!res.ok) throw new Error("Failed to fetch tags")
    return res.json()
  },

  getArchivedProducts: async (
    page: number,
    perPage: number,
    search?: string
  ): Promise<PaginatedResponse<ProductWithImages>> => {
    const searchParam = search ? `&search=${search}` : '';
    const res = await fetch(
      `/api/admin/products/archived?page=${page}&per_page=${perPage}${searchParam}`
    );
    if (!res.ok) throw new Error("Failed to fetch archived products");
    return res.json();
  },

  setThumbnail: async (productId: string, thumbnailId: string) => {
    const res = await fetch(`/api/admin/products/${productId}/thumbnail`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ thumbnailId })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to set thumbnail");
    }

    return res.json();
  }
};

const clearTracking = async (urls: string[]) => {
  await fetch('/api/admin/uploads/clear-tracking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls })
  });
}; 