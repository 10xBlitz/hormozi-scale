"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Zap,
  Target,
  Clock,
  CalendarDays,
  Loader2,
} from "lucide-react";

interface HubSpotContact {
  id: string;
  properties: {
    email?: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    phone?: string;
    website?: string;
    lifecyclestage?: string;
    hs_lead_status?: string;
    createdate?: string;
    lastmodifieddate?: string;
    closedate?: string;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

interface HubSpotAnalyticsProps {
  refreshKey: number;
}

interface AnalyticsData {
  totalContacts: number;
  contactsCount: number;
  lifecycleDistribution: Record<string, number>;
  recentContacts: number;
  connectedLeads: number;
  inProgressLeads: number;
  leadsToday: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
  salesConversions: number;
  salesThisMonth: number;
  salesThisWeek: number;
  conversionRate: number;
}

export function HubSpotAnalytics({ refreshKey }: HubSpotAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/hubspot/contacts");
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to fetch analytics");
      }

      if (responseData.success) {
        const contacts: HubSpotContact[] = responseData.contacts || [];

        // Calculate analytics
        const lifecycleDistribution: Record<string, number> = {};
        const companyCounts: Record<string, number> = {};

        contacts.forEach((contact) => {
          // Lifecycle distribution
          const stage = contact.properties.lifecyclestage || "unknown";
          lifecycleDistribution[stage] =
            (lifecycleDistribution[stage] || 0) + 1;

          // Company distribution
          const company = contact.properties.company?.trim();
          if (company) {
            companyCounts[company] = (companyCounts[company] || 0) + 1;
          }
        });

        // Calculate date ranges
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay()); // Start of this week (Sunday)
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Count recent contacts (this month)
        const recentContacts = contacts.filter((contact) => {
          if (!contact.properties.createdate) return false;
          const createDate = new Date(contact.properties.createdate);
          return createDate >= thisMonthStart;
        }).length;

        // Filter leads specifically (contacts with 'lead' lifecycle stage)
        const leads = contacts.filter(
          (contact) =>
            contact.properties.lifecyclestage?.toLowerCase() === "lead"
        );

        // Count leads by time period
        const leadsToday = leads.filter((contact) => {
          if (!contact.properties.createdate) return false;
          const createDate = new Date(contact.properties.createdate);
          return createDate >= today;
        }).length;

        const leadsThisWeek = leads.filter((contact) => {
          if (!contact.properties.createdate) return false;
          const createDate = new Date(contact.properties.createdate);
          return createDate >= thisWeekStart;
        }).length;

        const leadsThisMonth = leads.filter((contact) => {
          if (!contact.properties.createdate) return false;
          const createDate = new Date(contact.properties.createdate);
          return createDate >= thisMonthStart;
        }).length;

        // Count lead status metrics
        const connectedLeads = contacts.filter(
          (contact) =>
            contact.properties.hs_lead_status?.toLowerCase() === "connected"
        ).length;

        const inProgressLeads = contacts.filter(
          (contact) =>
            contact.properties.hs_lead_status?.toLowerCase() === "in_progress"
        ).length;

        // Count sales conversions (leads that became sales qualified leads)
        const salesConversions = contacts.filter(
          (contact) =>
            contact.properties.lifecyclestage?.toLowerCase() === "salesqualifiedlead"
        ).length;

        // Count sales by time period (this month and week)
        const salesThisMonth = contacts.filter((contact) => {
          if (contact.properties.lifecyclestage?.toLowerCase() !== "salesqualifiedlead")
            return false;
          const createDate = new Date(contact.properties.createdate || contact.createdAt);
          return createDate >= thisMonthStart;
        }).length;

        const salesThisWeek = contacts.filter((contact) => {
          if (contact.properties.lifecyclestage?.toLowerCase() !== "salesqualifiedlead")
            return false;
          const createDate = new Date(contact.properties.createdate || contact.createdAt);
          return createDate >= thisWeekStart;
        }).length;

        // Calculate conversion rate (sales qualified leads / total leads)
        const totalLeadsEver = contacts.filter(
          (contact) =>
            contact.properties.lifecyclestage?.toLowerCase() === "lead" ||
            contact.properties.lifecyclestage?.toLowerCase() === "salesqualifiedlead"
        ).length;
        const conversionRate = totalLeadsEver > 0 ? (salesConversions / totalLeadsEver) * 100 : 0;

        setData({
          totalContacts:
            responseData.totalContactsCount || responseData.contactsCount || 0,
          contactsCount: contacts.length,
          lifecycleDistribution,
          recentContacts,
          connectedLeads,
          inProgressLeads,
          leadsToday,
          leadsThisWeek,
          leadsThisMonth,
          salesConversions,
          salesThisMonth,
          salesThisWeek,
          conversionRate,
        });
      } else {
        throw new Error(responseData.error || "Failed to fetch analytics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-600 font-medium mb-2">
            Error Loading Analytics
          </div>
          <div className="text-gray-600 text-sm mb-4">{error}</div>
          <button
            onClick={() => fetchAnalytics()}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Total Contacts
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.totalContacts.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Total Sales
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.salesConversions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Connected Leads
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.connectedLeads}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                In Progress Leads
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.inProgressLeads}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Tracking Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Target className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Lead Generation Tracking
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  Today
                </span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {data.leadsToday}
              </div>
            </div>
            <p className="text-xs text-green-600">New leads today</p>
          </div>

