import { config } from '../config'
import type {
  AnalyzeTaskResult,
  ChatMessage,
  GeneratedSubtask,
} from '../lib/ai-common'
import * as gemini from './geminiService'
import * as openai from './openaiService'

export type { AnalyzeTaskResult, ChatMessage, GeneratedSubtask }

function useOpenAi(): boolean {
  return config.ai.provider === 'openai'
}

export async function generateBriefing(
  language: string,
  context: string,
  apiKey?: string,
): Promise<string> {
  if (useOpenAi()) return openai.generateBriefing(language, context, apiKey)
  return gemini.generateBriefing(language, context, apiKey)
}

export async function analyzeTask(
  language: string,
  text: string,
  apiKey?: string,
): Promise<AnalyzeTaskResult> {
  if (useOpenAi()) return openai.analyzeTask(language, text, apiKey)
  return gemini.analyzeTask(language, text, apiKey)
}

export async function generateSubtasks(
  language: string,
  title: string,
  description: string | null | undefined,
  apiKey?: string,
): Promise<GeneratedSubtask[]> {
  if (useOpenAi()) return openai.generateSubtasks(language, title, description, apiKey)
  return gemini.generateSubtasks(language, title, description, apiKey)
}

export async function chat(
  language: string,
  messages: ChatMessage[],
  thinkingMode: boolean,
  searchGrounding: boolean,
  apiKey?: string,
): Promise<string> {
  if (useOpenAi()) {
    return openai.chat(language, messages, thinkingMode, searchGrounding, apiKey)
  }
  return gemini.chat(language, messages, thinkingMode, searchGrounding, apiKey)
}
