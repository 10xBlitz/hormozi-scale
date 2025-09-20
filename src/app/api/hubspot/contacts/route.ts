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
  paging?: {
    next?: {
      after: string
      link: string
    }
  }
}

async function fetchHubSpotContacts(limit: number = 100): Promise<HubSpotContact[]> {
  const apiKey = process.env.HUBSPOT_API_KEY

  if (!apiKey) {
    throw new Error('HubSpot API key not configured')
  }

  const url = `https://api.hubapi.com/crm/v3/objects/contacts?limit=${limit}&properties=email,firstname,lastname,company,phone,website,lifecyclestage,createdate,lastmodifieddate`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HubSpot API error: ${response.status} - ${errorText}`)
    }

    const data: HubSpotContactsResponse = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Error fetching HubSpot contacts:', error)
    throw error
  }
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
    const limit = parseInt(searchParams.get('limit') || '100')
    const analyze = searchParams.get('analyze') === 'true'

    // Fetch contacts from HubSpot
    const contacts = await fetchHubSpotContacts(limit)

    if (analyze) {
      // Analyze contacts with AI and generate insights
      const analysis = await analyzeContactsWithAI(contacts)

      return NextResponse.json({
        success: true,
        contactsCount: contacts.length,
        contacts: contacts.slice(0, 10), // Return first 10 contacts for preview
        analysis,
        timestamp: new Date().toISOString()
      })
    } else {
      // Just return the contacts
      return NextResponse.json({
        success: true,
        contactsCount: contacts.length,
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
