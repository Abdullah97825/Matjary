export default function ProductLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          <div className="aspect-square animate-pulse rounded-lg bg-gray-200" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-6 w-1/4 animate-pulse rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-12 w-full animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Related Products Skeleton */}
      <section className="mt-16 min-h-[520px]">
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-6 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="w-[280px] flex-shrink-0"
            >
              <div className="h-[400px] rounded-lg border border-gray-200 bg-white p-4">
                <div className="aspect-square animate-pulse rounded-lg bg-gray-200" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
} 