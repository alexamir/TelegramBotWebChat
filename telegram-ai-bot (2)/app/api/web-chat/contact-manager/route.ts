import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@vercel/postgres"

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    const client = createClient()
    await client.connect()

    try {
      // Get Bitrix24 deal ID
      const { rows } = await client.sql`
        SELECT bitrix_deal_id FROM users WHERE chat_id = ${sessionId}
      `

      if (rows.length === 0 || !rows[0].bitrix_deal_id) {
        return NextResponse.json({ success: false, error: "Deal not found" })
      }

      const dealId = rows[0].bitrix_deal_id

      // Update deal in Bitrix24
      const bitrixWebhookUrl = process.env.BITRIX24_WEBHOOK_URL

      await fetch(`${bitrixWebhookUrl}/crm.deal.update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: dealId,
          fields: {
            STAGE_ID: "CONTACT_REQUESTED",
            COMMENTS: `${new Date().toISOString()}: User requested manager contact\n\n`,
          },
        }),
      })

      return NextResponse.json({ success: true })
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error("Error updating Bitrix24 deal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

