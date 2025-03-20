import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

// This route is used to set up the database tables for web chat
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const secret = searchParams.get("secret")

  // Verify the secret to prevent unauthorized database setup
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Create web chat sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS web_chat_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        bitrix_deal_id BIGINT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `

    // Create web chat messages table
    await sql`
      CREATE TABLE IF NOT EXISTS web_chat_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        direction VARCHAR(10) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL
      )
    `

    return NextResponse.json({ success: true, message: "Web chat database tables created successfully" })
  } catch (error) {
    console.error("Error setting up web chat database:", error)
    return NextResponse.json({ success: false, error: "Failed to set up web chat database" }, { status: 500 })
  }
}

