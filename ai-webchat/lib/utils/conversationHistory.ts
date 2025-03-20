import { sql } from "@vercel/postgres"

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

