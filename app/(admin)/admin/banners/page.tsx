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
import { BannerDialog } from "@/components/admin/banner-dialog"
import { Banner, BannerFormData, BannerUpdateData } from "@/types/banner"
import { bannerService } from "@/services/banner"

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
    total: 0
  })

  // New state for dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bannerToEdit, setBannerToEdit] = useState<Banner | null>(null)

  useEffect(() => {
    fetchBanners()
  }, [pagination.pageIndex, pagination.pageSize])

  const fetchBanners = async () => {
    try {
      const response = await fetch(`/api/admin/banners?page=${pagination.pageIndex + 1}&per_page=${pagination.pageSize}`)
      const data = await response.json()
      setBanners(data.items)
      setPagination(prev => ({
        ...prev,
        pageCount: Math.ceil(data.total / pagination.pageSize),
        total: data.total
      }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch banners")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!bannerToDelete) return

    setIsDeleting(true)
    try {
      await fetch(`/api/admin/banners/${bannerToDelete}`, {
        method: 'DELETE'
      })
      toast.success("Banner deleted successfully")
      fetchBanners()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete banner")
    } finally {
      setIsDeleting(false)
      setBannerToDelete(null)
    }
  }

  const handleCreate = async (data: BannerFormData | BannerUpdateData) => {
    // Create a complete BannerFormData with default values for any missing fields
    const completeData: BannerFormData = {
      title: data.title || "",
      imageUrl: data.imageUrl || "",
      link: data.link || null,
      active: data.active !== undefined ? data.active : true,
      order: data.order !== undefined ? data.order : 0
    };

    try {
      await bannerService.create(completeData);
      toast.success("Banner created successfully");
      fetchBanners();
      setDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create banner");
      throw error;
    }
  };

  const handleUpdate = async (data: BannerFormData | BannerUpdateData) => {
    if (!bannerToEdit) return

    try {
      await bannerService.update(bannerToEdit.id, data)
      toast.success("Banner updated successfully")
      fetchBanners()
      setDialogOpen(false)
    } catch (error) {
      toast.error("Failed to update banner")
      throw error
    }
  }

  const columns: ColumnDef<Banner>[] = [
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "imageUrl",
      header: "Image",
      cell: ({ row }) => (
        <div className="relative h-20 w-40">
          <img
            src={row.original.imageUrl}
            alt={row.original.title}
            className="w-full h-full object-cover rounded-md"
          />
        </div>
      )
    },
    {
      accessorKey: "link",
      header: "Link",
      cell: ({ row }) => row.original.link || "-"
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
      accessorKey: "order",
      header: "Order",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setBannerToEdit(row.original)
              setDialogOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => setBannerToDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Promotional Banners</h1>
            <p className="text-muted-foreground">
              Manage promotional banners shown in the store carousel.
            </p>
          </div>
          <Button onClick={() => {
            setBannerToEdit(null)
            setDialogOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Banner
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Banners</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={banners}
              pagination={pagination}
              onPaginationChange={setPagination}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!bannerToDelete} onOpenChange={() => setBannerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the banner. This action cannot be undone.
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

      <BannerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={bannerToEdit || undefined}
        onSubmit={bannerToEdit ? handleUpdate : handleCreate}
      />
    </>
  )
} 