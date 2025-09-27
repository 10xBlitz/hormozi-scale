import { callOpenAI } from '@/lib/openai-utils'
import { NextRequest, NextResponse } from 'next/server'

// HubSpot Contact interface
interface HubSpotContact {
  id: string
  properties: {
    email?: string
    firstname?: string
    lastname?: string
    company?: string
    phone?: string
    website?: string
    lifecyclestage?: string
    hs_lead_status?: string
    createdate?: string
    lastmodifieddate?: string
    [key: string]: string | undefined
  }
  createdAt: string
  updatedAt: string
  archived: boolean
}

interface HubSpotContactsResponse {
  results: HubSpotContact[]
  total?: number
  paging?: {
    next?: {
      after: string
      link: string
    }
  }
}


async function fetchAllHubSpotContacts(accessToken?: string): Promise<HubSpotContact[]> {
  const apiKey = process.env.HUBSPOT_API_KEY

  if (!apiKey && !accessToken) {
    throw new Error('HubSpot API key or access token not configured')
  }

  const allContacts: HubSpotContact[] = []
  let after: string | undefined

  do {
    const pageContacts = await fetchHubSpotContactsPage(100, after, accessToken)
    allContacts.push(...pageContacts.contacts)
    after = pageContacts.after
    console.log(`Fetched ${pageContacts.contacts.length} contacts, total so far: ${allContacts.length}`)
  } while (after)

  return allContacts
}

async function fetchHubSpotContactsPage(limit: number = 100, after?: string, accessToken?: string): Promise<{contacts: HubSpotContact[], after?: string}> {
  const apiKey = process.env.HUBSPOT_API_KEY

  if (!apiKey && !accessToken) {
    throw new Error('HubSpot API key or access token not configured')
  }

  // Build URL with pagination
  const baseUrl = `https://api.hubapi.com/crm/v3/objects/contacts?limit=${limit}&properties=email,firstname,lastname,company,phone,website,lifecyclestage,hs_lead_status,createdate,lastmodifieddate`
  const afterParam = after ? `&after=${after}` : ''

  // Try multiple authentication methods
  const configs = []

  // Method 1: OAuth Access Token (for Connected Apps)
  if (accessToken) {
    configs.push({
      url: `${baseUrl}${afterParam}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      } as Record<string, string>
    })
  }

  // Method 2: Bearer token (for Private Apps)
  if (apiKey) {
    configs.push({
      url: `${baseUrl}${afterParam}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      } as Record<string, string>
    })

    // Method 3: Query parameter (legacy API key)
    configs.push({
      url: `${baseUrl}&hapikey=${apiKey}${afterParam}`,
      headers: {
        'Content-Type': 'application/json'
      } as Record<string, string>
    })
  }

  let lastError: Error | null = null

  for (const config of configs) {
    try {
      const response = await fetch(config.url, {
        method: 'GET',
        headers: config.headers
      })

      if (response.ok) {
        const data: HubSpotContactsResponse = await response.json()
        return {
          contacts: data.results || [],
          after: data.paging?.next?.after
        }
      } else {
        const errorText = await response.text()
        lastError = new Error(`HubSpot API error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      continue
    }
  }

  // If all methods failed, throw the last error
  console.error('Error fetching HubSpot contacts:', lastError)
  throw lastError || new Error('Failed to fetch HubSpot contacts with all authentication methods')
}

async function analyzeContactsWithAI(contacts: HubSpotContact[]): Promise<string> {
  if (contacts.length === 0) {
    return "No contacts found to analyze."
  }

  // Prepare contact summary for AI analysis
  const contactSummary = contacts.map(contact => ({
    id: contact.id,
    name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
    email: contact.properties.email,
    company: contact.properties.company,
    lifecycleStage: contact.properties.lifecyclestage,
    createdDate: contact.properties.createdate,
    lastModified: contact.properties.lastmodifieddate
  }))

  const analysisPrompt = `
Analyze this list of ${contacts.length} HubSpot contacts and provide actionable insights for business growth:

CONTACTS SUMMARY:
${JSON.stringify(contactSummary, null, 2)}

Please analyze:
1. **Contact Distribution**: What percentage are in different lifecycle stages?
2. **Growth Trends**: How many new contacts in the last 30/90 days?
3. **Company Insights**: Which companies have multiple contacts?
4. **Engagement Patterns**: Based on lifecycle stages and modification dates
5. **Lead Quality**: Assessment of contact completeness and potential

Provide specific, actionable recommendations for:
- Lead generation strategies
- Customer nurturing campaigns
- Sales follow-up processes
- Marketing automation opportunities
- Data quality improvements

Focus on practical, implementable actions that will drive revenue growth.
`

  try {
    const analysis = await callOpenAI([
      {
        role: 'system',
        content: 'You are a CRM expert and growth strategist. Analyze HubSpot contact data and provide actionable business insights and recommendations.'
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ], {
      model: 'gpt-4o-mini',
      max_tokens: 2000
    })

    return analysis
  } catch (error) {
    console.error('Error analyzing contacts with AI:', error)
    return `Error analyzing contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analyze = searchParams.get('analyze') === 'true'

    // Get OAuth access token from cookies
    const accessToken = request.cookies.get('hubspot_access_token')?.value

    // Fetch ALL contacts
    const contacts = await fetchAllHubSpotContacts(accessToken)
    // Since we're fetching ALL contacts, the total count is just the length
    const totalContacts = contacts.length

    if (analyze) {
      // Analyze ALL contacts with AI and generate insights
      const analysis = await analyzeContactsWithAI(contacts)

      return NextResponse.json({
        success: true,
        contactsCount: contacts.length,
        totalContactsCount: totalContacts,
        contacts, // Return ALL contacts, not just first 10
        analysis,
        timestamp: new Date().toISOString()
      })
    } else {
      // Return ALL contacts
      return NextResponse.json({
        success: true,
        contactsCount: contacts.length,
        totalContactsCount: totalContacts,
        contacts,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('HubSpot contacts API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, contacts } = await request.json()

    if (action === 'analyze') {
      const analysis = await analyzeContactsWithAI(contacts)

      return NextResponse.json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action specified'
    }, { status: 400 })

  } catch (error) {
    console.error('HubSpot contacts POST error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
