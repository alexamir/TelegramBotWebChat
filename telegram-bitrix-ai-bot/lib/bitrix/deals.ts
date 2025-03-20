import { sql } from "@vercel/postgres"
import { getConversationHistory } from "../utils/conversationHistory"

// Create or update a deal in Bitrix24
export async function createOrUpdateBitrixDeal(user: any) {
  try {
    const bitrixWebhookUrl = process.env.BITRIX24_WEBHOOK_URL

    if (!bitrixWebhookUrl) {
      console.error("Bitrix24 webhook URL not configured")
      return false
    }

    const { surveyData } = user.state

    // Format deal fields based on user segment
    const dealFields: any = {
      TITLE:
        surveyData.segment === "company"
          ? `Сделка с компанией ${surveyData.companyName}`
          : `Сделка с ${surveyData.fullName}`,
      COMMENTS: formatSurveyDataForComments(surveyData),
      ASSIGNED_BY_ID: 1, // Default responsible person ID
      CATEGORY_ID: 1, // Default deal category
      STAGE_ID: "NEW", // Default stage
      TYPE_ID: "GOODS", // Default type
    }

    // Add contact information
    if (surveyData.email) {
      dealFields.EMAIL = surveyData.email
    }

    if (surveyData.phone) {
      dealFields.PHONE = surveyData.phone
    }

    // Check if the user already has a deal
    if (user.bitrix_deal_id) {
      // Update existing deal
      const response = await fetch(`${bitrixWebhookUrl}/crm.deal.update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.bitrix_deal_id,
          fields: dealFields,
        }),
      })

      const data = await response.json()
      return data.result
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
        // Save the deal ID to the user
        await updateUserBitrixDealId(user.chatId, data.result)
      }

      return data.result
    }
  } catch (error) {
    console.error("Error creating or updating")
  }
  Bitrix24
  deal:
  ', error);\
    throw error;
}
}

// Update user with Bitrix24 deal ID
async
function updateUserBitrixDealId(chatId: number, dealId: number) {
  try {
    await sql`
      UPDATE users
      SET 
        bitrix_deal_id = ${dealId},
        updated_at = NOW()
      WHERE chat_id = ${chatId}
    `

    return true
  } catch (error) {
    console.error("Error updating user Bitrix deal ID:", error)
    throw error
  }
}

// Format survey data for Bitrix24 comments
function formatSurveyDataForComments(surveyData: any) {
  if (surveyData.segment === "company") {
    return `
      Сегмент: Компания
      Название компании: ${surveyData.companyName || "Не указано"}
      Сфера деятельности: ${surveyData.industry || "Не указано"}
      Количество сотрудников: ${surveyData.employeeCount || "Не указано"}
      Email: ${surveyData.email || "Не указано"}
      Телефон: ${surveyData.phone || "Не указано"}
    `
  } else {
    return `
      Сегмент: Частное лицо
      Имя: ${surveyData.fullName || "Не указано"}
      Возраст: ${surveyData.age || "Не указано"}
      Email: ${surveyData.email || "Не указано"}
      Телефон: ${surveyData.phone || "Не указано"}
    `
  }
}

// Update Bitrix24 deal with conversation
export async function updateBitrixDealWithConversation(user: any) {
  try {
    if (!user.bitrix_deal_id) {
      return false
    }

    const bitrixWebhookUrl = process.env.BITRIX24_WEBHOOK_URL

    if (!bitrixWebhookUrl) {
      console.error("Bitrix24 webhook URL not configured")
      return false
    }

    // Get recent conversation history
    const history = await getConversationHistory(user.chatId, 5)

    // Format conversation for comments
    const conversationText = history
      .map((msg) => `${msg.direction === "incoming" ? "Пользователь" : "Бот"}: ${msg.text}`)
      .join("\n\n")

    // Update deal comments
    const response = await fetch(`${bitrixWebhookUrl}/crm.deal.update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: user.bitrix_deal_id,
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

