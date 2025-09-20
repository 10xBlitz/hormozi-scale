'use client'

import { ActionPlan, actionPlanService } from '@/lib/supabase/action-plans'
import { useEffect, useState } from 'react'

export function SavedActionPlans() {
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null)

  useEffect(() => {
    loadActionPlans()
  }, [])

  const loadActionPlans = async () => {
    try {
      setIsLoading(true)
      const plans = await actionPlanService.getActionPlans()
      setActionPlans(plans)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load action plans')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkStepCompleted = async (planId: string, stepIndex: number) => {
    try {
      const updatedPlan = await actionPlanService.markStepCompleted(planId, stepIndex)
      if (updatedPlan) {
        setActionPlans(prev => 
          prev.map(plan => plan.id === planId ? updatedPlan : plan)
        )
        if (selectedPlan?.id === planId) {
          setSelectedPlan(updatedPlan)
        }
      }
    } catch (err) {
      console.error('Error marking step completed:', err)
    }
  }

  const handleMarkPlanCompleted = async (planId: string) => {
    try {
      const updatedPlan = await actionPlanService.markPlanCompleted(planId)
      if (updatedPlan) {
        setActionPlans(prev => 
          prev.map(plan => plan.id === planId ? updatedPlan : plan)
        )
        if (selectedPlan?.id === planId) {
          setSelectedPlan(updatedPlan)
        }
      }
    } catch (err) {
      console.error('Error marking plan completed:', err)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-gray-600">Loading action plans...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      </div>
    )
  }

  if (actionPlans.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Action Plans Yet</h3>
          <p className="text-gray-600">Generate your first AI-powered action plan by selecting a business area above.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-black text-white px-6 py-4">
        <h2 className="text-lg font-bold">📋 Saved Action Plans ({actionPlans.length})</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Action Plans List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Plans</h3>
            {actionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPlan?.id === plan.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{plan.business_area}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{plan.stage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.is_completed ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        ✅ Completed
                      </span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        🔄 In Progress
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{plan.goal}</p>
                <div className="text-xs text-gray-500">
                  Created {formatDate(plan.created_at || '')}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Plan Details */}
          {selectedPlan && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Plan Details</h3>
                {!selectedPlan.is_completed && (
                  <button
                    onClick={() => handleMarkPlanCompleted(selectedPlan.id!)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Mark Complete
                  </button>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Goal</h4>
                <p className="text-sm text-gray-700">{selectedPlan.goal}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Action Steps</h4>
                <div className="space-y-3">
                  {selectedPlan.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-3 ${
                        step.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}
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
                        {!step.completed && (
                          <button
                            onClick={() => handleMarkStepCompleted(selectedPlan.id!, index)}
                            className="text-xs text-purple-600 hover:text-purple-800"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                      
                      <p className={`text-sm mb-2 ${step.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {step.action}
                      </p>
                      
                      {step.resources && (
                        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          <strong>Resources:</strong> {step.resources}
                        </div>
                      )}

                      {step.completed && step.completed_at && (
                        <div className="text-xs text-green-600 mt-1">
                          ✅ Completed on {formatDate(step.completed_at)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

