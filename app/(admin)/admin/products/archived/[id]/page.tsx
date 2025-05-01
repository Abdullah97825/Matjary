'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, Archive, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { ProductWithImages } from "@/types/products"
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
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/utils/format"

export default function ArchivedProductDetailPage() {
    const router = useRouter()
    const { id } = useParams()

    const [product, setProduct] = useState<ProductWithImages | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUnarchiving, setIsUnarchiving] = useState(false)
    const [showUnarchiveDialog, setShowUnarchiveDialog] = useState(false)

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                if (id) {
                    setIsLoading(true)
                    const productData = await productAdminService.getById(id as string)

                    // Redirect to regular edit page if product is not archived
                    if (productData && !productData.isArchived) {
                        router.push(`/admin/products/${id}`)
                        return
                    }

                    setProduct(productData)
                }
            } catch (error) {
                console.error('[FETCH_PRODUCT] Error:', error)
                toast.error("Failed to fetch product data")
            } finally {
                setIsLoading(false)
            }
        }

        fetchProduct()
    }, [id, router])

    if (isLoading) {
        return (
            <div className="flex h-[200px] items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="p-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/admin/products/archived')}
                    className="mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Archived Products
                </Button>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                    <h2 className="text-lg font-medium flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Product Not Found
                    </h2>
                    <p className="mt-2">This product may have been deleted or does not exist.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/admin/products/archived')}
                    className="mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Archived Products
                </Button>
            </div>

            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        {product.name}
                    </h1>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Archived</Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                    View details of this archived product. Archived products are hidden from customers.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Main product info - takes up 3 columns on large screens */}
                <div className="lg:col-span-3 space-y-6">
                    <Card>
                        <CardHeader className="border-b bg-muted/40">
                            <CardTitle>Product Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                                        <p className="text-lg font-medium">{formatCurrency(product.price)}</p>
                                        {(product.discountAmount || product.discountPercent) && (
                                            <div className="text-green-600 text-sm">
                                                {product.discountAmount && `${formatCurrency(product.discountAmount)} off`}
                                                {product.discountAmount && product.discountPercent && " | "}
                                                {product.discountPercent && `${product.discountPercent}% off`}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-muted-foreground">Stock</h3>
                                        <p className="text-lg font-medium">
                                            {product.stock} units
                                            {product.useStock ? " (Stock management enabled)" : " (Stock management disabled)"}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                                        <p className="text-lg font-medium">{product.category?.name || "—"}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-muted-foreground">Brand</h3>
                                        <p className="text-lg font-medium">{product.brand?.name || "None"}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                                    <div className="rounded-md p-4 bg-muted/20">
                                        <p className="whitespace-pre-wrap">{product.description || "No description provided."}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b bg-muted/40">
                            <CardTitle>Product Images</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {product.images && product.images.length > 0 ? (
                                    product.images.map((image) => (
                                        <div key={image.id} className="relative aspect-square rounded-md overflow-hidden border group">
                                            <img
                                                src={image.url}
                                                alt={product.name}
                                                className="object-cover w-full h-full transition-transform group-hover:scale-105"
                                            />
                                            {image.id === product.thumbnailId && (
                                                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                                    Thumbnail
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full flex flex-col items-center justify-center h-32 bg-muted/20 rounded-md">
                                        <p className="text-muted-foreground">No images available</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b bg-muted/40">
                            <CardTitle>Attachments</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {product.attachments && product.attachments.length > 0 ? (
                                <div className="space-y-2">
                                    {product.attachments.map((attachment) => (
                                        <div key={attachment.id} className="flex items-center justify-between border rounded-md p-3">
                                            <span>{attachment.name}</span>
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={attachment.url} target="_blank" rel="noopener noreferrer">View</a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-24 bg-muted/20 rounded-md">
                                    <p className="text-muted-foreground">No attachments available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Side panel with info - takes up 1 column on large screens */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="border-b bg-muted/40">
                            <CardTitle>Product Status</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="border-b pb-3">
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Visibility</h3>
                                    <Badge className="mb-2" variant={product.public ? "default" : "outline"}>
                                        {product.public ? "Public" : "Private"}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">
                                        {product.public
                                            ? "This product would be visible to customers if unarchived"
                                            : "This product would be hidden from customers even if unarchived"}
                                    </p>
                                </div>

                                <div className="border-b pb-3">
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Featured</h3>
                                    <Badge className="mb-2" variant={product.isFeatured ? "default" : "outline"}>
                                        {product.isFeatured ? "Featured" : "Not Featured"}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">
                                        {product.isFeatured
                                            ? "This product would appear in featured sections if unarchived"
                                            : "This product would not appear in featured sections"}
                                    </p>
                                </div>

                                <div className="border-b pb-3">
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Pricing Options</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Negotiable Price:</span>
                                            <Badge variant={product.negotiablePrice ? "default" : "outline"}>
                                                {product.negotiablePrice ? "Yes" : "No"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Hide Price:</span>
                                            <Badge variant={product.hidePrice ? "default" : "outline"}>
                                                {product.hidePrice ? "Yes" : "No"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Inventory Options</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">Hide Stock:</span>
                                            <Badge variant={product.hideStock ? "default" : "outline"}>
                                                {product.hideStock ? "Yes" : "No"}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm">Use Stock Management:</span>
                                            <Badge variant={product.useStock ? "default" : "outline"}>
                                                {product.useStock ? "Yes" : "No"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b bg-muted/40">
                            <CardTitle>Tags</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {product.tags && product.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {product.tags.map(tag => (
                                        <Badge key={tag.id} variant="outline">{tag.name}</Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-16 bg-muted/20 rounded-md">
                                    <p className="text-muted-foreground">No tags</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="border-b bg-muted/40">
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Button
                                onClick={() => setShowUnarchiveDialog(true)}
                                className="w-full bg-amber-500 text-white hover:bg-amber-600"
                                disabled={isUnarchiving}
                            >
                                {isUnarchiving ? (
                                    <LoadingSpinner className="mr-2 h-4 w-4" />
                                ) : (
                                    <Archive className="mr-2 h-4 w-4" />
                                )}
                                Unarchive Product
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={showUnarchiveDialog} onOpenChange={setShowUnarchiveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unarchive Product</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unarchive this product?
                            The product will become visible to customers again if it is set to public.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-amber-500 text-white hover:bg-amber-600"
                            onClick={async () => {
                                setShowUnarchiveDialog(false)
                                setIsUnarchiving(true)
                                try {
                                    await productAdminService.unarchiveProduct(id as string)
                                    toast.success("Product unarchived successfully")
                                    router.push(`/admin/products/${id}`)
                                } catch (error) {
                                    console.error('[UNARCHIVE_PRODUCT] Error:', error)
                                    toast.error(error instanceof Error ? error.message : "Failed to unarchive product")
                                    setIsUnarchiving(false)
                                }
                            }}
                        >
                            Unarchive
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
} 