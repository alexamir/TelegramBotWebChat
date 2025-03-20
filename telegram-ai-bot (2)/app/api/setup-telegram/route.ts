import { type NextRequest, NextResponse } from "next/server"

// Setup webhook for Telegram bot
export async function GET(request: NextRequest) {
  try {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN
    const webhookUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/telegram`
      : request.nextUrl.searchParams.get("webhook_url")

    if (!webhookUrl) {
      return NextResponse.json(
        {
          error: "Please provide webhook_url as a query parameter or deploy to Vercel",
        },
        { status: 400 },
      )
    }

    const apiUrl = `https://api.telegram.org/bot${telegramToken}/setWebhook`

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
      }),
    })

    const result = await response.json()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error setting up Telegram webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

