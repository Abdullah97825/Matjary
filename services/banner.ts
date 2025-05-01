import { Banner, BannerFormData, BannerUpdateData } from "@/types/banner"

export const bannerService = {
  getAll: async (): Promise<Banner[]> => {
    const res = await fetch('/api/admin/banners')
    if (!res.ok) throw new Error("Failed to fetch banners")
    return res.json()
  },

  getById: async (id: string): Promise<Banner> => {
    const res = await fetch(`/api/admin/banners/${id}`)
    if (!res.ok) throw new Error("Failed to fetch banner")
    return res.json()
  },

  create: async (data: BannerFormData): Promise<Banner> => {
    const res = await fetch('/api/admin/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "Failed to create banner")
    }

    if (data.imageUrl) {
      await clearTracking([data.imageUrl]);
    }

    return res.json()
  },

  update: async (id: string, data: BannerUpdateData): Promise<Banner> => {
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "Failed to update banner")
    }

    return res.json()
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "Failed to delete banner")
    }
  },

  uploadImage: async (bannerId: string | null, file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bannerId', bannerId || '')

    const res = await fetch('/api/admin/banners/upload', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "Failed to upload banner image")
    }

    const { url } = await res.json()

    await clearTracking([url]);

    return url
  }
}

const clearTracking = async (urls: string[]) => {
  await fetch('/api/admin/uploads/clear-tracking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls })
  });
}; 