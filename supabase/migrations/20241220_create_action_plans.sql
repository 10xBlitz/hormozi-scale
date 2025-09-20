-- Create action_plans table
CREATE TABLE IF NOT EXISTS action_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL,
  business_area VARCHAR(50) NOT NULL,
  goal TEXT NOT NULL,
  current_situation TEXT,
  context TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_action_plans_user_id ON action_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_stage ON action_plans(stage);
CREATE INDEX IF NOT EXISTS idx_action_plans_business_area ON action_plans(business_area);
CREATE INDEX IF NOT EXISTS idx_action_plans_created_at ON action_plans(created_at);

-- Enable RLS
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own action plans" ON action_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own action plans" ON action_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action plans" ON action_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action plans" ON action_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_action_plans_updated_at
  BEFORE UPDATE ON action_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

