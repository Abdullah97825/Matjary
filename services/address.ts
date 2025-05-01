import { AddressFormData } from "@/types/address";

export const addressService = {
  getAll: async () => {
    const response = await fetch("/api/addresses");
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch addresses");
    }
    return response.json();
  },

  create: async (data: AddressFormData) => {
    const response = await fetch("/api/addresses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create address");
    }

    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`/api/addresses/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete address");
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  },

  setDefault: async (id: string) => {
    const response = await fetch(`/api/addresses/${id}/default`, {
      method: "PUT",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to set default address");
    }

    return response.json();
  },
}; 