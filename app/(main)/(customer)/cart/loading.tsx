import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function CartLoading() {
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
            <CardContent className="divide-y">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 py-4">
                  <div className="h-16 w-16 animate-pulse rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                    <div className="h-4 w-1/4 rounded bg-gray-200" />
                    <div className="h-4 w-1/3 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
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
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="h-4 w-16 rounded bg-gray-200" />
                </div>
                <div className="flex justify-between border-t pt-3">
                  <div className="h-4 w-16 rounded bg-gray-200" />
                  <div className="h-4 w-20 rounded bg-gray-200" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-9 w-full rounded bg-gray-200" />
                <div className="h-9 w-full rounded bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
} 