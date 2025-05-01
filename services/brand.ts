import { BrandType, BrandFormData, BrandUpdateData } from "@/types/brand"
import { PaginatedResponse } from "@/types/pagination";

export const brandService = {
    getAll: async (page: number, perPage: number): Promise<PaginatedResponse<BrandType>> => {
        const res = await fetch(`/api/admin/brands?page=${page}&per_page=${perPage}`);
        if (!res.ok) throw new Error('Failed to fetch brands');
        const data = await res.json();
        return {
            data: data.items.map((brand: any) => ({
                ...brand,
                createdAt: brand.createdAt,
                updatedAt: brand.updatedAt
            })),
            meta: {
                current_page: page,
                last_page: Math.ceil(data.total / perPage),
                per_page: perPage,
                total: data.total
            }
        };
    },

    getById: async (id: string): Promise<BrandType> => {
        const res = await fetch(`/api/admin/brands/${id}`);
        if (!res.ok) throw new Error("Failed to fetch brand");
        return res.json();
    },

    create: async (data: BrandFormData): Promise<BrandType> => {
        const res = await fetch('/api/admin/brands', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to create brand");
        }

        if (data.imageUrl) {
            await clearTracking([data.imageUrl]);
        }

        return res.json();
    },

    update: async (id: string, data: BrandUpdateData): Promise<BrandType> => {
        const res = await fetch(`/api/admin/brands/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to update brand");
        }

        return res.json();
    },

    delete: async (id: string): Promise<void> => {
        const res = await fetch(`/api/admin/brands/${id}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to delete brand");
        }
    },

    uploadImage: async (brandId: string | null, file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('brandId', brandId || '');

        const res = await fetch('/api/admin/brands/upload', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to upload brand image");
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