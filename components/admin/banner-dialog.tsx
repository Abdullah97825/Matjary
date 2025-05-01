'use client'

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Banner, BannerFormData, BannerUpdateData } from "@/types/banner"
import { bannerService } from "@/services/banner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Loader } from "lucide-react"
import { toast } from "sonner"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  imageUrl: z.string().min(1, "Image URL is required"),
  link: z.string().url("Must be a valid URL")
    .or(z.literal(""))
    .or(z.string().regex(/^\/.*/, "Must start with /")),
  active: z.boolean(),
  order: z.number().min(0)
}).partial()

type FormValues = z.infer<typeof formSchema>

interface BannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Banner
  onSubmit: (data: BannerFormData | BannerUpdateData) => Promise<void>
}

export function BannerDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit
}: BannerDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const defaultValues = {
    title: "",
    imageUrl: "",
    link: "",
    active: true,
    order: 0
  }

  // Transform Banner to FormValues to handle the link null vs undefined issue
  const transformInitialData = (data?: Banner): FormValues | undefined => {
    if (!data) return undefined;

    return {
      title: data.title,
      imageUrl: data.imageUrl,
      link: data.link ?? "", // convert null to empty string
      active: data.active,
      order: data.order
    };
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: transformInitialData(initialData) || defaultValues,
  })

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(transformInitialData(initialData));
    } else {
      form.reset(defaultValues);
    }
  }, [initialData, form]);

  async function onFormSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      await onSubmit(values)
      form.reset(defaultValues)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await bannerService.uploadImage(initialData?.id || null, file)
      form.setValue('imageUrl', url, { shouldValidate: true })
      toast.success('Image uploaded successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Banner" : "Add New Banner"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Make changes to the banner" : "Create a new promotional banner"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image preview */}
            {form.watch('imageUrl') && (
              <div className="relative h-40 w-full overflow-hidden rounded-md">
                <img
                  src={form.watch('imageUrl') || '/images/placeholder.svg'}
                  alt="Banner preview"
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            {/* Image upload component */}
            <div className="space-y-3">
              <FormLabel>Banner Image</FormLabel>
              <div className="text-sm text-amber-600 font-medium mb-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                ⚠️ Note: Image updates are applied immediately when uploaded, not when saving the form.
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                {isUploading && <Loader className="h-4 w-4 animate-spin" />}
              </div>
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Or enter image URL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link URL (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com or /page-path" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Show this banner in the carousel
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <LoadingSpinner className="mr-2" />}
                {initialData ? "Save Changes" : "Add Banner"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
