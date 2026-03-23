import type { DietRecord, FoodItem, LLMApiConfig, UserProfile } from '../types'

const RECORDS_KEY = 'diet-records'
const CONFIG_KEY = 'diet-llm-config'
const PROFILE_KEY = 'diet-user-profile'
const CUSTOM_FOODS_KEY = 'diet-custom-foods'
const SERVER_STATE_ENDPOINT = '/api/state'

export function loadRecords(): DietRecord[] {
  try {
    const s = localStorage.getItem(RECORDS_KEY)
    return s ? JSON.parse(s) : []
  } catch {
    return []
  }
}

export function saveRecords(records: DietRecord[]) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
  void syncToServer()
}

function migrateLegacyConfig(s: string): LLMApiConfig | null {
  try {
    const raw = JSON.parse(s)
    if (raw.endpoint && !raw.baseUrl) {
      const url = raw.endpoint
      const base = url.replace(/\/(audio\/transcriptions|chat\/completions).*$/, '').replace(/\/$/, '')
      return {
        enabled: raw.enabled ?? false,
        provider: 'openai',
        baseUrl: base || 'https://api.openai.com/v1',
        apiKey: raw.apiKey ?? '',
        model: raw.model ?? 'gpt-3.5-turbo'
      }
    }
    if (!raw.provider && raw.baseUrl) {
      return { ...raw, provider: raw.provider || 'openai' }
    }
    return null
  } catch {
    return null
  }
}

export function loadLLMConfig(): LLMApiConfig {
  try {
    const s = localStorage.getItem(CONFIG_KEY)
    if (s) {
      const migrated = migrateLegacyConfig(s)
      if (migrated) return migrated
      const parsed = JSON.parse(s)
      if (!parsed.provider) parsed.provider = 'openai'
      return parsed
    }
  } catch {}
  return {
    enabled: false,
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo'
  }
}

export function saveLLMConfig(config: LLMApiConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  void syncToServer()
}

export function loadUserProfile(): UserProfile | null {
  try {
    const s = localStorage.getItem(PROFILE_KEY)
    if (!s) return null
    const p = JSON.parse(s) as UserProfile
    if (
      typeof p.age !== 'number' ||
      typeof p.heightCm !== 'number' ||
      typeof p.weightKg !== 'number' ||
      p.age < 1 ||
      p.heightCm < 50 ||
      p.weightKg < 20
    )
      return null
    const gender = p.gender === 'female' ? 'female' : 'male'
    const activity = p.activity || 'light'
    return { ...p, gender, activity }
  } catch {
    return null
  }
}

export function saveUserProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  void syncToServer()
}

function normalizeFoodName(name: string): string {
  return name.replace(/\s/g, '').toLowerCase()
}

export function loadCustomFoods(): FoodItem[] {
  try {
    const s = localStorage.getItem(CUSTOM_FOODS_KEY)
    if (!s) return []
    const arr = JSON.parse(s) as FoodItem[]
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (x) =>
        x &&
        typeof x.name === 'string' &&
        typeof x.caloriesPer100g === 'number' &&
        typeof x.category === 'string'
    )
  } catch {
    return []
  }
}

export function saveCustomFoods(items: FoodItem[]) {
  localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(items))
  void syncToServer()
}

export function upsertCustomFood(item: FoodItem) {
  const all = loadCustomFoods()
  const key = normalizeFoodName(item.name)
  const idx = all.findIndex((f) => normalizeFoodName(f.name) === key)
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      ...item,
      caloriesPer100g:
        item.caloriesPer100g > 0 ? item.caloriesPer100g : all[idx].caloriesPer100g || 100,
      category: item.category || all[idx].category || '智能新增'
    }
  } else {
    all.push({
      name: item.name,
      caloriesPer100g: item.caloriesPer100g > 0 ? item.caloriesPer100g : 100,
      category: item.category || '智能新增',
      aliases: item.aliases || []
    })
  }
  saveCustomFoods(all)
}

interface ServerState {
  records: DietRecord[]
  llmConfig: LLMApiConfig
  profile: UserProfile | null
  customFoods: FoodItem[]
}

function loadLocalState(): ServerState {
  return {
    records: loadRecords(),
    llmConfig: loadLLMConfig(),
    profile: loadUserProfile(),
    customFoods: loadCustomFoods()
  }
}

export async function syncFromServer() {
  try {
    const res = await fetch(SERVER_STATE_ENDPOINT, { method: 'GET' })
    if (!res.ok) return
    const data = (await res.json()) as Partial<ServerState>
    if (Array.isArray(data.records)) {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(data.records))
    }
    if (data.llmConfig && typeof data.llmConfig === 'object') {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(data.llmConfig))
    }
    if (data.profile === null || typeof data.profile === 'object') {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile))
    }
    if (Array.isArray(data.customFoods)) {
      localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(data.customFoods))
    }
  } catch {
    // Ignore network errors and keep local mode.
  }
}

export async function syncToServer() {
  try {
    await fetch(SERVER_STATE_ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loadLocalState())
    })
  } catch {
    // Ignore network errors and keep local mode.
  }
}
