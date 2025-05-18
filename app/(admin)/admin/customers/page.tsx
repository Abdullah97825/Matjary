'use client';

import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { customerService } from '@/services/customer'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Input } from '@/components/ui/input'
import { AdminCustomersTable } from '@/components/admin/customers-table'
import { PaginationState } from '@/types/pagination'
import { Customer } from '@/types/customer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
    total: 0
  })

  const debouncedSearch = useDebounce(search, 500)

  const fetchCustomers = async () => {
    try {
      setIsRefetching(true)
      const response = await customerService.getAll(
        pagination.pageIndex + 1,
        pagination.pageSize,
        debouncedSearch,
        activeFilter
      )
      setCustomers(response.data)
      setPagination(prev => ({
        ...prev,
        pageCount: response.meta.last_page,
        total: response.meta.total
      }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch customers')
      setCustomers([])
    } finally {
      setIsRefetching(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [debouncedSearch, pagination.pageIndex, pagination.pageSize, activeFilter])

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
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          Manage and view customer information.
        </p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <Select
          value={activeFilter || 'all'}
          onValueChange={(value) => setActiveFilter(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            <SelectItem value="true">Active Accounts</SelectItem>
            <SelectItem value="false">Inactive Accounts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdminCustomersTable
        customers={customers}
        isLoading={isRefetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        onRefresh={fetchCustomers}
      />
    </div>
  )
} 