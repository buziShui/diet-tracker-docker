import { useState, useEffect } from 'react'
import type { ActivityLevel, Gender, UserProfile } from '../types'
import { calculateBMR, calculateTDEE } from '../utils/metabolism'
import './BodyProfile.css'

const ACTIVITY_LABELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: '久坐（办公室）' },
  { value: 'light', label: '轻度活动' },
  { value: 'moderate', label: '中度活动' },
  { value: 'active', label: '高度活动' },
  { value: 'very_active', label: '极高活动' }
]

interface Props {
  open: boolean
  onClose: () => void
  profile: UserProfile | null
  onSave: (p: UserProfile) => void
}

const defaultProfile: UserProfile = {
  gender: 'male',
  age: 30,
  heightCm: 170,
  weightKg: 65,
  activity: 'light',
  manualDailyTarget: undefined
}

export function BodyProfile({ open, onClose, profile, onSave }: Props) {
  const [form, setForm] = useState<UserProfile>(profile ?? defaultProfile)
  const [useManual, setUseManual] = useState(!!profile?.manualDailyTarget)

  useEffect(() => {
    if (open) {
      setForm(profile ?? defaultProfile)
      setUseManual(!!profile?.manualDailyTarget)
    }
  }, [open, profile])

  if (!open) return null

  const bmr =
    form.age > 0 && form.heightCm > 0 && form.weightKg > 0
      ? calculateBMR(form.gender, form.weightKg, form.heightCm, form.age)
      : 0
  const tdee =
    form.age > 0 && form.heightCm > 0 && form.weightKg > 0 ? calculateTDEE(form) : 0

  function handleSave() {
    const p: UserProfile = {
      ...form,
      manualDailyTarget: useManual && form.manualDailyTarget && form.manualDailyTarget > 0
        ? form.manualDailyTarget
        : undefined
    }
    onSave(p)
    onClose()
  }

  return (
    <div className="body-profile-overlay" onClick={onClose}>
      <div className="body-profile-inner" onClick={(e) => e.stopPropagation()}>
        <h2>身体与热量</h2>
        <p className="body-profile-desc">
          用于估算基础代谢（Mifflin-St Jeor）与每日消耗（TDEE）。仅供参考。
        </p>

        <div className="form-row">
          <label>性别</label>
          <div className="seg">
            <button
              type="button"
              className={form.gender === 'male' ? 'on' : ''}
              onClick={() => setForm((f) => ({ ...f, gender: 'male' as Gender }))}
            >
              男
            </button>
            <button
              type="button"
              className={form.gender === 'female' ? 'on' : ''}
              onClick={() => setForm((f) => ({ ...f, gender: 'female' as Gender }))}
            >
              女
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>年龄（岁）</label>
          <input
            type="number"
            min={1}
            max={120}
            value={form.age || ''}
            onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))}
          />
        </div>
        <div className="form-group">
          <label>身高（cm）</label>
          <input
            type="number"
            min={50}
            max={250}
            value={form.heightCm || ''}
            onChange={(e) => setForm((f) => ({ ...f, heightCm: Number(e.target.value) }))}
          />
        </div>
        <div className="form-group">
          <label>体重（kg）</label>
          <input
            type="number"
            min={20}
            max={300}
            step={0.1}
            value={form.weightKg || ''}
            onChange={(e) => setForm((f) => ({ ...f, weightKg: Number(e.target.value) }))}
          />
        </div>

        <div className="form-group">
          <label>日常活动量</label>
          <select
            value={form.activity}
            onChange={(e) =>
              setForm((f) => ({ ...f, activity: e.target.value as ActivityLevel }))
            }
          >
            {ACTIVITY_LABELS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {bmr > 0 && (
          <div className="metabolism-summary">
            <div>基础代谢 BMR：<strong>{bmr}</strong> kcal/天</div>
            <div>估算消耗 TDEE：<strong>{tdee}</strong> kcal/天</div>
          </div>
        )}

        <div className="form-row toggle-manual">
          <label>
            <input
              type="checkbox"
              checked={useManual}
              onChange={(e) => setUseManual(e.target.checked)}
            />
            手动设定每日摄入目标
          </label>
        </div>
        {useManual && (
          <div className="form-group">
            <label>每日目标（kcal）</label>
            <input
              type="number"
              min={800}
              max={6000}
              placeholder={`默认与 TDEE 相同：${tdee || '—'}`}
              value={form.manualDailyTarget ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  manualDailyTarget: e.target.value ? Number(e.target.value) : undefined
                }))
              }
            />
          </div>
        )}

        <div className="body-profile-actions">
          <button type="button" className="btn-outline" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
