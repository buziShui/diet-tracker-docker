import type { LLMApiConfig } from '../types'
import { buildChatRequest, extractContent } from './llm-adapters'

const DEFAULT_PROMPT = `你是一个饮食解析助手。用户会说出他今天吃了什么食物及克数。
请从用户输入中提取所有食物及对应的克数，返回JSON数组。
格式：{"items":[{"foodName":"食物名","grams":数字,"category":"分类","caloriesPer100g":数字}]}
若无法确定克数，按常见份量估算（如一碗米饭约200克）。
若食物不在常见清单，请估算 category 与 caloriesPer100g。
只返回JSON，不要其他文字。`

function chatEndpoint(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '')
  return base.includes('/chat/completions') ? base : `${base}/chat/completions`
}

function parseItemsFromContent(content: string): {
  foodName: string
  grams: number
  category?: string
  caloriesPer100g?: number
}[] | null {
  const cleaned = content.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    const items = parsed?.items ?? (Array.isArray(parsed) ? parsed : null)
    if (!Array.isArray(items)) return null
    return items
      .filter((x: unknown) => {
        if (!x || typeof x !== 'object') return false
        const o = x as Record<string, unknown>
        return typeof o.foodName === 'string' && (typeof o.grams === 'number' || !isNaN(Number(o.grams)))
      })
      .map((x: unknown) => {
        const o = x as Record<string, unknown>
        return {
          foodName: String(o.foodName),
          grams: Number(o.grams) || 100,
          category: typeof o.category === 'string' ? o.category : undefined,
          caloriesPer100g:
            typeof o.caloriesPer100g === 'number' || !isNaN(Number(o.caloriesPer100g))
              ? Number(o.caloriesPer100g)
              : undefined
        }
      })
  } catch {
    return null
  }
}

export async function parseWithLLM(
  text: string,
  config: LLMApiConfig
): Promise<{ foodName: string; grams: number; category?: string; caloriesPer100g?: number }[] | null> {
  if (!config.enabled || !config.baseUrl?.trim()) return null
  try {
    const messages = [
      { role: 'system' as const, content: DEFAULT_PROMPT },
      { role: 'user' as const, content: text }
    ]
    const body = buildChatRequest(messages, config)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (config.apiKey?.trim()) {
      headers['Authorization'] = `Bearer ${config.apiKey.trim()}`
    }
    const res = await fetch(chatEndpoint(config.baseUrl.trim()), {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message || data?.message || `API ${res.status}`)
    const content = extractContent(data)
    if (!content) return null
    return parseItemsFromContent(content)
  } catch {
    return null
  }
}

// 供外部直接调用的解析函数（可被替换为自定义实现）
export type ParseFn = (
  text: string,
  config: LLMApiConfig
) => Promise<{ foodName: string; grams: number; category?: string; caloriesPer100g?: number }[] | null>

let customParseFn: ParseFn | null = null

export function setCustomParseFn(fn: ParseFn | null) {
  customParseFn = fn
}

export async function parseDietText(
  text: string,
  config: LLMApiConfig
): Promise<{ foodName: string; grams: number; category?: string; caloriesPer100g?: number }[] | null> {
  if (customParseFn) return customParseFn(text, config)
  return parseWithLLM(text, config)
}
