"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { BranchFormData, branchSchema } from "@/schemas/contact";
import { Loader2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { ContactType } from "@prisma/client";
import { BranchSections } from './BranchSections';
import { toast } from "sonner";
import { BranchBasicInfo } from "./BranchBasicInfo";
import { BranchContacts } from "./BranchContacts";
import { BranchHours } from "./BranchHours";
import { branchService } from "@/services/branch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BranchFormProps {
  mode: 'create' | 'edit';
  branchId?: string;
  initialData?: Partial<BranchFormData>;
}

interface ContactField {
  type: ContactType;
  value: string;
  label?: string;
  isMain: boolean;
  order: number;
}

const defaultContact: ContactField = {
  type: ContactType.EMAIL,
  value: '',
  label: '',
  isMain: false,
  order: 0
};

export function BranchForm({ mode, branchId, initialData }: BranchFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapDirty, setIsMapDirty] = useState(false);

  const form = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: initialData?.name || '',
      isMain: initialData?.isMain || false,
      address: initialData?.address || '',
      mapEnabled: initialData?.mapEnabled || false,
      latitude: initialData?.latitude,
      longitude: initialData?.longitude,
      mapZoomLevel: initialData?.mapZoomLevel || 14,
      contacts: initialData?.contacts || [defaultContact],
      businessHours: initialData?.businessHours || Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        isClosed: false
      })),
      sections: initialData?.sections || []
    }
  });

  // Watch for map-related changes
  const latitude = useWatch({ control: form.control, name: "latitude" });
  const longitude = useWatch({ control: form.control, name: "longitude" });
  const mapZoomLevel = useWatch({ control: form.control, name: "mapZoomLevel" });

  // Update map dirty state when values change
  useEffect(() => {
    if (
      latitude !== initialData?.latitude ||
      longitude !== initialData?.longitude ||
      mapZoomLevel !== initialData?.mapZoomLevel
    ) {
      setIsMapDirty(true);
    } else {
      setIsMapDirty(false);
    }
  }, [latitude, longitude, mapZoomLevel, initialData]);

  const handleSubmit = async (data: BranchFormData) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await branchService.create(data);
      } else {
        await branchService.update(branchId!, data);
      }
      toast.success(mode === 'create' ? 'Branch created successfully' : 'Branch updated successfully');
      router.push('/admin/branches');
      router.refresh();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || `Failed to ${mode} branch`);
      // Scroll to the first error if any
      const firstError = Object.keys(form.formState.errors)[0];
      if (firstError) {
        const element = document.getElementsByName(firstError)[0];
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="mb-8"
        onClick={() => router.push('/admin/branches')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Branches
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <BranchBasicInfo form={form} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <BranchContacts form={form} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <BranchHours form={form} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <BranchSections form={form} />
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || (!form.formState.isDirty && !isMapDirty)}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create Branch"
                : "Update Branch"
            }
          </Button>
        </form>
      </Form>
    </div>
  );
} 