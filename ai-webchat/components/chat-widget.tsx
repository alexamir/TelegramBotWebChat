"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConversationStage } from "@/types/app"
import { cn } from "@/lib/utils"

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationStage, setConversationStage] = useState<ConversationStage>(ConversationStage.START)
  const [surveyStep, setSurveyStep] = useState(0)
  const [userData, setUserData] = useState<Record<string, any>>({})
  const [sessionId, setSessionId] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize chat session
  useEffect(() => {
    // Generate a unique session ID if not exists
    if (!sessionId) {
      const newSessionId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      setSessionId(newSessionId)

      // Add welcome message
      setMessages([
        {
          id: 1,
          content: "Добро пожаловать! Я AI-ассистент. Чем я могу вам помочь?",
          sender: "bot",
          timestamp: new Date(),
        },
      ])
    }
  }, [sessionId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Toggle chat widget
  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim()) return

    // Add user message to chat
    const userMessage = {
      id: messages.length + 1,
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // Process message based on conversation stage
      if (conversationStage === ConversationStage.START) {
        // Initial greeting, move to contact info stage
        await handleStartStage()
      } else if (conversationStage === ConversationStage.SEGMENTATION) {
        // Handle segmentation response
        await handleSegmentationStage(inputValue)
      } else if (conversationStage === ConversationStage.SURVEY) {
        // Handle survey response
        await handleSurveyStage(inputValue)
      } else if (conversationStage === ConversationStage.AI_DIALOG) {
        // Handle AI dialog
        await handleAIDialog(inputValue)
      }
    } catch (error) {
      console.error("Error processing message:", error)

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          content: "Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.",
          sender: "bot",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle start stage
  const handleStartStage = async () => {
    // Add bot message asking for segmentation
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          content: 'Пожалуйста, выберите категорию: "Компания" или "Частное лицо"',
          sender: "bot",
          timestamp: new Date(),
        },
      ])

      // Update conversation stage
      setConversationStage(ConversationStage.SEGMENTATION)
    }, 1000)
  }

  // Handle segmentation stage
  const handleSegmentationStage = async (input: string) => {
    const segment = input.toLowerCase().includes("компания") ? "company" : "individual"

    // Update user data
    setUserData((prev) => ({
      ...prev,
      segment,
    }))

    // Move to survey stage
    setConversationStage(ConversationStage.SURVEY)
    setSurveyStep(1)

    // Send first survey question
    setTimeout(() => {
      const question = getSurveyQuestion(1, segment)

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          content: question,
          sender: "bot",
          timestamp: new Date(),
        },
      ])
    }, 1000)
  }

  // Handle survey stage
  const handleSurveyStage = async (input: string) => {
    const { segment } = userData
    const currentStep = surveyStep

    // Save response to user data
    const updatedUserData = { ...userData }

    if (segment === "company") {
      switch (currentStep) {
        case 1:
          updatedUserData.companyName = input
          break
        case 2:
          updatedUserData.industry = input
          break
        case 3:
          updatedUserData.employeeCount = input
          break
        case 4:
          updatedUserData.email = input
          break
        case 5:
          updatedUserData.phone = input
          break
      }
    } else {
      // Individual segment
      switch (currentStep) {
        case 1:
          updatedUserData.fullName = input
          break
        case 2:
          updatedUserData.age = input
          break
        case 3:
          updatedUserData.email = input
          break
        case 4:
          updatedUserData.phone = input
          break
      }
    }

    setUserData(updatedUserData)

    // Determine if survey is complete
    const maxSteps = segment === "company" ? 5 : 4
    const nextStep = currentStep + 1

    if (nextStep > maxSteps) {
      // Survey complete, move to AI dialog
      await finishSurvey(updatedUserData)
    } else {
      // Send next question
      setSurveyStep(nextStep)

      setTimeout(() => {
        const question = getSurveyQuestion(nextStep, segment)

        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            content: question,
            sender: "bot",
            timestamp: new Date(),
          },
        ])
      }, 1000)
    }
  }

  // Get survey question based on step and segment
  const getSurveyQuestion = (step: number, segment: string) => {
    if (segment === "company") {
      switch (step) {
        case 1:
          return "Название вашей компании?"
        case 2:
          return "Какая у вас сфера деятельности?"
        case 3:
          return "Количество сотрудников в компании?"
        case 4:
          return "Контактный email?"
        case 5:
          return "Контактный телефон?"
        default:
          return ""
      }
    } else {
      // Individual segment
      switch (step) {
        case 1:
          return "Как вас зовут (полное имя)?"
        case 2:
          return "Ваш возраст?"
        case 3:
          return "Контактный email?"
        case 4:
          return "Контактный телефон?"
        default:
          return ""
      }
    }
  }

  // Finish survey and move to AI dialog
  const finishSurvey = async (userData: Record<string, any>) => {
    try {
      // Create or update deal in Bitrix24
      await fetch("/api/bitrix/create-deal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          userData,
        }),
      })

      // Add completion message
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          content: "Спасибо за ответы! Теперь вы можете задать любой вопрос нашему AI-ассистенту.",
          sender: "bot",
          timestamp: new Date(),
        },
      ])

      // Update conversation stage
      setConversationStage(ConversationStage.AI_DIALOG)
    } catch (error) {
      console.error("Error finishing survey:", error)
    }
  }

  // Handle AI dialog
  const handleAIDialog = async (input: string) => {
    try {
      // Call AI endpoint
      const response = await fetch("/api/chat/ai-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: input,
          userData,
        }),
      })

      const data = await response.json()

      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          content: data.text,
          sender: "bot",
          timestamp: new Date(),
        },
      ])

      // If the response includes special content (video, link), add it
      if (data.videoUrl) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            content: `<video src="${data.videoUrl}" controls></video>`,
            sender: "bot",
            timestamp: new Date(),
            isMedia: true,
          },
        ])
      }

      if (data.linkUrl) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            content: `<a href="${data.linkUrl}" target="_blank">Дополнительная информация</a>`,
            sender: "bot",
            timestamp: new Date(),
            isLink: true,
          },
        ])
      }
    } catch (error) {
      console.error("Error getting AI response:", error)
    }
  }

  // Handle contact manager button
  const handleContactManager = async () => {
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        content: "Запрос на связь с менеджером отправлен. Менеджер присоединится к чату в ближайшее время.",
        sender: "bot",
        timestamp: new Date(),
      },
    ])

    // Notify backend about manager request
    await fetch("/api/chat/request-manager", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        userData,
      }),
    })
  }

  // Handle payment button
  const handlePayment = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        content:
          'Вот ссылка для оплаты: <a href="https://payment.example.com/checkout" target="_blank">https://payment.example.com/checkout</a>',
        sender: "bot",
        timestamp: new Date(),
        isLink: true,
      },
    ])
  }

  // Render message content
  const renderMessageContent = (message: any) => {
    if (message.isMedia) {
      return <div dangerouslySetInnerHTML={{ __html: message.content }} />
    } else if (message.isLink) {
      return <div dangerouslySetInnerHTML={{ __html: message.content }} />
    } else {
      return message.content
    }
  }

  return (
    <>
      {/* Chat toggle button */}
      {!isOpen && (
        <Button onClick={toggleChat} className="rounded-full h-14 w-14 shadow-lg">
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat widget */}
      {isOpen && (
        <Card className="w-80 sm:w-96 shadow-lg">
          <CardHeader className="p-4 flex flex-row items-center justify-between bg-primary text-primary-foreground">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI Assistant" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-sm">AI Assistant</h3>
                <p className="text-xs opacity-80">Online</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleChat}
              className="text-primary-foreground hover:bg-primary/90"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    {renderMessageContent(message)}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <div className="flex space-x-2">
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Action buttons for AI dialog stage */}
            {conversationStage === ConversationStage.AI_DIALOG && (
              <div className="p-2 border-t border-gray-200 flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleContactManager} className="text-xs">
                  Связаться с менеджером
                </Button>
                <Button variant="outline" size="sm" onClick={handlePayment} className="text-xs">
                  Перейти к оплате
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-2 pt-0">
            <form onSubmit={handleSubmit} className="flex w-full space-x-2">
              <Input
                placeholder="Введите сообщение..."
                value={inputValue}
                onChange={handleInputChange}
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  )
}

