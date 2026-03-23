import type { LLMApiConfig, LLMProvider } from '../types'

export const PROVIDER_DEFAULTS: Record<LLMProvider, { baseUrl: string; model: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-3.5-turbo' },
  dashscope: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  moonshot: { baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  doubao: { baseUrl: 'https://api.doubao-ai.com/v1', model: 'doubao-pro-32k' },
  wenxin: { baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop', model: 'ernie-4.0-turbo' },
  xunfei: { baseUrl: 'https://spark-api-open.xf-yun.com/v1', model: 'general' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  hunyuan: { baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1', model: 'hunyuan-lite' },
  minimax: { baseUrl: 'https://api.minimax.chat/v1', model: 'abab6.5s-chat' },
  lingyi: { baseUrl: 'https://api.lingyiwanwu.com/v1', model: 'yi-large' },
  baichuan: { baseUrl: 'https://api.baichuan-ai.com/v1', model: 'Baichuan4' },
  custom: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-3.5-turbo' }
}

export function buildChatRequest(
  messages: { role: string; content: string }[],
  config: LLMApiConfig
): Record<string, unknown> {
  const model = config.model || PROVIDER_DEFAULTS[config.provider]?.model || 'gpt-3.5-turbo'
  if (config.provider === 'dashscope') {
    return {
      model,
      input: { messages }
    }
  }
  return {
    model,
    messages
  }
}

/** 从多种 API 响应格式中提取 content */
export function extractContent(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const get = (obj: unknown, ...keys: string[]): unknown => {
    let cur: unknown = obj
    for (const k of keys) {
      if (cur == null || typeof cur !== 'object') return undefined
      cur = (cur as Record<string, unknown>)[k]
    }
    return cur
  }
  const candidates = [
    get(d, 'choices', '0', 'message', 'content'),
    get(d, 'output', 'text'),
    get(d, 'output', 'choices', '0', 'message', 'content'),
    get(d, 'result'),
    get(d, 'data', 'choices', '0', 'message', 'content'),
    get(d, 'data', 'text')
  ]
  for (const v of candidates) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}
