"use client";

import { useState } from "react";
import { Address } from "@prisma/client";
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddressForm } from "@/components/checkout/AddressForm";
import { AddressFormData } from "@/types/address";
import { addressService } from "@/services/address";
import { useRouter } from "next/navigation";

interface AddressBookProps {
  addresses: Address[];
  canDelete: boolean;
}

export function AddressBook({ addresses, canDelete }: AddressBookProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSetDefault = async (addressId: string) => {
    setIsLoading(addressId);
    try {
      await addressService.setDefault(addressId);
      toast.success("Default address updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update default address");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (addressId: string) => {
    setIsLoading(addressId);
    try {
      await addressService.delete(addressId);
      toast.success("Address deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete address");
    } finally {
      setIsLoading(null);
    }
  };

  const handleAddAddress = async (data: AddressFormData) => {
    setIsSubmitting(true);
    try {
      await addressService.create(data);
      toast.success("Address added successfully");
      router.refresh();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add address");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Delivery Addresses</h2>
          <p className="text-sm text-muted-foreground">
            Manage your delivery addresses
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!isSubmitting) setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <AddressForm 
              onSubmit={handleAddAddress}
              showSaveOption={false}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="flex items-start justify-between p-4 border rounded-lg"
          >
            <div className="space-y-1">
              <div className="font-medium">
                {[
                  address.neighbourhood,
                  address.city,
                  address.province,
                  address.country,
                  address.zipcode
                ].filter(Boolean).join(', ')}
              </div>
              {address.nearestLandmark && (
                <div className="text-sm text-muted-foreground">
                  Near {address.nearestLandmark}
                </div>
              )}
              {address.isDefault && (
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Default Address
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {!address.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetDefault(address.id)}
                  disabled={!!isLoading}
                >
                  {isLoading === address.id && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Set as Default
                </Button>
              )}
              {canDelete && !address.isDefault && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(address.id)}
                  disabled={!!isLoading}
                >
                  {isLoading === address.id && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 