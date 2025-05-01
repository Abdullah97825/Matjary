import { NextRequest, NextResponse } from "next/server"
import { authHandler } from "@/lib/auth-handler"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const userOrResponse = await authHandler(req);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const user = userOrResponse;
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('[TAGS_GET]', error)
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    )
  }
} 