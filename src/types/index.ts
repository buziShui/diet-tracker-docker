export interface FoodItem {
  name: string
  caloriesPer100g: number
  category: string
  aliases?: string[]
}

export interface DietRecord {
  id: string
  date: string // YYYY-MM-DD
  meal?: MealType // 早/中/晚餐
  foodName: string
  grams: number
  calories: number
  category: string
  createdAt: number
}

export type MealType = 'breakfast' | 'lunch' | 'dinner'

// 通用大模型 API 预设
export type LLMProvider =
  | 'openai'      // OpenAI / One-API / OpenRouter 等
  | 'dashscope'   // 阿里通义千问
  | 'zhipu'       // 智谱 ChatGLM
  | 'moonshot'    // 月之暗面 Kimi
  | 'doubao'      // 字节豆包
  | 'wenxin'      // 百度文心一言
  | 'xunfei'      // 讯飞星火
  | 'deepseek'    // DeepSeek
  | 'hunyuan'     // 腾讯混元
  | 'minimax'     // MiniMax
  | 'lingyi'      // 零一万物 Yi
  | 'baichuan'    // 百川智能
  | 'custom'      // 自定义

export interface LLMApiConfig {
  enabled: boolean
  provider: LLMProvider
  baseUrl: string
  apiKey?: string
  model?: string
}

export type Gender = 'male' | 'female'

export type ActivityLevel =
  | 'sedentary'   // 久坐
  | 'light'       // 轻度活动
  | 'moderate'    // 中度活动
  | 'active'      // 高度活动
  | 'very_active' // 极高活动

/** 身体数据：用于基础代谢与每日热量预算 */
export interface UserProfile {
  gender: Gender
  age: number
  heightCm: number
  weightKg: number
  activity: ActivityLevel
  /** 手动设定每日摄入目标（kcal），不填则按 TDEE */
  manualDailyTarget?: number
}

/** 中式菜单条目（每 100g 约热量，成品菜估算） */
export interface ChineseMenuItem {
  name: string
  caloriesPer100g: number
  category: string
  /** 添加时默认克数 */
  suggestedGrams?: number
  aliases?: string[]
}
