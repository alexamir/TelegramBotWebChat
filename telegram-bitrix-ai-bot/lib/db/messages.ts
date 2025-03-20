import { sql } from "@vercel/postgres"

// Save a message to the database
export async function saveMessage({
  chatId,
  messageId,
  text,
  direction,
  timestamp,
}: {
  chatId: number
  messageId: number
  text: string
  direction: "incoming" | "outgoing"
  timestamp: Date
}) {
  try {
    await sql`
      INSERT INTO messages (
        chat_id,
        message_id,
        text,
        direction,
        timestamp,
        created_at
      )
      VALUES (
        ${chatId},
        ${messageId},
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

// Get conversation history for a chat
export async function getConversationHistory(chatId: number, limit = 10) {
  try {
    const { rows } = await sql`
      SELECT * FROM messages
      WHERE chat_id = ${chatId}
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

