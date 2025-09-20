'use client'

import { getActionableSteps } from '@/lib/openai-utils'
import { useState } from 'react'

interface ActionableStepsProps {
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

export function ActionableSteps({ stage, businessArea, currentSituation, context }: ActionableStepsProps) {
  const [steps, setSteps] = useState<{ goal: string; steps: Step[] } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetSteps = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getActionableSteps(stage, businessArea, currentSituation, context)
      setSteps(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get actionable steps')
    } finally {
      setIsLoading(false)
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Actionable Steps for {businessArea}
          </h3>
          <p className="text-sm text-gray-600">Stage {stage}</p>
        </div>
        <button
          onClick={handleGetSteps}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Get Action Steps'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          Error: {error}
        </div>
      )}

      {steps && (
        <div className="space-y-4">
          {/* Goal */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">🎯 Goal for {businessArea}</h4>
            <p className="text-purple-800">{steps.goal}</p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">📋 Action Steps</h4>
            {steps.steps.map((step, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(step.priority)}`}>
                      {getPriorityIcon(step.priority)} {step.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {step.timeframe}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-900 mb-2">{step.action}</p>
                
                {step.resources && (
                  <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    <strong>Resources needed:</strong> {step.resources}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-gray-600">Generating actionable steps...</span>
          </div>
        </div>
      )}
    </div>
  )
}
