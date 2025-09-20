import { createClient } from '@/lib/supabase/client'

export interface ActionStep {
  action: string
  priority: 'high' | 'medium' | 'low'
  timeframe: string
  resources?: string
  completed?: boolean
  completed_at?: string
}

export interface ActionPlan {
  id?: string
  user_id?: string
  stage: string
  business_area: string
  goal: string
  current_situation?: string
  context?: string
  steps: ActionStep[]
  created_at?: string
  updated_at?: string
  is_completed?: boolean
  completed_at?: string
}

export class ActionPlanService {
  private supabase = createClient()

  async saveActionPlan(actionPlan: Omit<ActionPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ActionPlan | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await this.supabase
        .from('action_plans')
        .insert({
          user_id: user.id,
          stage: actionPlan.stage,
          business_area: actionPlan.business_area,
          goal: actionPlan.goal,
          current_situation: actionPlan.current_situation,
          context: actionPlan.context,
          steps: actionPlan.steps,
          is_completed: actionPlan.is_completed || false
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving action plan:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in saveActionPlan:', error)
      return null
    }
  }

  async getActionPlans(): Promise<ActionPlan[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await this.supabase
        .from('action_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching action plans:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getActionPlans:', error)
      return []
    }
  }

  async getActionPlanById(id: string): Promise<ActionPlan | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await this.supabase
        .from('action_plans')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching action plan:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getActionPlanById:', error)
      return null
    }
  }

  async updateActionPlan(id: string, updates: Partial<ActionPlan>): Promise<ActionPlan | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await this.supabase
        .from('action_plans')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating action plan:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateActionPlan:', error)
      return null
    }
  }

  async markStepCompleted(planId: string, stepIndex: number): Promise<ActionPlan | null> {
    try {
      const currentPlan = await this.getActionPlanById(planId)
      if (!currentPlan) return null

      const updatedSteps = [...currentPlan.steps]
      if (stepIndex >= 0 && stepIndex < updatedSteps.length) {
        updatedSteps[stepIndex] = {
          ...updatedSteps[stepIndex],
          completed: true,
          completed_at: new Date().toISOString()
        }
      }

      return await this.updateActionPlan(planId, { steps: updatedSteps })
    } catch (error) {
      console.error('Error in markStepCompleted:', error)
      return null
    }
  }

  async markPlanCompleted(id: string): Promise<ActionPlan | null> {
    return await this.updateActionPlan(id, {
      is_completed: true,
      completed_at: new Date().toISOString()
    })
  }

  async deleteActionPlan(id: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await this.supabase
        .from('action_plans')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting action plan:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteActionPlan:', error)
      return false
    }
  }
}

export const actionPlanService = new ActionPlanService()

