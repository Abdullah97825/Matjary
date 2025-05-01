'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { DiscountType } from '@prisma/client';
import { toast } from 'sonner';

import { promoCodeSchema, PromoCodeFormData } from '@/schemas/promo';
import { promoService } from '@/services/promo';
import { PromoCodeWithDetails } from '@/types/promo';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, AlertTriangle, Trash } from 'lucide-react';
import Link from 'next/link';
import { PromoCodeUserAssignment } from '@/components/admin/PromoCodeUserAssignment';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditPromoCodePage() {
    const router = useRouter();
    const { id } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [promoCode, setPromoCode] = useState<PromoCodeWithDetails | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm<PromoCodeFormData>({
        resolver: zodResolver(promoCodeSchema),
        defaultValues: {
            code: '',
            description: '',
            discountType: DiscountType.NONE,
            discountAmount: null,
            discountPercent: null,
            hasExpiryDate: true,
            expiryDate: null,
            isActive: true,
            maxUses: null,
            minOrderAmount: null,
            userAssignments: [],
            excludedUserIds: [],
        },
    });

    const discountType = form.watch('discountType');
    const hasExpiryDate = form.watch('hasExpiryDate');

    useEffect(() => {
        const fetchPromoCode = async () => {
            try {
                setIsLoading(true);
                const data = await promoService.getPromoCode(id as string);
                setPromoCode(data);

                // Convert the dates from ISO strings to Date objects
                const formValues = {
                    ...data,
                    expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                    // These fields are not directly used in the form but handled separately via the PromoCodeUserAssignment component
                    userAssignments: [],
                    excludedUserIds: [],
                };

                form.reset(formValues);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to load promo code');
                router.push('/admin/promo-codes');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchPromoCode();
        }
    }, [id, form, router]);

    const onSubmit = async (data: PromoCodeFormData) => {
        try {
            setIsSubmitting(true);

            // Format the data for API to match PromoCodeUpdate interface
            const formattedData = {
                id: id as string,
                code: data.code,
                description: data.description || undefined, // Convert null to undefined
                discountType: data.discountType,
                discountAmount: data.discountAmount === null ? undefined : data.discountAmount, // null to undefined
                discountPercent: data.discountPercent === null ? undefined : data.discountPercent, // null to undefined
                hasExpiryDate: data.hasExpiryDate,
                expiryDate: data.expiryDate ? data.expiryDate.toISOString() : null,
                isActive: data.isActive,
                maxUses: data.maxUses === null ? undefined : data.maxUses, // null to undefined
                minOrderAmount: data.minOrderAmount === null ? undefined : data.minOrderAmount, // null to undefined
                // User assignments and exclusions are handled by the PromoCodeUserAssignment component
            };

            await promoService.updatePromoCode(formattedData);
            toast.success('Promo code updated successfully');

            // Refresh the data
            const updatedPromoCode = await promoService.getPromoCode(id as string);
            setPromoCode(updatedPromoCode);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update promo code');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format date for input field
    const formatDateTimeForInput = (date: Date | null): string => {
        if (!date) return '';
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
    };

    // Get tomorrow's date as minimum date for expiry
    const getTomorrowDate = (): string => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    // Handle promo code deletion
    const handleDeletePromoCode = async () => {
        try {
            setIsDeleting(true);
            await promoService.deletePromoCode(id as string);
            toast.success('Promo code deleted successfully');
            router.push('/admin/promo-codes');
        } catch (error) {
            setIsDeleting(false);
            toast.error(error instanceof Error ? error.message : 'Failed to delete promo code');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-2">
                <Link href="/admin/promo-codes" className="flex items-center text-muted-foreground hover:text-primary">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to promo codes
                </Link>
            </div>

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Promo Code</h1>
                    <p className="text-muted-foreground">
                        Update the details of your promotional code
                    </p>
                </div>
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Trash className="h-4 w-4 mr-2" />
                            )}
                            Delete Promo Code
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this promo code? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeletePromoCode}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Update the general details of your promo code</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Promo Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="SUMMER2023" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                A unique code customers will use at checkout
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel>Active Status</FormLabel>
                                                <FormDescription>
                                                    Enable or disable this promo code
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Summer sale discount for all customers"
                                                className="resize-none"
                                                {...field}
                                                value={field.value || ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="discountType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount Type</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select discount type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value={DiscountType.NONE}>No Discount</SelectItem>
                                                    <SelectItem value={DiscountType.FLAT}>Flat Amount</SelectItem>
                                                    <SelectItem value={DiscountType.PERCENTAGE}>Percentage</SelectItem>
                                                    <SelectItem value={DiscountType.BOTH}>Both</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                How the discount will be calculated
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {(discountType === DiscountType.FLAT || discountType === DiscountType.BOTH) && (
                                    <FormField
                                        control={form.control}
                                        name="discountAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount Amount</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="10.00"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                        value={field.value === null ? '' : field.value}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Flat amount to discount (in your currency)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {(discountType === DiscountType.PERCENTAGE || discountType === DiscountType.BOTH) && (
                                    <FormField
                                        control={form.control}
                                        name="discountPercent"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount Percentage</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="10"
                                                        min={0}
                                                        max={100}
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                        value={field.value === null ? '' : field.value}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Percentage discount (0-100)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="minOrderAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Minimum Order Amount</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="50.00"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                    value={field.value === null ? '' : field.value}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Minimum order amount required to use this code (optional)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="maxUses"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Maximum Uses</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="100"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                                    value={field.value === null ? '' : field.value}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Limit the number of times this code can be used (leave empty for unlimited)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="hasExpiryDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel>Expiry Date</FormLabel>
                                            <FormDescription>
                                                Set an expiration date for this promo code
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {hasExpiryDate && (
                                <FormField
                                    control={form.control}
                                    name="expiryDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expiry Date and Time</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="datetime-local"
                                                    min={getTomorrowDate()}
                                                    value={field.value ? formatDateTimeForInput(field.value) : ''}
                                                    onChange={(e) => {
                                                        const date = e.target.value ? new Date(e.target.value) : null;
                                                        field.onChange(date);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                The date and time when this promo code will expire
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {promoCode && promoCode.usedCount > 0 && (
                                <div className="bg-yellow-50 p-4 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-yellow-800" />
                                        <p className="text-sm text-yellow-800">
                                            <strong>This promo code has been used {promoCode.usedCount} times.</strong> Some changes may affect users who have already used it.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t px-6 py-4">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/admin/promo-codes">Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>

            {promoCode && !isLoading && (
                <PromoCodeUserAssignment
                    promoCodeId={id as string}
                    initialAssignedUsers={promoCode.userAssignments}
                    initialExcludedUsers={promoCode.excludedUsers}
                />
            )}
        </div>
    );
} 