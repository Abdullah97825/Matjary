import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authHandler } from '@/lib/auth-handler';
import { z } from 'zod';

// Validate the request body
const updateSettingSchema = z.object({
    value: z.string()
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        if (!id) {
            return NextResponse.json(
                { error: 'Bad request', details: 'Setting ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const parseResult = updateSettingSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: parseResult.error.format() },
                { status: 400 }
            );
        }

        const { value } = parseResult.data;

        // Check if the setting exists
        try {
            // Update the setting
            const updatedSetting = await prisma.settings.update({
                where: { id },
                data: { value }
            });

            return NextResponse.json(updatedSetting);
        } catch (error) {
            // If no setting with this ID exists, Prisma will throw
            return NextResponse.json(
                { error: 'Setting not found', details: error instanceof Error ? error.message : String(error) },
                { status: 404 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update setting', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 