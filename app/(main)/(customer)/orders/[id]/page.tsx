import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@prisma/client';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/order';
import { getOriginalValue, getOriginalNote } from '@/utils/order';
import { CustomerStatusHistory } from '@/components/order/customerStatusHistory';
import { CustomerActions } from '@/components/order/customerActions';
import { CustomerItemEditor } from '@/components/order/CustomerItemEditor';
import { OrderReviewSection } from '@/components/order/OrderReviewSection';

interface OrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const order = await prisma.order.findUnique({
    where: {
      id,
      userId: user.id
    },
    include: {
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          priceEdited: true,
          quantityEdited: true,
          originalValues: true,
          adminAdded: true,
          productId: true,
          orderId: true,
          product: {
            include: {
              images: true,
              thumbnail: true
            }
          }
        }
      },
      promoCode: true
    }
  });

  if (!order) {
    notFound();
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const subtotal = order.items.reduce((total, item) => {
    if ((order.status === 'PENDING' || order.status === 'ADMIN_PENDING') && item.product.hidePrice) {
      return total;
    }
    return total + (Number(item.price) * item.quantity);
  }, 0);

  // Calculate the final total after all discounts
  const adminDiscount = order.adminDiscount ? Number(order.adminDiscount) : 0;
  const promoDiscount = order.promoDiscount ? Number(order.promoDiscount) : 0;

  // Check if this is an admin pending order
  const isAdminPending = order.status === 'ADMIN_PENDING';

  // Calculate estimated promo discount when necessary
  const hasHiddenPriceItems = order.items.some(item => item.product.hidePrice);
  const isPendingOrder = ['PENDING', 'ADMIN_PENDING', 'CUSTOMER_PENDING'].includes(order.status);
  const shouldShowEstimatedDiscount = order.promoCode && (hasHiddenPriceItems || isPendingOrder) && !order.promoDiscount;

  let estimatedPromoDiscount = 0;
  if (shouldShowEstimatedDiscount && order.promoCode) {
    if (order.promoCode.discountAmount) {
      // For flat discount
      estimatedPromoDiscount = Number(order.promoCode.discountAmount);
    } else if (order.promoCode.discountPercent && subtotal > 0) {
      // For percentage discount
      estimatedPromoDiscount = (subtotal * Number(order.promoCode.discountPercent)) / 100;
    }
  }

  // For display purposes, use the estimated discount if we don't have an actual one yet
  const displayPromoDiscount = promoDiscount > 0 ? promoDiscount : (shouldShowEstimatedDiscount ? estimatedPromoDiscount : 0);

  const finalTotal = subtotal - Number(order.savings) - adminDiscount - displayPromoDiscount;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <Badge variant={ORDER_STATUS_COLORS[order.status as OrderStatus]}>
              {ORDER_STATUS_LABELS[order.status as OrderStatus]}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">Order #{order.id} - {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/store">Continue Shopping</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {/* Conditionally render based on status */}
          {order.status === 'CUSTOMER_PENDING' ? (
            // Use the client wrapper for the interactive state
            <CustomerItemEditor
              orderId={id}
              initialItems={order.items.map(item => ({ // Pass formatted items
                id: item.id,
                quantity: item.quantity,
                price: Number(item.price), // Ensure price is number
                priceEdited: item.priceEdited || false,
                quantityEdited: item.quantityEdited || false,
                originalValues: item.originalValues ?
                  (typeof item.originalValues === 'string' ? item.originalValues : JSON.stringify(item.originalValues))
                  : undefined,
                adminAdded: item.adminAdded || false,
                product: {
                  id: item.product.id,
                  name: item.product.name,
                  price: Number(item.product.price), // Ensure product price is number
                  thumbnail: item.product.thumbnail ? { url: item.product.thumbnail.url } : undefined,
                  hidePrice: item.product.hidePrice,
                  negotiablePrice: item.product.negotiablePrice
                }
              }))}
            />
          ) : (
            // Render the read-only card for other statuses
            <Card>
              <CardHeader>
                <CardTitle>Items Ordered</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={item.product.thumbnail?.url || '/images/placeholder.svg'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                          {item.quantityEdited && item.originalValues && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md font-medium ml-1">
                              Updated (was: {getOriginalValue<number | string>(item.originalValues, 'quantity', '(unknown)')})
                            </span>
                          )}
                        </p>
                        {/* Display quantity change note if it exists */}
                        {item.quantityEdited && (
                          (() => {
                            const note = getOriginalNote(item.originalValues, 'quantity');
                            return note ? (
                              <p className="text-xs italic text-gray-600 mt-1 ml-1">
                                Note: {note}
                              </p>
                            ) : null;
                          })()
                        )}
                      </div>
                      {(isAdminPending && (item.product.hidePrice || item.product.negotiablePrice)) ||
                        (order.status === 'PENDING' && item.product.hidePrice) ? (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium w-fit">
                          {isAdminPending ? 'Price Pending' : 'Contact for Price'}
                        </span>
                      ) : (
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(Number(item.price) * item.quantity)}
                            {item.priceEdited && item.originalValues && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md font-medium ml-1">
                                Price Updated
                              </span>
                            )}
                          </p>
                          {/* Display price change note if it exists */}
                          {item.priceEdited && (
                            (() => {
                              const note = getOriginalNote(item.originalValues, 'price');
                              return note ? (
                                <p className="text-xs italic text-gray-600 mt-1">
                                  Note: {note}
                                </p>
                              ) : null;
                            })()
                          )}
                          {item.product.negotiablePrice && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md font-medium mt-1">
                              Negotiable
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Always show status history */}
          <CustomerStatusHistory orderId={id} />

          {/* Conditionally render actions *outside* the wrapper if status is not CUSTOMER_PENDING */}
          {order.status !== 'CUSTOMER_PENDING' && (
            <CustomerActions orderId={id} status={order.status} hasUnsavedChanges={false} />
          )}

          {/* Add the Order Review Section */}
          <OrderReviewSection
            orderId={id}
            isCompleted={order.status === 'COMPLETED'}
          />
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={ORDER_STATUS_COLORS[order.status as OrderStatus]} className="px-3 py-1">
                    {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Show status-specific information */}
                {order.status === 'ADMIN_PENDING' && (
                  <div className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-md mt-2">
                    <p className="font-medium">This order is being reviewed by our team.</p>
                    <p className="mt-1">We&apos;ll prepare a detailed quote with pricing information for all items in your order. You&apos;ll be notified when the review is complete.</p>
                  </div>
                )}

                {order.status === 'CUSTOMER_PENDING' && (
                  <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md mt-2">
                    <p className="font-medium">Your approval is needed.</p>
                    <p className="mt-1">We&apos;ve reviewed your order and prepared a quote. Please check the pricing details and confirm this order.</p>
                  </div>
                )}

                {order.status === 'PENDING' && (
                  <div className="text-sm text-gray-700 p-3 rounded-md mt-2">
                    <p>Your order has been received and is being processed.</p>
                  </div>
                )}

                {order.status === 'ACCEPTED' && (
                  <div className="text-sm text-gray-700 bg-green-50 p-3 rounded-md mt-2">
                    <p className="font-medium">Your order has been accepted.</p>
                    <p className="mt-1">We&apos;re preparing your items for delivery.</p>
                  </div>
                )}

                {order.status === 'COMPLETED' && (
                  <div className="text-sm text-gray-700 bg-green-50 p-3 rounded-md mt-2">
                    <p className="font-medium">Your order has been completed.</p>
                    <p className="mt-1">Thank you for shopping with us!</p>
                  </div>
                )}

                {(order.status === 'REJECTED' || order.status === 'CANCELLED') && (
                  <div className="text-sm text-gray-700 bg-red-50 p-3 rounded-md mt-2">
                    <p className="font-medium">This order has been {order.status.toLowerCase()}.</p>
                    <p className="mt-1">If you have any questions, please contact customer support.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isAdminPending ? (
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <h3 className="text-sm font-medium text-yellow-800">Order Pending Review</h3>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your order is being reviewed by our team. We&apos;ll prepare a detailed quote with pricing information.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({order.items.length} items)</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {Number(order.savings) > 0 && !(order.status === 'PENDING' && order.items.some(item => item.product.hidePrice)) && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Total Savings</span>
                        <span>-{formatPrice(Number(order.savings))}</span>
                      </div>
                    )}

                    {/* Display promo code information if available */}
                    {order.promoCode && (
                      <div className="bg-green-50 p-4 rounded-md mb-3">
                        <div className="flex flex-col space-y-2">
                          {/* Promo code row */}
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-green-800">Promo Code:</span>
                            <span className="text-green-700 font-medium">{order.promoCode.code}</span>
                          </div>

                          {/* Discount amount row */}
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-green-800">Discount:</span>
                            {Number(order.promoDiscount) > 0 ? (
                              <span className="text-green-700 font-medium text-base">-{formatPrice(Number(order.promoDiscount))}</span>
                            ) : shouldShowEstimatedDiscount ? (
                              <span className="text-green-700 font-medium text-base">
                                Est. -{formatPrice(estimatedPromoDiscount)}
                              </span>
                            ) : (
                              <span className="text-green-700 font-medium">Pending</span>
                            )}
                          </div>

                          {/* Note row */}
                          {shouldShowEstimatedDiscount && (
                            <p className="text-xs text-green-600 pt-1 border-t border-green-100">
                              *Final discount will be calculated when order is confirmed
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Add admin discount display */}
                    {order.adminDiscount && Number(order.adminDiscount) > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Special Discount</span>
                          <span>-{formatPrice(Number(order.adminDiscount))}</span>
                        </div>
                        {order.adminDiscountReason && (
                          <div className="text-xs text-gray-500 italic">
                            Reason: {order.adminDiscountReason}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Display note for items with hidden price in pending orders */}
                    {order.status === 'PENDING' && order.items.some(item => item.product.hidePrice) && (
                      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                        <p className="font-medium">Note about items with hidden prices:</p>
                        <ul className="list-disc pl-4 mt-1">
                          <li>Items with hidden pricing are not included in the subtotal</li>
                          <li>Please contact us for pricing information on these items</li>
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-between border-t pt-4 font-medium">
                      <span>Total</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Recipient Name</div>
                <div className="font-medium">{order.recipientName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone Number</div>
                <div className="font-medium">{order.phone}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Shipping Address</div>
                <div className="font-medium">{order.shippingAddress}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <div className="flex items-center">
                    {order.paymentMethod === 'PENDING' || isAdminPending ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">Payment Pending</Badge>
                    ) : (
                      <span className="font-medium">
                        {order.paymentMethod === 'CASH' ? 'Cash on Delivery' : order.paymentMethod}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
} 