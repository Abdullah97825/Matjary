import { CategoryType } from './products';

export type { CategoryType };
export type CategoryFormData = Omit<CategoryType, 'id' | 'createdAt' | 'updatedAt' | 'slug'>;
export type CategoryUpdateData = Partial<CategoryFormData>; 