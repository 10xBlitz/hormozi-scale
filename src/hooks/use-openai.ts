'use client'

import { useState } from 'react'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface UseOpenAIOptions {
  model?: string
  max_tokens?: number
  temperature?: number
}

interface UseOpenAIResult {
  messages: Message[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string, systemPrompt?: string) => Promise<string>
  clearMessages: () => void
  addMessage: (role: 'user' | 'assistant', content: string) => void
}

export function useOpenAI(options: UseOpenAIOptions = {}): UseOpenAIResult {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async (content: string, systemPrompt?: string): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      const newMessages: Message[] = [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        ...messages,
        { role: 'user', content }
      ]

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          model: options.model || 'gpt-4o-mini',
          max_tokens: options.max_tokens || 1000,
          temperature: options.temperature || 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response from OpenAI')
      }

      const data = await response.json()
      const assistantMessage = data.content

      // Update messages with both user and assistant messages
      setMessages(prev => [
        ...prev,
        { role: 'user', content },
        { role: 'assistant', content: assistantMessage }
      ])

      return assistantMessage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearMessages = () => {
    setMessages([])
    setError(null)
  }

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content }])
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    addMessage,
  }
}
