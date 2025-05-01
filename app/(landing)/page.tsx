import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Welcome to Matjary - Your One-Stop Shop',
    description: 'Discover high-quality products at competitive prices with fast delivery options.',
};

// Use the landing layout instead of the default layout with navigation
export default async function LandingPage() {

    const showLandingPageSetting = await prisma.settings.findFirst({
        where: { slug: 'show-landing-page' }
    });

    if (!showLandingPageSetting || showLandingPageSetting.value !== 'true') {
        redirect('/store');
    }


    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to Matjary</h1>
                    <p className="text-xl md:text-2xl mb-8">Your one-stop shop for high-quality products</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                            <Link href="/store">
                                Visit Store
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                            <Link href="/contact">
                                Contact Us
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">Why Choose Matjary?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-gray-50 p-6 rounded-lg text-center">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
                            <p className="text-gray-600">We offer only the highest quality products, carefully selected for our customers.</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg text-center">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Competitive Pricing</h3>
                            <p className="text-gray-600">Get the best value for your money with our fair and competitive pricing.</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg text-center">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-4.9-6.1" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h-2a4 4 0 00-4 4v14" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                            <p className="text-gray-600">Quick and reliable shipping to get your products to you as soon as possible.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-6">Ready to start shopping?</h2>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">Browse our extensive collection of products and find exactly what you need.</p>
                    <Button asChild size="lg">
                        <Link href="/store">
                            Visit Our Store
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4">Matjary</h3>
                            <p className="text-gray-400">Your trusted online shopping destination for quality products.</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                <li><Link href="/store" className="text-gray-400 hover:text-white transition-colors">Store</Link></li>
                                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
                            <address className="text-gray-400 not-italic">
                                <p>123 Shopping Street</p>
                                <p>Commerce City, CC 12345</p>
                                <p>Email: info@matjary.com</p>
                                <p>Phone: (123) 456-7890</p>
                            </address>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; {new Date().getFullYear()} Matjary. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
} 