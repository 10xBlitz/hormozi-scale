interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIOptions {
  model?: string
  max_tokens?: number
  temperature?: number
}

export async function callOpenAI(
  messages: OpenAIMessage[],
  options: OpenAIOptions = {}
): Promise<string> {
  const response = await fetch('/api/openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: options.model || 'gpt-4o-mini',
      max_tokens: options.max_tokens || 1000,
      temperature: options.temperature || 0.7,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get response from OpenAI')
  }

  const data = await response.json()
  return data.content
}

// Stage-specific goals for each business area
const STAGE_GOALS = {
  'Stage 0 - Improvise': {
    PRODUCT: 'Create a minimum viable product that solves a real problem',
    MARKETING: 'Find your first customers through personal networks',
    SALES: 'Learn to sell your solution through direct conversations',
    'CUSTOMER SERVICE': 'Handle early customer feedback personally',
    IT: 'Set up basic systems for customer communication',
    RECRUITING: 'Identify what help you need most',
    HR: 'Establish basic company structure',
    FINANCE: 'Track every dollar in and out'
  },
  'Stage 1 - Monetize': {
    PRODUCT: 'Make your product valuable enough that customers pay',
    MARKETING: 'Develop consistent lead generation methods',
    SALES: 'Create a repeatable sales process',
    'CUSTOMER SERVICE': 'Build systems to handle customer inquiries',
    IT: 'Implement basic CRM and communication tools',
    RECRUITING: 'Hire your first part-time helper',
    HR: 'Create basic employment documentation',
    FINANCE: 'Establish proper bookkeeping and cash flow tracking'
  },
  'Stage 2 - Advertise': {
    PRODUCT: 'Focus on making it good before making it scalable',
    MARKETING: 'Implement Rule of 100 daily and use Core Four consistently',
    SALES: 'Create and implement CLOSER framework script',
    'CUSTOMER SERVICE': 'Develop customer service scripts and testimonial processes',
    IT: 'Set up lead capture and customer tracking systems',
    RECRUITING: 'Transition from freelancers to full-time workers',
    HR: 'Establish proper hiring processes',
    FINANCE: 'Check bank account daily and track key metrics'
  },
  'Stage 3 - Stabilize': {
    PRODUCT: 'Build scalable systems and processes',
    MARKETING: 'Scale marketing efforts across multiple channels',
    SALES: 'Build a sales team and systematize the process',
    'CUSTOMER SERVICE': 'Create comprehensive customer success processes',
    IT: 'Implement robust systems and security measures',
    RECRUITING: 'Build a systematic hiring process',
    HR: 'Develop comprehensive HR policies and procedures',
    FINANCE: 'Implement financial controls and reporting'
  }
}

