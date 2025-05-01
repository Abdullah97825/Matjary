'use client'

import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { OrderStatus } from '@prisma/client'
import { orderService } from '@/services/order'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Input } from '@/components/ui/input'
import { AdminOrdersTable } from '@/components/admin/orders-table'
import { PaginationState } from '@/types/pagination'
import { ORDER_STATUS_LABELS } from '@/types/order'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Order {
  id: string
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
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
    total: 0
  })

  const debouncedSearch = useDebounce(search, 500)

  const fetchOrders = async () => {
    try {
      setIsRefetching(true)
      const response = await orderService.getAll({
        search: debouncedSearch,
        status: status === 'all' ? undefined : status,
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize
      })
      setOrders(response.data)
      setPagination(prev => ({
        ...prev,
        pageCount: Math.ceil(response.meta.total / pagination.pageSize),
        total: response.meta.total
      }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch orders')
      setOrders([])
    } finally {
      setIsLoading(false)
      setIsRefetching(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [status, debouncedSearch, pagination.pageIndex, pagination.pageSize])

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          View and manage customer orders.
        </p>
      </div>

      <div className="flex gap-4">
        <Select value={status} onValueChange={(value: OrderStatus | 'all') => setStatus(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <AdminOrdersTable
        orders={orders}
        isLoading={isRefetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        onRefresh={fetchOrders}
      />
    </div>
  )
} 