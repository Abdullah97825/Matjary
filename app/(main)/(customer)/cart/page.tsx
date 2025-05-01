import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CartItems } from '@/components/cart/CartItems';
import { CartSummary } from '@/components/cart/CartSummary';
import { CartProvider } from '@/contexts/CartContext';
import { serializeCartData } from '@/utils/cart';

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
              thumbnail: true,
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
      }
    }
  });

  const { serializedItems, subtotal } = serializeCartData(cart);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>

      <CartProvider initialSubtotal={subtotal} initialItems={serializedItems}>
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <CartItems />
          </div>
          <div className="lg:col-span-4">
            <CartSummary itemCount={serializedItems.length} />
          </div>
        </div>
      </CartProvider>
    </main>
  );
} 