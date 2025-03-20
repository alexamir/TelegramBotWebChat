import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@vercel/postgres"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, question, answer } = await request.json()

    const client = createClient()
    await client.connect()

    try {
      // Save answer to database
      await client.sql`
        INSERT INTO questionnaire_answers (chat_id, question, answer, created_at)
        VALUES (${sessionId}, ${question}, ${answer}, NOW())
      `

      return NextResponse.json({ success: true })
    } finally {
      await client.end()
    }
  } catch (error) {
    console.error("Error saving questionnaire answer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

