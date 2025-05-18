import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/schemas";
import { z } from "zod";
import crypto from "crypto";

const SESSION_TOKEN_COOKIE = "session_token";
const SESSION_EXPIRY_DAYS = 7;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

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

    const isPasswordValid = await verifyPassword(validatedData.password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if the account is active (admin accounts are always active)
    if (!user.isActive && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Your account is not active. Please contact an administrator." },
        { status: 403 }
      );
    }

    // Create session
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setDate(expires.getDate() + SESSION_EXPIRY_DAYS);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    // Create response with cookie
    const response = NextResponse.json(
      { message: "Logged in successfully" },
      { status: 200 }
    );

    response.cookies.set({
      name: SESSION_TOKEN_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires,
    });

    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 