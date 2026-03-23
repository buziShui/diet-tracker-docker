import { FOOD_DATABASE } from '../data/foodDatabase'
import { CHINESE_MENU } from '../data/chineseMenuDatabase'
import type { FoodItem } from '../types'
import { loadCustomFoods } from '../utils/storage'

function menuToFoodItem(m: (typeof CHINESE_MENU)[0]): FoodItem {
  const { name, caloriesPer100g, category, aliases } = m
  return { name, caloriesPer100g, category, aliases }
}

/** 基础食材优先，FOOD_DATABASE 仅补充未出现的名称，避免重复 */
const INGREDIENT_ITEMS = CHINESE_MENU.map(menuToFoodItem)
const ingredientNames = new Set(INGREDIENT_ITEMS.map((f) => f.name))
function getAllFoods(): FoodItem[] {
  const builtins: FoodItem[] = [
    ...INGREDIENT_ITEMS,
    ...FOOD_DATABASE.filter((f) => !ingredientNames.has(f.name))
  ]
  const custom = loadCustomFoods()
  const nameSet = new Set(builtins.map((f) => normalize(f.name)))
  for (const c of custom) {
    const k = normalize(c.name)
    if (!nameSet.has(k)) {
      builtins.push(c)
      nameSet.add(k)
    }
  }
  return builtins
}

function normalize(str: string): string {
  return str.replace(/\s/g, '').toLowerCase()
}

function matchScore(query: string, food: FoodItem): number {
  const nq = normalize(query)
  const names = [food.name, ...(food.aliases || [])].map(normalize)
  for (const n of names) {
    if (n === nq) return 100
    if (n.includes(nq) || nq.includes(n)) return 80
    if (nq.includes(n.substring(0, 2))) return 60
  }
  return 0
}

export function findFood(query: string): FoodItem | null {
  const allFoods = getAllFoods()
  let best: FoodItem | null = null
  let bestScore = 0
  for (const food of allFoods) {
    const s = matchScore(query, food)
    if (s > bestScore) {
      bestScore = s
      best = food
    }
  }
  return bestScore >= 60 ? best : null
}

export function getCategories(): string[] {
  const set = new Set(getAllFoods().map((f) => f.category))
  return [...set].sort()
}
