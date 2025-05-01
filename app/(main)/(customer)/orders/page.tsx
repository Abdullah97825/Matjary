import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Suspense } from 'react';
import CustomerOrdersList from '@/components/order/CustomerOrdersList';



export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      <Suspense fallback={<OrdersLoadingState />}>
        <CustomerOrdersList />
      </Suspense>
    </main>
  );
}

function OrdersLoadingState() {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-24 animate-pulse rounded-md bg-gray-200" />
          ))}
        </div>
      </div>

      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-lg border p-4 animate-pulse">
          <div className="flex justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
} 