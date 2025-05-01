import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page')) || 1
    const per_page = Number(searchParams.get('per_page')) || 10
    const skip = (page - 1) * per_page

    const [banners, total] = await Promise.all([
      prisma.promotionalBanner.findMany({
        orderBy: { order: 'asc' },
        skip,
        take: per_page,
      }),
      prisma.promotionalBanner.count()
    ])
    
    return NextResponse.json({
      items: banners,
      total
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch banners", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const banner = await prisma.promotionalBanner.create({
      data
    })
    
    return NextResponse.json(banner)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create banner", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 