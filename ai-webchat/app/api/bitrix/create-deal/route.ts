import { type NextRequest, NextResponse } from "next/server"
import { createOrUpdateBitrixDeal } from "@/lib/bitrix/deals"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userData } = await request.json()

    if (!sessionId || !userData) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Create or update deal in Bitrix24
    const dealId = await createOrUpdateBitrixDeal(sessionId, userData)

    return NextResponse.json({ success: true, dealId })
  } catch (error) {
    console.error("Error creating Bitrix24 deal:", error)
    return NextResponse.json({ success: false, error: "Failed to create Bitrix24 deal" }, { status: 500 })
  }
}

