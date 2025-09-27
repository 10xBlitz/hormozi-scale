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
  LineChart,
  Line,
} from "recharts";
import { BarChart3 } from "lucide-react";

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
  onLoadingChange?: (loading: boolean) => void;
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

export function HubSpotChartsDashboard({ refreshKey, onLoadingChange }: HubSpotChartsProps) {
  const [contacts, setContacts] = useState<HubSpotContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("30days");

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

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

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

  // Function to get date range based on time selection
  const getDateRange = (range: string) => {
    const today = new Date();
    const startDate = new Date();

    switch (range) {
      case "7days":
        startDate.setDate(today.getDate() - 7);
        return { startDate, today, interval: "day" };
      case "week":
        startDate.setDate(today.getDate() - 7);
        return { startDate, today, interval: "day" };
      case "30days":
        startDate.setDate(today.getDate() - 30);
        return { startDate, today, interval: "day" };
      case "quarter":
        startDate.setMonth(today.getMonth() - 3);
        return { startDate, today, interval: "week" };
      case "6months":
        startDate.setMonth(today.getMonth() - 6);
        return { startDate, today, interval: "week" };
      case "year":
        startDate.setFullYear(today.getFullYear() - 1);
        return { startDate, today, interval: "month" };
      case "2years":
        startDate.setFullYear(today.getFullYear() - 2);
        return { startDate, today, interval: "month" };
      case "3years":
        startDate.setFullYear(today.getFullYear() - 3);
        return { startDate, today, interval: "month" };
      default:
        startDate.setDate(today.getDate() - 30);
        return { startDate, today, interval: "day" };
    }
  };

  // Process daily leads data for time series chart
  const dailyLeadsData = (() => {
    const { startDate, today, interval } = getDateRange(timeRange);

    // Count leads by interval
    const counts: Record<string, number> = {};

    contacts.forEach((contact) => {
      if (contact.properties.createdate) {
        const createDate = new Date(contact.properties.createdate);

        // Only count if it's within our date range and is a lead
        if (createDate >= startDate && createDate <= today) {
          const isLead =
            contact.properties.lifecyclestage?.toLowerCase() === "lead" ||
            contact.properties.lifecyclestage?.toLowerCase() ===
              "salesqualifiedlead";

          if (isLead) {
            let dateKey: string;

            if (interval === "day") {
              dateKey = createDate.toISOString().split("T")[0]; // YYYY-MM-DD
            } else if (interval === "week") {
              // Get Monday of the week
              const monday = new Date(createDate);
              monday.setDate(createDate.getDate() - createDate.getDay() + 1);
              dateKey = monday.toISOString().split("T")[0];
            } else {
              // month
              dateKey = `${createDate.getFullYear()}-${String(
                createDate.getMonth() + 1
              ).padStart(2, "0")}`;
            }

            counts[dateKey] = (counts[dateKey] || 0) + 1;
          }
        }
      }
    });

    // Create date range array based on interval
    const dateRangeArray: Array<{
      dateKey: string;
      displayDate: string;
      actualDate: Date;
    }> = [];

    if (interval === "day") {
      for (
        let d = new Date(startDate);
        d <= today;
        d.setDate(d.getDate() + 1)
      ) {
        const dateKey = d.toISOString().split("T")[0];
        const displayDate = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        dateRangeArray.push({ dateKey, displayDate, actualDate: new Date(d) });
      }
    } else if (interval === "week") {
      const startMonday = new Date(startDate);
      startMonday.setDate(startDate.getDate() - startDate.getDay() + 1);

      for (
        let d = new Date(startMonday);
        d <= today;
        d.setDate(d.getDate() + 7)
      ) {
        const dateKey = d.toISOString().split("T")[0];
        const displayDate = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        dateRangeArray.push({ dateKey, displayDate, actualDate: new Date(d) });
      }
    } else {
      // month
      const current = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        1
      );
      const end = new Date(today.getFullYear(), today.getMonth(), 1);

      while (current <= end) {
        const dateKey = `${current.getFullYear()}-${String(
          current.getMonth() + 1
        ).padStart(2, "0")}`;
        const displayDate = current.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        dateRangeArray.push({
          dateKey,
          displayDate,
          actualDate: new Date(current),
        });
        current.setMonth(current.getMonth() + 1);
      }
    }

    // Create chart data with all dates (including zeros)
    return dateRangeArray.map(({ dateKey, displayDate }) => ({
      date: dateKey,
      leads: counts[dateKey] || 0,
      displayDate,
    }));
  })();


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

      <div className="space-y-6">
        {/* Top Row - Two Charts */}
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

        {/* Bottom Row - Leads Over Time Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Leads Trend Over Time
            </h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="7days">Last 7 Days</option>
              <option value="week">This Week</option>
              <option value="30days">Last 30 Days</option>
              <option value="quarter">Last Quarter</option>
              <option value="6months">Last 6 Months</option>
              <option value="year">Last Year</option>
              <option value="2years">Last 2 Years</option>
              <option value="3years">Last 3 Years</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyLeadsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="displayDate"
                  fontSize={12}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return `Date: ${data.displayDate}`;
                    }
                    return label;
                  }}
                  formatter={(value) => [value, "Leads"]}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#059669" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
