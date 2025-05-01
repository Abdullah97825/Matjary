import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SESSION_TOKEN_COOKIE = "session_token";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_TOKEN_COOKIE)?.value;
    if (token) {
      await prisma.session.delete({ where: { token } });
    }

    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    // Delete session cookie
    response.cookies.delete(SESSION_TOKEN_COOKIE);

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 