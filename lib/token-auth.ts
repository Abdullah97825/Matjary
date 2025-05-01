import { NextRequest } from "next/server";
import { prisma } from "./prisma";

export async function authenticateToken(request: NextRequest) {
    try {
        // Extract token from Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Find token in database
        const personalAccessToken = await prisma.personalAccessToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!personalAccessToken) return null;

        // Check if token is expired
        if (personalAccessToken.expiresAt && new Date() > personalAccessToken.expiresAt) {
            await prisma.personalAccessToken.delete({
                where: { id: personalAccessToken.id }
            });
            return null;
        }

        // Update last used timestamp
        await prisma.personalAccessToken.update({
            where: { id: personalAccessToken.id },
            data: { lastUsedAt: new Date() },
        });

        return personalAccessToken.user;
    } catch (error) {
        console.error('[AUTHENTICATE_TOKEN]', error);
        return null;
    }
}
