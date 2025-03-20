// Enum for conversation stages
export enum ConversationStage {
  START = "start",
  SEGMENTATION = "segmentation",
  SURVEY = "survey",
  AI_DIALOG = "ai_dialog",
}

// User state interface
export interface UserState {
  stage: ConversationStage
  surveyStep: number
  surveyData: Record<string, any>
}

// Message interface
export interface Message {
  id?: number
  chatId: number
  messageId: number
  text: string
  direction: "incoming" | "outgoing"
  timestamp: Date
  createdAt?: Date
}

// User interface
export interface User {
  id?: number
  chatId: number
  username?: string
  firstName?: string
  lastName?: string
  state: UserState
  bitrixDealId?: number
  createdAt?: Date
  updatedAt?: Date
}

