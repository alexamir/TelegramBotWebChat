import { createOrUpdateUser } from "@/lib/db/users"
import { saveMessage } from "@/lib/db/messages"
import { processAIResponse } from "@/lib/ai/processor"
import { createOrUpdateBitrixDeal } from "@/lib/bitrix/deals"
import type { TelegramUpdate, TelegramMessage } from "@/types/telegram"
import { type UserState, ConversationStage } from "@/types/app"

// Main handler for Telegram updates
export async function handleTelegramUpdate(update: TelegramUpdate) {
  // Check if this is a message update
  if (update.message) {
    await handleMessage(update.message)
  }

  // Check if this is a callback query (inline button press)
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query)
  }
}

// Handle incoming messages
async function handleMessage(message: TelegramMessage) {
  const chatId = message.chat.id
  const text = message.text || ""

  // Save the message to the database
  await saveMessage({
    chatId,
    messageId: message.message_id,
    text,
    direction: "incoming",
    timestamp: new Date(message.date * 1000),
  })

  // Get or create user and their current state
  const user = await createOrUpdateUser({
    chatId,
    username: message.from.username,
    firstName: message.from.first_name,
    lastName: message.from.last_name,
  })

  // Handle the message based on the user's current conversation stage
  switch (user.state.stage) {
    case ConversationStage.START:
      await handleStartCommand(chatId, text)
      break

    case ConversationStage.SEGMENTATION:
      await handleSegmentation(chatId, text, user)
      break

    case ConversationStage.SURVEY:
      await handleSurveyResponse(chatId, text, user)
      break

    case ConversationStage.AI_DIALOG:
      await handleAIDialog(chatId, text, user)
      break

    default:
      // Default to AI dialog if stage is unknown
      await handleAIDialog(chatId, text, user)
  }
}

// Handle callback queries from inline buttons
async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id
  const data = callbackQuery.data

  // Get user and their current state
  const user = await createOrUpdateUser({
    chatId,
    username: callbackQuery.from.username,
    firstName: callbackQuery.from.first_name,
    lastName: callbackQuery.from.last_name,
  })

  // Process the callback data
  if (data === "contact_manager") {
    await sendContactManagerMessage(chatId)
  } else if (data === "payment") {
    await sendPaymentLink(chatId)
  } else if (data === "additional_question") {
    await promptForAdditionalQuestion(chatId)
  } else if (data.startsWith("segment_")) {
    // Handle segmentation selection (company or individual)
    const segment = data.replace("segment_", "")
    await handleSegmentSelection(chatId, segment, user)
  }

  // Answer the callback query to remove the loading state
  await answerCallbackQuery(callbackQuery.id)
}

// Handle the /start command
async function handleStartCommand(chatId: number, text: string) {
  if (text === "/start") {
    await sendMessage(chatId, "Добро пожаловать! Выберите категорию:", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Компания", callback_data: "segment_company" },
            { text: "Частное лицо", callback_data: "segment_individual" },
          ],
        ],
      },
    })

    // Update user state
    await updateUserState(chatId, {
      stage: ConversationStage.SEGMENTATION,
      surveyStep: 0,
      surveyData: {},
    })
  }
}

// Handle segmentation selection
async function handleSegmentSelection(chatId: number, segment: string, user: any) {
  // Save the segment selection
  const updatedSurveyData = {
    ...user.state.surveyData,
    segment,
  }

  // Update user state and move to survey
  await updateUserState(chatId, {
    stage: ConversationStage.SURVEY,
    surveyStep: 1,
    surveyData: updatedSurveyData,
  })

  // Start the survey
  await sendSurveyQuestion(chatId, 1, segment)
}

// Send a survey question based on the step and segment
async function sendSurveyQuestion(chatId: number, step: number, segment: string) {
  let question = ""

  // Different questions based on segment and step
  if (segment === "company") {
    switch (step) {
      case 1:
        question = "Название вашей компании?"
        break
      case 2:
        question = "Какая у вас сфера деятельности?"
        break
      case 3:
        question = "Количество сотрудников в компании?"
        break
      case 4:
        question = "Контактный email?"
        break
      case 5:
        question = "Контактный телефон?"
        break
      default:
        // Survey complete, move to AI dialog
        await finishSurvey(chatId)
        return
    }
  } else {
    // Individual segment
    switch (step) {
      case 1:
        question = "Как вас зовут (полное имя)?"
        break
      case 2:
        question = "Ваш возраст?"
        break
      case 3:
        question = "Контактный email?"
        break
      case 4:
        question = "Контактный телефон?"
        break
      default:
        // Survey complete, move to AI dialog
        await finishSurvey(chatId)
        return
    }
  }

  await sendMessage(chatId, question)
}

