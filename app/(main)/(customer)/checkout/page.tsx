import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';
import { serializeCartData } from '@/utils/cart';
import { toast } from 'sonner';

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [cart, addresses] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                thumbnail: true
              }
            }
          }
        }
      }
    }),
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' }
    })
  ]);

  if (!cart?.items.length) {
    redirect('/cart');
  }

  let foundNonPublicProduct = false;
  let nonPublicProductName = '';
  let foundArchivedProduct = false;
  let archivedProductName = '';

  for (const item of cart.items) {
    if (!item.product.public) {
      foundNonPublicProduct = true;
      nonPublicProductName = item.product.name;
      break;
    }
    if (item.product.isArchived) {
      foundArchivedProduct = true;
      archivedProductName = item.product.name;
      break;
    }
  }

  if (foundNonPublicProduct) {
    toast.error(`Product "${nonPublicProductName}" is not offered right now`);
    redirect('/cart');
  }

  if (foundArchivedProduct) {
    toast.error(`Product "${archivedProductName}" is no longer available`);
    redirect('/cart');
  }

  const { serializedItems, subtotal } = serializeCartData(cart);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

      <CheckoutClient
        user={user}
        addresses={addresses}
        serializedItems={serializedItems}
        subtotal={subtotal}
      />
    </main>
  );
} 