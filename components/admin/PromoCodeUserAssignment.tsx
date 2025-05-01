"use client";

import { useState, useEffect } from 'react';
import { UserSearchDialog } from '@/components/admin/UserSearchDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trash, Settings } from 'lucide-react';
import { promoService } from '@/services/promo';
import { toast } from 'sonner';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AssignedUser {
    id: string;
    userId: string;
    name: string;
    email: string;
    isExclusive: boolean;
    hasExpiryDate: boolean;
    expiryDate: Date | null;
}

interface ExcludedUser {
    id: string;
    userId: string;
    name: string;
    email: string;
}

interface PromoCodeUserAssignmentProps {
    promoCodeId: string;
    initialAssignedUsers?: Array<{
        id: string;
        userId: string;
        isExclusive: boolean;
        hasExpiryDate: boolean;
        expiryDate?: string | null;
        assignedAt: string;
        usedAt?: string | null;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    initialExcludedUsers?: Array<{
        userId: string;
        excludedAt: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
}

interface UserSettingsDialogProps {
    user: AssignedUser;
    onToggleExclusive: (userId: string, isExclusive: boolean) => Promise<void>;
    onToggleExpiryDate: (userId: string, hasExpiryDate: boolean) => Promise<void>;
    onChangeExpiryDate: (userId: string, expiryDate: Date) => Promise<void>;
    processingUser: string | null;
    formatDateTimeForInput: (date: Date | null) => string;
}

function UserSettingsDialog({
    user,
    onToggleExclusive,
    onToggleExpiryDate,
    onChangeExpiryDate,
    processingUser,
    formatDateTimeForInput
}: UserSettingsDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>User Settings</DialogTitle>
                    <DialogDescription>
                        Configure settings for {user.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor={`exclusive-dialog-${user.id}`} className="text-sm">
                                Exclusive to this user
                            </Label>
                            <Switch
                                id={`exclusive-dialog-${user.id}`}
                                checked={user.isExclusive}
                                onCheckedChange={(checked) => onToggleExclusive(user.userId, checked)}
                                disabled={processingUser === user.userId}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor={`expiry-toggle-dialog-${user.id}`} className="text-sm">
                                Custom expiry date
                            </Label>
                            <Switch
                                id={`expiry-toggle-dialog-${user.id}`}
                                checked={user.hasExpiryDate}
                                onCheckedChange={(checked) => onToggleExpiryDate(user.userId, checked)}
                                disabled={processingUser === user.userId}
                            />
                        </div>

                        {user.hasExpiryDate && (
                            <div>
                                <Label htmlFor={`expiry-date-dialog-${user.id}`} className="text-sm">
                                    Expiry Date
                                </Label>
                                <Input
                                    id={`expiry-date-dialog-${user.id}`}
                                    type="datetime-local"
                                    value={formatDateTimeForInput(user.expiryDate)}
                                    onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : null;
                                        if (date) {
                                            onChangeExpiryDate(user.userId, date);
                                        }
                                    }}
                                    disabled={processingUser === user.userId}
                                    className="mt-1"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function PromoCodeUserAssignment({
    promoCodeId,
    initialAssignedUsers = [],
    initialExcludedUsers = [],
}: PromoCodeUserAssignmentProps) {
    const [activeTab, setActiveTab] = useState<string>("assigned");
    const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
    const [excludedUsers, setExcludedUsers] = useState<ExcludedUser[]>([]);
    const [isAssigning, setIsAssigning] = useState<boolean>(false);
    const [isExcluding, setIsExcluding] = useState<boolean>(false);
    const [processingUser, setProcessingUser] = useState<string | null>(null);

    // Format initial data
    useEffect(() => {
        if (initialAssignedUsers.length > 0) {
            setAssignedUsers(
                initialAssignedUsers.map(user => ({
                    id: user.id,
                    userId: user.userId,
                    name: user.user.name,
                    email: user.user.email,
                    isExclusive: user.isExclusive,
                    hasExpiryDate: user.hasExpiryDate,
                    expiryDate: user.expiryDate ? new Date(user.expiryDate) : null,
                }))
            );
        }

        if (initialExcludedUsers.length > 0) {
            setExcludedUsers(
                initialExcludedUsers.map(user => ({
                    id: `excluded-${user.userId}`, // Generate a temporary ID
                    userId: user.userId,
                    name: user.user.name,
                    email: user.user.email,
                }))
            );
        }
    }, [initialAssignedUsers, initialExcludedUsers]);

    // Handle assigning a user
    const handleAssignUser = async (user: { id: string; name: string; email: string }) => {
        try {
            setIsAssigning(true);
            setProcessingUser(user.id);

            // Check if user is already in excluded list and remove if they are
            const isExcluded = excludedUsers.some(eu => eu.userId === user.id);
            if (isExcluded) {
                await promoService.removeExcludedUserFromPromoCode(promoCodeId, user.id);
                setExcludedUsers(prev => prev.filter(eu => eu.userId !== user.id));
            }

            // Add user to assigned list
            await promoService.assignUserToPromoCode(promoCodeId, user.id);

            // Add to local state
            setAssignedUsers(prev => [
                ...prev,
                {
                    id: `temp-${user.id}`, // Will be replaced by real ID on refresh
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                    isExclusive: false,
                    hasExpiryDate: false,
                    expiryDate: null,
                },
            ]);

            toast.success(`${user.name} assigned to promo code`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to assign user');
        } finally {
            setIsAssigning(false);
            setProcessingUser(null);
        }
    };

    // Handle excluding a user
    const handleExcludeUser = async (user: { id: string; name: string; email: string }) => {
        try {
            setIsExcluding(true);
            setProcessingUser(user.id);

            // Check if user is already in assigned list and remove if they are
            const isAssigned = assignedUsers.some(au => au.userId === user.id);
            if (isAssigned) {
                await promoService.removeUserFromPromoCode(promoCodeId, user.id);
                setAssignedUsers(prev => prev.filter(au => au.userId !== user.id));
            }

            // Add user to excluded list
            await promoService.excludeUserFromPromoCode(promoCodeId, user.id);

            // Add to local state
            setExcludedUsers(prev => [
                ...prev,
                {
                    id: `excluded-${user.id}`, // Temporary ID
                    userId: user.id,
                    name: user.name,
                    email: user.email,
                },
            ]);

            toast.success(`${user.name} excluded from promo code`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to exclude user');
        } finally {
            setIsExcluding(false);
            setProcessingUser(null);
        }
    };

    // Handle removing an assigned user
    const handleRemoveAssignedUser = async (userId: string) => {
        try {
            setProcessingUser(userId);
            await promoService.removeUserFromPromoCode(promoCodeId, userId);
            setAssignedUsers(prev => prev.filter(user => user.userId !== userId));
            toast.success('User removed from promo code');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to remove user');
        } finally {
            setProcessingUser(null);
        }
    };

    // Handle removing an excluded user
    const handleRemoveExcludedUser = async (userId: string) => {
        try {
            setProcessingUser(userId);
            await promoService.removeExcludedUserFromPromoCode(promoCodeId, userId);
            setExcludedUsers(prev => prev.filter(user => user.userId !== userId));
            toast.success('User removed from exclusion list');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to remove user from exclusion list');
        } finally {
            setProcessingUser(null);
        }
    };

    // Handle toggling exclusive status for a user
    const handleToggleExclusive = async (userId: string, isExclusive: boolean) => {
        try {
            setProcessingUser(userId);
            const user = assignedUsers.find(u => u.userId === userId);
            if (!user) return;

            // Update on server
            await promoService.removeUserFromPromoCode(promoCodeId, userId);
            await promoService.assignUserToPromoCode(
                promoCodeId,
                userId,
                isExclusive,
                user.hasExpiryDate && user.expiryDate ? user.expiryDate.toISOString() : undefined
            );

            // Update local state
            setAssignedUsers(prev =>
                prev.map(u =>
                    u.userId === userId
                        ? { ...u, isExclusive }
                        : u
                )
            );

            toast.success(`User ${isExclusive ? 'set to exclusive' : 'set to non-exclusive'}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update user settings');
        } finally {
            setProcessingUser(null);
        }
    };

    // Handle toggling expiry date for a user
    const handleToggleExpiryDate = async (userId: string, hasExpiryDate: boolean) => {
        try {
            setProcessingUser(userId);
            const user = assignedUsers.find(u => u.userId === userId);
            if (!user) return;

            // If enabling expiry date and no date is set, set it to 30 days from now
            let expiryDate = user.expiryDate;
            if (hasExpiryDate && !expiryDate) {
                const date = new Date();
                date.setDate(date.getDate() + 30);
                expiryDate = date;
            }

            // Update on server
            await promoService.removeUserFromPromoCode(promoCodeId, userId);
            await promoService.assignUserToPromoCode(
                promoCodeId,
                userId,
                user.isExclusive,
                hasExpiryDate && expiryDate ? expiryDate.toISOString() : undefined
            );

            // Update local state
            setAssignedUsers(prev =>
                prev.map(u =>
                    u.userId === userId
                        ? { ...u, hasExpiryDate, expiryDate }
                        : u
                )
            );

            toast.success(`Expiry date ${hasExpiryDate ? 'enabled' : 'disabled'} for user`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update user settings');
        } finally {
            setProcessingUser(null);
        }
    };

    // Handle changing the expiry date for a user
    const handleChangeExpiryDate = async (userId: string, expiryDate: Date) => {
        try {
            setProcessingUser(userId);
            const user = assignedUsers.find(u => u.userId === userId);
            if (!user) return;

            // Update on server
            await promoService.removeUserFromPromoCode(promoCodeId, userId);
            await promoService.assignUserToPromoCode(
                promoCodeId,
                userId,
                user.isExclusive,
                user.hasExpiryDate ? expiryDate.toISOString() : undefined
            );

            // Update local state
            setAssignedUsers(prev =>
                prev.map(u =>
                    u.userId === userId
                        ? { ...u, expiryDate }
                        : u
                )
            );

            toast.success('User expiry date updated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update expiry date');
        } finally {
            setProcessingUser(null);
        }
    };

    // Format date for input field
    const formatDateTimeForInput = (date: Date | null): string => {
        if (!date) return '';
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
    };

    // Get filtered lists of users for the search dialog
    const getSelectedUsers = () => {
        return [
            ...assignedUsers.map(user => ({
                id: user.userId,
                name: user.name,
                email: user.email,
            })),
            ...excludedUsers.map(user => ({
                id: user.userId,
                name: user.name,
                email: user.email,
            })),
        ];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Assignment & Exclusion</CardTitle>
                <CardDescription>
                    Manage which users can use this promo code
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="assigned" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="assigned">Assigned Users</TabsTrigger>
                        <TabsTrigger value="excluded">Excluded Users</TabsTrigger>
                    </TabsList>

                    <TabsContent value="assigned" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium">Assigned Users</h3>
                            <UserSearchDialog
                                onSelectUser={handleAssignUser}
                                buttonLabel="Assign User"
                                selectedUsers={getSelectedUsers()}
                                isProcessing={isAssigning}
                            />
                        </div>

                        <div className="border rounded-md h-[350px] overflow-y-auto">
                            {assignedUsers.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No users assigned to this promo code
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {assignedUsers.map(user => (
                                        <div key={user.id} className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium">{user.name}</h4>
                                                        {user.isExclusive && (
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                                                Exclusive
                                                            </Badge>
                                                        )}
                                                        {user.hasExpiryDate && (
                                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                                                                Custom Expiry
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <UserSettingsDialog
                                                        user={user}
                                                        onToggleExclusive={handleToggleExclusive}
                                                        onToggleExpiryDate={handleToggleExpiryDate}
                                                        onChangeExpiryDate={handleChangeExpiryDate}
                                                        processingUser={processingUser}
                                                        formatDateTimeForInput={formatDateTimeForInput}
                                                    />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                disabled={processingUser === user.userId}
                                                            >
                                                                {processingUser === user.userId ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Remove User</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to remove {user.name} from this promo code?
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleRemoveAssignedUser(user.userId)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Remove
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="excluded" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium">Excluded Users</h3>
                            <UserSearchDialog
                                onSelectUser={handleExcludeUser}
                                buttonLabel="Exclude User"
                                selectedUsers={getSelectedUsers()}
                                isProcessing={isExcluding}
                            />
                        </div>

                        <div className="border rounded-md h-[350px] overflow-y-auto">
                            {excludedUsers.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No users excluded from this promo code
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {excludedUsers.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-4">
                                            <div>
                                                <h4 className="font-medium">{user.name}</h4>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        disabled={processingUser === user.userId}
                                                    >
                                                        {processingUser === user.userId ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Remove Exclusion</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to remove {user.name} from the exclusion list?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleRemoveExcludedUser(user.userId)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Remove
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
} 