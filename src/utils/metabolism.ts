import type { ActivityLevel, Gender, UserProfile } from '../types'

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
}

/** Mifflin-St Jeor 公式，单位 kcal/天 */
export function calculateBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(gender === 'male' ? base + 5 : base - 161)
}

export function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile.gender, profile.weightKg, profile.heightCm, profile.age)
  const mult = ACTIVITY_MULTIPLIER[profile.activity] ?? 1.2
  return Math.round(bmr * mult)
}

export function getDailyCalorieBudget(profile: UserProfile): number {
  if (profile.manualDailyTarget != null && profile.manualDailyTarget > 0) {
    return Math.round(profile.manualDailyTarget)
  }
  return calculateTDEE(profile)
}

export function sumCaloriesByDate(records: { date: string; calories: number }[], date: string): number {
  return records.filter((r) => r.date === date).reduce((s, r) => s + r.calories, 0)
}

export function getRemainingCalories(
  profile: UserProfile | null,
  records: { date: string; calories: number }[],
  date: string
): { budget: number; consumed: number; remaining: number; bmr: number; tdee: number } | null {
  if (!profile || profile.age <= 0 || profile.heightCm <= 0 || profile.weightKg <= 0) return null
  const bmr = calculateBMR(profile.gender, profile.weightKg, profile.heightCm, profile.age)
  const tdee = calculateTDEE(profile)
  const budget = getDailyCalorieBudget(profile)
  const consumed = sumCaloriesByDate(records, date)
  const remaining = Math.round(budget - consumed)
  return { budget, consumed, remaining, bmr, tdee }
}
