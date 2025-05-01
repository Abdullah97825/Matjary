import { requireAdmin } from "@/lib/auth";
import { BranchForm } from "@/components/forms/branch/BranchForm";

export default async function NewBranchPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Add New Branch</h1>
          <p className="mt-2 text-muted-foreground">
            Create a new branch location with contact details.
          </p>
        </div>

        <BranchForm
          mode="create"
        />
      </div>
    </div>
  );
} 