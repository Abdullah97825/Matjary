"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { X } from "lucide-react";
import { UserSearchDialog } from './UserSearchDialog';

export interface AssignedUser {
    id: string;
    userId: string;
    name: string;
    email: string;
}

export interface ExcludedUser {
    userId: string;
    name: string;
    email: string;
}

interface PromoCodeUserListsProps {
    assignedUsers: AssignedUser[];
    excludedUsers: ExcludedUser[];
    onAddAssignedUser: (user: { id: string; name: string; email: string }) => void;
    onRemoveAssignedUser: (userId: string) => void;
    onAddExcludedUser: (user: { id: string; name: string; email: string }) => void;
    onRemoveExcludedUser: (userId: string) => void;
    isLoadingUsers?: boolean;
}

export function PromoCodeUserLists({
    assignedUsers,
    excludedUsers,
    onAddAssignedUser,
    onRemoveAssignedUser,
    onAddExcludedUser,
    onRemoveExcludedUser,
    isLoadingUsers = false
}: PromoCodeUserListsProps) {
    // Create arrays of IDs for filtering in the search dialog
    const assignedUserIds = assignedUsers.map(user => user.userId);
    const excludedUserIds = excludedUsers.map(user => user.userId);

    return (
        <Tabs defaultValue="assigned" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="assigned">
                    Assigned Users ({assignedUsers.length})
                </TabsTrigger>
                <TabsTrigger value="excluded">
                    Excluded Users ({excludedUsers.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="assigned" className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm text-muted-foreground">
                        Users that can use this promo code
                    </h3>
                    <UserSearchDialog
                        buttonLabel="Add User"
                        onSelectUser={onAddAssignedUser}
                        selectedUsers={assignedUsers.map(u => ({ id: u.userId, name: u.name, email: u.email }))}
                        excludedUserIds={excludedUserIds}
                    />
                </div>

                <Card>
                    <CardContent className="p-0">
                        {isLoadingUsers ? (
                            <div className="flex justify-center items-center h-[200px]">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : assignedUsers.length === 0 ? (
                            <div className="flex justify-center items-center h-[200px] text-muted-foreground">
                                No assigned users
                            </div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto">
                                <ul className="divide-y">
                                    {assignedUsers.map(user => (
                                        <li key={user.userId} className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onRemoveAssignedUser(user.userId)}
                                                disabled={isLoadingUsers}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="excluded" className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm text-muted-foreground">
                        Users that cannot use this promo code
                    </h3>
                    <UserSearchDialog
                        buttonLabel="Exclude User"
                        onSelectUser={onAddExcludedUser}
                        selectedUsers={excludedUsers.map(u => ({ id: u.userId, name: u.name, email: u.email }))}
                        excludedUserIds={assignedUserIds}
                    />
                </div>

                <Card>
                    <CardContent className="p-0">
                        {isLoadingUsers ? (
                            <div className="flex justify-center items-center h-[200px]">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : excludedUsers.length === 0 ? (
                            <div className="flex justify-center items-center h-[200px] text-muted-foreground">
                                No excluded users
                            </div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto">
                                <ul className="divide-y">
                                    {excludedUsers.map(user => (
                                        <li key={user.userId} className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onRemoveExcludedUser(user.userId)}
                                                disabled={isLoadingUsers}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
} 