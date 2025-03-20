import { sql } from "@vercel/postgres"
import { type UserState, ConversationStage } from "@/types/app"

// Create or update a user in the database
export async function createOrUpdateUser({
  chatId,
  username,
  firstName,
  lastName,
}: {
  chatId: number
  username?: string
  firstName?: string
  lastName?: string
}) {
  try {
    // Check if user exists
    const { rows } = await sql`
      SELECT * FROM users WHERE chat_id = ${chatId}
    `

    if (rows.length > 0) {
      // Update existing user
      const user = rows[0]

      await sql`
        UPDATE users
        SET 
          username = ${username || user.username},
          first_name = ${firstName || user.first_name},
          last_name = ${lastName || user.last_name},
          updated_at = NOW()
        WHERE chat_id = ${chatId}
      `

      // Return updated user with state
      const { rows: updatedRows } = await sql`
        SELECT * FROM users WHERE chat_id = ${chatId}
      `

      const updatedUser = updatedRows[0]
      return {
        ...updatedUser,
        state: JSON.parse(updatedUser.state),
      }
    } else {
      // Create new user with default state
      const defaultState: UserState = {
        stage: ConversationStage.START,
        surveyStep: 0,
        surveyData: {},
      }

      await sql`
        INSERT INTO users (
          chat_id, 
          username, 
          first_name, 
          last_name, 
          state, 
          created_at, 
          updated_at
        )
        VALUES (
          ${chatId},
          ${username || ""},
          ${firstName || ""},
          ${lastName || ""},
          ${JSON.stringify(defaultState)},
          NOW(),
          NOW()
        )
      `

      // Return new user
      const { rows: newRows } = await sql`
        SELECT * FROM users WHERE chat_id = ${chatId}
      `

      const newUser = newRows[0]
      return {
        ...newUser,
        state: JSON.parse(newUser.state),
      }
    }
  } catch (error) {
    console.error("Error creating or updating user:", error)
    throw error
  }
}

// Get a user by chat ID
export async function getUserByChatId(chatId: number) {
  try {
    const { rows } = await sql`
      SELECT * FROM users WHERE chat_id = ${chatId}
    `

    if (rows.length === 0) {
      return null
    }

    const user = rows[0]
    return {
      ...user,
      state: JSON.parse(user.state),
    }
  } catch (error) {
    console.error("Error getting user by chat ID:", error)
    throw error
  }
}

// Update user state
export async function updateUserState(chatId: number, state: UserState) {
  try {
    await sql`
      UPDATE users
      SET 
        state = ${JSON.stringify(state)},
        updated_at = NOW()
      WHERE chat_id = ${chatId}
    `

    return true
  } catch (error) {
    console.error("Error updating user state:", error)
    throw error
  }
}

