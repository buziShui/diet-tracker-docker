import { useState, useRef, useEffect } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { parseVoiceToDiet, toRecord } from '../api/voiceParser'
import { loadLLMConfig } from '../utils/storage'
import type { DietRecord, MealType } from '../types'
import type { ParsedDietItem } from '../api/voiceParser'
import './VoiceRecorder.css'

function isMobile() {
  return /(iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini)/i.test(navigator.userAgent)
}

interface Props {
  selectedDate: string
  selectedMeal: MealType
  onAdd: (records: DietRecord[]) => void
}

export function VoiceRecorder({ selectedDate, selectedMeal, onAdd }: Props) {
  const isMobileDevice = isMobile()
  const { isListening, transcript, error, start, stop, clearTranscript } = useSpeechRecognition()
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<ParsedDietItem[] | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isMobileDevice) setInputText(transcript)
  }, [transcript, isMobileDevice])

  async function handleConfirm() {
    const text = inputText.trim()
    if (!text || loading) return
    setLoading(true)
    const config = loadLLMConfig()
    try {
      const items = await parseVoiceToDiet(text, selectedDate, config)
      if (items.length > 0) {
        const records = items.map((it) => toRecord(it, selectedDate, selectedMeal))
        onAdd(records)
        setInputText('')
        if (!isMobileDevice) clearTranscript()
        setPreview(null)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handlePreview() {
    const text = inputText.trim()
    if (!text || loading) return
    setLoading(true)
    const config = loadLLMConfig()
    try {
      const items = await parseVoiceToDiet(text, selectedDate, config)
      setPreview(items)
    } finally {
      setLoading(false)
    }
  }

  function focusForVoice() {
    textareaRef.current?.focus()
  }

  return (
    <section className="voice-section">
      {isMobileDevice ? (
        <button
          className="mic-btn"
          type="button"
          onClick={focusForVoice}
          title="唤起键盘，使用输入法麦克风"
        >
          🎤
        </button>
      ) : (
        <button
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); if (!isListening) start() }}
          onMouseUp={() => { if (isListening) stop() }}
          onMouseLeave={() => { if (isListening) stop() }}
          onTouchStart={(e) => { e.preventDefault(); if (!isListening) start() }}
          onTouchEnd={(e) => { e.preventDefault(); if (isListening) stop() }}
          onTouchCancel={() => { if (isListening) stop() }}
          onContextMenu={(e) => e.preventDefault()}
          title="按住说话"
        >
          {isListening ? '⏹' : '🎤'}
        </button>
      )}
      <p>
        {isMobileDevice
          ? '点击麦克风使用输入法语音，或直接输入'
          : isListening
            ? '松手停止'
            : '按住说话 或 直接输入'}
      </p>
      <textarea
        ref={textareaRef}
        className={`transcript-box ${inputText ? 'has-text' : ''}`}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="例如：今天吃了200克米饭、100克鸡胸肉"
        rows={3}
      />
      {!isMobileDevice && error && <p className="voice-error">{error}</p>}
      {inputText.trim() && (
        <div className="confirm-row">
          <button className="btn-cancel" onClick={handlePreview} disabled={loading}>
            {loading ? '解析中…' : '预览'}
          </button>
          <button className="btn-confirm" onClick={handleConfirm} disabled={loading}>
            确认添加
          </button>
        </div>
      )}
      {preview && preview.length > 0 && (
        <div className="preview-list">
          <span className="preview-label">识别结果：</span>
          {preview.map((it, i) => (
            <div key={i} className="preview-item">
              {it.foodName} {it.grams}g ≈ {it.calories} kcal
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
