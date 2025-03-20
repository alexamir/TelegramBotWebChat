"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export default function WebChat() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [input, setInput] = useState("")
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    questionIndex: 0,
    questionnaireCompleted: false,
  })
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Questions for the questionnaire
  const companyQuestions = [
    "What is your company name?",
    "What industry are you in?",
    "How many employees do you have?",
    "What is your role in the company?",
    "What is your email address?",
  ]

  const individualQuestions = [
    "What is your name?",
    "What is your email address?",
    "What is your phone number?",
    "What services are you interested in?",
  ]

  // Initialize chat with welcome message
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: "Welcome! Please select your category:",
      },
    ])
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle category selection
  const handleCategorySelect = async (category: string) => {
    setUserData({ ...userData, category })

    const questions = category === "company" ? companyQuestions : individualQuestions

    setMessages([
      ...messages,
      { role: "user", content: category === "company" ? "Company" : "Individual" },
      { role: "assistant", content: questions[0] },
    ])
  }

  // Handle user input
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    const userMessage = input
    setInput("")

    // Add user message to chat
    setMessages([...messages, { role: "user", content: userMessage }])

    setLoading(true)

    try {
      if (!userData.category) {
        // User hasn't selected a category yet
        if (userMessage.toLowerCase().includes("company")) {
          handleCategorySelect("company")
        } else if (userMessage.toLowerCase().includes("individual") || userMessage.toLowerCase().includes("person")) {
          handleCategorySelect("individual")
        } else {
          setMessages([
            ...messages,
            { role: "user", content: userMessage },
            {
              role: "assistant",
              content: "Please select your category: Company or Individual",
            },
          ])
        }
      } else if (!userData.questionnaireCompleted) {
        // User is in questionnaire phase
        const questions = userData.category === "company" ? companyQuestions : individualQuestions

        // Save answer
        await saveQuestionnaireAnswer(questions[userData.questionIndex], userMessage)

        // Update user data based on question
        if (questions[userData.questionIndex].toLowerCase().includes("name")) {
          setUserData({ ...userData, name: userMessage })
        } else if (questions[userData.questionIndex].toLowerCase().includes("email")) {
          setUserData({ ...userData, email: userMessage })
        } else if (questions[userData.questionIndex].toLowerCase().includes("phone")) {
          setUserData({ ...userData, phone: userMessage })
        }

        // Move to next question or complete questionnaire
        const nextIndex = userData.questionIndex + 1

        if (nextIndex < questions.length) {
          setUserData({ ...userData, questionIndex: nextIndex })
          setMessages([
            ...messages,
            { role: "user", content: userMessage },
            { role: "assistant", content: questions[nextIndex] },
          ])
        } else {
          // Questionnaire completed
          setUserData({
            ...userData,
            questionnaireCompleted: true,
          })

          // Create Bitrix24 deal
          await createBitrix24Deal()

          setMessages([
            ...messages,
            { role: "user", content: userMessage },
            {
              role: "assistant",
              content: "Thank you for completing the questionnaire! How can I help you today?",
            },
          ])
        }
      } else {
        // Regular AI conversation
        const aiResponse = await generateAIResponse(userMessage)

        setMessages([...messages, { role: "user", content: userMessage }, { role: "assistant", content: aiResponse }])

        // Update Bitrix24 deal
        await updateBitrix24Deal(userMessage, aiResponse)
      }
    } catch (error) {
      console.error("Error processing message:", error)

      setMessages([
        ...messages,
        { role: "user", content: userMessage },
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again later.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Generate AI response using AI SDK
  const generateAIResponse = async (userMessage: string) => {
    // Get conversation history
    const history = messages
      .slice(-10)
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n")

    // Generate AI response
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `User: ${userMessage}`,
      system: `You are a helpful assistant for a company. 
      Previous conversation: ${history}
      User data: ${JSON.stringify(userData)}
      Respond in a professional and helpful manner.`,
    })

    return text
  }

  // Save questionnaire answer to database
  const saveQuestionnaireAnswer = async (question: string, answer: string) => {
    try {
      await fetch("/api/web-chat/save-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: getSessionId(),
          question,
          answer,
        }),
      })
    } catch (error) {
      console.error("Error saving questionnaire answer:", error)
    }
  }

  // Create Bitrix24 deal
  const createBitrix24Deal = async () => {
    try {
      await fetch("/api/web-chat/create-deal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: getSessionId(),
          userData,
        }),
      })
    } catch (error) {
      console.error("Error creating Bitrix24 deal:", error)
    }
  }

  // Update Bitrix24 deal with conversation
  const updateBitrix24Deal = async (userMessage: string, aiResponse: string) => {
    try {
      await fetch("/api/web-chat/update-deal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: getSessionId(),
          userMessage,
          aiResponse,
        }),
      })
    } catch (error) {
      console.error("Error updating Bitrix24 deal:", error)
    }
  }

  // Get or create session ID
  const getSessionId = () => {
    let sessionId = localStorage.getItem("chat_session_id")

    if (!sessionId) {
      sessionId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      localStorage.setItem("chat_session_id", sessionId)
    }

    return sessionId
  }

  // Handle special actions
  const handleSpecialAction = async (action: string) => {
    switch (action) {
      case "contact_manager":
        setMessages([
          ...messages,
          {
            role: "user",
            content: "I want to contact a manager",
          },
          {
            role: "assistant",
            content: "Thank you! A manager will contact you shortly.",
          },
        ])

        // Update Bitrix24 deal
        await fetch("/api/web-chat/contact-manager", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: getSessionId(),
          }),
        })
        break

      case "payment":
        setMessages([
          ...messages,
          {
            role: "user",
            content: "I want to proceed to payment",
          },
          {
            role: "assistant",
            content: "Here is your payment link: https://example.com/payment",
          },
        ])

        // Update Bitrix24 deal
        await fetch("/api/web-chat/payment-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: getSessionId(),
          }),
        })
        break

      case "additional_question":
        setMessages([
          ...messages,
          {
            role: "user",
            content: "I have an additional question",
          },
          {
            role: "assistant",
            content: "Please ask your additional question, and I'll do my best to help you.",
          },
        ])
        break

      default:
        break
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <header className="bg-white py-4 border-b">
        <h1 className="text-2xl font-bold text-center">AI Assistant</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-800">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {userData.questionnaireCompleted && (
        <div className="flex justify-center space-x-2 mb-4">
          <button
            onClick={() => handleSpecialAction("contact_manager")}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            Contact Manager
          </button>
          <button
            onClick={() => handleSpecialAction("payment")}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Proceed to Payment
          </button>
          <button
            onClick={() => handleSpecialAction("additional_question")}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
          >
            Additional Question
          </button>
        </div>
      )}

      {!userData.category && (
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={() => handleCategorySelect("company")}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
          >
            Company
          </button>
          <button
            onClick={() => handleCategorySelect("individual")}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
          >
            Individual
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex space-x-2 p-4 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          disabled={loading}
        >
          Send
        </button>
      </form>
    </div>
  )
}

