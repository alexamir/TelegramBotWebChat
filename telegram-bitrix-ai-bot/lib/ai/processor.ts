import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getConversationHistory } from "@/lib/db/messages"

// Process user message with AI
export async function processAIResponse(message: string, user: any) {
  try {
    // Get conversation history for context
    const history = await getConversationHistory(user.chatId, 10)

    // Format history for the AI prompt
    const formattedHistory = history
      .map((msg) => `${msg.direction === "incoming" ? "User" : "Assistant"}: ${msg.text}`)
      .join("\n")

    // Create a system prompt with user information
    const systemPrompt = createSystemPrompt(user)

    // Generate AI response
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `${formattedHistory}\nUser: ${message}\nAssistant:`,
    })

    // Parse the response for any special content (videos, links)
    const parsedResponse = parseSpecialContent(text)

    return parsedResponse
  } catch (error) {
    console.error("Error processing AI response:", error)
    return {
      text: "Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.",
      videoUrl: null,
      linkUrl: null,
    }
  }
}

// Create a system prompt with user information
function createSystemPrompt(user: any) {
  const { surveyData } = user.state

  let userInfo = ""

  if (surveyData.segment === "company") {
    userInfo = `
      Компания: ${surveyData.companyName || "Не указано"}
      Сфера деятельности: ${surveyData.industry || "Не указано"}
      Количество сотрудников: ${surveyData.employeeCount || "Не указано"}
      Email: ${surveyData.email || "Не указано"}
      Телефон: ${surveyData.phone || "Не указано"}
    `
  } else {
    userInfo = `
      Имя: ${surveyData.fullName || "Не указано"}
      Возраст: ${surveyData.age || "Не указано"}
      Email: ${surveyData.email || "Не указано"}
      Телефон: ${surveyData.phone || "Не указано"}
    `
  }

  return `
    Вы - AI-ассистент для Telegram-бота компании. Ваша задача - помогать пользователям, отвечать на их вопросы и предоставлять полезную информацию.
    
    Информация о пользователе:
    ${userInfo}
    
    Правила:
    1. Отвечайте вежливо и профессионально.
    2. Если вы не знаете ответ, честно признайтесь в этом.
    3. Если пользователь запрашивает видео или ссылки, вы можете включить их в ответ в формате [VIDEO:URL] или [LINK:URL].
    4. Не предоставляйте ложную информацию.
    5. Если пользователь хочет связаться с менеджером, предложите ему нажать кнопку "Связаться с менеджером".
  `
}

// Parse special content from AI response
function parseSpecialContent(text: string) {
  let cleanText = text
  let videoUrl = null
  let linkUrl = null

  // Extract video URL if present
  const videoMatch = text.match(/\[VIDEO:(.*?)\]/)
  if (videoMatch && videoMatch[1]) {
    videoUrl = videoMatch[1]
    cleanText = cleanText.replace(videoMatch[0], "")
  }

  // Extract link URL if present
  const linkMatch = text.match(/\[LINK:(.*?)\]/)
  if (linkMatch && linkMatch[1]) {
    linkUrl = linkMatch[1]
    cleanText = cleanText.replace(linkMatch[0], "")
  }

  return {
    text: cleanText.trim(),
    videoUrl,
    linkUrl,
  }
}

