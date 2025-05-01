import { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/order";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { ChevronDown, ChevronUp, ClockIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface OrderHistoryItem {
    id: string;
    previousStatus: OrderStatus;
    newStatus: OrderStatus;
    note?: string;
    createdAt: string;
    createdBy: {
        name: string;
        role?: string;
    };
}

interface StatusHistoryProps {
    history: OrderHistoryItem[];
    isLoading?: boolean;
    initialItemsToShow?: number;
}

export function StatusHistory({
    history,
    isLoading = false,
    initialItemsToShow = 2
}: StatusHistoryProps) {
    const [expanded, setExpanded] = useState(false);

    const hasMoreItems = history.length > initialItemsToShow;
    const visibleItems = expanded ? history : history.slice(0, initialItemsToShow);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Status History</CardTitle>
                    <CardDescription>Loading status history...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (history.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Status History</CardTitle>
                    <CardDescription>No status changes recorded yet.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Status History</CardTitle>
                <CardDescription>Timeline of order status changes</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {visibleItems.map((item, index) => (
                        <div key={item.id} className="relative pl-6 pb-6">
                            {/* Timeline connector */}
                            {index < visibleItems.length - 1 && (
                                <div className="absolute left-2 top-3 bottom-0 w-[1px] bg-gray-200"></div>
                            )}

                            {/* Status dot */}
                            <div className={`absolute left-0 top-2 h-4 w-4 rounded-full bg-${ORDER_STATUS_COLORS[item.newStatus]}-500`}></div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={ORDER_STATUS_COLORS[item.newStatus]}>
                                            {ORDER_STATUS_LABELS[item.newStatus]}
                                        </Badge>
                                        <span className="text-sm text-gray-500">
                                            from {ORDER_STATUS_LABELS[item.previousStatus]}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <ClockIcon className="h-3 w-3" />
                                        {new Date(item.createdAt).toLocaleString()}
                                    </div>
                                </div>

                                {item.note && (
                                    <div className="text-sm bg-gray-50 p-3 rounded-md">
                                        {item.note}
                                    </div>
                                )}

                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <UserIcon className="h-3 w-3" />
                                    Changed by {item.createdBy.name}
                                </div>
                            </div>
                        </div>
                    ))}

                    {hasMoreItems && (
                        <Button
                            variant="ghost"
                            className="w-full text-sm text-gray-500 hover:text-gray-800"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? (
                                <>
                                    <ChevronUp className="h-4 w-4 mr-1" />
                                    Show Less
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                    Show {history.length - initialItemsToShow} More
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 