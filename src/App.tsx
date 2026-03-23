import { useState, useCallback, useEffect, useMemo } from 'react'
import { VoiceRecorder } from './components/VoiceRecorder'
import { DietList } from './components/DietList'
import { Settings } from './components/Settings'
import { MenuPicker } from './components/MenuPicker'
import { BodyProfile } from './components/BodyProfile'
import {
  loadRecords,
  saveRecords,
  loadUserProfile,
  saveUserProfile,
  syncFromServer
} from './utils/storage'
import { getRemainingCalories } from './utils/metabolism'
import type { DietRecord, MealType, UserProfile } from './types'
import './App.css'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function App() {
  const [records, setRecords] = useState<DietRecord[]>(loadRecords)
  const [profile, setProfile] = useState<UserProfile | null>(() => loadUserProfile())
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedMeal, setSelectedMeal] = useState<MealType>('dinner')
  const [showSettings, setShowSettings] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showBody, setShowBody] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      await syncFromServer()
      if (cancelled) return
      setRecords(loadRecords())
      setProfile(loadUserProfile())
      setHydrated(true)
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveRecords(records)
  }, [records, hydrated])

  useEffect(() => {
    if (!hydrated) return
    if (profile) saveUserProfile(profile)
  }, [profile, hydrated])

  const calorieStats = useMemo(
    () => getRemainingCalories(profile, records, selectedDate),
    [profile, records, selectedDate]
  )

  const addRecords = useCallback((newOnes: DietRecord[]) => {
    setRecords((prev) => [...prev, ...newOnes])
  }, [])

  const deleteRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }, [])

  function changeDate(delta: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  return (
    <div className="app">
      <header className="header">
        <h1>饮食记录</h1>
        <div className="header-actions">
          <button
            className={selectedDate === todayStr() ? 'active' : ''}
            onClick={() => setSelectedDate(todayStr())}
          >
            今天
          </button>
          <button onClick={() => setShowMenu(true)}>食材</button>
          <button onClick={() => setShowBody(true)}>身体数据</button>
          <button onClick={() => setShowSettings(true)}>API</button>
        </div>
      </header>

      {calorieStats && (
        <div className="calorie-bar">
          <div className="calorie-bar-row">
            <span>BMR {calorieStats.bmr}</span>
            <span>TDEE {calorieStats.tdee}</span>
            <span>目标 {calorieStats.budget}</span>
          </div>
          <div className="calorie-bar-main">
            <span>
              {selectedDate === todayStr() ? '今日' : '当日'}已摄入{' '}
              <strong>{calorieStats.consumed}</strong> kcal
            </span>
            <span className={calorieStats.remaining < 0 ? 'over' : ''}>
              还可摄入 <strong>{calorieStats.remaining}</strong> kcal
            </span>
          </div>
        </div>
      )}
      {!calorieStats && (
        <button type="button" className="calorie-hint" onClick={() => setShowBody(true)}>
          填写身高、体重、年龄以计算基础代谢与剩余热量
        </button>
      )}

      <div className="date-nav">
        <button type="button" onClick={() => changeDate(-1)}>‹</button>
        <span>{selectedDate}</span>
        <button type="button" onClick={() => changeDate(1)}>›</button>
      </div>

      <div className="meal-tabs">
        <button
          type="button"
          className={selectedMeal === 'breakfast' ? 'active' : ''}
          onClick={() => setSelectedMeal('breakfast')}
        >
          早餐
        </button>
        <button
          type="button"
          className={selectedMeal === 'lunch' ? 'active' : ''}
          onClick={() => setSelectedMeal('lunch')}
        >
          午餐
        </button>
        <button
          type="button"
          className={selectedMeal === 'dinner' ? 'active' : ''}
          onClick={() => setSelectedMeal('dinner')}
        >
          晚餐
        </button>
      </div>

      <VoiceRecorder selectedDate={selectedDate} selectedMeal={selectedMeal} onAdd={addRecords} />

      <DietList
        records={records.filter((r) => r.date === selectedDate)}
        onDelete={deleteRecord}
      />

      <Settings open={showSettings} onClose={() => setShowSettings(false)} />
      <MenuPicker
        open={showMenu}
        onClose={() => setShowMenu(false)}
        selectedDate={selectedDate}
        selectedMeal={selectedMeal}
        onAdd={addRecords}
      />
      <BodyProfile
        open={showBody}
        onClose={() => setShowBody(false)}
        profile={profile}
        onSave={setProfile}
      />
    </div>
  )
}
