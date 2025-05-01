import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

// Token creation schema
const createTokenSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    deviceName: z.string().min(1).max(255),
});

// Default token expiration (90 days)
const TOKEN_EXPIRY_DAYS = 90;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createTokenSchema.parse(body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Verify password
        const isPasswordValid = await verifyPassword(validatedData.password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Generate token
        const token = crypto.randomBytes(40).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

        // Store in database
        await prisma.personalAccessToken.create({
            data: {
                token,
                name: validatedData.deviceName,
                expiresAt,
                userId: user.id,
                lastUsedAt: new Date(),
            },
        });

        // Return token and user info
        return NextResponse.json({
            token,
            expires_at: expiresAt.toISOString(),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json(
                { error: err.errors[0].message },
                { status: 400 }
            );
        }

        console.error("Token creation error:", err);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
