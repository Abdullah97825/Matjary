"use client";

import { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogDescription,
    DialogHeader
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useDebounce } from '@/hooks/useDebounce';
import { userService } from '@/services/user';

interface User {
    id: string;
    name: string;
    email: string;
}

interface UserSearchDialogProps {
    onSelectUser: (user: User) => void;
    buttonLabel?: string;
    selectedUsers?: User[];
    excludedUserIds?: string[];
    isProcessing?: boolean;
}

export function UserSearchDialog({
    onSelectUser,
    buttonLabel = "Add User",
    selectedUsers = [],
    excludedUserIds = [],
    isProcessing = false
}: UserSearchDialogProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        console.log("useEffect running with search:", debouncedSearch);

        // Reset the search when dialog is closed
        if (!open) {
            setSearch('');
            setResults([]);
            return;
        }

        const searchUsers = async () => {
            if (!debouncedSearch.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const users = await userService.searchUsers(debouncedSearch);

                // We'll manually filter these users when rendering instead of storing filtered state
                setResults(users);
            } catch (error) {
                console.error('Failed to fetch search results:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        searchUsers();
    }, [debouncedSearch, open]); // Only depend on search term and dialog state

    // Filter results at render time instead of in state
    const filteredResults = results.filter(user =>
        !selectedUsers.some(selected => selected.id === user.id) &&
        !excludedUserIds.includes(user.id)
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredResults.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > -1 ? prev - 1 : prev);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSelectUser(filteredResults[selectedIndex]);
                }
                break;
        }
    };

    const handleSelectUser = (user: User) => {
        onSelectUser(user);
        setOpen(false);
        setSearch('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="secondary" disabled={isProcessing}>
                    {isProcessing ? (
                        <>
                            <LoadingSpinner className="h-4 w-4 mr-2" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <SearchIcon className="h-4 w-4 mr-2" />
                            {buttonLabel}
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Search Users</DialogTitle>
                    <DialogDescription>
                        Search for users by name or email
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 py-2">
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1"
                        autoFocus
                    />
                    {isLoading && <LoadingSpinner size="sm" />}
                </div>

                <div className="h-[300px] overflow-y-auto border rounded-md">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : filteredResults.length > 0 ? (
                        <div className="divide-y">
                            {filteredResults.map((user, index) => (
                                <div
                                    key={user.id}
                                    className={cn(
                                        "flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-accent",
                                        selectedIndex === index && "bg-accent"
                                    )}
                                    onClick={() => handleSelectUser(user)}
                                >
                                    <div>
                                        <h4 className="font-medium">{user.name}</h4>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                    <Button size="sm" variant="ghost">
                                        Select
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : search ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            No users found
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Start typing to search users
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
} 