'use client'

import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { ProductWithImages } from "@/types/products"
import { PaginationState } from "@/types/pagination"
import { formatPrice } from "@/utils/format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"

interface AdminProductsTableProps {
  products: ProductWithImages[]
  isLoading?: boolean
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  onRefresh: () => void
}

export function AdminProductsTable({
  products,
  isLoading,
  pagination,
  onPaginationChange,
  onRefresh
}: AdminProductsTableProps) {
  const router = useRouter()
  
  const columns: ColumnDef<ProductWithImages>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => formatPrice(Number(row.original.price))
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => (
        <Badge variant={row.original.stock > 0 ? "default" : "destructive"}>
          {row.original.stock}
        </Badge>
      )
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row.original.category?.name || "Uncategorized"
    },
    {
      accessorKey: "public",
      header: "Status",
      cell: ({ row }) => {
        const isPublic = row.getValue("public") as boolean
        return (
          <Badge variant={isPublic ? "default" : "secondary"}>
            {isPublic ? "Public" : "Private"}
          </Badge>
        )
      }
    },
    {
      accessorKey: "discountType",
      header: "Discount",
      cell: ({ row }) => {
        const discountType = row.getValue("discountType") as string | null
        const discountAmount = row.original.discountAmount
        const discountPercent = row.original.discountPercent

        if (!discountType || discountType === 'NONE') {
          return <span className="text-muted-foreground">No discount</span>
        }

        return (
          <div className="space-y-1">
            {discountType === 'FLAT' && (
              <Badge variant="outline">-${Number(discountAmount).toFixed(2)}</Badge>
            )}
            {discountType === 'PERCENTAGE' && (
              <Badge variant="outline">-{discountPercent}%</Badge>
            )}
            {discountType === 'BOTH' && (
              <>
                <Badge variant="outline" className="mr-1">-${Number(discountAmount).toFixed(2)}</Badge>
                <Badge variant="outline">-{discountPercent}%</Badge>
              </>
            )}
          </div>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/products/${row.original.id}`)}
        >
          View Details
          <ChevronRight className="ml-2 h-4 w-4" />
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
        data={products}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        isLoading={isLoading}
      />
    </div>
  )
} 