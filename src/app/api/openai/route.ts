import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type {
  ChatCompletion,
  ChatCompletionMessageParam
} from 'openai/resources/chat/completions'

interface OpenAIError {
  status?: number
  code?: string
  headers?: Record<string, string>
  message?: string
}

// Type for the OpenAI API response
interface OpenAIResponse {
  content: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  model?: string
  finish_reason?: string
}

// Type for the API request body
interface OpenAIRequest {
  messages: ChatCompletionMessageParam[]
  model?: string
  max_tokens?: number
  temperature?: number
}

const openai = new OpenAI({
  apiKey: 'REMOVED_FOR_SECURITY',
})

// Simple rate limiting (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute

function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const clientData = requestCounts.get(clientId)

  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  clientData.count++
  return true
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper function to safely extract message content from ChatCompletion
function extractMessageContent(completion: ChatCompletion): string {
  try {
    const choice = completion.choices?.[0]
    if (!choice) {
      return 'No response generated'
    }

    const message = choice.message
    if (!message) {
      return 'No message in response'
    }

    // Handle different message types
    if (typeof message.content === 'string') {
      return message.content
    }

    // Handle function call responses (if any)
    if (message.function_call) {
      return `Function call: ${message.function_call.name} with arguments ${message.function_call.arguments}`
    }

    // Handle tool calls (if any)
    if (message.tool_calls && message.tool_calls.length > 0) {
      return `Tool calls: ${message.tool_calls.map(call => 'function' in call ? call.function.name : 'Unknown tool').join(', ')}`
    }

    return 'Response received but content format not recognized'
  } catch (error) {
    console.error('Error extracting message content:', error)
    return 'Error processing response'
  }
}

async function callOpenAIWithRetry(
  messages: ChatCompletionMessageParam[],
  model: string,
  maxTokens: number,
  temperature: number,
  maxRetries = 3
): Promise<ChatCompletion> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      })
      return completion
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`OpenAI API error (attempt ${attempt}/${maxRetries}):`, errorMessage)

      // Check if it's a rate limit or quota error
      const isOpenAIError = error && typeof error === 'object' && ('status' in error || 'code' in error)
      const openaiError = isOpenAIError ? (error as OpenAIError) : null
      const errorStatus = openaiError?.status

      if (errorStatus === 429) {
        if (attempt === maxRetries) {
          throw error // Re-throw on final attempt
        }

        // Extract retry-after header if available
        const retryAfter = openaiError?.headers?.['retry-after']
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000 // Exponential backoff

        console.log(`Rate limited. Waiting ${waitTime}ms before retry...`)
        await sleep(waitTime)
        continue
      }

      // For other errors, don't retry
      throw error
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('All retry attempts failed')
}

export async function POST(request: NextRequest) {
  try {
    const requestBody: OpenAIRequest = await request.json()
    const { messages, model = 'gpt-4o-mini', max_tokens = 10000, temperature = 0.7 } = requestBody

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Simple rate limiting based on IP
    const clientId = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown-client'

    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before making another request.',
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString()
          }
        }
      )
    }

    const completion = await callOpenAIWithRetry(messages, model, max_tokens, temperature)

    // Safely extract the response content
    const response: OpenAIResponse = {
      content: extractMessageContent(completion),
      usage: completion.usage,
      model: completion.model,
      finish_reason: completion.choices[0]?.finish_reason
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('OpenAI API error:', errorMessage)

    // Handle specific error types
    const isOpenAIError = error && typeof error === 'object' && ('status' in error || 'code' in error)
    const openaiError = isOpenAIError ? (error as OpenAIError) : null
    const errorStatus = openaiError?.status
    const errorCode = openaiError?.code

    if (errorStatus === 429) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again in a few minutes.',
          type: 'rate_limit'
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60' // Suggest waiting 60 seconds
          }
        }
      )
    }

    if (errorStatus === 401) {
      return NextResponse.json(
        {
          error: 'Invalid API key. Please check your OpenAI API key configuration.',
          type: 'invalid_api_key'
        },
        { status: 401 }
      )
    }

    if (errorCode === 'insufficient_quota') {
      return NextResponse.json(
        {
          error: 'OpenAI quota exceeded. Please add credits to your OpenAI account.',
          type: 'insufficient_quota'
        },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'OpenAI API endpoint is ready',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']
  })
}
