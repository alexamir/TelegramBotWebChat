import { sql } from "@vercel/postgres"

// Create or update a deal in Bitrix24
export async function createOrUpdateBitrixDeal(sessionId: string, userData: any) {
  try {
    const bitrixWebhookUrl = process.env.BITRIX24_WEBHOOK_URL

    if (!bitrixWebhookUrl) {
      console.error("Bitrix24 webhook URL not configured")
      return false
    }

    // Format deal fields based on user segment
    const dealFields: any = {
      TITLE: userData.segment === "company" ? `Веб-чат: ${userData.companyName}` : `Веб-чат: ${userData.fullName}`,
      COMMENTS: formatUserDataForComments(userData),
      ASSIGNED_BY_ID: 1, // Default responsible person ID
      CATEGORY_ID: 2, // Web chat deal category
      STAGE_ID: "NEW", // Default stage
      TYPE_ID: "GOODS", // Default type
      SOURCE_ID: "WEB", // Source is web chat
    }

    // Add contact information
    if (userData.email) {
      dealFields.EMAIL = userData.email
    }

    if (userData.phone) {
      dealFields.PHONE = userData.phone
    }

    // Check if the session already has a deal
    const { rows } = await sql`
      SELECT bitrix_deal_id FROM web_chat_sessions
      WHERE session_id = ${sessionId}
    `

    let dealId

    if (rows.length > 0 && rows[0].bitrix_deal_id) {
      // Update existing deal
      dealId = rows[0].bitrix_deal_id

      const response = await fetch(`${bitrixWebhookUrl}/crm.deal.update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: dealId,
          fields: dealFields,
        }),
      })

      const data = await response.json()

      if (!data.result) {
        throw new Error("Failed to update Bitrix24 deal")
      }
    } else {
      // Create new deal
      const response = await fetch(`${bitrixWebhookUrl}/crm.deal.add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: dealFields,
        }),
      })

      const data = await response.json()

      if (data.result) {
        // Save the deal ID to the session
        dealId = data.result

        await sql`
          INSERT INTO web_chat_sessions (
            session_id,
            bitrix_deal_id,
            created_at,
            updated_at
          )
          VALUES (
            ${sessionId},
            ${dealId},
            NOW(),
            NOW()
          )
          ON CONFLICT (session_id)
          DO UPDATE SET
            bitrix_deal_id = ${dealId},
            updated_at = NOW()
        `
      } else {
        throw new Error("Failed to create Bitrix24 deal")
      }
    }

    return dealId
  } catch (error) {
    console.error("Error creating or updating Bitrix24 deal:", error)
    throw error
  }
}

// Format user data for Bitrix24 comments
function formatUserDataForComments(userData: any) {
  if (userData.segment === "company") {
    return `
      Источник: Веб-чат
      Сегмент: Компания
      Название компании: ${userData.companyName || "Не указано"}
      Сфера деятельности: ${userData.industry || "Не указано"}
      Количество сотрудников: ${userData.employeeCount || "Не указано"}
      Email: ${userData.email || "Не указано"}
      Телефон: ${userData.phone || "Не указано"}
    `
  } else {
    return `
      Источник: Веб-чат
      Сегмент: Частное лицо
      Имя: ${userData.fullName || "Не указано"}
      Возраст: ${userData.age || "Не указано"}
      Email: ${userData.email || "Не указано"}
      Телефон: ${userData.phone || "Не указано"}
    `
  }
}

// Update Bitrix24 deal with conversation
export async function updateBitrixDealWithConversation(sessionId: string, userData: any) {
  try {
    // Get the Bitrix24 deal ID for this session
    const { rows } = await sql`
      SELECT bitrix_deal_id FROM web_chat_sessions
      WHERE session_id = ${sessionId}
    `

    if (rows.length === 0 || !rows[0].bitrix_deal_id) {
      return false
    }

    const dealId = rows[0].bitrix_deal_id
    const bitrixWebhookUrl = process.env.BITRIX24_WEBHOOK_URL

    if (!bitrixWebhookUrl) {
      console.error("Bitrix24 webhook URL not configured")
      return false
    }

    // Get recent conversation history
    const { rows: historyRows } = await sql`
      SELECT * FROM web_chat_messages
      WHERE session_id = ${sessionId}
      ORDER BY timestamp DESC
      LIMIT 5
    `

    // Format conversation for comments
    const conversationText = historyRows
      .reverse()
      .map(
        (msg) =>
          `${msg.direction === "incoming" ? "Пользователь" : msg.direction === "outgoing" ? "Бот" : "Система"}: ${msg.text}`,
      )
      .join("\n\n")

    // Update deal comments
    const response = await fetch(`${bitrixWebhookUrl}/crm.deal.update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: dealId,
        fields: {
          COMMENTS: `Последняя переписка:\n\n${conversationText}`,
        },
      }),
    })

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error updating Bitrix24 deal with conversation:", error)
    throw error
  }
}

