export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="group flex h-[400px] w-full flex-col rounded-lg border border-gray-200 bg-white p-4">
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
      ))}
    </div>
  );
} 