// Helper function for getting actionable steps by business area and stage
export async function getActionableSteps(
  stage: string,
  businessArea: string,
  currentSituation: string,
  context?: string
): Promise<{
  goal: string
  steps: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    timeframe: string
    resources?: string
  }>
}> {
  const stageKey = Object.keys(STAGE_GOALS).find(key => key.includes(stage)) || 'Stage 2 - Advertise'
  const stageGoals = STAGE_GOALS[stageKey as keyof typeof STAGE_GOALS]
  const goal = (stageGoals && businessArea in stageGoals) 
    ? stageGoals[businessArea as keyof typeof stageGoals] 
    : 'Improve this business area'

  const systemPrompt = `You are a scaling expert helping companies grow through 10 stages. For each business area and stage, provide specific, actionable steps that lead to the stage goal.

**Response Format:**
Return a nicely formatted text response that includes:

🎯 **STAGE GOAL:**
[Clear, specific goal statement for this business area and stage]

📋 **ACTION PLAN:**

**HIGH PRIORITY - Critical First Steps:**

1. **🏆 [Clear, Action-Oriented Title]**

   **📝 Description:**
   [Detailed explanation of what this action entails and why it's important]

   **⚡ How to Execute:**
   [Step-by-step instructions on how to implement this action]

   **⏰ Timeline:** [Specific timeframe like "Complete within 1 week"]
   **🛠️ Resources & Links:**
   • [Tool/Service Name] - [Direct link if available, e.g., https://forms.google.com]
   • [Additional resources or people needed]
   • [Cost considerations if any]

   **✅ Success Criteria:**
   [Measurable outcomes that prove this action is complete]

**MEDIUM PRIORITY - Build Sustainable Growth:**

2. **🚀 [Clear, Action-Oriented Title]**

   **📝 Description:**
   [Detailed explanation of this growth-building action]

   **⚡ How to Execute:**
   [Specific implementation steps]

   **⏰ Timeline:** [Realistic timeframe for completion]
   **🛠️ Resources & Links:**
   • [Primary tool or service with link]
   • [Supporting resources]
   • [Budget considerations]

   **✅ Success Criteria:**
   [Clear metrics for measuring success]

**LOW PRIORITY - Future Enhancements:**

3. **💡 [Clear, Action-Oriented Title]**

   **📝 Description:**
   [Explanation of this enhancement and its benefits]

   **⚡ How to Execute:**
   [Implementation guidance]

   **⏰ Timeline:** [When to consider this action]
   **🛠️ Resources & Links:**
   • [Tools and services needed]
   • [Learning resources or documentation]

   **✅ Success Criteria:**
   [Success indicators for this enhancement]

**Guidelines:**
- Focus on 5-8 practical, executable steps
- Include direct links to tools and resources whenever possible
- Make timeframes realistic for a business in this stage
- Each step should have measurable success criteria
- Start with immediate actions that create quick wins
- Consider budget constraints and available resources
- Provide specific tool recommendations with links

Make it conversational and encouraging - like advice from an experienced scaling mentor!`

  const userPrompt = `I'm in ${stage} working on ${businessArea}.

Current situation: ${currentSituation}
${context ? `\nAdditional context: ${context}` : ''}

The goal for ${businessArea} in ${stage} is: ${goal}

Please provide 5-8 detailed, practical action steps that will help me achieve this goal. Each step should:
- Be something I can realistically start working on this week
- Include specific tools, processes, or methods to use
- Have clear success criteria
- Consider my current business stage and resources

Make the steps progressive - start with the most immediate actions and build toward longer-term improvements. Focus on actions that will create the most impact for a business in ${stage}.`

  const response = await callOpenAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ])

  try {
    // Try to parse the JSON response first
    const parsed = JSON.parse(response)
    return {
      goal: parsed.goal || goal,
      steps: parsed.steps || []
    }
  } catch {
    // If JSON parsing fails, parse the formatted text response
    return parseFormattedTextResponse(response, goal)
  }
}

