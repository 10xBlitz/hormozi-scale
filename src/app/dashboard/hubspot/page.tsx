"use client";

import { AppLayout } from "@/components/app-layout";
import { HubSpotAnalytics } from "@/components/hubspot-analytics";
import { HubSpotContactsTable } from "@/components/hubspot-contacts-table";
import { HubSpotChartsDashboard } from "@/components/hubspot-charts-dashboard";
import { HubSpotAIAnalysis } from "@/components/hubspot-ai-analysis";
import { HubSpotAnalyticsSkeleton } from "@/components/hubspot-analytics-skeleton";
import { HubSpotContactsTableSkeleton } from "@/components/hubspot-contacts-table-skeleton";
import { useState, useEffect } from "react";

export default function HubSpotDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    // Show skeleton for 1.5 seconds to simulate realistic loading time
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

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

        {/* Analytics Section */}
        {isInitialLoading ? (
          <HubSpotAnalyticsSkeleton />
        ) : (
          <HubSpotAnalytics refreshKey={refreshKey} />
        )}

        {/* Charts Dashboard */}
        {!isInitialLoading && (
          <HubSpotChartsDashboard refreshKey={refreshKey} />
        )}

        {/* AI Analysis Dashboard */}
        {!isInitialLoading && (
          <HubSpotAIAnalysis refreshKey={refreshKey} />
        )}

        {/* Contacts Table */}
        {isInitialLoading ? (
          <HubSpotContactsTableSkeleton />
        ) : (
          <HubSpotContactsTable refreshKey={refreshKey} />
        )}
      </div>
    </AppLayout>
  );
}
