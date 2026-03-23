import type { DietRecord } from '../types'
import './DietList.css'

interface Props {
  records: DietRecord[]
  onDelete: (id: string) => void
}

export function DietList({ records, onDelete }: Props) {
  const byDate = records.reduce<Record<string, DietRecord[]>>((acc, r) => {
    if (!acc[r.date]) acc[r.date] = []
    acc[r.date].push(r)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  if (records.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">🍽️</div>
        <p>还没有记录</p>
        <p>点击麦克风开始语音记录</p>
      </div>
    )
  }

  return (
    <section className="records-section">
      {dates.map((date) => (
        <div key={date} className="day-group">
          <h2>{formatDate(date)}</h2>
          <div className="record-list">
            {byDate[date]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((r) => (
                <div key={r.id} className="record-card">
                  <div className="record-info">
                    <h3>{r.foodName}</h3>
                    <span>{formatMeal(r.meal)} · {r.category}</span>
                  </div>
                  <div className="record-meta">
                    <div className="cal">{r.calories} kcal</div>
                    <div className="grams">{r.grams} g</div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => onDelete(r.id)}
                    type="button"
                    title="删除"
                  >
                    删除
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function formatDate(s: string): string {
  const d = new Date(s)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (s === today.toISOString().slice(0, 10)) return '今天'
  if (s === yesterday.toISOString().slice(0, 10)) return '昨天'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function formatMeal(meal?: DietRecord['meal']): string {
  if (meal === 'breakfast') return '早餐'
  if (meal === 'lunch') return '午餐'
  if (meal === 'dinner') return '晚餐'
  return '未分餐'
}
