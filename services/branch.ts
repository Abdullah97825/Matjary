import { BranchFormData } from "@/schemas/contact";
import { BranchWithRelations } from "@/types/branch";
import { PaginatedResponse } from "@/types/pagination";

class BranchService {
  async getAll(
    page: number = 1,
    perPage: number = 10,
    search?: string
  ): Promise<PaginatedResponse<BranchWithRelations>> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });

    if (search) {
      searchParams.append('search', search);
    }

    const response = await fetch(`/api/admin/branches?${searchParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch branches');
    }
    return response.json();
  }

  async getById(id: string): Promise<BranchWithRelations> {
    const response = await fetch(`/api/admin/branches/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch branch');
    }
    return response.json();
  }

  async create(data: BranchFormData): Promise<BranchWithRelations> {
    const response = await fetch('/api/admin/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error('Failed to create branch');
    }
    return response.json();
  }

  async update(id: string, data: BranchFormData): Promise<BranchWithRelations> {
    const response = await fetch(`/api/admin/branches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error('Failed to update branch');
    }
    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/admin/branches/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete branch');
    }
  }

  async deleteMany(ids: string[]): Promise<void> {
    const response = await fetch('/api/admin/branches/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) {
      throw new Error('Failed to delete branches');
    }
  }
}

export const branchService = new BranchService(); 