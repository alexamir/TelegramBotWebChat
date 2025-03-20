import { type NextRequest, NextResponse } from "next/server"
import { saveMessage } from "@/lib/db/messages"
import { notifyManager } from "@/lib/notifications/manager"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userData } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing session ID" }, { status: 400 })
    }

    // Save system message about manager request
    await saveMessage({
      sessionId,
      text: "Пользователь запросил связь с менеджером",
      direction: "system",
      timestamp: new Date(),
    })

    // Notify manager about the request
    await notifyManager(sessionId, userData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error requesting manager:", error)
    return NextResponse.json({ success: false, error: "Failed to request manager" }, { status: 500 })
  }
}

