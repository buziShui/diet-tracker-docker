import type { LLMApiConfig } from '../types'

function transcriptionEndpoint(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '')
  return base.includes('/audio/transcriptions') ? base : `${base}/audio/transcriptions`
}

function getExtFromMime(mime: string): string {
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a'
  if (mime.includes('mp3') || mime.includes('mpeg')) return 'mp3'
  if (mime.includes('wav')) return 'wav'
  return 'webm'
}

function parseTranscriptResponse(res: Response, body: string): string | null {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('text/plain')) return body.trim() || null
  try {
    const data = JSON.parse(body)
    const text = data?.text ?? data?.transcript ?? data?.data?.text
    return typeof text === 'string' ? text.trim() : null
  } catch {
    return body.trim() || null
  }
}

/**
 * 调用 Whisper 兼容 API 进行语音转文字
 * OpenAI: POST /v1/audio/transcriptions, multipart: file, model=whisper-1
 */
export async function transcribeWithWhisper(
  audioBlob: Blob,
  config: LLMApiConfig
): Promise<{ text: string | null; error?: string }> {
  if (!config.enabled || !config.baseUrl?.trim()) {
    return { text: null, error: '未配置 API' }
  }
  if (audioBlob.size < 500) {
    return { text: null, error: '录音太短，请至少说 1 秒' }
  }
  try {
    const mime = audioBlob.type || 'audio/webm'
    const ext = getExtFromMime(mime)
    const form = new FormData()
    form.append('file', audioBlob, `audio.${ext}`)
    form.append('model', 'whisper-1')
    form.append('language', 'zh')

    const headers: Record<string, string> = {}
    if (config.apiKey?.trim()) {
      headers['Authorization'] = `Bearer ${config.apiKey.trim()}`
    }

    const res = await fetch(transcriptionEndpoint(config.baseUrl.trim()), {
      method: 'POST',
      headers,
      body: form
    })
    const bodyText = await res.text()
    if (!res.ok) {
      const errMsg = bodyText ? bodyText.slice(0, 200) : `HTTP ${res.status}`
      return { text: null, error: `API 错误: ${errMsg}` }
    }
    const text = parseTranscriptResponse(res, bodyText)
    return { text }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { text: null, error: msg.includes('fetch') ? '网络请求失败，请检查 API 地址' : msg }
  }
}
