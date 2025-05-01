export interface Banner {
  id: string
  title: string
  imageUrl: string
  link: string | null
  active: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export type BannerFormData = Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>
export type BannerUpdateData = Partial<BannerFormData>