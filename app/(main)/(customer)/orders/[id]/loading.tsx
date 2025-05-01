import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function OrderLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-8 w-40 animate-pulse rounded-md bg-gray-200" />
          <div className="mt-1 h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-md bg-gray-200" />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
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
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-20 rounded bg-gray-200" />
                  <div className="h-4 w-24 rounded bg-gray-200" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
} 