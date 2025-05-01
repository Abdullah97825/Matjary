import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authHandler } from "@/lib/auth-handler";
import { updateProfileSchema } from "@/schemas/user";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const userOrResponse = await authHandler(request);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;
    const userWithAddresses = await prisma.user.findUnique({
      where: { id: user.id },
      include: { addresses: true }
    });

    return NextResponse.json(userWithAddresses);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userOrResponse = await authHandler(request);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    // Check if email is taken
    if (data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already taken" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
      include: { addresses: true }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile PATCH error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 