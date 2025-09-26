-- Replace personality test system with productivity assessment system

-- Update users table to use productivity assessment instead of personality test
ALTER TABLE users ADD COLUMN productivity_assessment_completed boolean DEFAULT false;

-- Create work experiences table
CREATE TABLE work_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_activities text,
  position text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  work_duration text, -- "3 года", "6 месяцев" etc
  reason_for_leaving text,
  functions_performed text,
  work_products text, -- What was the product/result of work
  result_measurement text, -- How they measured their results
  product_timeline text, -- How long to produce their work product
  team_comparison_score integer CHECK (team_comparison_score >= 1 AND team_comparison_score <= 5), -- 1-5 scale vs other employees
  workload_change_over_time text, -- How workload changed during employment
  responsibility_evolution text, -- How responsibilities grew/changed
  key_achievements text, -- Main accomplishments
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create knowledge assessments table
CREATE TABLE knowledge_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recent_learning_activities text, -- What they learned recently (online, offline, training, etc)
  professional_development text, -- Courses, certifications, skills developed
  future_learning_goals text, -- What they want to learn next
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create productivity assessments table (main assessment results)
CREATE TABLE productivity_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Personal Information
  citizenship text,
  residence_location text,
  family_status text,
  has_children boolean,
  living_situation text, -- Who they live with
  actual_address text,
  financial_obligations text, -- Credits, mortgages, etc
  legal_issues text, -- Court cases, etc
  chronic_illnesses text,
  minimum_salary_requirement integer,

  -- Assessment Scores
  role_type text CHECK (role_type IN ('manager', 'specialist')),
  motivation_level integer CHECK (motivation_level >= 1 AND motivation_level <= 4), -- 1=money, 2=personal_benefit, 3=personal_conviction, 4=duty
  iq_test_score integer,
  personality_test_score integer,
  leadership_test_score integer,

  -- Assessment Conclusion
  overall_productivity_score integer CHECK (overall_productivity_score >= 0 AND overall_productivity_score <= 100),
  assessor_notes text,
  probation_recommendation text CHECK (probation_recommendation IN ('yes', 'no', 'never_consider')),
  planned_start_date date,

  -- Assessment metadata
  assessment_version text DEFAULT 'v1.0',
  completed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_work_experiences_user_id ON work_experiences(user_id);
CREATE INDEX idx_work_experiences_dates ON work_experiences(start_date, end_date);
CREATE INDEX idx_knowledge_assessments_user_id ON knowledge_assessments(user_id);
CREATE INDEX idx_productivity_assessments_user_id ON productivity_assessments(user_id);
CREATE INDEX idx_productivity_assessments_scores ON productivity_assessments(overall_productivity_score, motivation_level);

-- Add RLS policies for security
ALTER TABLE work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_assessments ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own work experiences" ON work_experiences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work experiences" ON work_experiences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work experiences" ON work_experiences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own work experiences" ON work_experiences
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own knowledge assessments" ON knowledge_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge assessments" ON knowledge_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge assessments" ON knowledge_assessments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own productivity assessments" ON productivity_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own productivity assessments" ON productivity_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own productivity assessments" ON productivity_assessments
  FOR UPDATE USING (auth.uid() = user_id);

-- Drop old personality test related tables (if they exist)
DROP TABLE IF EXISTS personality_analysis CASCADE;
DROP TABLE IF EXISTS test_responses CASCADE;

-- Clean up old questionnaires table (guarded if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'questionnaires'
  ) THEN
    DELETE FROM questionnaires WHERE question_type = 'open_text';

    -- Insert productivity assessment questions/sections metadata
    INSERT INTO questionnaires (question_text, question_type, category, is_active, order_index) VALUES
    ('Работа №1', 'work_experience', 'productivity', true, 1),
    ('Работа №2', 'work_experience', 'productivity', true, 2),
    ('Работа №3', 'work_experience', 'productivity', true, 3),
    ('Знания (Компетентность)', 'knowledge', 'competency', true, 4),
    ('Дополнительная информация', 'personal_info', 'background', true, 5),
    ('Заключение по кандидату', 'assessment', 'evaluation', true, 6)
    ON CONFLICT (question_text) DO NOTHING;
  END IF;
END $$;