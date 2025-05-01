'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { PaginationState } from "@/types/pagination"
import { Input } from "@/components/ui/input"
import { useDebounce } from '@/hooks/useDebounce'
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
import { BrandDialog } from "@/components/admin/brand-dialog"
import { BrandType, BrandFormData, BrandUpdateData } from "@/types/brand"
import { brandService } from "@/services/brand"

export default function AdminBrandsPage() {
    const [brands, setBrands] = useState<BrandType[]>([])
    const [initialLoading, setInitialLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [brandToDelete, setBrandToDelete] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
        pageCount: 0,
        total: 0
    })
    const debouncedSearch = useDebounce(search, 500)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [brandToEdit, setBrandToEdit] = useState<BrandType | null>(null)

    useEffect(() => {
        fetchBrands()
    }, [debouncedSearch, pagination.pageIndex, pagination.pageSize])

    const fetchBrands = async () => {
        try {
            if (initialLoading) {
                setInitialLoading(true)
            } else {
                setIsRefetching(true)
            }

            const response = await brandService.getAll(pagination.pageIndex + 1, pagination.pageSize)
            setBrands(response.data)
            setPagination(prev => ({
                ...prev,
                pageCount: Math.ceil(response.meta.total / pagination.pageSize),
                total: response.meta.total
            }))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to fetch brands")
        } finally {
            setInitialLoading(false)
            setIsRefetching(false)
        }
    }

    const handleDelete = async () => {
        if (!brandToDelete) return

        setIsDeleting(true)
        try {
            await brandService.delete(brandToDelete)
            toast.success("Brand deleted successfully")
            fetchBrands()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete brand")
        } finally {
            setIsDeleting(false)
            setBrandToDelete(null)
        }
    }

    const handleSubmit = async (data: BrandFormData | BrandUpdateData) => {
        try {
            if (brandToEdit) {
                await brandService.update(brandToEdit.id, data)
                toast.success("Brand updated successfully")
            } else {
                await brandService.create(data as BrandFormData)
                toast.success("Brand created successfully")
            }
            fetchBrands()
            return Promise.resolve()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save brand")
            return Promise.reject(error)
        }
    }

    const columns: ColumnDef<BrandType>[] = [
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => {
                const description = row.original.description || "-";
                // Truncate long descriptions
                return (
                    <div className="max-w-xs truncate" title={description}>
                        {description}
                    </div>
                );
            }
        },
        {
            accessorKey: "imageUrl",
            header: "Image",
            cell: ({ row }) => (
                row.original.imageUrl ? (
                    <div className="relative h-20 w-40">
                        <img
                            src={row.original.imageUrl}
                            alt={row.original.name}
                            className="w-full h-full object-cover rounded-md"
                        />
                    </div>
                ) : "-"
            )
        },
        {
            accessorKey: "active",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.original.active ? "green" : "secondary"}>
                    {row.original.active ? "Active" : "Inactive"}
                </Badge>
            )
        },
        {
            accessorKey: "_count.products",
            header: "Products",
            cell: ({ row }) => row.original._count?.products || 0
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setBrandToEdit(row.original)
                            setDialogOpen(true)
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setBrandToDelete(row.original.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ]

    if (initialLoading) {
        return (
            <div className="flex h-[200px] items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
                        <p className="text-muted-foreground">
                            Manage product brands in your store.
                        </p>
                    </div>
                    <Button onClick={() => {
                        setBrandToEdit(null)
                        setDialogOpen(true)
                    }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Brand
                    </Button>
                </div>

                <div className="flex gap-4">
                    <Input
                        placeholder="Search brands..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Brands</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            data={brands}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            isLoading={isRefetching}
                        />
                    </CardContent>
                </Card>
            </div>

            <BrandDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                initialData={brandToEdit || undefined}
                onSubmit={handleSubmit}
            />

            <AlertDialog open={!!brandToDelete} onOpenChange={() => setBrandToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the brand. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting && <LoadingSpinner className="mr-2" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
} 