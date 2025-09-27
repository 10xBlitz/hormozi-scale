"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Zap,
  Brain,
  Loader2,
  RefreshCw,
  Target,
  Clock,
  CalendarDays,
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
    createdate?: string;
    lastmodifieddate?: string;
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
  companiesWithMultipleContacts: number;
  leadsToday: number;
  leadsThisWeek: number;
  leadsThisMonth: number;
  analysis?: string;
}

export function HubSpotAnalytics({ refreshKey }: HubSpotAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (withAnalysis = false) => {
    try {
      setLoading(true);
      setError(null);

      const url = withAnalysis
        ? "/api/hubspot/contacts?analyze=true"
        : "/api/hubspot/contacts";
      const response = await fetch(url);
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

        // Count companies with multiple contacts
        const companiesWithMultipleContacts = Object.values(
          companyCounts
        ).filter((count) => count > 1).length;

        setData({
          totalContacts:
            responseData.totalContactsCount || responseData.contactsCount || 0,
          contactsCount: contacts.length,
          lifecycleDistribution,
          recentContacts,
          companiesWithMultipleContacts,
          leadsToday,
          leadsThisWeek,
          leadsThisMonth,
          analysis: responseData.analysis,
        });
      } else {
        throw new Error(responseData.error || "Failed to fetch analytics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setAnalyzingWithAI(false);
    }
  };

  const generateAIAnalysis = async () => {
    setAnalyzingWithAI(true);
    await fetchAnalytics(true);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [refreshKey]);

  const getLifecycleStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      subscriber: "Subscriber",
      lead: "Lead",
      marketingqualifiedlead: "MQL",
      salesqualifiedlead: "SQL",
      opportunity: "Opportunity",
      customer: "Customer",
      evangelist: "Evangelist",
      unknown: "Unknown",
    };

    return labels[stage.toLowerCase()] || stage;
  };

  const getLifecycleStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      subscriber: "bg-blue-500",
      lead: "bg-yellow-500",
      marketingqualifiedlead: "bg-orange-500",
      salesqualifiedlead: "bg-purple-500",
      opportunity: "bg-green-500",
      customer: "bg-emerald-500",
      evangelist: "bg-pink-500",
      unknown: "bg-gray-500",
    };

    return colors[stage.toLowerCase()] || "bg-gray-500";
  };

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Multi-Contact Companies
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data.companiesWithMultipleContacts}
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
                Lifecycle Stages
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {Object.keys(data.lifecycleDistribution).length}
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

      {/* Lifecycle Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Lifecycle Stage Distribution
        </h3>
        <div className="space-y-4">
          {Object.entries(data.lifecycleDistribution)
            .sort(([, a], [, b]) => b - a)
            .map(([stage, count]) => {
              const percentage =
                data.contactsCount > 0 ? (count / data.contactsCount) * 100 : 0;
              return (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-4 h-4 rounded ${getLifecycleStageColor(
                        stage
                      )} mr-3`}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {getLifecycleStageLabel(stage)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getLifecycleStageColor(
                          stage
                        )}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Brain className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI Business Insights
            </h3>
          </div>
          <button
            onClick={generateAIAnalysis}
            disabled={analyzingWithAI}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analyzingWithAI ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Analysis
              </>
            )}
          </button>
        </div>

        {data.analysis ? (
          <div className="prose max-w-none">
            <div className="bg-purple-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {data.analysis}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>
              Click &quot;Generate Analysis&quot; to get AI-powered insights
              about your HubSpot contacts
            </p>
            <p className="text-xs mt-2">
              Analysis includes trends, recommendations, and growth
              opportunities
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
