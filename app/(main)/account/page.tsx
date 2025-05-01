import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/forms/account/profileForm";
import { SecurityForm } from "@/components/forms/account/securityForm";
import { AddressBook } from "@/components/forms/account/addressBook";

export default async function AccountPage() {
  const user = await requireAuth();
  
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { isDefault: 'desc' }
  });

  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your profile, security settings, and delivery addresses.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileForm user={user} />
          </TabsContent>

          <TabsContent value="addresses">
            <AddressBook 
              addresses={addresses} 
              canDelete={addresses.length > 1} 
            />
          </TabsContent>

          <TabsContent value="security">
            <SecurityForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 