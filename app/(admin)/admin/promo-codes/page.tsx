'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { promoService } from "@/services/promo"
import { PromoCodeWithDetails } from "@/types/promo"
import { AdminPromoCodesTable } from "@/components/admin/promo-codes-table"
import { useDebounce } from "@/hooks/useDebounce"
import { PaginationState } from "@/types/pagination"

export default function AdminPromoCodesPage() {
    const [promoCodes, setPromoCodes] = useState<PromoCodeWithDetails[]>([])
    const [search, setSearch] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
        pageCount: 0,
        total: 0
    })

    const debouncedSearch = useDebounce(search, 500)

    const fetchPromoCodes = async () => {
        try {
            setIsRefetching(true)
            const response = await promoService.getAllPromoCodes(
                pagination.pageIndex + 1,
                pagination.pageSize,
                debouncedSearch
            )
            setPromoCodes(response.data)
            setPagination(prev => ({
                ...prev,
                pageCount: response.meta.last_page,
                total: response.meta.total
            }))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to fetch promo codes")
        } finally {
            setIsRefetching(false)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPromoCodes()
    }, [pagination.pageIndex, pagination.pageSize, debouncedSearch])

    if (isLoading) {
        return (
            <div className="flex h-[200px] items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Promo Codes</h1>
                    <p className="text-muted-foreground">
                        Manage promotional codes for your store.
                    </p>
                </div>
                <Link href="/admin/promo-codes/new" className={buttonVariants()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Promo Code
                </Link>
            </div>

            <div className="flex gap-4">
                <Input
                    placeholder="Search promo codes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Promo Codes</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminPromoCodesTable
                        promoCodes={promoCodes}
                        isLoading={isRefetching}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        onRefresh={fetchPromoCodes}
                    />
                </CardContent>
            </Card>
        </div>
    )
} 