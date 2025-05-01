import { NextRequest, NextResponse } from "next/server";
import { authHandler } from "@/lib/auth-handler";
import { prisma } from "@/lib/prisma";

type Props = {
    params: Promise<{ id: string }>
};

export async function DELETE(
    request: NextRequest,
    { params }: Props
) {
    try {
        const { id } = await params;

        const userOrResponse = await authHandler(request);
        if (userOrResponse instanceof NextResponse) {
            return userOrResponse;
        }

        const user = userOrResponse;

        // Check if token belongs to user
        const token = await prisma.personalAccessToken.findUnique({
            where: {
                id: id,
                userId: user.id
            }
        });

        if (!token) {
            return NextResponse.json(
                { error: "Token not found" },
                { status: 404 }
            );
        }

        // Delete token
        await prisma.personalAccessToken.delete({
            where: { id: id }
        });

        return NextResponse.json(
            { message: "Token revoked successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Revoke token error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
