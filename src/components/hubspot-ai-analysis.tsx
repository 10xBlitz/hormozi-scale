"use client";

import { useState } from "react";
import {
  Brain,
  Loader2,
  RefreshCw,
  Users,
  TrendingUp,
  Building2,
  Activity,
  UserCheck,
  Lightbulb,
  Star,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface HubSpotAIAnalysisProps {
  refreshKey?: number; // Optional, for when we want to trigger refresh
}

export function HubSpotAIAnalysis({ refreshKey }: HubSpotAIAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/hubspot/contacts?analyze=true");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate analysis");
      }

      if (data.success) {
        setAnalysis(data.analysis || "No analysis generated");
      } else {
        throw new Error(data.error || "Failed to generate analysis");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-600 font-medium mb-2">
            Error Generating Analysis
          </div>
          <div className="text-gray-600 text-sm mb-4">{error}</div>
          <button
            onClick={generateAnalysis}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Brain className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            AI Business Insights
          </h3>
        </div>
        <button
          onClick={generateAnalysis}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
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

      {analysis ? (
        <div className="space-y-6">
          <AIAnalysisRenderer analysis={analysis} />
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>
            Click "Generate Analysis" to get AI-powered insights about your
            HubSpot contacts
          </p>
          <p className="text-xs mt-2">
            Analysis includes trends, recommendations, and growth opportunities
          </p>
        </div>
      )}
    </div>
  );
}

// AI Analysis Renderer Component
function AIAnalysisRenderer({ analysis }: { analysis: string }) {
  // Parse the analysis text into structured sections
  const parseAnalysis = (text: string) => {
    const sections: Array<{
      title: string;
      icon: React.ReactNode;
      content: string;
      type: 'overview' | 'metrics' | 'recommendations';
      subsections?: Array<{ title: string; content: string; items?: string[] }>;
    }> = [];

    // Split by main sections
    const parts = text.split(/###\s+\d+\.\s+|###\s+/);

    parts.forEach((part, index) => {
      if (!part.trim()) return;

      // Detect section type and assign appropriate icon
      const lowerPart = part.toLowerCase();
      let icon: React.ReactNode;
      let type: 'overview' | 'metrics' | 'recommendations' = 'overview';

      if (lowerPart.includes('contact distribution') || lowerPart.includes('distribution')) {
        icon = <Users className="h-5 w-5 text-blue-600" />;
        type = 'metrics';
      } else if (lowerPart.includes('growth trends') || lowerPart.includes('trends')) {
        icon = <TrendingUp className="h-5 w-5 text-green-600" />;
        type = 'metrics';
      } else if (lowerPart.includes('company insights') || lowerPart.includes('company')) {
        icon = <Building2 className="h-5 w-5 text-purple-600" />;
        type = 'metrics';
      } else if (lowerPart.includes('engagement patterns') || lowerPart.includes('engagement')) {
        icon = <Activity className="h-5 w-5 text-orange-600" />;
        type = 'metrics';
      } else if (lowerPart.includes('lead quality') || lowerPart.includes('quality')) {
        icon = <UserCheck className="h-5 w-5 text-emerald-600" />;
        type = 'metrics';
      } else if (lowerPart.includes('recommendations') || lowerPart.includes('actionable')) {
        icon = <Lightbulb className="h-5 w-5 text-yellow-600" />;
        type = 'recommendations';
      } else {
        icon = <Star className="h-5 w-5 text-indigo-600" />;
      }

      // Extract title and content
      const lines = part.split('\n').filter(line => line.trim());
      const title = lines[0]?.replace(/^\d+\.\s*/, '').trim() || `Section ${index + 1}`;
      const content = lines.slice(1).join('\n');

      // Parse subsections
      const subsections: Array<{ title: string; content: string; items?: string[] }> = [];
      const subsectionMatches = content.split(/####\s+/).filter(s => s.trim());

      subsectionMatches.forEach(subsection => {
        const subLines = subsection.split('\n').filter(line => line.trim());
        if (subLines.length > 0) {
          const subTitle = subLines[0].replace(/:/g, '').trim();
          const subContent = subLines.slice(1).join('\n');

          // Extract bullet points
          const items = subContent.match(/[-•]\s*\*\*.*?\*\*:.*$/gm)?.map(item =>
            item.replace(/[-•]\s*/, '').trim()
          ) || [];

          subsections.push({
            title: subTitle,
            content: subContent,
            items: items.length > 0 ? items : undefined
          });
        }
      });

      sections.push({
        title,
        icon,
        content,
        type,
        subsections: subsections.length > 0 ? subsections : undefined
      });
    });

    return sections;
  };

  const sections = parseAnalysis(analysis);

  // Group sections by type
  const metricsSections = sections.filter(s => s.type === 'metrics');
  const recommendationsSections = sections.filter(s => s.type === 'recommendations');

  return (
    <div className="space-y-8">
      {/* Metrics Overview */}
      {metricsSections.length > 0 && (
        <div>
          <div className="flex items-center mb-6">
            <Activity className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Analysis Overview</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metricsSections.map((section, index) => (
              <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  {section.icon}
                  <h4 className="text-lg font-semibold text-gray-900 ml-3">{section.title}</h4>
                </div>

                {section.subsections ? (
                  <div className="space-y-4">
                    {section.subsections.map((subsection, subIndex) => (
                      <div key={subIndex} className="bg-white rounded-lg p-4 border border-gray-100">
                        <h5 className="font-medium text-gray-800 mb-2">{subsection.title}</h5>
                        {subsection.items ? (
                          <ul className="space-y-2">
                            {subsection.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: subsection.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: section.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Recommendations */}
      {recommendationsSections.length > 0 && (
        <div>
          <div className="flex items-center mb-6">
            <Lightbulb className="h-6 w-6 text-yellow-600 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Actionable Recommendations</h3>
          </div>

          <div className="space-y-6">
            {recommendationsSections.map((section, index) => (
              <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
                <div className="space-y-6">
                  {/* Extract recommendation categories */}
                  {section.content.split(/####\s+/).filter(cat => cat.trim()).map((category, catIndex) => {
                    const lines = category.split('\n').filter(line => line.trim());
                    const categoryTitle = lines[0]?.replace(/:/g, '').trim();
                    const recommendations = lines.slice(1).filter(line => line.match(/^\d+\./));

                    if (!categoryTitle || recommendations.length === 0) return null;

                    return (
                      <div key={catIndex} className="bg-white rounded-lg p-5 border border-yellow-100">
                        <div className="flex items-center mb-4">
                          <ArrowRight className="h-5 w-5 text-yellow-600 mr-2" />
                          <h4 className="text-lg font-semibold text-gray-900">{categoryTitle}</h4>
                        </div>

                        <div className="space-y-3">
                          {recommendations.map((rec, recIndex) => {
                            const [title, ...descParts] = rec.split(':');
                            const description = descParts.join(':').trim();

                            return (
                              <div key={recIndex} className="flex items-start p-3 bg-gray-50 rounded-lg">
                                <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 mt-1">
                                  <span className="text-xs font-semibold text-yellow-700">{recIndex + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 mb-1">
                                    {title.replace(/^\d+\.\s*\*\*/, '').replace(/\*\*$/, '').trim()}
                                  </h5>
                                  {description && (
                                    <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: description.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conclusion */}
      {analysis.includes('Conclusion') && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center mb-4">
            <Star className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-bold text-gray-900">Key Takeaways</h3>
          </div>

          <div className="prose prose-blue max-w-none">
            {analysis.split('### Conclusion')[1] && (
              <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{
                __html: analysis.split('### Conclusion')[1].trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}