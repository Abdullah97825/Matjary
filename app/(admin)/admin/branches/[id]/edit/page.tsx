import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BranchForm } from "@/components/forms/branch/BranchForm";
import { BranchFormData } from "@/schemas/contact";
import { DeleteBranchButton } from "@/components/branches/DeleteBranchButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBranchPage({ params }: Props) {
  const { id } = await params;
  await requireAdmin();

  const branch = await prisma.branch.findUnique({
    where: { id },
    include: {
      contacts: true,
      businessHours: { orderBy: { dayOfWeek: 'asc' } },
      sections: { orderBy: { order: 'asc' } }
    }
  });

  if (!branch) {
    notFound();
  }

  // Transform the data to match the form schema
  const formData: Partial<BranchFormData> = {
    name: branch.name,
    isMain: branch.isMain,
    address: branch.address || '',
    mapEnabled: branch.mapEnabled,
    latitude: branch.latitude || undefined,
    longitude: branch.longitude || undefined,
    mapZoomLevel: branch.mapZoomLevel,
    contacts: branch.contacts.map(contact => ({
      type: contact.type,
      value: contact.value,
      label: contact.label || undefined,
      isMain: contact.isMain,
      order: contact.order
    })),
    businessHours: branch.businessHours.map(hours => ({
      dayOfWeek: hours.dayOfWeek,
      isClosed: hours.isClosed,
      openTime: hours.openTime || undefined,
      closeTime: hours.closeTime || undefined
    })),
    sections: branch.sections.map(section => ({
      title: section.title,
      content: section.content,
      order: section.order,
      isEnabled: section.isEnabled
    }))
  };

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Edit Branch</h1>
              <p className="mt-2 text-muted-foreground">
                Update branch information and contact details.
              </p>
            </div>
            <DeleteBranchButton branchId={id} />
          </div>
        </div>

        <BranchForm 
          mode="edit"
          branchId={id}
          initialData={formData}
        />
      </div>
    </div>
  );
} 