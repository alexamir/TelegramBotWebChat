import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@vercel/postgres"

// Telegram bot webhook handler
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Process Telegram update
    if (data.message) {
      const chatId = data.message.chat.id
      const text = data.message.text

      // Handle commands and user input
      if (text === "/start") {
        await sendTelegramMessage(chatId, "Welcome! Please select your category:", {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Company", callback_data: "category_company" },
                { text: "Individual", callback_data: "category_individual" },
              ],
            ],
          },
        })
      } else {
        // Process regular messages with AI
        const aiResponse = await generateAIResponse(text, chatId)
        await sendTelegramMessage(chatId, aiResponse)
      }
    } else if (data.callback_query) {
      // Handle button callbacks
      const chatId = data.callback_query.message.chat.id
      const callbackData = data.callback_query.data

      if (callbackData.startsWith("category_")) {
        const category = callbackData.replace("category_", "")
        await saveUserCategory(chatId, category)
        await startQuestionnaire(chatId, category)
      } else if (callbackData === "contact_manager") {
        await handleContactManager(chatId)
      } else if (callbackData === "payment") {
        await handlePayment(chatId)
      } else if (callbackData === "additional_question") {
        await handleAdditionalQuestion(chatId)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error processing Telegram webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper functions
async function sendTelegramMessage(chatId: number, text: string, options = {}) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN
  const apiUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...options,
    }),
  })

  return response.json()
}

async function generateAIResponse(userMessage: string, chatId: number) {
  try {
    // Get conversation history from database
    const history = await getConversationHistory(chatId)

    // Generate AI response using the AI SDK
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `User: ${userMessage}`,
      system: `You are a helpful assistant for a company. 
      Previous conversation: ${history.join("\n")}
      Respond in a professional and helpful manner.`,
    })

    // Save the conversation to the database
    await saveConversation(chatId, userMessage, text)

    // Update Bitrix24 deal
    await updateBitrix24Deal(chatId, userMessage, text)

    return text
  } catch (error) {
    console.error("Error generating AI response:", error)
    return "Sorry, I encountered an error. Please try again later."
  }
}

async function saveUserCategory(chatId: number, category: string) {
  const client = createClient()
  await client.connect()

  try {
    // Check if user exists
    const { rows } = await client.sql`
      SELECT * FROM users WHERE chat_id = ${chatId}
    `

    if (rows.length === 0) {
      // Create new user
      await client.sql`
        INSERT INTO users (chat_id, category, created_at)
        VALUES (${chatId}, ${category}, NOW())
      `
    } else {
      // Update existing user
      await client.sql`
        UPDATE users SET category = ${category}, updated_at = NOW()
        WHERE chat_id = ${chatId}
      `
    }
  } finally {
    await client.end()
  }
}

async function startQuestionnaire(chatId: number, category: string) {
  // Get first question based on category
  const question = await getNextQuestion(chatId, category)

  await sendTelegramMessage(chatId, question, {
    reply_markup: {
      force_reply: true,
    },
  })
}

async function getNextQuestion(chatId: number, category: string) {
  const client = createClient()
  await client.connect()

  try {
    // Get current question index
    const { rows } = await client.sql`
      SELECT question_index FROM users WHERE chat_id = ${chatId}
    `

    const questionIndex = rows[0]?.question_index || 0

    // Get questions based on category
    const questions =
      category === "company"
        ? [
            "What is your company name?",
            "What industry are you in?",
            "How many employees do you have?",
            "What is your role in the company?",
            "What is your email address?",
          ]
        : [
            "What is your name?",
            "What is your email address?",
            "What is your phone number?",
            "What services are you interested in?",
          ]

    if (questionIndex < questions.length) {
      // Update question index
      await client.sql`
        UPDATE users SET question_index = ${questionIndex + 1}
        WHERE chat_id = ${chatId}
      `

      return questions[questionIndex]
    } else {
      // Questionnaire completed
      await client.sql`
        UPDATE users SET questionnaire_completed = true
        WHERE chat_id = ${chatId}
      `

      // Create Bitrix24 deal
      await createBitrix24Deal(chatId)

      return "Thank you for completing the questionnaire! How can I help you today?"
    }
  } finally {
    await client.end()
  }
}

async function saveConversation(chatId: number, userMessage: string, aiResponse: string) {
  const client = createClient()
  await client.connect()

  try {
    await client.sql`
      INSERT INTO conversations (chat_id, user_message, ai_response, created_at)
      VALUES (${chatId}, ${userMessage}, ${aiResponse}, NOW())
    `
  } finally {
    await client.end()
  }
}

