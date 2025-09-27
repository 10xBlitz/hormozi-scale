"use client";

import { AppLayout } from "@/components/app-layout";
import { HubSpotAnalytics } from "@/components/hubspot-analytics";
import { HubSpotContactsTable } from "@/components/hubspot-contacts-table";
import { HubSpotChartsDashboard } from "@/components/hubspot-charts-dashboard";
import { HubSpotAIAnalysis } from "@/components/hubspot-ai-analysis";
import { HubSpotAnalyticsSkeleton } from "@/components/hubspot-analytics-skeleton";
import { HubSpotContactsTableSkeleton } from "@/components/hubspot-contacts-table-skeleton";
import { HubSpotChartsSkeleton } from "@/components/hubspot-charts-skeleton";
import { useState } from "react";
import { BarChart3, Brain, Users, PieChart } from "lucide-react";

export default function HubSpotDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: BarChart3,
    },
    {
      id: "charts",
      label: "Charts",
      icon: PieChart,
    },
    {
      id: "insights",
      label: "AI Insights",
      icon: Brain,
    },
    {
      id: "contacts",
      label: "Contacts",
      icon: Users,
    },
  ];

  return (
    <AppLayout currentPage="hubspot">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                HubSpot Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and analyze your HubSpot contacts
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div>
                {/* Analytics Section */}
                {analyticsLoading && <HubSpotAnalyticsSkeleton />}
                <div style={{ display: analyticsLoading ? 'none' : 'block' }}>
                  <HubSpotAnalytics
                    refreshKey={refreshKey}
                    onLoadingChange={setAnalyticsLoading}
                  />
                </div>
              </div>
            )}

            {activeTab === "charts" && (
              <div>
                {/* Charts Dashboard */}
                {chartsLoading && <HubSpotChartsSkeleton />}
                <div style={{ display: chartsLoading ? 'none' : 'block' }}>
                  <HubSpotChartsDashboard
                    refreshKey={refreshKey}
                    onLoadingChange={setChartsLoading}
                  />
                </div>
              </div>
            )}

            {activeTab === "insights" && (
              <div>
                <HubSpotAIAnalysis refreshKey={refreshKey} />
              </div>
            )}

            {activeTab === "contacts" && (
              <div>
                {/* Contacts Table */}
                {contactsLoading && <HubSpotContactsTableSkeleton />}
                <div style={{ display: contactsLoading ? 'none' : 'block' }}>
                  <HubSpotContactsTable
                    refreshKey={refreshKey}
                    onLoadingChange={setContactsLoading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
