'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function OrdersError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <main className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

            <Card>
                <CardContent className="pt-6">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold mb-2">Something went wrong!</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            We couldn&apos;t load your orders. Please try again later.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button onClick={reset} variant="default">
                                Try again
                            </Button>
                            <Link href="/" passHref>
                                <Button variant="outline">Go to homepage</Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
} 