'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ContactsDataTable } from '@/components/contacts-data-table'
import { Loader2, TrendingUp, Users } from 'lucide-react'
import { useState } from 'react'

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

interface AnalysisResponse {
  success: boolean
  contactsCount?: number
  totalContactsCount?: number
  contacts?: HubSpotContact[]
  analysis?: string
  error?: string
  timestamp?: string
}

export function HubSpotContactsAnalyzer() {
  const [contacts, setContacts] = useState<HubSpotContact[]>([])
  const [analysis, setAnalysis] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [contactsCount, setContactsCount] = useState<number>(0)
  const [totalContactsCount, setTotalContactsCount] = useState<number>(0)

  const fetchContacts = async (analyze: boolean = false) => {
    setIsLoading(true)
    setError('')
    setContacts([]) // Clear existing contacts while loading

    try {
      const response = await fetch(`/api/hubspot/contacts?analyze=${analyze}`)
      const data: AnalysisResponse = await response.json()

      if (data.success) {
        setContacts(data.contacts || [])
        setContactsCount(data.contactsCount || 0)
        setTotalContactsCount(data.totalContactsCount || 0)

        if (analyze && data.analysis) {
          setAnalysis(data.analysis)
        }
      } else {
        setError(data.error || 'Failed to fetch contacts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            HubSpot Contacts Analyzer
          </CardTitle>
          <CardDescription>
            Fetch and analyze your HubSpot contacts to generate actionable business insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => window.open('/api/auth/hubspot?action=login', '_self')}
              variant="outline"
              className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
            >
              Connect to HubSpot
            </Button>
            <Button
              onClick={() => fetchContacts(false)}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch Contacts
            </Button>
            <Button
              onClick={() => fetchContacts(true)}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <TrendingUp className="mr-2 h-4 w-4" />
              Analyze & Create Action Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-red-600 font-medium">Error: {error}</div>
          </CardContent>
        </Card>
      )}

      {/* Contacts Count */}
      {totalContactsCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-semibold">{totalContactsCount.toLocaleString()}</span>
                <span className="text-gray-600">total contacts in HubSpot</span>
              </div>
              {contactsCount > 0 && contactsCount < totalContactsCount && (
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Showing {contactsCount.toLocaleString()} fetched contacts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Analysis & Action Plan
            </CardTitle>
            <CardDescription>
              AI-powered insights based on your HubSpot contact data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {analysis}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts Data Table */}
      <ContactsDataTable contacts={contacts} isLoading={isLoading} />

      {/* Original Contacts List - Commented out, uncomment if you prefer this format */}
      {/* {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Preview</CardTitle>
            <CardDescription>
              First {contacts.length} contacts from your HubSpot CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {contact.properties.firstname} {contact.properties.lastname}
                        </h4>
                        {contact.properties.lifecyclestage && (
                          <Badge className={getLifecycleBadgeColor(contact.properties.lifecyclestage)}>
                            {contact.properties.lifecyclestage.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        {contact.properties.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {contact.properties.email}
                          </div>
                        )}
                        {contact.properties.company && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {contact.properties.company}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        Created: {formatDate(contact.properties.createdate)} |
                        Last Modified: {formatDate(contact.properties.lastmodifieddate)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Setup Instructions */}
      {!contacts.length && !error && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Setup Required</CardTitle>
            <CardDescription className="text-blue-700">
              To use HubSpot integration, you need to add your HubSpot API key
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-blue-800">
              <p>1. Go to <a href="https://app.hubspot.com/api-key" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">HubSpot API Keys</a></p>
              <p>2. Generate a new API key or copy your existing one</p>
              <p>3. Add it to your <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code> file:</p>
              <pre className="bg-blue-100 p-3 rounded text-xs">
                HUBSPOT_API_KEY=your-hubspot-api-key-here
              </pre>
              <p>4. Restart your development server</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

