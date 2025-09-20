'use client'

import { AppLayout } from '@/components/app-layout'
import { BusinessAreaAdvisor } from '@/components/business-area-advisor'
import { HubSpotContactsAnalyzer } from '@/components/hubspot-contacts-analyzer'
import { SavedActionPlans } from '@/components/saved-action-plans'
import { useState } from 'react'

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

const businessAreas = [
  {
    name: "PRODUCT",
    constraint: "Customers have nothing else to buy from you & churn.",
    graduation: "Focus on making it good. Make it valuable first then scalable.",
    color: "bg-purple-600",
    checklist: [
      { text: "Make product valuable before focusing on scalability", frequency: "once" },
      { text: "Improve core product quality and user experience", frequency: "ongoing" },
      { text: "Gather customer feedback and iterate based on needs", frequency: "weekly" }
    ]
  },
  {
    name: "MARKETING", 
    constraint: "Lead flow is inconsistent",
    graduation: "Implement Rule of 100 daily and use Core Four consistently",
    color: "bg-purple-600",
    checklist: [
      { text: "Choose your Core Four method (see selection above)", frequency: "once" }
    ]
  },
  {
    name: "SALES",
    constraint: "Customers get sold with unrealistic expectations and refunds/bad reviews become an issue.",
    graduation: "Create and implement CLOSER framework script",
    color: "bg-purple-600",
    checklist: [
      { text: "Create sales script using CLOSER framework", frequency: "once" },
      { text: "Script elements: Where are you now?", frequency: "once" },
      { text: "Script elements: Where do you want to go?", frequency: "once" }, 
      { text: "Script elements: What have you tried?", frequency: "once" },
      { text: "Script elements: What did you like/not like?", frequency: "once" },
      { text: "Script elements: I will solve the obstacles this way", frequency: "once" },
      { text: "Practice and refine script based on results", frequency: "daily" }
    ]
  },
  {
    name: "CUSTOMER SERVICE",
    constraint: "Paid customers have higher standards and complain more",
    graduation: "Create customer service scripts for upset customers and testimonial collection",
    color: "bg-purple-600",
    checklist: [
      { text: "Create script to deal with upset customers", frequency: "once" },
      { text: "Create process to get testimonials from happy customers", frequency: "once" },
      { text: "Train team on consistent customer service approach", frequency: "once" },
      { text: "Document common issues and responses", frequency: "weekly" }
    ]
  },
  {
    name: "INFORMATION TECH (IT)",
    constraint: "No system to track leads and customers",
    graduation: "Set up customer contact and tracking systems",
    color: "bg-purple-600",
    checklist: [
      { text: "Set up a place for customers to submit contact info", frequency: "once" },
      { text: "Implement a way to keep track of prospects", frequency: "once" },
      { text: "Implement a way to keep track of customers", frequency: "once" },
      { text: "Ensure data is organized and accessible", frequency: "weekly" }
    ]
  },
  {
    name: "RECRUITING",
    constraint: "Too much work for freelancers and part-timers",
    graduation: "Transition to full-time workers",
    color: "bg-purple-600",
    checklist: [
      { text: "Identify roles that need full-time commitment", frequency: "once" },
      { text: "Create job descriptions for full-time positions", frequency: "once" },
      { text: "Begin recruiting full-time workers", frequency: "weekly" },
      { text: "Transition key freelancers to full-time if possible", frequency: "once" }
    ]
  },
  {
    name: "HUMAN RESOURCES (HR)",
    constraint: "You're firing people incorrectly and exposed.",
    graduation: "Create termination policies and process.",
    color: "bg-purple-600",
    checklist: [
      { text: "Create written termination policies", frequency: "once" },
      { text: "Document termination process and procedures", frequency: "once" },
      { text: "Ensure legal compliance for terminations", frequency: "once" },
      { text: "Train managers on proper termination protocols", frequency: "once" }
    ]
  },
  {
    name: "FINANCE",
    constraint: "You don't know how much money you can reinvest into growth.",
    graduation: "Implement daily financial monitoring",
    color: "bg-purple-600",
    checklist: [
      { text: "Check your bank account daily", frequency: "daily" },
      { text: "Track daily cash flow", frequency: "daily" },
      { text: "Monitor key financial metrics", frequency: "weekly" },
      { text: "Set up basic budgeting system", frequency: "once" }
    ]
  }
]

