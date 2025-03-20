import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@vercel/postgres"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userData } = await request.json()

    const client = createClient()
    await client.connect()

    try {
      // Get questionnaire answers
      const { rows: answerRows } = await client.sql`
        SELECT question, answer FROM questionnaire_answers
        WHERE chat_id = ${sessionId}
        ORDER BY created_at ASC
      `

      // Create deal in Bitrix24
      const bitrixWebhookUrl = process.env.BITRIX24_WEBHOOK_URL

      const response = await fetch(`${bitrixWebhookUrl}/crm.deal.add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            TITLE: `New Deal from ${userData.category === "company" ? "Company" : "Individual"}`,
            CATEGORY_ID: userData.category === "company" ? 1 : 2,
            COMMENTS: answerRows.map((row) => `${row.question}: ${row.answer}`).join("\n"),
            SOURCE_ID: "WEB_CHAT",
          },
        }),
      })

      const result = await response.json()

      // Save deal ID to database
      if (result.result) {
        await client.sql`
          INSERT INTO users (chat_id, category, questionnaire_completed, bitrix_deal_id, created_at)
          VALUES (${sessionId}, ${userData.category}, true, ${result.result}, NOW())
          ON CONFLICT (chat_id) 
          DO UPDATE SET 
            category = ${userData.category},
            questionnaire_completed = true,
            bitrix_deal_id = ${result.result},
            updated_at = NOW()
        `
      }

      return NextResponse.json({ success: true, dealId: result.result })
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error("Error creating Bitrix24 deal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

