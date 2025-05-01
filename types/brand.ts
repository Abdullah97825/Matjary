export interface BrandType {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        products: number;
    };
}

export type BrandFormData = Omit<BrandType, 'id' | 'createdAt' | 'updatedAt' | 'slug'>;
export type BrandUpdateData = Partial<BrandFormData>; 