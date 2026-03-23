import { findFood } from './foodDb'
import { parseDietText } from './llm'
import type { DietRecord, LLMApiConfig, MealType } from '../types'
import { upsertCustomFood } from '../utils/storage'

export interface ParsedDietItem {
  foodName: string
  grams: number
  calories: number
  category: string
}

// 正则：数字+克+食物名，或 食物名+数字+克
const PATTERNS = [
  /(\d+)\s*克\s*(.+?)(?=[\d\s]*克|$)/g,
  /(.+?)\s+(\d+)\s*克/g
]

function extractFromText(text: string): { foodName: string; grams: number }[] {
  const results: { foodName: string; grams: number }[] = []
  const seen = new Set<string>()
  for (const re of PATTERNS) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text)) !== null) {
      const grams = parseInt(m[1] || m[2], 10)
      let foodName = (m[2] || m[1] || '').replace(/[、，。]\s*$/, '').trim()
      if (grams > 0 && grams < 10000 && foodName.length >= 1) {
        const key = `${foodName}-${grams}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push({ foodName, grams })
        }
      }
    }
  }
  // 若未匹配到「克」，尝试「份」「个」「碗」等
  const fallback = /(.+?)\s*[（(]?\s*(\d+)\s*[克g]?\s*[）)]?/.exec(text)
  if (fallback && results.length === 0) {
    const foodName = fallback[1].trim()
    const grams = parseInt(fallback[2], 10) || 100
    if (foodName) results.push({ foodName, grams })
  }
  return results
}

export async function parseVoiceToDiet(
  text: string,
  date: string,
  llmConfig: LLMApiConfig
): Promise<ParsedDietItem[]> {
  let items: { foodName: string; grams: number; category?: string; caloriesPer100g?: number }[] = []
  const llmResult = await parseDietText(text, llmConfig)
  const usedLLM = !!(llmResult && llmResult.length > 0)
  if (llmResult && llmResult.length > 0) {
    items = llmResult
  } else {
    const localItems = extractFromText(text)
    items = localItems.map(({ foodName, grams }) => ({ foodName, grams }))
  }
  const output: ParsedDietItem[] = []
  for (const it of items) {
    const food = findFood(it.foodName)
    if (!food && usedLLM) {
      upsertCustomFood({
        name: it.foodName.trim(),
        caloriesPer100g:
          typeof it.caloriesPer100g === 'number' && it.caloriesPer100g > 0
            ? Math.round(it.caloriesPer100g)
            : 100,
        category: inferCategory(it.category, it.foodName),
        aliases: []
      })
    }
    const name = food?.name ?? it.foodName
    const grams = it.grams > 0 ? it.grams : 100
    const calPer100 =
      food?.caloriesPer100g ??
      (typeof it.caloriesPer100g === 'number' && it.caloriesPer100g > 0
        ? Math.round(it.caloriesPer100g)
        : 100)
    const calories = Math.round((grams / 100) * calPer100)
    const category = food?.category ?? inferCategory(it.category, it.foodName)
    output.push({ foodName: name, grams, calories, category })
  }
  return output
}

function inferCategory(categoryFromLLM: string | undefined, foodName: string): string {
  if (categoryFromLLM?.trim()) return normalizeToGroup(categoryFromLLM.trim())
  const n = foodName
  if (/(米|面|粉|馍|饼|馒头|包子|饺|粥|土豆|红薯|山药|玉米)/.test(n)) return '主食'
  if (/(菜|瓜|茄|椒|菇|木耳|海带|萝卜|葱|蒜|姜|番茄|黄瓜|苹果|香蕉|橙|梨|葡萄|草莓|西瓜|芒果|桃|柚|猕猴桃|榴莲)/.test(n)) return '蔬果'
  if (/(猪|牛|羊|里脊|排骨|肝|培根|香肠|鸡|鸭|鹅|蛋|鱼|虾|蟹|贝|蛤|鱿|墨鱼|海参|奶|酸奶|芝士|黄油)/.test(n)) return '肉蛋奶'
  if (/(豆|腐竹|豆皮|坚果|核桃|杏仁|腰果|花生|油|糖|蜂蜜|芝麻)/.test(n)) return '豆类坚果'
  return '豆类坚果'
}

function normalizeToGroup(raw: string): string {
  if (/(主食|谷物|薯类)/.test(raw)) return '主食'
  if (/(蔬果|蔬菜|菌菇|水果)/.test(raw)) return '蔬果'
  if (/(肉蛋奶|畜肉|禽肉|水产|奶类)/.test(raw)) return '肉蛋奶'
  if (/(豆类|坚果|油脂|大豆|杂豆)/.test(raw)) return '豆类坚果'
  return raw
}

export function toRecord(item: ParsedDietItem, date: string, meal?: MealType): DietRecord {
  return {
    id: `${date}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    date,
    meal,
    foodName: item.foodName,
    grams: item.grams,
    calories: item.calories,
    category: item.category,
    createdAt: Date.now()
  }
}
