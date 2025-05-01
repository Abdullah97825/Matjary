"use client";

import { Branch, ContactDetail, BusinessHours, BranchSection } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, MapPin, Clock, Phone, Mail, Pencil, Trash, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { branchService } from "@/services/branch";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type BranchWithRelations = Branch & {
  contacts: ContactDetail[];
  businessHours: BusinessHours[];
  sections: BranchSection[];
};

interface BranchListProps {
  branches: BranchWithRelations[];
}

export function BranchList({ branches: initialBranches }: BranchListProps) {
  const [branches, setBranches] = useState(initialBranches);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await branchService.delete(id);
      setBranches(branches.filter(branch => branch.id !== id));
      toast.success('Branch deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete branch');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href="/admin/branches/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((branch) => (
          <Card key={branch.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{branch.name}</CardTitle>
                  <CardDescription>
                    {branch.isMain && <span className="text-primary">Main Branch</span>}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/branches/${branch.id}/edit`}>
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(branch.id)}
                        disabled={deletingId === branch.id}
                      >
                        {deletingId === branch.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Branch</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this branch? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(branch.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {branch.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{branch.address}</span>
                </div>
              )}
              
              {branch.contacts.length > 0 && (
                <div className="space-y-1">
                  {branch.contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center gap-2 text-sm">
                      {contact.type === 'EMAIL' ? (
                        <Mail className="h-4 w-4" />
                      ) : contact.type === 'PHONE' ? (
                        <Phone className="h-4 w-4" />
                      ) : null}
                      <span>{contact.value}</span>
                      {contact.label && (
                        <span className="text-muted-foreground">({contact.label})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {branch.businessHours.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{branch.businessHours.some(h => !h.isClosed) ? 'Open' : 'Closed'}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 