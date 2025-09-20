'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Building,
  Mail,
  Phone,
  Search,
  Download,
  Users,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { useState, useMemo } from 'react'

interface ContactData {
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
    [key: string]: any
  }
}

interface ContactsDataTableProps {
  contacts: ContactData[]
  isLoading?: boolean
}

type SortField = 'name' | 'status' | 'email' | 'company' | 'created' | 'modified'
type SortDirection = 'asc' | 'desc'

export function ContactsDataTable({ contacts, isLoading }: ContactsDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Filter and sort contacts based on search, status, and sorting
  const filteredContacts = useMemo(() => {
    let filtered = contacts.filter(contact => {
      const matchesSearch =
        contact.properties.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.properties.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.properties.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.properties.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.properties.phone?.includes(searchTerm)

      const matchesStatus = statusFilter === 'all' ||
        contact.properties.lifecyclestage?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })

    // Sort the filtered contacts
    filtered.sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''

      switch (sortField) {
        case 'name':
          aValue = `${a.properties.firstname || ''} ${a.properties.lastname || ''}`.trim().toLowerCase()
          bValue = `${b.properties.firstname || ''} ${b.properties.lastname || ''}`.trim().toLowerCase()
          break
        case 'status':
          aValue = (a.properties.lifecyclestage || '').toLowerCase()
          bValue = (b.properties.lifecyclestage || '').toLowerCase()
          break
        case 'email':
          aValue = (a.properties.email || '').toLowerCase()
          bValue = (b.properties.email || '').toLowerCase()
          break
        case 'company':
          aValue = (a.properties.company || '').toLowerCase()
          bValue = (b.properties.company || '').toLowerCase()
          break
        case 'created':
          aValue = new Date(a.properties.createdate || 0).getTime()
          bValue = new Date(b.properties.createdate || 0).getTime()
          break
        case 'modified':
          aValue = new Date(a.properties.lastmodifieddate || 0).getTime()
          bValue = new Date(b.properties.lastmodifieddate || 0).getTime()
          break
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [contacts, searchTerm, statusFilter, sortField, sortDirection])

  // Pagination calculations
  const totalItems = filteredContacts.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // If clicking a different field, sort by that field ascending
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  // Get sort icon for a field
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 text-gray-600" />
      : <ArrowDown className="h-4 w-4 text-gray-600" />
  }

  // Helper component for truncated text with tooltip
  const TruncatedText = ({ text, maxLength = 30, className = "" }: { text?: string, maxLength?: number, className?: string }) => {
    if (!text) return <span className="text-gray-400">--</span>

    if (text.length <= maxLength) {
      return <span className={className}>{text}</span>
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`cursor-help ${className}`}>
              {text.substring(0, maxLength)}...
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs break-words">{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'customer':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'lead':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'marketingqualifiedlead':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'salesqualifiedlead':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'subscriber':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'opportunity':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatStatus = (status?: string) => {
    if (!status) return '--'

    // Convert camelCase to readable format
    return status
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return '--'
    }
  }

  const getFullName = (contact: ContactData) => {
    const firstName = contact.properties.firstname || ''
    const lastName = contact.properties.lastname || ''
    return `${firstName} ${lastName}`.trim() || 'Unnamed Contact'
  }

  // Get unique lifecycle stages for filter
  const uniqueStatuses = Array.from(
    new Set(
      contacts
        .map(c => c.properties.lifecyclestage)
        .filter(Boolean)
    )
  )

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Company', 'Phone', 'Status', 'Created Date']
    const csvData = filteredContacts.map(contact => [
      getFullName(contact),
      contact.properties.email || '',
      contact.properties.company || '',
      contact.properties.phone || '',
      formatStatus(contact.properties.lifecyclestage),
      formatDate(contact.properties.createdate)
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hubspot-contacts-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Fetching ALL contacts from HubSpot...</span>
          </div>
          <div className="text-center mt-2 text-sm text-gray-500">
            This may take a moment for large contact databases
          </div>
        </CardContent>
      </Card>
    )
  }

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No contacts found. Try fetching contacts first.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              HubSpot Contacts ({totalItems})
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Manage and analyze your contact database
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search name, email, company, or phone..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white min-w-[150px]"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-2 border rounded-md bg-white min-w-[80px]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-gray-100 select-none w-40"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-gray-100 select-none w-32"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-gray-100 select-none w-48"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-2">
                    Contact Info
                    {getSortIcon('email')}
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-gray-100 select-none w-36"
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center gap-2">
                    Company
                    {getSortIcon('company')}
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-gray-100 select-none w-28"
                  onClick={() => handleSort('created')}
                >
                  <div className="flex items-center gap-2">
                    Created
                    {getSortIcon('created')}
                  </div>
                </TableHead>
                <TableHead
                  className="font-semibold cursor-pointer hover:bg-gray-100 select-none w-32"
                  onClick={() => handleSort('modified')}
                >
                  <div className="flex items-center gap-2">
                    Last Modified
                    {getSortIcon('modified')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedContacts.map((contact) => (
                <TableRow key={contact.id} className="hover:bg-gray-50">
                  <TableCell className="w-40">
                    <div className="font-medium text-gray-900">
                      <TruncatedText text={getFullName(contact)} maxLength={20} />
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {contact.id.substring(0, 8)}...
                    </div>
                  </TableCell>

                  <TableCell className="w-32">
                    {contact.properties.lifecyclestage ? (
                      <Badge
                        variant="outline"
                        className={getStatusBadgeColor(contact.properties.lifecyclestage)}
                      >
                        <TruncatedText
                          text={formatStatus(contact.properties.lifecyclestage)}
                          maxLength={12}
                          className="text-xs"
                        />
                      </Badge>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </TableCell>

                  <TableCell className="w-48">
                    <div className="space-y-1">
                      {contact.properties.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <a
                            href={`mailto:${contact.properties.email}`}
                            className="text-blue-600 hover:underline min-w-0"
                          >
                            <TruncatedText text={contact.properties.email} maxLength={25} />
                          </a>
                        </div>
                      )}
                      {contact.properties.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <a
                            href={`tel:${contact.properties.phone}`}
                            className="text-gray-600 hover:underline min-w-0"
                          >
                            <TruncatedText text={contact.properties.phone} maxLength={15} />
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="w-36">
                    {contact.properties.company ? (
                      <div className="flex items-center gap-2">
                        <Building className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-sm min-w-0">
                          <TruncatedText text={contact.properties.company} maxLength={18} />
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </TableCell>

                  <TableCell className="w-28">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="min-w-0">
                        {formatDate(contact.properties.createdate)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="w-32">
                    <div className="text-sm text-gray-600">
                      {formatDate(contact.properties.lastmodifieddate)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} contacts
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="hidden sm:flex"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Previous</span>
              </Button>

              <div className="flex items-center gap-1">
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[36px]"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <span className="mr-1 hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="hidden sm:flex"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {paginatedContacts.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              No contacts found matching "{searchTerm}"
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchTerm('')}
              className="mt-2"
            >
              Clear Search
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}