import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authHandler } from '@/lib/auth-handler';

export async function GET(request: NextRequest) {
    try {
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }

        const user = userOrResponse;
        if (user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized', details: 'User is not an admin' },
                { status: 401 }
            );
        }

        const settings = await prisma.settings.findMany({
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch settings', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 