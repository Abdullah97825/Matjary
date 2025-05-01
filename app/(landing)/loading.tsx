import { Skeleton } from "@/components/ui/skeleton";

export default function LandingLoading() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero Section Loading Skeleton */}
            <section className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-r from-blue-600/40 to-indigo-700/40">
                <div className="max-w-4xl mx-auto w-full">
                    <Skeleton className="h-16 w-3/4 mx-auto mb-6" />
                    <Skeleton className="h-8 w-2/3 mx-auto mb-8" />
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Skeleton className="h-12 w-32 rounded-md" />
                        <Skeleton className="h-12 w-32 rounded-md" />
                    </div>
                </div>
            </section>

            {/* Features Section Loading Skeleton */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <Skeleton className="h-10 w-64 mx-auto mb-12" />
                    <div className="grid md:grid-cols-3 gap-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-gray-50 p-6 rounded-lg">
                                <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
                                <Skeleton className="h-6 w-40 mx-auto mb-2" />
                                <Skeleton className="h-4 w-full mx-auto mb-1" />
                                <Skeleton className="h-4 w-5/6 mx-auto mb-1" />
                                <Skeleton className="h-4 w-4/6 mx-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section Loading Skeleton */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4 text-center">
                    <Skeleton className="h-10 w-72 mx-auto mb-6" />
                    <Skeleton className="h-6 w-full max-w-2xl mx-auto mb-8" />
                    <Skeleton className="h-12 w-40 mx-auto rounded-md" />
                </div>
            </section>

            {/* Footer Loading Skeleton */}
            <footer className="bg-gray-800 py-12">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i}>
                                <Skeleton className="h-8 w-32 mb-4 bg-gray-700" />
                                <Skeleton className="h-4 w-full mb-2 bg-gray-700" />
                                <Skeleton className="h-4 w-5/6 mb-2 bg-gray-700" />
                                <Skeleton className="h-4 w-4/6 bg-gray-700" />
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-700 mt-8 pt-8 text-center">
                        <Skeleton className="h-4 w-64 mx-auto bg-gray-700" />
                    </div>
                </div>
            </footer>
        </div>
    );
}
