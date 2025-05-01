'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { ProductWithImages } from "@/types/products"
import { productAdminService } from "@/services/product-admin"
import { PaginationState } from "@/types/pagination"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { ArchivedProductsTable } from "@/components/admin/archived-products-table"

export default function ArchivedProductsPage() {
    const [products, setProducts] = useState<ProductWithImages[]>([])
    const [search, setSearch] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
        pageCount: 0,
        total: 0
    })

    const fetchArchivedProducts = async () => {
        try {
            setIsRefetching(true)
            const response = await productAdminService.getArchivedProducts(
                pagination.pageIndex + 1,
                pagination.pageSize,
                search
            )
            setProducts(response.data)
            setPagination(prev => ({
                ...prev,
                pageCount: response.meta.last_page,
                total: response.meta.total
            }))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to fetch archived products")
        } finally {
            setIsRefetching(false)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchArchivedProducts()
    }, [pagination.pageIndex, pagination.pageSize, search])

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
                    <h1 className="text-3xl font-bold tracking-tight">Archived Products</h1>
                    <p className="text-muted-foreground">
                        View and manage archived products.
                    </p>
                </div>
                <Link href="/admin/settings" className={buttonVariants({ variant: "outline" })}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Settings
                </Link>
            </div>

            <div className="flex gap-4">
                <Input
                    placeholder="Search archived products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Archived Products</CardTitle>
                </CardHeader>
                <CardContent>
                    {products.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            No archived products found.
                        </div>
                    ) : (
                        <ArchivedProductsTable
                            products={products}
                            isLoading={isRefetching}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            onRefresh={fetchArchivedProducts}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 