'use client';

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { BranchWithRelations } from "@/types/branch";
import { branchService } from "@/services/branch";
import { AdminBranchesTable } from "@/components/admin/branches/branches-table";
import { PaginationState } from "@/types/pagination";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<BranchWithRelations[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
    total: 0
  });

  const debouncedSearch = useDebounce(search, 500);

  const fetchBranches = async () => {
    try {
      setIsRefetching(true);
      const response = await branchService.getAll(
        pagination.pageIndex + 1,
        pagination.pageSize,
        debouncedSearch
      );
      setBranches(response.data);
      setPagination(prev => ({
        ...prev,
        pageCount: response.meta.last_page,
        total: response.meta.total
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch branches");
    } finally {
      setIsRefetching(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Branch Management</h1>
        <Link href="/admin/branches/new" className={buttonVariants()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <Input
              placeholder="Search branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <AdminBranchesTable
            branches={branches}
            isLoading={isRefetching}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRefresh={fetchBranches}
          />
        </CardContent>
      </Card>
    </div>
  );
} 