async function getConversationHistory(chatId: number) {
  const client = createClient()
  await client.connect()

  try {
    const { rows } = await client.sql`
      SELECT user_message, ai_response FROM conversations
      WHERE chat_id = ${chatId}
      ORDER BY created_at DESC
      LIMIT 10
    `

    return rows.map((row) => `User: ${row.user_message}\nAssistant: ${row.ai_response}`)
  } finally {
    await client.end()
  }
}

async function createBitrix24Deal(chatId: number) {
  const client = createClient()
  await client.connect()

  try {
    // Get user data
    const { rows } = await client.sql`
      SELECT * FROM users WHERE chat_id = ${chatId}
    `

    if (rows.length === 0) return

    const userData = rows[0]

    // Get questionnaire answers
    const { rows: answerRows } = await client.sql`
      SELECT question, answer FROM questionnaire_answers
      WHERE chat_id = ${chatId}
      ORDER BY created_at ASC
    `

    // Create deal in Bitrix24
    const bitrixWebhookUrl = process.env.BITRIX24_WEBHOOK_URL

    const response = await fetch(`${bitrixWebhookUrl}/crm.deal.add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          TITLE: `New Deal from ${userData.category === "company" ? "Company" : "Individual"}`,
          CATEGORY_ID: userData.category === "company" ? 1 : 2,
          COMMENTS: answerRows.map((row) => `${row.question}: ${row.answer}`).join("\n"),
          SOURCE_ID: "TELEGRAM_BOT",
        },
      }),
    })

    const result = await response.json()

    // Save deal ID to database
    if (result.result) {
      await client.sql`
        UPDATE users SET bitrix_deal_id = ${result.result}
        WHERE chat_id = ${chatId}
      `
    }
  } catch (error) {
    console.error("Error creating Bitrix24 deal:", error)
  } finally {
    await client.end()
  }
}

async function updateBitrix24Deal(chatId: number, userMessage: string, aiResponse: string) {
  const client = createClient()
  await client.connect()

  try {
    // Get Bitrix24 deal ID
    const { rows } = await client.sql`
      SELECT bitrix_deal_id FROM users WHERE chat_id = ${chatId}
    `

    if (rows.length === 0 || !rows[0].bitrix_deal_id) return

    const dealId = rows[0].bitrix_deal_id

    // Update deal in Bitrix24
    const bitrixWebhookUrl = process.env.BITRIX24_WEBHOOK_URL

    await fetch(`${bitrixWebhookUrl}/crm.deal.update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: dealId,
        fields: {
          COMMENTS: `${new Date().toISOString()}\nUser: ${userMessage}\nBot: ${aiResponse}\n\n`,
        },
      }),
    })
  } catch (error) {
    console.error("Error updating Bitrix24 deal:", error)
  } finally {
    await client.end()
  }
}

async function handleContactManager(chatId: number) {
  // Notify manager about contact request
  await sendTelegramMessage(chatId, "Thank you! A manager will contact you shortly.")

  // Update Bitrix24 deal with contact request
  const client = createClient()
  await client.connect()

  try {
    const { rows } = await client.sql`
      SELECT bitrix_deal_id FROM users WHERE chat_id = ${chatId}
    `

    if (rows.length === 0 || !rows[0].bitrix_deal_id) return

    const dealId = rows[0].bitrix_deal_id
    const bitrixWebhookUrl = process.env.BITRIX24_WEBHOOK_URL

    await fetch(`${bitrixWebhookUrl}/crm.deal.update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: dealId,
        fields: {
          STAGE_ID: "CONTACT_REQUESTED",
          COMMENTS: `${new Date().toISOString()}: User requested manager contact\n\n`,
        },
      }),
    })
  } finally {
    await client.end()
  }
}

async function handlePayment(chatId: number) {
  // Send payment link
  await sendTelegramMessage(chatId, "Here is your payment link: https://example.com/payment")

  // Update Bitrix24 deal with payment request
  const client = createClient()
  await client.connect()

  try {
    const { rows } = await client.sql`
      SELECT bitrix_deal_id FROM users WHERE chat_id = ${chatId}
    `

    if (rows.length === 0 || !rows[0].bitrix_deal_id) return

    const dealId = rows[0].bitrix_deal_id
    const bitrixWebhookUrl = process.env.BITRIX24_WEBHOOK_URL

    await fetch(`${bitrixWebhookUrl}/crm.deal.update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: dealId,
        fields: {
          STAGE_ID: "PAYMENT_REQUESTED",
          COMMENTS: `${new Date().toISOString()}: User requested payment link\n\n`,
        },
      }),
    })
  } finally {
    await client.end()
  }
}

async function handleAdditionalQuestion(chatId: number) {
  await sendTelegramMessage(chatId, "Please ask your additional question, and I'll do my best to help you.")
}

