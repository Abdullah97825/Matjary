'use client';

import { useEffect, useState } from 'react';
import { OrderStatus } from '@prisma/client';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/order';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, ClockIcon } from 'lucide-react';
import { orderService } from '@/services/order';
import { Button } from '@/components/ui/button';

interface OrderHistoryItem {
    id: string;
    previousStatus: OrderStatus;
    newStatus: OrderStatus;
    note?: string;
    createdAt: string;
    createdBy: {
        name: string;
    };
}

interface CustomerStatusHistoryProps {
    orderId: string;
}

export function CustomerStatusHistory({ orderId }: CustomerStatusHistoryProps) {
    const [history, setHistory] = useState<OrderHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    const ITEMS_TO_SHOW = 2;
    const hasMoreItems = history.length > ITEMS_TO_SHOW;
    const visibleItems = expanded ? history : history.slice(0, ITEMS_TO_SHOW);

    useEffect(() => {
        async function fetchOrderHistory() {
            try {
                const historyData = await orderService.getOrderHistory(orderId);
                setHistory(historyData);
            } catch (error) {
                console.error('Error fetching order history:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchOrderHistory();
    }, [orderId]);

    if (isLoading) {
        return (
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Order Updates</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-gray-500">Loading updates...</div>
                </CardContent>
            </Card>
        );
    }

    if (history.length === 0) {
        return null; // Don't show anything if there's no history
    }

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Order Updates</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {visibleItems.map((item) => (
                        <div key={item.id} className="relative pl-6 py-2">
                            {/* Status dot */}
                            <div className={`absolute left-0 top-3 h-3 w-3 rounded-full bg-${ORDER_STATUS_COLORS[item.newStatus]}-500`}></div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={ORDER_STATUS_COLORS[item.newStatus]}>
                                            {ORDER_STATUS_LABELS[item.newStatus]}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <ClockIcon className="h-3 w-3" />
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                {item.note && (
                                    <div className="text-sm bg-gray-50 p-3 rounded-md">
                                        {item.note}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {hasMoreItems && (
                        <Button
                            variant="ghost"
                            className="w-full text-sm text-gray-500 hover:text-gray-800 mt-2"
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
                                    Show {history.length - ITEMS_TO_SHOW} More
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 