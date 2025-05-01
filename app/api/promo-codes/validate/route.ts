import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from '@/lib/auth-handler';
import { validatePromoCode } from '@/lib/promo-validator';
import { prisma } from '@/lib/prisma';
import { calculateDiscountedPrice } from '@/utils/price';

export async function GET(request: NextRequest) {
    try {
        // Get the current user
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }
        const user = userOrResponse;

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const orderId = searchParams.get('orderId');
        const amountStr = searchParams.get('amount');

        if (!code) {
            return NextResponse.json(
                { isValid: false, message: 'Promo code is required' },
                { status: 400 }
            );
        }

        // Calculate the order/cart amount from the database
        let amount = 0;

        // If order ID is provided, get the total from that order
        if (orderId) {
            const order = await prisma.order.findUnique({
                where: {
                    id: orderId,
                    userId: user.id // Ensure the order belongs to the user
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            if (!order) {
                return NextResponse.json(
                    { isValid: false, message: 'Order not found' },
                    { status: 404 }
                );
            }

            // Calculate order total including items with hidden prices
            amount = order.items.reduce((total, item) => {
                return total + (Number(item.price) * item.quantity);
            }, 0);
        }
        // Otherwise, calculate from the user's cart
        else {
            const cart = await prisma.cart.findUnique({
                where: { userId: user.id },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            if (cart) {
                // Calculate cart total with individual product discounts
                // Include ALL items, even those with hidden prices
                amount = cart.items.reduce((total, item) => {
                    // Use the actual product price from the database, regardless of whether it's hidden in the UI
                    const itemPrice = calculateDiscountedPrice(item.product);
                    return total + (itemPrice * item.quantity);
                }, 0);
            }
        }

        // If we couldn't calculate from DB, fall back to provided amount (with validation)
        if (amount === 0 && amountStr) {
            const parsedAmount = parseFloat(amountStr);
            if (!isNaN(parsedAmount)) {
                amount = parsedAmount;
            }
        }

        console.log(`Validating promo code: ${code} for amount: ${amount} (including hidden price items)`);

        // Validate the promo code using the total amount including all items
        const validationResult = await validatePromoCode(code, user.id, amount);

        return NextResponse.json(validationResult);
    } catch (error) {
        console.error('Error validating promo code:', error);
        return NextResponse.json(
            { isValid: false, message: 'An error occurred while validating the promo code' },
            { status: 500 }
        );
    }
} 