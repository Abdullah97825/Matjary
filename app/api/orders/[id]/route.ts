import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const orderId = (await params).id;

        // Authenticate user
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = userOrResponse;

        // Get the order with full details
        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
                userId: user.id // Ensure the order belongs to the authenticated user
            },
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
                                thumbnail: true,
                                negotiablePrice: true,
                                hidePrice: true
                            }
                        }
                    }
                },
                promoCode: true // Include the promo code details
            }
        });

        // Check if order exists and belongs to the user
        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Serialize the response
        const serializedOrder = {
            id: order.id,
            status: order.status,
            recipientName: order.recipientName,
            phone: order.phone,
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            items: order.items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: Number(item.price),
                priceEdited: item.priceEdited,
                quantityEdited: item.quantityEdited,
                originalValues: item.originalValues,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    images: item.product.images,
                    thumbnail: item.product.thumbnail
                }
            })),
            totalPrice: Number(order.items.reduce(
                (sum, item) => sum + Number(item.price) * item.quantity,
                0
            )),
            savings: Number(order.savings),
            promoCode: order.promoCode ? {
                id: order.promoCode.id,
                code: order.promoCode.code,
                discountAmount: order.promoDiscount ? Number(order.promoDiscount) : null
            } : null,
            promoDiscount: order.promoDiscount ? Number(order.promoDiscount) : null,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };

        return NextResponse.json(serializedOrder);
    } catch (error) {
        console.error('Error fetching order details:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 