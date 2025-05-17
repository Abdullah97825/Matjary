import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';
import { formatAddressToString } from '@/utils/format';
import { calculateDiscountedPrice } from '@/utils/price';
import { OrderStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const userOrResponse = await authHandler(request);
    if (userOrResponse instanceof NextResponse) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = userOrResponse;

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '10');
    const status = searchParams.get('status') as OrderStatus | undefined;

    // Build where clause
    const where = {
      userId: user.id,
      ...(status ? { status } : {})
    };

    // Calculate skip value for pagination
    const skip = (page - 1) * per_page;

    // Get total count for pagination metadata
    const totalCount = await prisma.order.count({ where });

    // Get orders with pagination and optional filters
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        recipientName: true,
        phone: true,
        shippingAddress: true,
        paymentMethod: true,
        savings: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            items: true
          }
        },
        items: {
          select: {
            price: true,
            quantity: true,
            product: {
              select: {
                hidePrice: true,
                negotiablePrice: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: per_page
    });

    // Format the response with calculated total price
    const serializedOrders = orders.map(order => {
      // Calculate total price, excluding hidden price items in pending orders
      const total = order.items.reduce((sum, item) => {
        if ((order.status === 'PENDING' || order.status === 'CUSTOMER_PENDING') && item.product.hidePrice) {
          return sum;
        }
        return sum + (Number(item.price) * item.quantity);
      }, 0);

      // Check for special items
      const hasHiddenPriceItems = order.items.some(item => item.product.hidePrice);
      const hasNegotiableItems = order.items.some(item => item.product.negotiablePrice);

      return {
        id: order.id,
        orderNumber: order.orderNumber || undefined,
        status: order.status,
        recipientName: order.recipientName,
        phone: order.phone,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        totalItems: order._count.items,
        savings: Number(order.savings),
        total: total,
        hasHiddenPriceItems,
        hasNegotiableItems,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });

    return NextResponse.json({
      orders: serializedOrders,
      meta: {
        current_page: page,
        per_page,
        total: totalCount,
        last_page: Math.ceil(totalCount / per_page)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting order creation process...');
    const userOrResponse = await authHandler(request);
    if (userOrResponse instanceof NextResponse) {
      console.log('No authenticated user found');
      return userOrResponse;
    }

    const user = userOrResponse;

    const body = await request.json();
    console.log('Request body:', body);

    const { addressId, newAddress, saveAddress, paymentMethod, requestDetails, promoCodeId } = body;

    // Validate payment method based on whether this is a request for details
    if (!requestDetails && paymentMethod !== 'CASH') {
      return new NextResponse('Invalid payment method', { status: 400 });
    }

    // Get address data
    let addressData;
    if (addressId) {
      const existingAddress = await prisma.address.findUnique({
        where: { id: addressId, userId: user.id }
      });
      if (!existingAddress) {
        return new NextResponse('Invalid address selected', { status: 400 });
      }
      addressData = existingAddress;
    } else if (newAddress) {
      addressData = newAddress;
      if (saveAddress) {
        await prisma.address.create({
          data: {
            ...newAddress,
            userId: user.id,
            isDefault: false
          }
        });
      }
    } else {
      return new NextResponse('Address is required', { status: 400 });
    }

    const formattedAddress = formatAddressToString(addressData);

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                images: true,
                thumbnailId: true,
                thumbnail: true,
                discountType: true,
                discountAmount: true,
                discountPercent: true,
                public: true,
                negotiablePrice: true,
                hidePrice: true,
                isArchived: true
              }
            }
          }
        }
      }
    });

    if (!cart?.items.length) {
      return new NextResponse('Cart is empty', { status: 400 });
    }

    // Check stock availability for all items
    for (const item of cart.items) {
      if (item.product.isArchived) {
        return new NextResponse(
          `"${item.product.name}" is no longer available`,
          { status: 400 }
        );
      }

      if (item.product.stock < item.quantity) {
        return new NextResponse(
          `Insufficient stock for ${item.product.name}`,
          { status: 400 }
        );
      }

      if (!item.product.public) {
        return new NextResponse(`Product "${item.product.name}" is not offered right now`, { status: 400 });
      }
    }

    // Check if the cart has negotiable or hidden price items
    const hasSpecialPriceItems = cart.items.some(item =>
      item.product.negotiablePrice === true ||
      item.product.hidePrice === true
    );

    // If requestDetails is true but there are no special price items, or vice versa, this is a mismatch
    if (requestDetails !== hasSpecialPriceItems) {
      return new NextResponse(
        requestDetails
          ? 'Cart does not contain any items requiring price negotiation'
          : 'Cart contains items requiring price negotiation',
        { status: 400 }
      );
    }

    // Calculate total savings during order creation
    const savings = cart.items.reduce((total, item) => {
      const originalPrice = Number(item.product.price) * item.quantity;
      const discountedPrice = calculateDiscountedPrice(item.product) * item.quantity;
      return total + (originalPrice - discountedPrice);
    }, 0);

    console.log('Cart data:', {
      itemCount: cart?.items.length,
      items: cart?.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
        discountType: item.product.discountType
      }))
    });

    // After savings calculation
    console.log('Calculated savings:', savings);

    // Set appropriate order status based on whether this is a price request
    const orderStatus = hasSpecialPriceItems ? 'ADMIN_PENDING' : 'PENDING';

    // Before order creation
    console.log('Creating order with data:', {
      userId: user.id,
      recipientName: user.name,
      phone: user.phone,
      shippingAddress: formattedAddress,
      paymentMethod,
      savings,
      itemCount: cart.items.length,
      orderStatus
    });

    // Fetch the order prefix from Settings (default to 'M' if not set)
    const prefixSetting = await prisma.settings.findUnique({
      where: { slug: 'order_prefix' }
    });
    const orderPrefix = prefixSetting?.value || 'O';

    // Create order using user's verified data and generate order number
    const order = await prisma.$transaction(async (tx) => {
      // Create the order (orderSequenceNumber will be auto-generated)
      const createdOrder = await tx.order.create({
        data: {
          userId: user.id,
          status: orderStatus,
          recipientName: user.name,
          phone: user.phone,
          shippingAddress: formattedAddress,
          paymentMethod: paymentMethod,
          savings: savings,
          promoCodeId: promoCodeId,
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: calculateDiscountedPrice(item.product)
            }))
          }
        }
      });

      // Generate the orderNumber using the prefix and orderSequenceNumber
      const orderNumber = `${orderPrefix}-${createdOrder.orderSequenceNumber}`;

      // Update the order with the generated orderNumber
      const updatedOrder = await tx.order.update({
        where: { id: createdOrder.id },
        data: { orderNumber }
      });

      return updatedOrder;
    });

    // Clear the cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error('Error creating order:', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : 'Unknown error message',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}