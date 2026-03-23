import { useState, useMemo, useEffect } from 'react'
import { CHINESE_MENU } from '../data/chineseMenuDatabase'
import type { ChineseMenuItem, DietRecord, MealType } from '../types'
import { loadCustomFoods } from '../utils/storage'
import './MenuPicker.css'

interface Props {
  open: boolean
  onClose: () => void
  selectedDate: string
  selectedMeal: MealType
  onAdd: (records: DietRecord[]) => void
}

function toRecord(item: ChineseMenuItem, grams: number, date: string, meal: MealType): DietRecord {
  const calories = Math.round((grams / 100) * item.caloriesPer100g)
  return {
    id: `${date}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    date,
    meal,
    foodName: item.name,
    grams,
    calories,
    category: item.category,
    createdAt: Date.now()
  }
}

const GROUP_ORDER = ['主食', '蔬果', '肉蛋奶', '豆类坚果']

function toGroupCategory(raw: string): string {
  if (/(谷物|薯类)/.test(raw)) return '主食'
  if (/(蔬菜|菌菇|水果)/.test(raw)) return '蔬果'
  if (/(畜肉|禽肉蛋类|水产|奶类)/.test(raw)) return '肉蛋奶'
  if (/(杂豆|大豆|坚果|油脂)/.test(raw)) return '豆类坚果'
  return '豆类坚果'
}

export function MenuPicker({ open, onClose, selectedDate, selectedMeal, onAdd }: Props) {
  const allIngredients = useMemo(() => {
    const custom = loadCustomFoods().map<ChineseMenuItem>((f) => ({
      name: f.name,
      caloriesPer100g: f.caloriesPer100g,
      category: toGroupCategory(f.category || '豆类坚果'),
      suggestedGrams: 100,
      aliases: f.aliases
    }))
    const baseMenu = CHINESE_MENU.map((i) => ({ ...i, category: toGroupCategory(i.category) }))
    const set = new Set(baseMenu.map((i) => i.name))
    const merged = [...baseMenu]
    for (const c of custom) {
      if (!set.has(c.name)) {
        merged.push(c)
        set.add(c.name)
      }
    }
    return merged
  }, [open])

  const categories = useMemo(() => {
    const set = new Set(allIngredients.map((i) => i.category))
    const extra = [...set].filter((c) => !GROUP_ORDER.includes(c)).sort()
    return [...GROUP_ORDER.filter((c) => set.has(c)), ...extra]
  }, [allIngredients])
  const [cat, setCat] = useState(categories[0] || '')
  const [search, setSearch] = useState('')
  const [pick, setPick] = useState<ChineseMenuItem | null>(null)
  const [grams, setGrams] = useState(200)

  useEffect(() => {
    if (!categories.length) return
    if (!cat || !categories.includes(cat)) setCat(categories[0])
  }, [categories, cat])

  const filtered = useMemo(() => {
    let list = allIngredients.filter((i) => i.category === cat)
    const q = search.trim().toLowerCase()
    if (q) {
      list = allIngredients.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.aliases?.some((a) => a.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  }, [allIngredients, cat, search])

  if (!open) return null

  function openPick(item: ChineseMenuItem) {
    setPick(item)
    setGrams(item.suggestedGrams ?? 200)
  }

  function handleAdd() {
    if (!pick) return
    const g = Math.max(1, Math.min(5000, grams))
    onAdd([toRecord(pick, g, selectedDate, selectedMeal)])
    setPick(null)
    onClose()
  }

  const previewKcal = pick ? Math.round((grams / 100) * pick.caloriesPer100g) : 0

  return (
    <div className="menu-picker-overlay" onClick={onClose}>
      <div className="menu-picker-panel" onClick={(e) => e.stopPropagation()}>
        <div className="menu-picker-head">
          <h2>基础食材</h2>
          <button type="button" className="menu-picker-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <input
          type="search"
          className="menu-search"
          placeholder="搜索食材名…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!search.trim() && (
          <div className="menu-cats">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={c === cat ? 'active' : ''}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="menu-list">
          {filtered.map((item) => (
            <button
              key={item.name + item.category}
              type="button"
              className="menu-item"
              onClick={() => openPick(item)}
            >
              <span>{item.name}</span>
              <span className="menu-item-meta">
                约 {item.caloriesPer100g} kcal/100g
              </span>
            </button>
          ))}
          {filtered.length === 0 && <p className="menu-empty">无匹配菜品</p>}
        </div>

        {pick && (
          <div className="menu-grams-sheet">
            <div className="menu-grams-inner">
              <h3>{pick.name}</h3>
              <p className="menu-grams-hint">参考 {pick.caloriesPer100g} kcal/100g</p>
              <label>
                克数（g）
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={grams}
                  onChange={(e) => setGrams(Number(e.target.value) || 0)}
                />
              </label>
              <p className="menu-grams-preview">约 {previewKcal} kcal</p>
              <div className="menu-grams-actions">
                <button type="button" className="btn-outline" onClick={() => setPick(null)}>
                  取消
                </button>
                <button type="button" className="btn-primary" onClick={handleAdd}>
                  加入记录
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
