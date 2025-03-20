import { type NextRequest, NextResponse } from "next/server"
import { handleTelegramUpdate } from "@/lib/telegram/handler"

// This is the webhook endpoint that Telegram will call
export async function POST(request: NextRequest) {
  try {
    const update = await request.json()

    // Process the Telegram update
    await handleTelegramUpdate(update)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing Telegram webhook:", error)
    return NextResponse.json({ success: false, error: "Failed to process webhook" }, { status: 500 })
  }
}

// This route is used to set up the webhook with Telegram
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const secret = searchParams.get("secret")

  // Verify the secret to prevent unauthorized webhook setup
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN
    const webhookUrl = `${process.env.VERCEL_URL || "https://your-domain.com"}/api/telegram/webhook`

    // Set the webhook with Telegram
    const response = await fetch(`https://api.telegram.org/bot${telegramToken}/setWebhook?url=${webhookUrl}`, {
      method: "GET",
    })

    const data = await response.json()

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error setting webhook:", error)
    return NextResponse.json({ success: false, error: "Failed to set webhook" }, { status: 500 })
  }
}

