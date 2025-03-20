// Telegram Update interface
export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

// Telegram Message interface
export interface TelegramMessage {
  message_id: number
  from: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
}

// Telegram User interface
export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
}

// Telegram Chat interface
export interface TelegramChat {
  id: number
  type: string
  title?: string
  username?: string
  first_name?: string
  last_name?: string
}

// Telegram Callback Query interface
export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message: TelegramMessage
  chat_instance: string
  data?: string
}

