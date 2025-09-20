'use client'

import { AppLayout } from '@/components/app-layout'
import { useState } from 'react'

export default function CompanyInfoPage() {
  const [currentHeadcount, setCurrentHeadcount] = useState<number>(4)
  const [currentRevenue, setCurrentRevenue] = useState<number>(0)
  const [servicePrice, setServicePrice] = useState<number>(5000)
  const [deliveryTimeWeeks, setDeliveryTimeWeeks] = useState<number>(4)
  const [selectedCoreFour, setSelectedCoreFour] = useState<string>('warm-outreach')

  const stages = [
    { id: 0, name: "Improvise", headcount_min: 0, headcount_max: 1, revenue_min: 0, revenue_max: 50000 },
    { id: 1, name: "Monetize", headcount_min: 0, headcount_max: 1, revenue_min: 50000, revenue_max: 100000 },
    { id: 2, name: "Advertise", headcount_min: 0, headcount_max: 1, revenue_min: 100000, revenue_max: 250000 },
    { id: 3, name: "Stabilize", headcount_min: 1, headcount_max: 4, revenue_min: 250000, revenue_max: 1000000 },
    { id: 4, name: "Prioritize", headcount_min: 5, headcount_max: 9, revenue_min: 1000000, revenue_max: 2000000 },
    { id: 5, name: "Productize", headcount_min: 10, headcount_max: 19, revenue_min: 2000000, revenue_max: 5000000 },
    { id: 6, name: "Optimize", headcount_min: 20, headcount_max: 49, revenue_min: 5000000, revenue_max: 12000000 },
    { id: 7, name: "Categorize", headcount_min: 50, headcount_max: 99, revenue_min: 12000000, revenue_max: 25000000 },
    { id: 8, name: "Specialize", headcount_min: 100, headcount_max: 249, revenue_min: 25000000, revenue_max: 50000000 },
    { id: 9, name: "Capitalize", headcount_min: 250, headcount_max: 500, revenue_min: 100000000, revenue_max: null }
  ]

  const formatRevenue = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`
    return `$${amount.toLocaleString()}`
  }

  const getCurrentStage = () => {
    return stages.find(stage => 
      currentHeadcount >= stage.headcount_min && 
      currentHeadcount <= stage.headcount_max &&
      currentRevenue >= stage.revenue_min &&
      (stage.revenue_max === null || currentRevenue < stage.revenue_max)
    ) || stages[0]
  }

  const getNextStage = () => {
    const currentStage = getCurrentStage()
    return stages.find(stage => stage.id === currentStage.id + 1) || null
  }

  const handleSave = () => {
    // Here you would typically save to a database
    // For now, we'll just redirect back to dashboard
    window.location.href = '/dashboard'
  }

  const currentStage = getCurrentStage()
  const nextStage = getNextStage()

  return (
    <AppLayout 
      currentPage="company-info" 
      stageInfo={currentStage}
    >
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Company Settings</h2>
              <p className="text-gray-600">Configure your company details and service information</p>
            </div>
            <button 
              onClick={handleSave}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Save & Return to Dashboard
            </button>
          </div>
        </div>

        {/* Current Stage Display */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current Stage: {currentStage.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600">Current Status</div>
              <div className="font-semibold">{currentHeadcount} employees</div>
              <div className="font-semibold">{formatRevenue(currentRevenue)} annual revenue</div>
            </div>
            {nextStage && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600">Next Stage: {nextStage.name}</div>
                <div className="font-semibold">Goal: {formatRevenue(nextStage.revenue_min)}+ revenue</div>
                <div className="text-sm text-gray-600">
                  {nextStage.headcount_min}-{nextStage.headcount_max} employees
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Company Details Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-6">Company Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Headcount
                </label>
                <input
                  type="number"
                  min="0"
                  value={currentHeadcount}
                  onChange={(e) => setCurrentHeadcount(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Annual Revenue ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={currentRevenue}
                  onChange={(e) => setCurrentRevenue(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Service Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Time (weeks)
                </label>
                <input
                  type="number"
                  min="1"
                  value={deliveryTimeWeeks}
                  onChange={(e) => setDeliveryTimeWeeks(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marketing Core Four Method
                </label>
                <select
                  value={selectedCoreFour}
                  onChange={(e) => setSelectedCoreFour(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="warm-outreach">Warm Outreach</option>
                  <option value="cold-outreach">Cold Outreach</option>
                  <option value="creating-content">Creating Content</option>
                  <option value="paid-ads">Paid Ads</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
