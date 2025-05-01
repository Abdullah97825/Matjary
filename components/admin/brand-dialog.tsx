'use client'

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { BrandType, BrandFormData, BrandUpdateData } from "@/types/brand"
import { brandService } from "@/services/brand"
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
import { Textarea } from "@/components/ui/textarea"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Loader } from "lucide-react"
import { toast } from "sonner"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().or(z.literal("")),
    imageUrl: z.string()
        .url("Must be a valid URL")
        .or(z.string().regex(/^\/.*/, "Must start with /"))
        .or(z.literal("")),
    active: z.boolean()
}).partial()

type FormValues = z.infer<typeof formSchema>

interface BrandDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: BrandType
    onSubmit: (data: BrandFormData | BrandUpdateData) => Promise<void>
}

export function BrandDialog({
    open,
    onOpenChange,
    initialData,
    onSubmit
}: BrandDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const defaultValues = {
        name: "",
        description: "",
        imageUrl: "",
        active: true
    }

    // Transform BrandType to FormValues to handle any null vs undefined issues
    const transformInitialData = (data?: BrandType): FormValues | undefined => {
        if (!data) return undefined;

        return {
            name: data.name,
            description: data.description || "",
            imageUrl: data.imageUrl || "",
            active: data.active
        };
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: transformInitialData(initialData) || defaultValues,
    })

    useEffect(() => {
        if (initialData) {
            form.reset(transformInitialData(initialData));
        } else {
            form.reset(defaultValues)
        }
    }, [form, initialData])

    const handleSubmit = async (values: FormValues) => {
        setIsLoading(true)
        try {
            const formData = initialData
                ? {
                    ...values,
                    description: values.description || null,
                    imageUrl: values.imageUrl || null
                }
                : {
                    name: values.name!,
                    description: values.description || null,
                    imageUrl: values.imageUrl || null,
                    active: values.active!
                }
            await onSubmit(formData)
            onOpenChange(false)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const imageUrl = await brandService.uploadImage(initialData?.id || null, file)
            form.setValue('imageUrl', imageUrl)
            toast.success("Image uploaded successfully")
        } catch (error) {
            toast.error("Failed to upload image")
            console.error('Upload error:', error)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Brand" : "Add Brand"}</DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? "Make changes to the brand"
                            : "Create a new brand for products"
                        }
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Brand Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Brand Description"
                                            className="resize-none"
                                            {...field}
                                        />
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
                                    alt="Brand preview"
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        )}

                        {/* Image upload component */}
                        <div>
                            <FormLabel>Brand Image</FormLabel>
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
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel>Active</FormLabel>
                                        <FormDescription>
                                            Show this brand in the shop
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

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <LoadingSpinner className="mr-2" />}
                                {initialData ? "Save Changes" : "Add Brand"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
} 