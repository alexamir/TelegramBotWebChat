import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@vercel/postgres"

// Setup database tables
export async function GET(request: NextRequest) {
  const client = createClient()
  await client.connect()

  try {
    // Create users table
    await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        chat_id BIGINT UNIQUE NOT NULL,
        category VARCHAR(20),
        question_index INT DEFAULT 0,
        questionnaire_completed BOOLEAN DEFAULT FALSE,
        bitrix_deal_id VARCHAR(50),
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP
      )
    `

    // Create conversations table
    await client.sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        chat_id BIGINT NOT NULL,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL
      )
    `

    // Create questionnaire_answers table
    await client.sql`
      CREATE TABLE IF NOT EXISTS questionnaire_answers (
        id SERIAL PRIMARY KEY,
        chat_id BIGINT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL
      )
    `

    return NextResponse.json({ success: true, message: "Database tables created successfully" })
  } catch (error) {
    console.error("Error setting up database:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await client.end()
  }
}

