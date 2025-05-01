'use client'

import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Customer } from "@/types/customer"
import { PaginationState } from "@/types/pagination"
import { formatPrice } from "@/utils/format"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

interface AdminCustomersTableProps {
  customers: Customer[]
  isLoading?: boolean
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  onRefresh: () => void
}

export function AdminCustomersTable({
  customers,
  isLoading,
  pagination,
  onPaginationChange,
  onRefresh
}: AdminCustomersTableProps) {
  const router = useRouter()
  
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      )
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "ordersCount",
      header: "Orders",
      cell: ({ row }) => (
        <div className="text-center">{row.original.ordersCount}</div>
      )
    },
    {
      accessorKey: "totalSpent",
      header: "Total Spent",
      cell: ({ row }) => (
        <div className="font-medium">{formatPrice(row.original.totalSpent)}</div>
      )
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/customers/${row.original.id}`)}
          className="flex items-center gap-1"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Button>
      )
    }
  ]

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={customers}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        isLoading={isLoading}
        />
    </div>
  )
} 