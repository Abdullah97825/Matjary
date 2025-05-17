'use client'

import { useRouter } from 'next/navigation'
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"
import { PaginationState } from "@/types/pagination"
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/order"
import { OrderStatus } from "@prisma/client"
import { formatPrice } from "@/utils/format"

interface Order {
  id: string
  orderNumber?: string
  status: OrderStatus
  createdAt: string
  recipientName: string
  shippingAddress: string
  phone: string
  savings: number
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      name: string
      price: number
    }
  }>
  user: {
    name: string
    email: string
  }
  adminDiscount?: number
}

interface AdminOrdersTableProps {
  orders: Order[]
  isLoading?: boolean
  pagination: PaginationState
  onPaginationChange: (pagination: PaginationState) => void
  onRefresh: () => void
}

export function AdminOrdersTable({
  orders,
  isLoading,
  pagination,
  onPaginationChange,
  onRefresh
}: AdminOrdersTableProps) {
  const router = useRouter()

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "Order Number",
      cell: ({ row }) => `${row.original.orderNumber || row.original.id}`
    },
    {
      accessorKey: "user",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div>{row.original.user.name}</div>
          <div className="text-sm text-muted-foreground">{row.original.user.email}</div>
          <div className="text-sm text-muted-foreground">{row.original.phone}</div>
        </div>
      )
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        const total = row.original.items.reduce((sum, item) =>
          sum + (item.price * item.quantity), 0
        );
        const adminDiscount = row.original.adminDiscount ? Number(row.original.adminDiscount) : 0;
        const savings = Number(row.getValue("savings"));
        const finalTotal = total - savings - adminDiscount;
        return formatPrice(finalTotal);
      }
    },
    {
      accessorKey: "savings",
      header: "Savings",
      cell: ({ row }) => {
        const savings = Number(row.getValue("savings"))
        if (!savings || savings === 0) {
          return <span className="text-muted-foreground">-</span>
        }
        return (
          <span className="text-green-600">
            -{formatPrice(savings)}
          </span>
        )
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as OrderStatus
        return (
          <Badge variant={ORDER_STATUS_COLORS[status]}>
            {ORDER_STATUS_LABELS[status]}
          </Badge>
        )
      }
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => row.original.items.length
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/orders/${row.original.id}`)}
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
        data={orders}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        isLoading={isLoading}
      />
    </div>
  )
} 