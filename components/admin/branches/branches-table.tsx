"use client";

import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { BranchWithRelations } from "@/types/branch";
import { PaginationState } from "@/types/pagination";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminBranchesTableProps {
  branches: BranchWithRelations[];
  isLoading?: boolean;
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
  onRefresh: () => void;
}

export function AdminBranchesTable({
  branches,
  isLoading,
  pagination,
  onPaginationChange,
}: AdminBranchesTableProps) {
  const router = useRouter();

  const columns: ColumnDef<BranchWithRelations>[] = [
    {
      accessorKey: "name",
      header: "Name"
    },
    {
      accessorKey: "isMain",
      header: "Status",
      cell: ({ row }) => row.original.isMain ? (
        <Badge>Main Branch</Badge>
      ) : null
    },
    {
      accessorKey: "address",
      header: "Address"
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/branches/${row.original.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={branches}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        isLoading={isLoading}
      />
    </div>
  );
} 