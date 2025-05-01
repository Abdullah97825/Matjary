import { PaginatedResponse } from "@/types/pagination";
import { Customer, CustomerDetails } from "@/types/customer";

export const customerService = {
  getAll: async (
    page: number, 
    perPage: number, 
    search?: string
  ): Promise<PaginatedResponse<Customer>> => {
    const searchParam = search ? `&search=${search}` : '';
    const res = await fetch(
      `/api/admin/customers?page=${page}&per_page=${perPage}${searchParam}`
    );
    if (!res.ok) throw new Error("Failed to fetch customers");
    return res.json();
  },

  getById: async (id: string): Promise<CustomerDetails> => {
    const res = await fetch(`/api/admin/customers/${id}`);
    if (!res.ok) throw new Error("Failed to fetch customer details");
    return res.json();
  },

  delete: async (id: string) => {
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete customer");
    return res.json();
  }
}; 