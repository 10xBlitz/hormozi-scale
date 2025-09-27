"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Loader2, BarChart3 } from "lucide-react";

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
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

interface HubSpotChartsProps {
  refreshKey: number;
}

const LIFECYCLE_COLORS = [
  "#3B82F6", // Blue
  "#EAB308", // Yellow
  "#F97316", // Orange
  "#A855F7", // Purple
  "#10B981", // Green
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#6B7280", // Gray
];

export function HubSpotChartsDashboard({ refreshKey }: HubSpotChartsProps) {
  const [contacts, setContacts] = useState<HubSpotContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/hubspot/contacts");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch contacts");
      }

      if (data.success) {
        setContacts(data.contacts || []);
      } else {
        throw new Error(data.error || "Failed to fetch contacts");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [refreshKey]);

  const getLifecycleStageLabel = (stage?: string) => {
    const labels: Record<string, string> = {
      subscriber: "Subscriber",
      lead: "Lead",
      marketingqualifiedlead: "MQL",
      salesqualifiedlead: "SQL",
      opportunity: "Opportunity",
      customer: "Customer",
      evangelist: "Evangelist",
    };

    const normalizedStage = stage?.toLowerCase() || "unknown";
    return labels[normalizedStage] || stage || "Unknown";
  };

  const getLeadStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      new: "New",
      open: "Open",
      in_progress: "In Progress",
      open_deal: "Open Deal",
      unqualified: "Unqualified",
      attempted_to_contact: "Attempted to Contact",
      connected: "Connected",
      bad_timing: "Bad Timing",
    };

    const normalizedStatus =
      status?.toLowerCase().replace(/\s/g, "_") || "unknown";
    return labels[normalizedStatus] || status || "Unknown";
  };

  // Process lifecycle data for charts
  const lifecycleData = Object.entries(
    contacts.reduce((acc, contact) => {
      const stage = contact.properties.lifecyclestage || "unknown";
      const label = getLifecycleStageLabel(stage);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Process lead status data for charts
  const leadStatusData = Object.entries(
    contacts.reduce((acc, contact) => {
      const status = contact.properties.hs_lead_status || "unknown";
      const label = getLeadStatusLabel(status);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <span className="ml-2 text-gray-600">Loading charts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-600 font-medium mb-2">
            Error Loading Charts
          </div>
          <div className="text-gray-600 text-sm mb-4">{error}</div>
          <button
            onClick={fetchContacts}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            HubSpot Analytics Charts
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lifecycle Stage Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Lifecycle Stage Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lifecycleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {lifecycleData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={LIFECYCLE_COLORS[index % LIFECYCLE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Status Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Lead Status Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={leadStatusData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
