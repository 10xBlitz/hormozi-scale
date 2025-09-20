'use client'

import { getActionableSteps } from '@/lib/openai-utils'
import { ActionPlan, actionPlanService } from '@/lib/supabase/action-plans'
import { useState } from 'react'

interface BusinessAreaAdvisorProps {
  stage: string
  businessArea: string
  currentSituation: string
  context?: string
}

interface Step {
  action: string
  priority: 'high' | 'medium' | 'low'
  timeframe: string
  resources?: string
}

const BUSINESS_AREA_COLORS = {
  PRODUCT: 'bg-purple-600',
  MARKETING: 'bg-blue-600',
  SALES: 'bg-green-600',
  'CUSTOMER SERVICE': 'bg-orange-600',
  IT: 'bg-indigo-600',
  RECRUITING: 'bg-pink-600',
  HR: 'bg-teal-600',
  FINANCE: 'bg-red-600'
}

// Helper function to render structured action content
function renderStructuredAction(actionText: string) {
  const lines = actionText.split('\n\n')
  const sections: JSX.Element[] = []

  for (const line of lines) {
    if (line.startsWith('**') && line.includes('**')) {
      // Extract title (remove ** markers and any emojis)
      const titleMatch = line.match(/\*\*(.+?)\*\*/)
      if (titleMatch) {
        const title = titleMatch[1].replace(/^[🏆🚀💡]\s*/, '') // Remove emoji prefix
        sections.push(
          <h5 key={`title-${sections.length}`} className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h5>
        )
      }
    } else if (line.startsWith('Description:')) {
      const description = line.replace('Description:', '').trim()
      sections.push(
        <div key={`desc-${sections.length}`} className="mb-3">
          <p className="text-gray-700 leading-relaxed">{description}</p>
        </div>
      )
    } else if (line.startsWith('How to Execute:')) {
      const execution = line.replace('How to Execute:', '').trim()
      sections.push(
        <div key={`exec-${sections.length}`} className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="text-sm font-medium text-blue-900 mb-1">⚡ How to Execute:</div>
          <div className="text-sm text-blue-800">{execution}</div>
        </div>
      )
    } else if (line.startsWith('Timeline:')) {
      const timeline = line.replace('Timeline:', '').trim()
      sections.push(
        <div key={`time-${sections.length}`} className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">⏰ Timeline:</span>
          <span className="text-sm text-gray-900">{timeline}</span>
        </div>
      )
    } else if (line.startsWith('Resources:')) {
      const resources = line.replace('Resources:', '').trim()
      sections.push(
        <div key={`res-${sections.length}`} className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
          <div className="text-sm font-medium text-gray-700 mb-2">🛠️ Resources & Tools:</div>
          <div className="text-sm text-gray-600 space-y-1">
            {resources.split(';').map((resource, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>{resource.trim()}</span>
              </div>
            ))}
          </div>
        </div>
      )
    } else if (line.startsWith('Links:')) {
      const linksText = line.replace('Links:', '').trim()
      const links = linksText.split(',').map(link => link.trim()).filter(link => link.startsWith('http'))

      if (links.length > 0) {
        sections.push(
          <div key={`links-${sections.length}`} className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
            <div className="text-sm font-medium text-green-900 mb-2">🔗 Helpful Links:</div>
            <div className="space-y-1">
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 hover:text-green-800 underline block"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        )
      }
    } else if (line.trim()) {
      // Fallback for any other content
      sections.push(
        <p key={`fallback-${sections.length}`} className="text-gray-700 leading-relaxed mb-2">
          {line.trim()}
        </p>
      )
    }
  }

  return sections.length > 0 ? sections : (
    <p className="text-gray-900 leading-relaxed">{actionText}</p>
  )
}

export function BusinessAreaAdvisor({ stage, businessArea, currentSituation, context }: BusinessAreaAdvisorProps) {
  const [advisorData, setAdvisorData] = useState<{ goal: string; steps: Step[] } | null>(null)
  const [savedPlan, setSavedPlan] = useState<ActionPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleGetAdvice = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getActionableSteps(stage, businessArea, currentSituation, context)
      setAdvisorData(result)
      setShowDetails(true)

      // Automatically save the action plan
      await handleSaveActionPlan(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get business advice')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveActionPlan = async (data: { goal: string; steps: Step[] }) => {
    if (!data || !data.steps.length) return

    setIsSaving(true)
    try {
      const actionPlan: Omit<ActionPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        stage,
        business_area: businessArea,
        goal: data.goal,
        current_situation: currentSituation,
        context,
        steps: data.steps.map(step => ({
          action: step.action,
          priority: step.priority,
          timeframe: step.timeframe,
          resources: step.resources,
          completed: false
        })),
        is_completed: false
      }

      const saved = await actionPlanService.saveActionPlan(actionPlan)
      if (saved) {
        setSavedPlan(saved)
      }
    } catch (err) {
      console.error('Error saving action plan:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return '🔴'
      case 'medium':
        return '🟡'
      case 'low':
        return '🟢'
      default:
        return '⚪'
    }
  }

  const areaColor = BUSINESS_AREA_COLORS[businessArea as keyof typeof BUSINESS_AREA_COLORS] || 'bg-gray-600'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`${areaColor} text-white px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-white opacity-20"></div>
            <div>
              <h3 className="text-lg font-semibold">{businessArea} Advisor</h3>
              <p className="text-sm opacity-90">Stage {stage} • AI-Powered Guidance</p>
            </div>
          </div>
          <button
            onClick={handleGetAdvice}
            disabled={isLoading || isSaving}
            className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Analyzing...' : isSaving ? 'Saving...' : 'Get AI Advice'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            Error: {error}
          </div>
        )}

        {!advisorData && !isLoading && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Get AI-Powered Advice</h4>
            <p className="text-gray-600 mb-4">
              Get specific, actionable steps tailored to your {businessArea} challenges in Stage {stage}.
            </p>
            <button
              onClick={handleGetAdvice}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Analysis
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <div>
                <div className="text-gray-900 font-medium">Analyzing your situation...</div>
                <div className="text-sm text-gray-600">Generating personalized action steps</div>
              </div>
            </div>
          </div>
        )}

        {advisorData && showDetails && (
          <div className="space-y-6">
            {/* Success Message */}
            {savedPlan && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <span className="font-medium">Action plan saved successfully!</span>
                </div>
                <p className="text-sm mt-1">Your personalized action plan has been saved to your account.</p>
              </div>
            )}

            {/* Goal Section */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🎯</span>
                </div>
                <h4 className="text-lg font-semibold text-purple-900">Stage Goal</h4>
              </div>
              <p className="text-purple-800 leading-relaxed">{advisorData.goal}</p>
            </div>

            {/* Action Steps */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📋</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Action Steps</h4>
                <span className="text-sm text-gray-500">({advisorData.steps.length} steps)</span>
              </div>

              <div className="space-y-3">
                {advisorData.steps.map((step, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(step.priority)}`}>
                            {getPriorityIcon(step.priority)} {step.priority.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {step.timeframe}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced action display with structured content */}
                    <div className="space-y-3">
                      {renderStructuredAction(step.action)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Hide Details
              </button>
              <button
                onClick={handleGetAdvice}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Refresh Advice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
