import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

// This route is used to set up the database tables
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const secret = searchParams.get("secret")

  // Verify the secret to prevent unauthorized database setup
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        chat_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        state JSONB NOT NULL,
        bitrix_deal_id BIGINT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `

    // Create messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id BIGINT NOT NULL,
        message_id BIGINT NOT NULL,
        text TEXT NOT NULL,
        direction VARCHAR(10) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL
      )
    `

    return NextResponse.json({ success: true, message: "Database tables created successfully" })
  } catch (error) {
    console.error("Error setting up database:", error)
    return NextResponse.json({ success: false, error: "Failed to set up database" }, { status: 500 })
  }
}

