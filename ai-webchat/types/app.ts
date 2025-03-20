// Enum for conversation stages
export enum ConversationStage {
  START = "start",
  SEGMENTATION = "segmentation",
  SURVEY = "survey",
  AI_DIALOG = "ai_dialog",
}

// Web chat message interface
export interface WebChatMessage {
  id?: number
  sessionId: string
  text: string
  direction: "incoming" | "outgoing" | "system"
  timestamp: Date
  createdAt?: Date
}

// Web chat session interface
export interface WebChatSession {
  id?: number
  sessionId: string
  bitrixDealId?: number
  createdAt?: Date
  updatedAt?: Date
}

