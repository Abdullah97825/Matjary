import { NextRequest, NextResponse } from 'next/server';
import { authHandler } from '@/lib/auth-handler';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
    try {
        const userOrResponse = await authHandler(req);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }

        const user = userOrResponse;
        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const per_page = Number(searchParams.get('per_page')) || 10;

        // Don't search if query is too short
        if (search.length < 2) {
            return NextResponse.json({ users: [] });
        }

        const where: Prisma.UserWhereInput = {
            OR: [
                { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                { phone: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
            ]
        };

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
            },
            take: per_page,
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('[API] Error searching users:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 