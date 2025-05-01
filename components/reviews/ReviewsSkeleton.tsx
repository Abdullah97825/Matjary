export function ReviewsSkeleton() {
  return (
    <div className="mt-16 border-t pt-8">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-4">
          {/* Stats Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-16 animate-pulse rounded bg-gray-200" />
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-6 w-6 animate-pulse rounded bg-gray-200" />
                    ))}
                  </div>
                </div>
                <div className="mt-1 h-4 w-20 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                  <div className="h-2 flex-1 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-8">
          {/* Reviews List Skeleton */}
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                    <div className="space-y-1">
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                    ))}
                  </div>
                </div>
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-16 w-full animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 