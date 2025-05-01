"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressFormData } from "@/types/address";
import { addressFormSchema } from "@/schemas/address";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void;
  showSaveOption?: boolean;
  onSaveOptionChange?: (save: boolean) => void;
  initialData?: Partial<AddressFormData>;
  standalone?: boolean;
  isSubmitting?: boolean;
}

export function AddressForm({ 
  onSubmit, 
  showSaveOption = false, 
  onSaveOptionChange,
  initialData,
  standalone = true,
  isSubmitting = false
}: AddressFormProps) {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      country: initialData?.country || "",
      province: initialData?.province || "",
      city: initialData?.city || "",
      neighbourhood: initialData?.neighbourhood || "",
      nearestLandmark: initialData?.nearestLandmark || "",
      zipcode: initialData?.zipcode || "",
      isDefault: initialData?.isDefault || false
    }
  });

  // For non-standalone mode, watch form changes
  useEffect(() => {
    if (!standalone) {
      const subscription = form.watch((value) => {
        // Only submit if all required fields are filled
        const isComplete = Object.values(value).every(val => 
          typeof val === 'boolean' || (val && val.length >= 2)
        );
        if (isComplete) {
          onSubmit(value as AddressFormData);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [form, onSubmit, standalone]);

  const handleSubmit = async (data: AddressFormData) => {
    const isValid = await form.trigger();
    if (isValid) {
      try {
        await onSubmit(data);
        if (standalone && !isSubmitting) {
          form.reset();
        }
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
  };

  const formContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="province"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Province</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="city"
        render={({ field }) => (
          <FormItem>
            <FormLabel>City</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="neighbourhood"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Neighbourhood</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nearestLandmark"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nearest Landmark</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="zipcode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zipcode</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {showSaveOption && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="saveAddress"
            checked={form.watch('isDefault')}
            onCheckedChange={(checked) => {
              form.setValue('isDefault', !!checked);
              onSaveOptionChange?.(!!checked);
            }}
          />
          <label htmlFor="saveAddress">Save this address for future use</label>
        </div>
      )}

      {standalone && (
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Address
        </Button>
      )}
    </div>
  );

  if (standalone) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {formContent}
        </form>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        {formContent}
      </div>
    </Form>
  );
} 