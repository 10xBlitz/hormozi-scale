'use client'

import { useState, useEffect } from 'react'
import { Search, User, Building2, Phone, Mail, Calendar, Loader2 } from 'lucide-react'

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
  }
  createdAt: string
  updatedAt: string
  archived: boolean
}

interface HubSpotContactsTableProps {
  refreshKey: number
}

export function HubSpotContactsTable({ refreshKey }: HubSpotContactsTableProps) {
  const [contacts, setContacts] = useState<HubSpotContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all')
  const [totalContacts, setTotalContacts] = useState(0)

  const fetchContacts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/hubspot/contacts')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contacts')
      }

      if (data.success) {
        setContacts(data.contacts || [])
        setTotalContacts(data.totalContactsCount || data.contactsCount || 0)
      } else {
        throw new Error(data.error || 'Failed to fetch contacts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [refreshKey])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const getLifecycleStageColor = (stage?: string) => {
    const colors: Record<string, string> = {
      'subscriber': 'bg-blue-100 text-blue-800',
      'lead': 'bg-yellow-100 text-yellow-800',
      'marketingqualifiedlead': 'bg-orange-100 text-orange-800',
      'salesqualifiedlead': 'bg-purple-100 text-purple-800',
      'opportunity': 'bg-green-100 text-green-800',
      'customer': 'bg-emerald-100 text-emerald-800',
      'evangelist': 'bg-pink-100 text-pink-800'
    }

    const normalizedStage = stage?.toLowerCase() || 'unknown'
    return colors[normalizedStage] || 'bg-gray-100 text-gray-800'
  }

  const getLifecycleStageLabel = (stage?: string) => {
    const labels: Record<string, string> = {
      'subscriber': 'Subscriber',
      'lead': 'Lead',
      'marketingqualifiedlead': 'MQL',
      'salesqualifiedlead': 'SQL',
      'opportunity': 'Opportunity',
      'customer': 'Customer',
      'evangelist': 'Evangelist'
    }

    const normalizedStage = stage?.toLowerCase() || 'unknown'
    return labels[normalizedStage] || stage || 'Unknown'
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm ||
      contact.properties.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.properties.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.properties.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.properties.company?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLifecycle = lifecycleFilter === 'all' ||
      contact.properties.lifecyclestage?.toLowerCase() === lifecycleFilter.toLowerCase()

    return matchesSearch && matchesLifecycle
  })

  const uniqueLifecycleStages = Array.from(
    new Set(contacts.map(contact => contact.properties.lifecyclestage).filter(Boolean))
  )

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <span className="ml-2 text-gray-600">Loading contacts...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-600 font-medium mb-2">Error Loading Contacts</div>
          <div className="text-gray-600 text-sm mb-4">{error}</div>
          <button
            onClick={fetchContacts}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            HubSpot Contacts ({filteredContacts.length} of {totalContacts})
          </h2>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <select
            value={lifecycleFilter}
            onChange={(e) => setLifecycleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">All Stages</option>
            {uniqueLifecycleStages.map(stage => (
              <option key={stage} value={stage}>
                {getLifecycleStageLabel(stage)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Modified
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {contacts.length === 0 ? 'No contacts found' : 'No contacts match your filters'}
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {`${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {contact.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {contact.properties.company || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {contact.properties.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-1" />
                          {contact.properties.email}
                        </div>
                      )}
                      {contact.properties.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          {contact.properties.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLifecycleStageColor(contact.properties.lifecyclestage)}`}>
                      {getLifecycleStageLabel(contact.properties.lifecyclestage)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(contact.properties.createdate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(contact.properties.lastmodifieddate)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}