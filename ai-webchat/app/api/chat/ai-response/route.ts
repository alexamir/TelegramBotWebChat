import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { saveMessage, getConversationHistory } from "@/lib/db/messages"
import { updateBitrixDealWithConversation } from "@/lib/bitrix/deals"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message, userData } = await request.json()

    if (!sessionId || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Save user message to database
    await saveMessage({
      sessionId,
      text: message,
      direction: "incoming",
      timestamp: new Date(),
    })

    // Get conversation history for context
    const history = await getConversationHistory(sessionId, 10)

    // Format history for the AI prompt
    const formattedHistory = history
      .map((msg) => `${msg.direction === "incoming" ? "User" : "Assistant"}: ${msg.text}`)
      .join("\n")

    // Create a system prompt with user information
    const systemPrompt = createSystemPrompt(userData)

    // Generate AI response
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `${formattedHistory}\nUser: ${message}\nAssistant:`,
    })

    // Parse the response for any special content (videos, links)
    const parsedResponse = parseSpecialContent(text)

    // Save AI response to database
    await saveMessage({
      sessionId,
      text: parsedResponse.text,
      direction: "outgoing",
      timestamp: new Date(),
    })

    // Update Bitrix24 deal with conversation
    await updateBitrixDealWithConversation(sessionId, userData)

    return NextResponse.json(parsedResponse)
  } catch (error) {
    console.error("Error generating AI response:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate AI response",
        text: "Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.",
      },
      { status: 500 },
    )
  }
}

// Create a system prompt with user information
function createSystemPrompt(userData: any) {
  let userInfo = ""

  if (userData.segment === "company") {
    userInfo = `
      Компания: ${userData.companyName || "Не указано"}
      Сфера деятельности: ${userData.industry || "Не указано"}
      Количество сотрудников: ${userData.employeeCount || "Не указано"}
      Email: ${userData.email || "Не указано"}
      Телефон: ${userData.phone || "Не указано"}
    `
  } else {
    userInfo = `
      Имя: ${userData.fullName || "Не указано"}
      Возраст: ${userData.age || "Не указано"}
      Email: ${userData.email || "Не указано"}
      Телефон: ${userData.phone || "Не указано"}
    `
  }

  return `
    Вы - AI-ассистент для веб-чата компании. Ваша задача - помогать пользователям, отвечать на их вопросы и предоставлять полезную информацию.
    
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

