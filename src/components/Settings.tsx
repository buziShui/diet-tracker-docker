import { useState, useEffect } from 'react'
import { loadLLMConfig, saveLLMConfig } from '../utils/storage'
import { PROVIDER_DEFAULTS } from '../api/llm-adapters'
import type { LLMApiConfig, LLMProvider } from '../types'
import './Settings.css'

const PROVIDER_OPTIONS: { value: LLMProvider; label: string }[] = [
  { value: 'openai', label: 'OpenAI / One-API / OpenRouter' },
  { value: 'dashscope', label: '阿里 通义千问' },
  { value: 'zhipu', label: '智谱 ChatGLM' },
  { value: 'moonshot', label: '月之暗面 Kimi' },
  { value: 'doubao', label: '字节 豆包' },
  { value: 'wenxin', label: '百度 文心一言' },
  { value: 'xunfei', label: '讯飞 星火' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'hunyuan', label: '腾讯 混元' },
  { value: 'minimax', label: 'MiniMax' },
  { value: 'lingyi', label: '零一万物 Yi' },
  { value: 'baichuan', label: '百川智能' },
  { value: 'custom', label: '自定义' }
]

interface Props {
  open: boolean
  onClose: () => void
}

export function Settings({ open, onClose }: Props) {
  const [config, setConfig] = useState<LLMApiConfig>(loadLLMConfig())

  useEffect(() => {
    if (open) setConfig(loadLLMConfig())
  }, [open])

  function handleProviderChange(provider: LLMProvider) {
    const def = PROVIDER_DEFAULTS[provider]
    setConfig((c) => ({
      ...c,
      provider,
      baseUrl: provider === 'custom' ? c.baseUrl : def.baseUrl,
      model: provider === 'custom' ? c.model : def.model
    }))
  }

  function handleSave() {
    saveLLMConfig(config)
    onClose()
  }

  if (!open) return null

  return (
    <div className="settings-panel" onClick={onClose}>
      <div className="settings-inner" onClick={(e) => e.stopPropagation()}>
        <h2>大模型 API</h2>
        <p className="settings-desc">
          API 仅用于对话框文本解析。语音识别由浏览器原生能力处理。
        </p>
        <div className="toggle-row">
          <span>启用以大模型识别</span>
          <button
            className={`toggle ${config.enabled ? 'on' : ''}`}
            type="button"
            onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
          />
        </div>
        <div className="form-group">
          <label>服务商</label>
          <select
            value={config.provider || 'openai'}
            onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
            className="settings-select"
          >
            {PROVIDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>API 基础地址</label>
          <input
            type="url"
            placeholder="https://api.openai.com/v1"
            value={config.baseUrl}
            onChange={(e) => setConfig((c) => ({ ...c, baseUrl: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>API Key</label>
          <input
            type="password"
            placeholder="sk-... 或各平台 Key"
            value={config.apiKey || ''}
            onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>模型</label>
          <input
            type="text"
            placeholder="gpt-3.5-turbo"
            value={config.model || ''}
            onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}
          />
        </div>
        <div className="settings-actions">
          <button className="btn-close" onClick={onClose}>取消</button>
          <button className="btn-save" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  )
}
