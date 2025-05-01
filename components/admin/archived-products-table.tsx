'use client'

import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { ProductWithImages } from "@/types/products"
import { PaginationState } from "@/types/pagination"
import { formatPrice } from "@/utils/format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Archive, ArchiveRestore } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { productAdminService } from "@/services/product-admin"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ArchivedProductsTableProps {
    products: ProductWithImages[]
    isLoading?: boolean
    pagination: PaginationState
    onPaginationChange: (pagination: PaginationState) => void
    onRefresh: () => void
}

export function ArchivedProductsTable({
    products,
    isLoading,
    pagination,
    onPaginationChange,
    onRefresh
}: ArchivedProductsTableProps) {
    const router = useRouter()
    const [productToUnarchive, setProductToUnarchive] = useState<ProductWithImages | null>(null)
    const [isUnarchiving, setIsUnarchiving] = useState(false)

    const handleUnarchive = async () => {
        if (!productToUnarchive) return

        try {
            setIsUnarchiving(true)
            await productAdminService.unarchiveProduct(productToUnarchive.id)
            toast.success(`"${productToUnarchive.name}" has been unarchived`)
            onRefresh()
        } catch (error) {
            console.error('[UNARCHIVE_PRODUCT]', error)
            toast.error(error instanceof Error ? error.message : "Failed to unarchive product")
        } finally {
            setIsUnarchiving(false)
            setProductToUnarchive(null)
        }
    }

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
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => router.push(`/admin/products/archived/${row.original.id}`)}
                    >
                        View Details
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 border-amber-600 hover:bg-amber-100"
                        onClick={() => setProductToUnarchive(row.original)}
                    >
                        <ArchiveRestore className="mr-2 h-4 w-4" />
                        Unarchive
                    </Button>
                </div>
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

            <AlertDialog open={!!productToUnarchive} onOpenChange={(open) => !open && setProductToUnarchive(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unarchive Product</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unarchive "{productToUnarchive?.name}"?
                            This will make the product visible to customers again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-amber-500 text-white hover:bg-amber-600"
                            onClick={handleUnarchive}
                            disabled={isUnarchiving}
                        >
                            {isUnarchiving ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                            Unarchive
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
} 