// Handle survey responses
async function handleSurveyResponse(chatId: number, text: string, user: any) {
  const currentStep = user.state.surveyStep
  const segment = user.state.surveyData.segment

  // Save the response to the current question
  const updatedSurveyData = {
    ...user.state.surveyData,
  }

  // Map the response to the appropriate field based on segment and step
  if (segment === "company") {
    switch (currentStep) {
      case 1:
        updatedSurveyData.companyName = text
        break
      case 2:
        updatedSurveyData.industry = text
        break
      case 3:
        updatedSurveyData.employeeCount = text
        break
      case 4:
        updatedSurveyData.email = text
        break
      case 5:
        updatedSurveyData.phone = text
        break
    }
  } else {
    // Individual segment
    switch (currentStep) {
      case 1:
        updatedSurveyData.fullName = text
        break
      case 2:
        updatedSurveyData.age = text
        break
      case 3:
        updatedSurveyData.email = text
        break
      case 4:
        updatedSurveyData.phone = text
        break
    }
  }

  // Update user state and move to next question
  const nextStep = currentStep + 1
  await updateUserState(chatId, {
    stage: ConversationStage.SURVEY,
    surveyStep: nextStep,
    surveyData: updatedSurveyData,
  })

  // Send the next question or finish the survey
  await sendSurveyQuestion(chatId, nextStep, segment)
}

// Finish the survey and move to AI dialog
async function finishSurvey(chatId: number) {
  // Get the user with updated survey data
  const user = await getUserByChatId(chatId)

  // Create or update a deal in Bitrix24
  await createOrUpdateBitrixDeal(user)

  // Send a message to start the AI dialog
  await sendMessage(chatId, "Спасибо за ответы! Теперь вы можете задать любой вопрос нашему AI-ассистенту.", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Связаться с менеджером", callback_data: "contact_manager" },
          { text: "Перейти к оплате", callback_data: "payment" },
        ],
        [{ text: "Дополнительный вопрос", callback_data: "additional_question" }],
      ],
    },
  })

  // Update user state to AI dialog
  await updateUserState(chatId, {
    stage: ConversationStage.AI_DIALOG,
    surveyStep: 0,
    surveyData: user.state.surveyData,
  })
}

// Handle AI dialog
async function handleAIDialog(chatId: number, text: string, user: any) {
  // Send typing indicator
  await sendChatAction(chatId, "typing")

  // Process the message with AI
  const aiResponse = await processAIResponse(text, user)

  // Send the AI response
  await sendMessage(chatId, aiResponse.text, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Связаться с менеджером", callback_data: "contact_manager" },
          { text: "Перейти к оплате", callback_data: "payment" },
        ],
        [{ text: "Дополнительный вопрос", callback_data: "additional_question" }],
      ],
    },
  })

  // If the AI response includes a video or link, send it
  if (aiResponse.videoUrl) {
    await sendVideo(chatId, aiResponse.videoUrl)
  }

  if (aiResponse.linkUrl) {
    await sendMessage(chatId, `Дополнительная информация: ${aiResponse.linkUrl}`)
  }

  // Save the AI response to the database
  await saveMessage({
    chatId,
    messageId: 0, // We don't have the message ID yet
    text: aiResponse.text,
    direction: "outgoing",
    timestamp: new Date(),
  })

  // Update the Bitrix24 deal with the conversation
  await updateBitrixDealWithConversation(user)
}

// Helper functions for Telegram API
async function sendMessage(chatId: number, text: string, options = {}) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN

  const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
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

  return await response.json()
}

async function sendChatAction(chatId: number, action: string) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN

  await fetch(`https://api.telegram.org/bot${telegramToken}/sendChatAction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      action,
    }),
  })
}

async function sendVideo(chatId: number, videoUrl: string) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN

  await fetch(`https://api.telegram.org/bot${telegramToken}/sendVideo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      video: videoUrl,
    }),
  })
}

async function answerCallbackQuery(callbackQueryId: string) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN

  await fetch(`https://api.telegram.org/bot${telegramToken}/answerCallbackQuery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
    }),
  })
}

// Helper functions for user state management
async function updateUserState(chatId: number, state: UserState) {
  // Update the user state in the database
  // Implementation depends on your database structure
}

async function getUserByChatId(chatId: number) {
  // Get the user from the database
  // Implementation depends on your database structure
}

// Helper functions for inline button actions
async function sendContactManagerMessage(chatId: number) {
  await sendMessage(chatId, "Наш менеджер свяжется с вами в ближайшее время. Пожалуйста, ожидайте.")
}

async function sendPaymentLink(chatId: number) {
  await sendMessage(chatId, "Вот ссылка для оплаты: https://payment.example.com/checkout")
}

async function promptForAdditionalQuestion(chatId: number) {
  await sendMessage(chatId, "Пожалуйста, задайте ваш дополнительный вопрос:")
}

// Helper function to update Bitrix24 deal with conversation
async function updateBitrixDealWithConversation(user: any) {
  // Implementation depends on your Bitrix24 integration
}

async function handleSegmentation(chatId: number, text: string, user: any) {
  await sendMessage(chatId, "Вы находитесь на этапе сегментации. Пожалуйста, выберите опцию.")
}

