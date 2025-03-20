import { sql } from "@vercel/postgres"

// Save a message to the database
export async function saveMessage({
  sessionId,
  text,
  direction,
  timestamp,
}: {
  sessionId: string
  text: string
  direction: "incoming" | "outgoing" | "system"
  timestamp: Date
}) {
  try {
    await sql`
      INSERT INTO web_chat_messages (
        session_id,
        text,
        direction,
        timestamp,
        created_at
      )
      VALUES (
        ${sessionId},
        ${text},
        ${direction},
        ${timestamp},
        NOW()
      )
    `

    return true
  } catch (error) {
    console.error("Error saving message:", error)
    throw error
  }
}

// Get conversation history for a session
export async function getConversationHistory(sessionId: string, limit = 10) {
  try {
    const { rows } = await sql`
      SELECT * FROM web_chat_messages
      WHERE session_id = ${sessionId}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `

    // Return in chronological order
    return rows.reverse()
  } catch (error) {
    console.error("Error getting conversation history:", error)
    throw error
  }
}

