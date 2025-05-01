import { prisma } from "@/lib/prisma";
import { BranchCard } from "@/components/branches/BranchCard";

// Add export const dynamic = 'force-dynamic' to prevent static pre-rendering
export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const branches = await prisma.branch.findMany({
    include: {
      contacts: true,
      businessHours: {
        orderBy: { dayOfWeek: 'asc' }
      },
      sections: {
        where: { isEnabled: true },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: [
      { isMain: 'desc' },
      { name: 'asc' }
    ]
  });

  const mainBranch = branches.find(branch => branch.isMain);
  const otherBranches = branches.filter(branch => !branch.isMain);

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Contact Us</h1>
          <p className="mt-2 text-muted-foreground">
            Get in touch with us through any of our locations.
          </p>
        </div>

        {mainBranch && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Main Office</h2>
            <BranchCard branch={mainBranch} />
          </div>
        )}

        {otherBranches.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Other Locations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherBranches.map((branch) => (
                <BranchCard key={branch.id} branch={branch} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}