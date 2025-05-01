import { NextRequest, NextResponse } from "next/server";
import { authHandler } from "@/lib/auth-handler";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }

        const user = userOrResponse;

        // Get all tokens for this user
        const tokens = await prisma.personalAccessToken.findMany({
            where: {
                userId: user.id
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
                lastUsedAt: true,
                expiresAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(tokens);
    } catch (error) {
        console.error("List tokens error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
