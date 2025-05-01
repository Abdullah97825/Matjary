export function RelatedProductsSkeleton() {
  return (
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
  );
} 