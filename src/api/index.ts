// 自定义 API 入口：供外部接入大模型或自定义解析逻辑
export { setCustomParseFn, parseWithLLM } from './llm'
export type { ParseFn } from './llm'
export { findFood, getCategories } from './foodDb'
export { parseVoiceToDiet, toRecord } from './voiceParser'
export type { ParsedDietItem } from './voiceParser'
export type { DietRecord, LLMApiConfig, FoodItem, LLMProvider } from '../types'