export default function DashboardPage() {
  const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({})
  const [selectedCoreFour] = useState<string>('warm-outreach') // Default value, will be managed in company settings
  const [frequencyFilter, setFrequencyFilter] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [currentHeadcount] = useState<number>(4) // Default value, will be managed in company settings
  const [currentRevenue] = useState<number>(0) // Default value, will be managed in company settings
  const [servicePrice] = useState<number>(5000) // Default value, will be managed in company settings
  const [deliveryTimeWeeks] = useState<number>(4) // Default value, will be managed in company settings

  const toggleChecklistItem = (itemKey: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }))
  }

  const formatRevenue = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}k`
    } else {
      return `$${amount.toLocaleString()}`
    }
  }

  const getCurrentStage = () => {
    // First filter by headcount
    const headcountMatches = stages.filter(stage => 
      currentHeadcount >= stage.headcount_min && 
      currentHeadcount <= stage.headcount_max
    )
    
    if (headcountMatches.length === 1) {
      return headcountMatches[0]
    }
    
    // If multiple matches (stages 0-2), use revenue as tiebreaker
    const revenueMatch = headcountMatches.find(stage => 
      currentRevenue >= stage.revenue_min && 
      (stage.revenue_max === null || currentRevenue <= stage.revenue_max)
    )
    
    return revenueMatch || headcountMatches[0]
  }

  const getNextStage = () => {
    const currentStage = getCurrentStage()
    if (!currentStage || currentStage.id >= 9) return null
    return stages.find(stage => stage.id === currentStage.id + 1)
  }

  const getSalesMetrics = () => {
    const nextStage = getNextStage()
    if (!nextStage || !servicePrice) return null

    const revenueGap = Math.max(0, nextStage.revenue_min - currentRevenue) // Ensure non-negative
    if (revenueGap <= 0) return null // Already at or above next stage revenue

    const salesNeeded = Math.ceil(revenueGap / servicePrice)
    
    // Use 12 months for annual planning
    const timelineMonths = 12
    
    const salesPerMonth = Math.ceil(salesNeeded / timelineMonths)
    const monthlyRevenueTarget = salesPerMonth * servicePrice
    const salesPerWeek = Math.ceil(salesPerMonth / 4.33) // Average weeks per month
    const salesPerDay = Math.ceil(salesPerWeek / 5) // Business days

    // Calculate capacity: each person can deliver 1 project per week
    // Example: 4 people × 1 project/week = 4 projects/week = 16 projects/month
    const projectsPerPersonPerWeek = 1
    const projectsPerWeekTotal = projectsPerPersonPerWeek * currentHeadcount
    const projectsPerMonthTotal = projectsPerWeekTotal * 4.33 // Average weeks per month
    const maxClientsPerYear = projectsPerWeekTotal * 52
    const maxConcurrentProjects = deliveryTimeWeeks * currentHeadcount // How many projects running at once
    const capacityUtilization = salesNeeded > 0 ? (salesNeeded / maxClientsPerYear) * 100 : 0

    return {
      revenueGap,
      salesNeeded,
      salesPerMonth,
      monthlyRevenueTarget,
      salesPerWeek,
      salesPerDay,
      maxClientsPerYear,
      maxClientsPerMonth: Math.floor(projectsPerMonthTotal),
      maxConcurrentProjects,
      capacityUtilization,
      timelineMonths
    }
  }

  const getSalesActionPoints = () => {
    const metrics = getSalesMetrics()
    if (!metrics) return []

    const actionPoints = []

    // Lead generation actions
    if (metrics.salesPerDay >= 2) {
      actionPoints.push({
        text: `Generate ${metrics.salesPerDay * 10} leads daily (10:1 lead-to-sale ratio target)`,
        frequency: "daily",
        area: "MARKETING",
        priority: "high"
      })
    } else {
      actionPoints.push({
        text: `Generate ${metrics.salesPerWeek * 10} leads weekly (10:1 lead-to-sale ratio target)`,
        frequency: "weekly", 
        area: "MARKETING",
        priority: "high"
      })
    }

    // Sales conversion actions
    actionPoints.push({
      text: `Close ${metrics.salesPerMonth} sales this month (${formatRevenue(metrics.monthlyRevenueTarget)} monthly target)`,
      frequency: "weekly",
      area: "SALES", 
      priority: "high"
    })

    actionPoints.push({
      text: `Close ${metrics.salesPerWeek} sales this week (${formatRevenue(metrics.salesPerWeek * servicePrice)} revenue)`,
      frequency: "weekly",
      area: "SALES", 
      priority: "medium"
    })

    actionPoints.push({
      text: `Follow up with ${Math.ceil(metrics.salesPerDay * 3)} prospects daily`,
      frequency: "daily",
      area: "SALES",
      priority: "medium"
    })

    // Capacity management
    if (metrics.capacityUtilization > 80) {
      actionPoints.push({
        text: `Plan to hire additional team members - you'll be at ${metrics.capacityUtilization.toFixed(0)}% capacity`,
        frequency: "once",
        area: "RECRUITING",
        priority: "high"
      })
    }

    // Delivery optimization
    if (deliveryTimeWeeks > 8) {
      actionPoints.push({
        text: `Optimize service delivery to reduce ${deliveryTimeWeeks}-week timeline`,
        frequency: "once",
        area: "PRODUCT",
        priority: "medium"
      })
    }

    // Pipeline management
    actionPoints.push({
      text: `Maintain pipeline of ${metrics.salesNeeded * 2} qualified prospects`,
      frequency: "weekly",
      area: "SALES",
      priority: "medium"
    })

    return actionPoints
  }

  const getCoreFourChecklist = (method: string) => {
    const baseItems = [
      { text: "Contact 100 people today (Rule of 100)", frequency: "daily" }
    ]

    const dailyMinutes = 100 // Standard daily time commitment

    switch (method) {
      case 'warm-outreach':
        return [
          ...baseItems,
          { text: `Spend ${dailyMinutes} minutes reaching out to warm contacts`, frequency: "daily" },
          { text: "Send follow-up messages to 5 past clients", frequency: "daily" },
          { text: "Ask 3 satisfied customers for referrals", frequency: "weekly" },
          { text: "Comment on 10 warm contacts' social media posts", frequency: "daily" },
          { text: "Update your warm contact list with new connections", frequency: "weekly" }
        ]
      case 'cold-outreach':
        return [
          ...baseItems,
          { text: `Spend ${dailyMinutes} minutes on cold outreach`, frequency: "daily" },
          { text: "Research and add 50 new prospects to your list", frequency: "weekly" },
          { text: "Create 2 new outreach message templates", frequency: "weekly" },
          { text: "Track and record response rates from this week", frequency: "weekly" },
          { text: "Send 20 cold messages to new prospects", frequency: "daily" }
        ]
      case 'content':
        return [
          ...baseItems,
          { text: "Create and post 1 piece of content", frequency: "daily" },
          { text: "Leave 100+ valuable comments on target audience posts", frequency: "daily" },
          { text: "Write the most helpful comment on 5 posts", frequency: "daily" },
          { text: "Plan next week's content calendar (7 posts)", frequency: "weekly" },
          { text: "Review last week's content performance and note insights", frequency: "weekly" },
          { text: "Engage with everyone who commented on your content", frequency: "daily" }
        ]
      case 'paid-ads':
        return [
          ...baseItems,
          { text: `Spend ${dailyMinutes} minutes managing ad campaigns`, frequency: "daily" },
          { text: "Research 5 new hooks or angles for ads", frequency: "daily" },
          { text: "Create 2 new ad creatives (images/videos)", frequency: "daily" },
          { text: "Check ad performance and adjust budgets", frequency: "daily" },
          { text: "Launch A/B test with 2 ad variations", frequency: "weekly" },
          { text: "Calculate ROI and pause underperforming ads", frequency: "weekly" }
        ]
      default:
        return [
          { text: "Choose your Core Four method above to see specific action items", frequency: "once" }
        ]
    }
  }

  const getCoreFourTips = (method: string) => {
    const baseTips = [
      "Don't stop even if you have enough leads - consistency is key",
      "Track your numbers daily to see what's working"
    ]

    switch (method) {
      case 'warm-outreach':
        return [
          ...baseTips,
          "Warm contacts convert 10x better than cold ones",
          "Always provide value before asking for anything",
          "Personal relationships are your biggest asset"
        ]
      case 'cold-outreach':
        return [
          ...baseTips,
        ]
      case 'content':
        return [
          ...baseTips,
          "Engagement is more valuable than followers",
          "Be genuinely helpful in every comment",
          "Consistency beats perfection"
        ]
      case 'paid-ads':
        return [
          ...baseTips,
          "Test everything - hooks, creatives, audiences",
          "Start small and scale what works",
          "Creative fatigue happens - refresh regularly"
        ]
      default:
        return baseTips
    }
  }

  const getFrequencyBadge = (frequency: string) => {
    const colors: Record<string, string> = {
      'daily': 'bg-red-100 text-red-800',
      'weekly': 'bg-yellow-100 text-yellow-800', 
      'once': 'bg-green-100 text-green-800',
      'ongoing': 'bg-blue-100 text-blue-800'
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[frequency] || 'bg-gray-100 text-gray-800'}`}>
        {frequency}
      </span>
    )
  }

  // Removed deadline tracking since we removed graduation settings

  const getAllTasks = () => {
    // Get regular business area tasks
    const regularTasks = businessAreas.flatMap(area => {
      const items = area.name === 'MARKETING' ? 
        getCoreFourChecklist(selectedCoreFour) : 
        area.checklist
      
      return items.map((item, index) => {
        const itemText = typeof item === 'string' ? item : item.text
        const itemFrequency = typeof item === 'string' ? 'once' : item.frequency
        const itemKey = area.name === 'MARKETING' 
          ? `${area.name}-${selectedCoreFour}-${itemText.substring(0, 20)}` 
          : `${area.name}-${index}`
        
        return {
          id: itemKey,
          text: itemText,
          frequency: itemFrequency,
          area: area.name,
          areaColor: area.color,
          completed: checkedItems[itemKey] || false,
          priority: 'medium'
        }
      })
    })

    // Get sales-specific action points
    const salesActionPoints = getSalesActionPoints().map((action, index) => {
      const itemKey = `SALES-ACTION-${index}-${action.text.substring(0, 20)}`
      const areaInfo = businessAreas.find(a => a.name === action.area)
      
      return {
        id: itemKey,
        text: action.text,
        frequency: action.frequency,
        area: action.area,
        areaColor: areaInfo?.color || 'bg-purple-600',
        completed: checkedItems[itemKey] || false,
        priority: action.priority
      }
    })

    return [...regularTasks, ...salesActionPoints]
  }

  const getFilteredTasks = () => {
    let tasks = getAllTasks()
    
    if (frequencyFilter !== 'all') {
      tasks = tasks.filter(task => task.frequency === frequencyFilter)
    }
    
    if (areaFilter !== 'all') {
      tasks = tasks.filter(task => task.area === areaFilter)
    }
    
    return tasks
  }

  const getCompletionProgress = () => {
    const allTasks = getAllTasks()
    const completedTasks = allTasks.filter(task => task.completed)
    
    return {
      total: allTasks.length,
      completed: completedTasks.length,
      percentage: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0
    }
  }

  const currentStage = getCurrentStage()

  return (
    <AppLayout 
      currentPage="dashboard" 
      stageInfo={currentStage}
    >


        {/* Monthly Revenue System */}
        {getSalesMetrics() && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">🎯 Monthly Revenue System</h2>
            
            <div className="text-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {formatRevenue(getSalesMetrics()?.monthlyRevenueTarget || 0)}
              </div>
              <div className="text-lg text-gray-700 mb-4">Monthly Target</div>
              
              <div className="flex justify-center items-center space-x-8 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{getSalesMetrics()?.salesPerMonth}</div>
                  <div className="text-gray-600">Sales/Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{getSalesMetrics()?.salesPerWeek}</div>
                  <div className="text-gray-600">Sales/Week</div>
                </div>
                
              </div>
            </div>
          </div>
        )}

        {/* Task Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📈 Task Progress</h3>
            <div className="text-sm text-gray-600">
              {getCompletionProgress().completed} / {getCompletionProgress().total} tasks
            </div>
          </div>
          <div className="space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  getCompletionProgress().percentage === 100 ? 'bg-green-500' :
                  getCompletionProgress().percentage > 50 ? 'bg-purple-500' :
                  'bg-gray-400'
                }`}
                style={{ width: `${getCompletionProgress().percentage}%` }}
              ></div>
            </div>
            <div className="text-center">
              <span className={`text-sm font-medium ${
                getCompletionProgress().percentage === 100 ? 'text-green-600' : 'text-gray-700'
              }`}>
                {getCompletionProgress().percentage.toFixed(1)}% complete
                {getCompletionProgress().percentage === 100 && ' 🎉'}
              </span>
            </div>
            
            {/* Progress by Area */}
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Progress by Area</h4>
              {businessAreas.map(area => {
                const areaItems = area.name === 'MARKETING' ? 
                  getCoreFourChecklist(selectedCoreFour) : 
                  area.checklist
                
                const areaCompleted = areaItems.filter((item, index) => {
                  const itemText = typeof item === 'string' ? item : item.text
                  const itemKey = area.name === 'MARKETING' 
                    ? `${area.name}-${selectedCoreFour}-${itemText.substring(0, 20)}` 
                    : `${area.name}-${index}`
                  return checkedItems[itemKey] || false
                }).length
                
                const areaPercentage = areaItems.length > 0 ? (areaCompleted / areaItems.length) * 100 : 0
                
                return (
                  <div key={area.name} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 w-20 truncate">{area.name}</span>
                    <div className="flex-1 mx-2 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full bg-purple-400 transition-all duration-300"
                        style={{ width: `${areaPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-500 w-8 text-right">{areaCompleted}/{areaItems.length}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* AI Business Area Advisor */}
        {areaFilter !== 'all' && (() => {
          const filteredArea = businessAreas.find(area => area.name === areaFilter)
          return filteredArea ? (
            <div className="mb-6">
              <BusinessAreaAdvisor
                stage={`${getCurrentStage()?.id} - ${getCurrentStage()?.name}`}
                businessArea={filteredArea.name}
                currentSituation={`Working on ${filteredArea.constraint}. Goal: ${filteredArea.graduation}`}
                context={`Current headcount: ${currentHeadcount}, Revenue: $${currentRevenue.toLocaleString()}, Service price: $${servicePrice.toLocaleString()}`}
              />
            </div>
          ) : null
        })()}

        {/* Combined Business Areas & Action Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold">📋 Action Items ({getFilteredTasks().length} tasks)</h2>
              {areaFilter !== 'all' && (() => {
                const filteredArea = businessAreas.find(area => area.name === areaFilter)
                return filteredArea ? (
                  <div className="flex items-center gap-3 text-sm">
                    <div className={`w-4 h-4 rounded ${filteredArea.color}`}></div>
                    <div>
                      <div className="font-semibold">{filteredArea.name}</div>
                      <div className="text-xs text-gray-300">
                        <strong>Constraint:</strong> {filteredArea.constraint}
                      </div>
                      <div className="text-xs text-gray-300">
                        <strong>To Graduate:</strong> {filteredArea.graduation}
                        {filteredArea.name === 'MARKETING' && selectedCoreFour && (
                          <span className="ml-2 text-purple-300">
                            Method: {selectedCoreFour.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
            <div className="flex items-center gap-4">
              {/* Frequency Filter */}
              <select
                value={frequencyFilter}
                onChange={(e) => setFrequencyFilter(e.target.value)}
                className="px-3 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Frequencies</option>
                <option value="daily">Daily Tasks</option>
                <option value="weekly">Weekly Tasks</option>
                <option value="once">One-time Tasks</option>
                <option value="ongoing">Ongoing Tasks</option>
              </select>

              {/* Area Filter */}
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="px-3 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Areas</option>
                {businessAreas.map(area => (
                  <option key={area.name} value={area.name}>{area.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Show all business areas when no filter is applied */}
          {areaFilter === 'all' && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Stage 2 Business Areas Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {businessAreas.map((area) => (
                  <div key={area.name} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded ${area.color}`}></div>
                      <div className="font-semibold text-xs text-gray-900 relative group">
                        {area.name}
                        {area.name === 'MARKETING' && selectedCoreFour && (
                          <>
                            <span className="ml-1 text-xs opacity-75">💡</span>
                            {/* Tooltip for Marketing Tips */}
                            <div className="absolute bottom-full left-0 mb-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
                              <div className="font-semibold mb-2 text-purple-300">💡 Marketing Tips:</div>
                              <ul className="space-y-1">
                                {getCoreFourTips(selectedCoreFour).map((tip, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-purple-400 mr-2">•</span>
                                    <span className="leading-relaxed">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      <strong>Constraint:</strong> {area.constraint}
                    </div>
                    <div className="text-xs text-gray-700">
                      <strong>To Graduate:</strong> {area.graduation}
                      {area.name === 'MARKETING' && selectedCoreFour && (
                        <div className="mt-1 text-purple-600 font-medium">
                          Method: {selectedCoreFour.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {getFilteredTasks().length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                {selectedCoreFour ? 'No tasks match your filters.' : 'Select a Core Four marketing method to see all tasks.'}
              </div>
            ) : (
              getFilteredTasks().map((task) => (
                <label key={task.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  task.priority === 'high' ? 'border-l-4 border-red-500 bg-red-50' : 
                  task.priority === 'medium' ? 'border-l-4 border-yellow-500' : ''
                }`}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleChecklistItem(task.id)}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  
                  <div className={`w-3 h-3 rounded-full ${task.areaColor}`}></div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.text}
                        </span>
                        {task.priority === 'high' && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                            HIGH
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {task.area}
                        </span>
                        {getFrequencyBadge(task.frequency)}
                      </div>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* HubSpot Contacts Analyzer */}
        <div className="mt-6">
          <HubSpotContactsAnalyzer />
        </div>

        {/* Saved Action Plans */}
        <div className="mt-6">
          <SavedActionPlans />
        </div>
    </AppLayout>
  )
}
