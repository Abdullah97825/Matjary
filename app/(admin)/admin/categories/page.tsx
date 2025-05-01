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
import { CategoryDialog } from "@/components/admin/category-dialog"
import { CategoryType, CategoryFormData, CategoryUpdateData } from "@/types/category"
import { categoryService } from "@/services/category"

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
    total: 0
  })
  const debouncedSearch = useDebounce(search, 500)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryType | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [debouncedSearch, pagination.pageIndex, pagination.pageSize])

  const fetchCategories = async () => {
    try {
      if (initialLoading) {
        setInitialLoading(true)
      } else {
        setIsRefetching(true)
      }

      const response = await categoryService.getAll(pagination.pageIndex + 1, pagination.pageSize)
      setCategories(response.data)
      setPagination(prev => ({
        ...prev,
        pageCount: Math.ceil(response.meta.total / pagination.pageSize),
        total: response.meta.total
      }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch categories")
    } finally {
      setInitialLoading(false)
      setIsRefetching(false)
    }
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return

    setIsDeleting(true)
    try {
      await categoryService.delete(categoryToDelete)
      toast.success("Category deleted successfully")
      fetchCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category")
    } finally {
      setIsDeleting(false)
      setCategoryToDelete(null)
    }
  }

  const handleCreate = async (data: CategoryFormData | CategoryUpdateData) => {
    // For creation, we need all fields
    const formData: CategoryFormData = {
      name: data.name!,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      active: data.active ?? true
    }

    try {
      await categoryService.create(formData)
      toast.success("Category created successfully")
      fetchCategories()
    } catch (error) {
      toast.error("Failed to create category")
      throw error
    }
  }

  const handleUpdate = async (data: CategoryUpdateData) => {
    if (!categoryToEdit) return
    
    try {
      await categoryService.update(categoryToEdit.id, data)
      toast.success("Category updated successfully")
      fetchCategories()
    } catch (error) {
      toast.error("Failed to update category")
      throw error
    }
  }

  const columns: ColumnDef<CategoryType>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description || "-"
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
        <Badge variant={row.original.active ? "green" : "gray"}>
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
              setCategoryToEdit(row.original)
              setDialogOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive"
            onClick={() => setCategoryToDelete(row.original.id)}
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
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">
              Manage product categories in your store.
            </p>
          </div>
          <Button onClick={() => {
            setCategoryToEdit(null)
            setDialogOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={categories}
              pagination={pagination}
              onPaginationChange={setPagination}
              isLoading={isRefetching}
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <LoadingSpinner className="mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CategoryDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={categoryToEdit || undefined}
        onSubmit={categoryToEdit ? handleUpdate : handleCreate}
      />
    </>
  )
} 