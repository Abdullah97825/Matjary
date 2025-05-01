import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function CheckoutLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="h-8 w-40 animate-pulse rounded-md bg-gray-200" />
      
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shipping Information */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="h-10 animate-pulse rounded bg-gray-200" />
                  <div className="h-10 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="h-10 animate-pulse rounded bg-gray-200" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="h-10 animate-pulse rounded bg-gray-200" />
                  <div className="h-10 animate-pulse rounded bg-gray-200" />
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <div className="h-10 animate-pulse rounded bg-gray-200" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="h-10 animate-pulse rounded bg-gray-200" />
                  <div className="h-10 animate-pulse rounded bg-gray-200" />
                  <div className="h-10 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="divide-y">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-4 py-4">
                    <div className="h-16 w-16 animate-pulse rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-gray-200" />
                      <div className="h-4 w-1/4 rounded bg-gray-200" />
                      <div className="h-4 w-1/3 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t pt-4">
                <div className="h-5 w-16 rounded bg-gray-200" />
                <div className="h-5 w-24 rounded bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
} 