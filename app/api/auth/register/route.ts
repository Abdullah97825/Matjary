import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/schemas/auth";
import type { RegisterData } from "@/schemas/auth";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body) as RegisterData;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Create user
    const hashedPassword = await hashPassword(validatedData.password);
    await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        password: hashedPassword,
        addresses: {
          create: {
            country: validatedData.address.country,
            province: validatedData.address.province,
            city: validatedData.address.city,
            neighbourhood: validatedData.address.neighbourhood,
            nearestLandmark: validatedData.address.nearestLandmark,
            zipcode: validatedData.address.zipcode,
            isDefault: true
          }
        }
      },
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    
    // Safely log the error without stringifying it
    console.error("Registration error occurred");
    if (err instanceof Error) {
      console.error("Error message:", err.message);
    }

    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
} 