// Helper function to parse formatted text response
function parseFormattedTextResponse(response: string, defaultGoal: string) {
  const lines = response.split('\n').map(line => line.trim()).filter(line => line.length > 0)

  let goal = defaultGoal
  const steps: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    timeframe: string
    resources?: string
  }> = []

  let currentPriority: 'high' | 'medium' | 'low' = 'medium'
  let currentStep: Partial<typeof steps[0]> & {
    title?: string
    description?: string
    execution?: string
    links?: string[]
  } = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Extract goal
    if (line.includes('STAGE GOAL:') || line.includes('🎯')) {
      const goalMatch = line.match(/(?:STAGE GOAL:|🎯)\s*(.+)/i)
      if (goalMatch) {
        goal = goalMatch[1].trim()
      }
      continue
    }

    // Extract priority sections
    if (line.includes('HIGH PRIORITY')) {
      currentPriority = 'high'
      continue
    }
    if (line.includes('MEDIUM PRIORITY')) {
      currentPriority = 'medium'
      continue
    }
    if (line.includes('LOW PRIORITY')) {
      currentPriority = 'low'
      continue
    }

    // Extract step numbers and titles
    if (/^\d+\./.test(line)) {
      // Save previous step if it exists
      if (currentStep.title || currentStep.action) {
        const fullAction = [
          currentStep.title && `**${currentStep.title}**`,
          currentStep.description && `Description: ${currentStep.description}`,
          currentStep.execution && `How to Execute: ${currentStep.execution}`,
          currentStep.timeframe && `Timeline: ${currentStep.timeframe}`,
          currentStep.resources && `Resources: ${currentStep.resources}`,
          currentStep.links && currentStep.links.length > 0 && `Links: ${currentStep.links.join(', ')}`
        ].filter(Boolean).join('\n\n')

        steps.push({
          action: fullAction || currentStep.title || 'Action details',
          priority: currentStep.priority || currentPriority,
          timeframe: currentStep.timeframe || 'TBD',
          resources: currentStep.resources || (currentStep.links ? currentStep.links.join(', ') : undefined)
        })
      }

      // Start new step
      currentStep = {
        priority: currentPriority,
        links: []
      }

      // Extract step title (look for trophy/rocket/lightbulb emojis followed by bold text)
      const titleMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*/)
      if (titleMatch) {
        currentStep.title = titleMatch[1].trim()
      }
      continue
    }

    // Extract Description section
    if (line.includes('**📝 Description:**')) {
      let description = ''
      i++ // Move to next line
      while (i < lines.length && !lines[i].includes('**⚡ How to Execute:**') && !lines[i].includes('**⏰ Timeline:**')) {
        if (lines[i].trim()) {
          description += (description ? ' ' : '') + lines[i].trim()
        }
        i++
      }
      i-- // Back up one line since we went too far
      currentStep.description = description
      continue
    }

    // Extract How to Execute section
    if (line.includes('**⚡ How to Execute:**')) {
      let execution = ''
      i++ // Move to next line
      while (i < lines.length && !lines[i].includes('**⏰ Timeline:**') && !lines[i].includes('**🛠️ Resources')) {
        if (lines[i].trim()) {
          execution += (execution ? ' ' : '') + lines[i].trim()
        }
        i++
      }
      i-- // Back up one line since we went too far
      currentStep.execution = execution
      continue
    }

    // Extract Timeline
    if (line.includes('**⏰ Timeline:**')) {
      const timelineMatch = line.match(/\*\*⏰ Timeline:\*\*\s*(.+)/)
      if (timelineMatch) {
        currentStep.timeframe = timelineMatch[1].trim()
      }
      continue
    }

    // Extract Resources & Links
    if (line.includes('**🛠️ Resources & Links:**')) {
      let resources = ''
      const links: string[] = []
      i++ // Move to next line

      while (i < lines.length && !lines[i].includes('**✅ Success Criteria:**') && !/^\d+\./.test(lines[i])) {
        const resourceLine = lines[i].trim()
        if (resourceLine.startsWith('•') || resourceLine.startsWith('-')) {
          const cleanResource = resourceLine.substring(1).trim()
          resources += (resources ? '; ' : '') + cleanResource

          // Extract URLs from the resource line
          const urlMatches = cleanResource.match(/https?:\/\/[^\s]+/g)
          if (urlMatches) {
            links.push(...urlMatches)
          }
        }
        i++
      }
      i-- // Back up one line since we went too far

      currentStep.resources = resources
      currentStep.links = links
      continue
    }

    // Extract Success Criteria
    if (line.includes('**✅ Success Criteria:**')) {
      // We don't need to parse success criteria for the current structure,
      // but we can use it as a delimiter
      continue
    }
  }

  // Add the last step
  if (currentStep.title || currentStep.action) {
    const fullAction = [
      currentStep.title && `**${currentStep.title}**`,
      currentStep.description && `Description: ${currentStep.description}`,
      currentStep.execution && `How to Execute: ${currentStep.execution}`,
      currentStep.timeframe && `Timeline: ${currentStep.timeframe}`,
      currentStep.resources && `Resources: ${currentStep.resources}`,
      currentStep.links && currentStep.links.length > 0 && `Links: ${currentStep.links.join(', ')}`
    ].filter(Boolean).join('\n\n')

    steps.push({
      action: fullAction || currentStep.title || 'Action details',
      priority: currentStep.priority || currentPriority,
      timeframe: currentStep.timeframe || 'TBD',
      resources: currentStep.resources || (currentStep.links ? currentStep.links.join(', ') : undefined)
    })
  }

  // If no steps were parsed, create a fallback
  if (steps.length === 0) {
    steps.push({
      action: response,
      priority: 'high',
      timeframe: 'Immediate'
    })
  }

  return { goal, steps }
}

// Helper function for generating action items
export async function generateActionItems(
  businessArea: string,
  stage: string,
  currentSituation: string
): Promise<string> {
  const systemPrompt = `You are a business scaling consultant. Generate specific, actionable tasks for companies in different growth stages. Focus on immediate, concrete actions that can be completed.`

  const userPrompt = `Generate 5 specific action items for ${businessArea} in Stage ${stage}. Current situation: ${currentSituation}. Make each item specific, measurable, and immediately actionable.`

  return callOpenAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ])
}

// Helper function for analyzing business metrics
export async function analyzeBusinessMetrics(
  metrics: Record<string, unknown>,
  stage: string
): Promise<string> {
  const systemPrompt = `You are a business analyst specializing in scaling companies. Analyze business metrics and provide insights on what they mean for growth and what actions to take.`

  const userPrompt = `Analyze these business metrics for a company in Stage ${stage}:\n\n${JSON.stringify(metrics, null, 2)}\n\nWhat do these metrics tell us about the company's health and what should they focus on next?`

  return callOpenAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ])
}