          {/* This Week */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  This Week
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {data.leadsThisWeek}
              </div>
            </div>
            <p className="text-xs text-blue-600">New leads this week</p>
          </div>

          {/* This Month */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-800">
                  This Month
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-700">
                {data.leadsThisMonth}
              </div>
            </div>
            <p className="text-xs text-purple-600">New leads this month</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center gap-8">
              <div>
                <span>Daily Average (This Month): </span>
                <span className="font-medium text-gray-900">
                  {(() => {
                    const currentDay = new Date().getDate();
                    const average =
                      data.leadsThisMonth > 0
                        ? data.leadsThisMonth / currentDay
                        : 0;
                    return Math.round(average * 10) / 10;
                  })()}{" "}
                  leads/day
                </span>
              </div>
              <div>
                <span>Weekly Average (This Month): </span>
                <span className="font-medium text-gray-900">
                  {(() => {
                    const currentDay = new Date().getDate();
                    const weeksElapsed = Math.ceil(currentDay / 7);
                    const average =
                      data.leadsThisMonth > 0
                        ? data.leadsThisMonth / weeksElapsed
                        : 0;
                    return Math.round(average * 10) / 10;
                  })()}{" "}
                  leads/week
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Conversion Tracking Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Target className="h-5 w-5 text-emerald-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Sales Conversion Metrics
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversion Rate */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Target className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">
                  Conversion Rate
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {data.conversionRate.toFixed(1)}%
              </div>
            </div>
            <p className="text-xs text-blue-600">Lead to customer rate</p>
          </div>

          {/* Sales This Week */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-800">
                  This Week
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-700">
                {data.salesThisWeek}
              </div>
            </div>
            <p className="text-xs text-purple-600">Sales closed this week</p>
          </div>

          {/* Sales This Month */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-orange-800">
                  This Month
                </span>
              </div>
              <div className="text-2xl font-bold text-orange-700">
                {data.salesThisMonth}
              </div>
            </div>
            <p className="text-xs text-orange-600">Sales closed this month</p>
          </div>
        </div>

        {/* Sales Performance Insights */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center gap-8">
              <div>
                <span>Average Weekly Sales: </span>
                <span className="font-medium text-gray-900">
                  {(() => {
                    const weeksInMonth = Math.ceil(new Date().getDate() / 7);
                    const avgWeekly = data.salesThisMonth > 0 ? data.salesThisMonth / weeksInMonth : 0;
                    return avgWeekly.toFixed(1);
                  })()}{" "}
                  sales/week
                </span>
              </div>
              <div>
                <span>Monthly Goal Progress: </span>
                <span className="font-medium text-gray-900">
                  {data.salesThisMonth} / {Math.max(10, data.salesThisMonth)} sales
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
