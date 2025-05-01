export function FeaturedProductsSkeleton() {
  return (
    <div className="relative w-full">
      <div className="flex gap-6 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-[280px] flex-shrink-0">
            <div className="group flex h-[400px] w-full flex-col rounded-lg border border-gray-200 bg-white p-4">
              <div className="aspect-square w-full animate-pulse rounded-lg bg-gray-200" />
              <div className="mt-4 flex flex-1 flex-col space-y-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 