'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/order';
import { OrderStatus } from '@prisma/client';
import { formatPrice } from '@/utils/format';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { orderService } from '@/services/order';

type OrderWithItems = {
    id: string;
    status: OrderStatus;
    createdAt: Date | string;
    total?: number;
    totalItems?: number;
    hasHiddenPriceItems?: boolean;
    hasNegotiableItems?: boolean;
    items?: {
        quantity: number;
        price: number | string;
        product: {
            hidePrice: boolean;
            negotiablePrice: boolean;
        };
    }[];
    orderNumber?: string;
};

export default function CustomerOrdersList({ orders: initialOrders }: { orders?: OrderWithItems[] } = {}) {
    const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders || []);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const lastOrderElementRef = useRef<HTMLDivElement | null>(null);

    // Track the current request to avoid race conditions
    const currentRequestRef = useRef<string | null>(null);

    // Flag to track if initial load has been done
    const initialLoadDone = useRef(false);

    // Map tab values to OrderStatus filters
    const getStatusFilter = useCallback((tabValue: string): OrderStatus | undefined => {
        switch (tabValue) {
            case 'active':
                return undefined; // We'll filter these client-side
            case 'completed':
                return OrderStatus.COMPLETED;
            case 'cancelled':
                return undefined; // We'll filter these client-side
            case 'rejected':
                return OrderStatus.REJECTED;
            case 'pending':
                return OrderStatus.PENDING;
            case 'admin_pending':
                return OrderStatus.ADMIN_PENDING;
            case 'customer_pending':
                return OrderStatus.CUSTOMER_PENDING;
            case 'accepted':
                return OrderStatus.ACCEPTED;
            default:
                return undefined;
        }
    }, []);

    // Function to fetch orders with force parameter to bypass loading check
    const fetchOrders = useCallback(async (
        pageNum: number,
        reset: boolean = false,
        tabValue: string = activeTab,
        force: boolean = false
    ) => {
        // Skip if already loading unless forced
        if (isLoading && !force) {
            return;
        }

        // Generate a unique request ID
        const requestId = `${tabValue}-${pageNum}-${Date.now()}`;
        currentRequestRef.current = requestId;

        setIsLoading(true);
        setIsError(false);

        try {
            const statusFilter = getStatusFilter(tabValue);
            const response = await orderService.getCustomerOrders({
                page: pageNum,
                per_page: 10,
                status: statusFilter
            });

            // Only update state if this is still the current request
            if (currentRequestRef.current === requestId) {
                // Ensure we don't have duplicate IDs
                if (reset) {
                    setOrders(response.orders);
                } else {
                    // Only add orders that aren't already in the list
                    setOrders(prev => {
                        const existingIds = new Set(prev.map(o => o.id));
                        const newOrders = response.orders.filter(o => !existingIds.has(o.id));
                        return [...prev, ...newOrders];
                    });
                }

                setHasMore(pageNum < response.meta.last_page);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            // Only update error state if this is still the current request
            if (currentRequestRef.current === requestId) {
                setIsError(true);
            }
        } finally {
            // Only update loading state if this is still the current request
            if (currentRequestRef.current === requestId) {
                setIsLoading(false);
            }
        }
    }, [isLoading, getStatusFilter, activeTab]);

    // Handle tab changes
    const handleTabChange = (value: string) => {
        if (activeTab === value) return;

        // Cancel any in-progress requests
        currentRequestRef.current = null;

        // Force reset loading state to prevent it from getting stuck
        setIsLoading(false);

        setActiveTab(value);
        setPage(1);
        setOrders([]);
        setHasMore(true);

        // Using setTimeout to push the execution of the fetch to the next event loop tick to ensure all state is updated
        setTimeout(() => {
            fetchOrders(1, true, value, true);
        }, 0);

    };

    // Initial load
    useEffect(() => {
        if (!initialLoadDone.current) {
            initialLoadDone.current = true;
            // Use setTimeout to ensure component is fully mounted
            setTimeout(() => {
                fetchOrders(1, true, activeTab, true);
            }, 0);
        }
    }, [fetchOrders, activeTab]);

    // Reset when unmounting
    useEffect(() => {
        return () => {
            // Cancel any pending requests when unmounting
            currentRequestRef.current = null;
            // Clean up observer
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // Set up intersection observer for infinite scrolling
    useEffect(() => {
        // Clean up previous observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        // Skip setup during initial loading or if no orders are loaded yet
        if (isLoading && orders.length === 0) {
            return;
        }

        // Don't observe if we're loading or there's no more content
        if (!hasMore || isLoading) {
            return;
        }

        // Create a new observer
        const observer = new IntersectionObserver(entries => {
            const entry = entries[0];
            // Only fetch more when the element is intersecting and we have more to load
            if (entry?.isIntersecting && hasMore && !isLoading) {
                const nextPage = page + 1;
                fetchOrders(nextPage, false, activeTab);
            }
        }, {
            rootMargin: '0px 0px 100px 0px', // Load earlier for smoother experience
            threshold: 0.1 // Trigger when at least 10% of the element is visible
        });

        observerRef.current = observer;

        // If we have a last element, observe it
        const lastElement = lastOrderElementRef.current;
        if (lastElement) {
            observer.observe(lastElement);
        }

        // Clean up on unmount
        return () => {
            observer.disconnect();
        };
    }, [fetchOrders, hasMore, isLoading, page, activeTab, orders.length]);

    // Filter orders for specific tabs when needed
    const filteredOrders = orders.filter(order => {
        if (activeTab === 'active') {
            return ['PENDING', 'ADMIN_PENDING', 'CUSTOMER_PENDING', 'ACCEPTED'].includes(order.status);
        } else if (activeTab === 'cancelled') {
            // Only show CANCELLED, not REJECTED (since we have a separate tab for rejected)
            return order.status === 'CANCELLED';
        } else if (activeTab === 'latest') {
            return true; // Show all, we'll only take the first 5 later
        }
        return true;
    });

    // For the "latest" tab, we only show the first 5 orders
    const displayedOrders = activeTab === 'latest'
        ? filteredOrders.slice(0, 5)
        : filteredOrders;

    // Create a unique key for each order using a more reliable method
    const getOrderKey = (order: OrderWithItems, index: number) => {
        return `${order.id}-${activeTab}-${index}`;
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="mb-6 flex w-full overflow-x-auto sm:flex-wrap gap-2 pb-1">
                    <TabsTrigger value="all" className="flex-shrink-0">All Orders</TabsTrigger>
                    <TabsTrigger value="latest" className="flex-shrink-0">Latest</TabsTrigger>
                    <TabsTrigger value="active" className="flex-shrink-0">Active</TabsTrigger>
                    <TabsTrigger value="completed" className="flex-shrink-0">Completed</TabsTrigger>
                    <TabsTrigger value="cancelled" className="flex-shrink-0">Cancelled</TabsTrigger>
                    <TabsTrigger value="rejected" className="flex-shrink-0">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    {displayedOrders.length === 0 && !isLoading ? (
                        <div className="mx-auto max-w-3xl">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">No {activeTab} orders found</p>
                                        {activeTab !== 'all' && (
                                            <button
                                                onClick={() => handleTabChange('all')}
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                View all orders
                                            </button>
                                        )}
                                        <Link href="/" className="block mt-2 text-sm text-blue-600 hover:underline">
                                            Start shopping
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <>
                            <div className="mx-auto max-w-3xl">
                                {displayedOrders.map((order, index) => {
                                    const isLastOrder = index === displayedOrders.length - 1;

                                    // For orders that don't have pre-calculated totals
                                    const total = order.total;
                                    const isAdminPending = order.status === 'ADMIN_PENDING';
                                    const hasPendingHiddenPriceItems = order.hasHiddenPriceItems && order.status === 'PENDING';
                                    const hasNegotiableItems = order.hasNegotiableItems;
                                    const itemsCount = order.totalItems || order.items?.length || 0;

                                    return (
                                        <div
                                            key={getOrderKey(order, index)}
                                            ref={isLastOrder ? lastOrderElementRef : null}
                                            className="mb-4"
                                        >
                                            <Link href={`/orders/${order.id}`}>
                                                <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="flex items-center justify-between text-base">
                                                            <span>Order #{order.orderNumber || order.id}</span>
                                                            <span className="text-sm font-normal text-gray-500">
                                                                {new Date(order.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="flex justify-between text-sm">
                                                            <div>
                                                                <p className="text-gray-500">
                                                                    {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant={ORDER_STATUS_COLORS[order.status as OrderStatus]}>
                                                                            {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        {hasPendingHiddenPriceItems && (
                                                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                                                Hidden prices
                                                                            </span>
                                                                        )}
                                                                        {hasNegotiableItems && (
                                                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                                                Negotiable
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                {isAdminPending ? (
                                                                    <p className="text-xs text-gray-500 italic">Quote pending</p>
                                                                ) : (
                                                                    <>
                                                                        {total !== undefined && (
                                                                            <p className="font-medium text-gray-900">{formatPrice(total)}</p>
                                                                        )}
                                                                        {hasPendingHiddenPriceItems && (
                                                                            <p className="text-xs text-gray-500">*Excludes items with hidden prices</p>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>

                            {isLoading && (
                                <div className="flex justify-center py-4">
                                    <LoadingSpinner size="lg" />
                                </div>
                            )}

                            {isError && (
                                <div className="mx-auto max-w-3xl">
                                    <Card className="border-red-200 bg-red-50">
                                        <CardContent className="pt-6">
                                            <div className="text-center text-red-600">
                                                <p>Failed to load orders. Please try again.</p>
                                                <button
                                                    onClick={() => fetchOrders(page, false)}
                                                    className="mt-2 text-sm font-medium underline"
                                                >
                                                    Retry
                                                </button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Hidden dummy element for infinite scroll when there are few orders */}
                            {displayedOrders.length > 0 && displayedOrders.length < 5 && hasMore && (
                                <div ref={lastOrderElementRef}></div>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
} 