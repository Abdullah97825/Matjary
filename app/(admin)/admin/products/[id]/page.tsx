'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { ProductFormData, ProductWithImages, CategoryType } from "@/types/products"
import { productAdminService } from "@/services/product-admin"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { categoryService } from "@/services/category"
import { ImageUpload } from "@/components/ui/image-upload"
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
import { AttachmentUpload } from "@/components/ui/attachment-upload"
import { cn } from "@/lib/utils"
import { DiscountType } from "@prisma/client"
import { TagInput } from "@/components/ui/tag-input"
import { ThumbnailSelector } from "@/components/admin/ThumbnailSelector"
import { Checkbox } from "@/components/ui/checkbox"
import { BrandType } from "@/types/brand"
import { brandService } from "@/services/brand"

function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg z-50">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export default function AdminProductPage() {
  const router = useRouter()
  const { id } = useParams()
  const isNew = id === 'new'

  const [product, setProduct] = useState<ProductWithImages | null>(null)
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [brands, setBrands] = useState<BrandType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string }>>([])
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null)
  const [isDeletingImage, setIsDeletingImage] = useState(false)
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [tags, setTags] = useState<{ id: string; name: string }[]>([])
  const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([])
  const [isSettingThumbnail, setIsSettingThumbnail] = useState(false)
  const [newProductThumbnailId, setNewProductThumbnailId] = useState<string | null>(null)

  const [discountType, setDiscountType] = useState<DiscountType | 'NONE'>('NONE')

  const fetchProduct = async () => {
    try {
      if (!isNew && id) {
        const productData = await productAdminService.getById(id as string)
        if (productData) {
          // Check if the product is archived, and redirect to the archived view
          if (productData.isArchived) {
            router.push(`/admin/products/archived/${id}`)
            return
          }

          setProduct(productData)
          setDiscountType(productData.discountType || 'NONE')
          setUploadedImages(productData.images?.map(img => img.url) || [])
          setAttachments(productData.attachments?.map(att => ({
            url: att.url,
            name: att.name
          })) || [])
          setTags(productData.tags?.map(tag => ({
            id: tag.id,
            name: tag.name
          })) || [])
        }
      }
    } catch (error) {
      console.error('[FETCH_PRODUCT] Error:', error)
      toast.error("Failed to fetch product data")
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Fetch all existing tags for suggestions
        const tagsData = await productAdminService.getAllTags()
        setAllTags(tagsData.map(tag => ({ id: tag.id, name: tag.name })))

        // Always fetch categories
        const categoriesData = await categoryService.getAll(1, 100)
        setCategories(categoriesData.data)

        // Fetch brands
        const brandsData = await brandService.getAll(1, 100)
        setBrands(brandsData.data)

        // Fetch product data if editing
        await fetchProduct()
      } catch (error) {
        console.error('[FETCH_DATA] Error:', error)
        toast.error("Failed to fetch data")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [id, isNew])

  useEffect(() => {
    console.log('[PRODUCT_IMAGES] Updated:', product?.images)
  }, [product?.images])

  useEffect(() => {
    console.log('[DEBUG] Product state changed:', {
      product,
      uploadedImages,
      isNew,
      productImages: product?.images,
    });
  }, [product, uploadedImages, isNew]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Get form data
    const formData = new FormData(e.currentTarget)

    setIsSaving(true)

    try {
      const data: ProductFormData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: Number(formData.get('price')),
        stock: Number(formData.get('stock')),
        categoryId: formData.get('categoryId') as string,
        brandId: formData.get('brandId') as string || null,
        images: uploadedImages,
        attachments: attachments,
        tags: tags.map(tag => tag.name),
        thumbnailId: product?.thumbnailId || undefined,
        discountType: (formData.get('discountType') as DiscountType | 'NONE') === 'NONE'
          ? null
          : (formData.get('discountType') as 'FLAT' | 'PERCENTAGE' | 'BOTH' | null),
        discountAmount: formData.get('discountAmount') ? Number(formData.get('discountAmount')) : null,
        discountPercent: formData.get('discountPercent') ? Number(formData.get('discountPercent')) : null,
        public: formData.get('public') === 'on',
        isFeatured: formData.get('isFeatured') === 'on',
        negotiablePrice: formData.get('negotiablePrice') === 'on',
        hidePrice: formData.get('hidePrice') === 'on',
        hideStock: formData.get('hideStock') === 'on',
        useStock: formData.get('useStock') === 'on'
      }

      if (isNew) {
        console.log('[SUBMIT] Creating product with data:', data);
        const createdProduct = await productAdminService.create(data)
        console.log('[SUBMIT] Product created:', createdProduct);

        // If we have a selected thumbnail, set it after product creation
        if (newProductThumbnailId) {
          console.log('[SUBMIT] Setting thumbnail for new product:', {
            productId: createdProduct.id,
            thumbnailId: newProductThumbnailId,
            createdImages: createdProduct.images
          });

          // Find the actual image ID from the created product
          const actualImage = createdProduct.images?.find((img: { id: string; url: string }) =>
            img.url === uploadedImages[parseInt(newProductThumbnailId.split('-')[1])]
          );

          if (actualImage) {
            console.log('[SUBMIT] Found matching image:', actualImage);
            await productAdminService.setThumbnail(createdProduct.id, actualImage.id);
          } else {
            console.error('[SUBMIT] Could not find matching image for thumbnail');
          }
        }
      } else {
        await productAdminService.update(id as string, data)
      }

      toast.success(`Product ${isNew ? 'created' : 'updated'} successfully`)
      router.push('/admin/products')
    } catch (error) {
      console.error('[SUBMIT]', error)
      toast.error(`Failed to ${isNew ? 'create' : 'update'} product`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const result = await productAdminService.uploadImage(product?.id || null, file)

      if (product) {
        await fetchProduct()
      } else {
        // For new products, just track the URL
        setUploadedImages(prev => [...prev, result])
      }
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error('[UPLOAD] Error:', error)
      toast.error("Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageDelete = async () => {
    if (!imageToDelete) return
    setIsDeletingImage(true)

    try {
      const result = await productAdminService.deleteImage(imageToDelete)

      // Create filtered images array
      const filteredImages = uploadedImages.filter(img => img !== imageToDelete)

      if (product) {
        // If editing an existing product, update the database
        const updatedProduct: ProductFormData = {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          categoryId: product.categoryId,
          images: filteredImages,
          attachments: (product.attachments || []).map(att => ({
            url: att.url,
            name: att.name
          })),
          tags: (product.tags || []).map(tag => tag.name),
          thumbnailId: product.thumbnailId ?? undefined,
          public: product.public,
          isFeatured: product.isFeatured,
          negotiablePrice: product.negotiablePrice,
          hidePrice: product.hidePrice,
          hideStock: product.hideStock,
          useStock: product.useStock
        }
        const updatedProductData = await productAdminService.update(product.id, updatedProduct)
        // Update the local product state with the new data
        setProduct(updatedProductData)
      }

      // Update UI state
      setUploadedImages(filteredImages)

      if (!result.fileDeleted) {
        toast.success("Image removed from product (file not found)")
      } else {
        toast.success("Image deleted successfully")
      }
    } catch (error) {
      console.error('[DELETE_IMAGE] Error:', error)
      toast.error("Failed to delete image")
    } finally {
      setImageToDelete(null)
      setIsDeletingImage(false)
    }
  }

  const handleAttachmentUpload = async (file: File) => {
    setIsUploadingAttachment(true)
    try {
      const result = await productAdminService.uploadAttachment(product?.id || null, file)
      setAttachments(prev => [...prev, result])
      toast.success("Attachment uploaded successfully")
    } catch (error) {
      console.error('[UPLOAD_ATTACHMENT] Error:', error)
      toast.error("Failed to upload attachment")
    } finally {
      setIsUploadingAttachment(false)
    }
  }

  const handleAttachmentDelete = async () => {
    if (!attachmentToDelete) return
    console.log('[DELETE_ATTACHMENT] Starting deletion for:', attachmentToDelete)
    console.log('[DELETE_ATTACHMENT] Setting isDeletingAttachment to true')
    setIsDeletingAttachment(true)

    try {
      const result = await productAdminService.deleteAttachment(attachmentToDelete)

      // Create filtered attachments array
      const filteredAttachments = attachments.filter(att => att.url !== attachmentToDelete)

      if (product) {
        // If editing an existing product, update the database
        const updatedProduct: ProductFormData = {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          categoryId: product.categoryId,
          images: (product.images || []).map(img => img.url),
          attachments: filteredAttachments,
          tags: (product.tags || []).map(tag => tag.name),
          public: product.public,
          isFeatured: product.isFeatured,
          negotiablePrice: product.negotiablePrice,
          hidePrice: product.hidePrice,
          hideStock: product.hideStock,
          useStock: product.useStock
        }
        await productAdminService.update(product.id, updatedProduct)
      }

      // Update UI state
      setAttachments(filteredAttachments)

      if (!result.fileDeleted) {
        toast.success("Attachment removed from product (file not found)")
      } else {
        toast.success("Attachment deleted successfully")
      }
    } catch (error) {
      console.error('[DELETE_ATTACHMENT] Error:', error)
      toast.error("Failed to delete attachment")
    } finally {
      console.log('[DELETE_ATTACHMENT] Cleanup: Setting states to false/null')
      setAttachmentToDelete(null)
      setIsDeletingAttachment(false)
    }
  }

  const handleThumbnailSelect = async (imageId: string) => {
    setIsSettingThumbnail(true);
    console.log('[THUMBNAIL_SELECT] Selecting thumbnail:', { imageId, isNew });
    try {
      if (isNew) {
        // For new products, just store the temporary ID
        setNewProductThumbnailId(imageId);
        console.log('[THUMBNAIL_SELECT] Set new product thumbnail ID:', imageId);
        toast.success("Thumbnail selected");
      } else {
        // For existing products, update in the database
        console.log('[THUMBNAIL_SELECT] Updating existing product thumbnail:', { id, imageId });
        const updatedProduct = await productAdminService.setThumbnail(id as string, imageId);
        setProduct(updatedProduct);
        toast.success("Thumbnail updated successfully");
      }
    } catch (error) {
      console.error('[THUMBNAIL_SELECT] Error:', error);
      toast.error("Failed to update thumbnail");
    } finally {
      setIsSettingThumbnail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isNew ? "Add Product" : "Edit Product"}
        </h1>
        <p className="text-muted-foreground">
          {isNew ? "Add a new product to your store." : "Edit product details."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <LoadingOverlay show={isDeleting} />
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={product?.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="categoryId" className="text-sm font-medium">Category</label>
                  <Select name="categoryId" defaultValue={product?.categoryId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="brandId" className="text-sm font-medium">Brand</label>
                  <Select name="brandId" defaultValue={product?.brandId || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">Price</label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={product?.price}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="discountType" className="text-sm font-medium">
                    Discount Type
                  </label>
                  <Select
                    name="discountType"
                    defaultValue={product?.discountType || "NONE"}
                    onValueChange={(value: DiscountType | 'NONE') => setDiscountType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No Discount</SelectItem>
                      <SelectItem value="FLAT">Flat Discount</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage Discount</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="discountAmount" className="text-sm font-medium">
                    Flat Discount Amount ($)
                  </label>
                  <Input
                    id="discountAmount"
                    name="discountAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={product?.discountAmount || ""}
                    disabled={!["FLAT", "BOTH"].includes(discountType)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="discountPercent" className="text-sm font-medium">
                    Discount Percentage (%)
                  </label>
                  <Input
                    id="discountPercent"
                    name="discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={product?.discountPercent || ""}
                    disabled={!["PERCENTAGE", "BOTH"].includes(discountType)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="stock" className="text-sm font-medium">Stock</label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    defaultValue={product?.stock}
                    required
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <label className="text-sm font-medium">Product Options</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="public"
                      name="public"
                      defaultChecked={product?.public ?? true}
                      className="h-5 w-5 mt-0.5"
                    />
                    <div className="flex flex-col">
                      <label
                        htmlFor="public"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Make product public
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Product will be visible to customers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="isFeatured"
                      name="isFeatured"
                      defaultChecked={product?.isFeatured ?? false}
                      className="h-5 w-5 mt-0.5"
                    />
                    <div className="flex flex-col">
                      <label
                        htmlFor="isFeatured"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Featured product
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Product will be displayed in featured sections.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="negotiablePrice"
                        name="negotiablePrice"
                        defaultChecked={isNew ? false : (product?.negotiablePrice ?? false)}
                      />
                      <label
                        htmlFor="negotiablePrice"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Negotiable Price
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When enabled, customers will be able to negotiate the price of this
                      product.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hidePrice"
                        name="hidePrice"
                        defaultChecked={isNew ? false : (product?.hidePrice ?? false)}
                      />
                      <label
                        htmlFor="hidePrice"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Hide Price
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When enabled, the price of this product will be hidden from customers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hideStock"
                        name="hideStock"
                        defaultChecked={isNew ? false : (product?.hideStock ?? false)}
                      />
                      <label
                        htmlFor="hideStock"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Hide Stock
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When enabled, the stock level of this product will be hidden from customers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="useStock"
                        name="useStock"
                        defaultChecked={isNew ? true : (product?.useStock ?? true)}
                      />
                      <label
                        htmlFor="useStock"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Use Stock Management
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When enabled, stock will be automatically updated when orders are accepted or cancelled.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={product?.description || ''}
                  required
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (Optional)</label>
                <TagInput
                  tags={tags}
                  onTagsChange={setTags}
                  suggestions={allTags}
                />
              </div>
              {isNew && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <p>
                      <strong>Important:</strong> Uploaded files will be automatically deleted after 1 hour if the product is not saved.
                    </p>
                  </div>
                </div>
              )}
              <Card className="relative">
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <LoadingOverlay show={isDeletingImage || isSettingThumbnail} />
                  <div className="grid gap-4 md:grid-cols-3">
                    {isNew ? (
                      uploadedImages.map((url, index) => {
                        const tempImageId = `temp-${index}`;
                        return (
                          <div
                            key={tempImageId}
                            className={cn(
                              "relative aspect-square group rounded-lg",
                              tempImageId === newProductThumbnailId && "ring-2 ring-primary ring-offset-2"
                            )}
                          >
                            <img
                              src={url}
                              alt="Product image"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <ThumbnailSelector
                                imageId={tempImageId}
                                isThumbnail={tempImageId === newProductThumbnailId}
                                onSelect={(id) => setNewProductThumbnailId(id)}
                                disabled={isSettingThumbnail}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => setImageToDelete(url)}
                                disabled={isDeletingImage}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {tempImageId === newProductThumbnailId && (
                              <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                Thumbnail
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      // For existing products, render from product.images
                      product?.images?.map((image) => (
                        <div
                          key={image.id}
                          className={cn(
                            "relative aspect-square group rounded-lg",
                            image.id === product.thumbnailId && "ring-2 ring-primary ring-offset-2"
                          )}
                        >
                          <img
                            src={image.url}
                            alt="Product image"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <ThumbnailSelector
                              imageId={image.id}
                              isThumbnail={image.id === product.thumbnailId}
                              onSelect={handleThumbnailSelect}
                              disabled={isSettingThumbnail}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => setImageToDelete(image.url)}
                              disabled={isDeletingImage}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {image.id === product.thumbnailId && (
                            <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              Thumbnail
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    <ImageUpload
                      onUpload={handleImageUpload}
                      isUploading={isUploading}
                      className="aspect-square"
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2">
                <label className="text-sm font-medium">Attachments</label>
                <div className="relative">
                  <LoadingOverlay show={isDeletingAttachment} />
                  <div className="space-y-4">
                    {attachments.map((attachment) => (
                      <div key={attachment.url} className="relative flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm">{attachment.name}</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          type="button"
                          onClick={() => {
                            console.log('[DELETE_ATTACHMENT] Setting attachmentToDelete:', attachment.url)
                            setAttachmentToDelete(attachment.url)
                          }}
                          disabled={isDeletingAttachment && attachmentToDelete === attachment.url}
                        >
                          {isDeletingAttachment && attachmentToDelete === attachment.url ? (
                            <LoadingSpinner className="h-4 w-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                    <AttachmentUpload
                      onUpload={handleAttachmentUpload}
                      isUploading={isUploadingAttachment}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 mt-4">
            {!isNew && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    setShowDeleteDialog(true)
                  }}
                  disabled={isSaving || isDeleting || isArchiving}
                >
                  Delete Product
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-300"
                  onClick={async () => {
                    setShowArchiveDialog(true)
                  }}
                  disabled={isSaving || isDeleting || isArchiving}
                >
                  Archive Product
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSaving || isDeleting || isArchiving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || isDeleting || isArchiving}>
              {isSaving && <LoadingSpinner className="mr-2" />}
              {isNew ? "Create Product" : "Update Product"}
            </Button>
          </div>
        </div>
      </form>

      <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleImageDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!attachmentToDelete} onOpenChange={() => setAttachmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attachment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleAttachmentDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
              All associated images and attachments will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                setShowDeleteDialog(false)
                setIsDeleting(true)
                try {
                  await productAdminService.deleteProduct(id as string)
                  toast.success("Product deleted successfully")
                  router.push('/admin/products')
                } catch (error) {
                  console.error('[DELETE_PRODUCT] Error:', error)
                  toast.error(error instanceof Error ? error.message : "Failed to delete product")
                  setIsDeleting(false)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this product?
              Archived products will be hidden from customers but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 text-white hover:bg-amber-600"
              onClick={async () => {
                setShowArchiveDialog(false)
                setIsArchiving(true)
                try {
                  const result = await productAdminService.archiveProduct(id as string)
                  toast.success("Product archived successfully")

                  // Show warning about affected orders if any
                  if (result.warning) {
                    toast(result.warning, {
                      description: `Order IDs: ${result.affectedOrders?.join(', ')}`,
                      duration: 10000,
                      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />
                    })
                  }

                  router.push('/admin/products')
                } catch (error) {
                  console.error('[ARCHIVE_PRODUCT] Error:', error)
                  toast.error(error instanceof Error ? error.message : "Failed to archive product")
                  setIsArchiving(false)
                }
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 