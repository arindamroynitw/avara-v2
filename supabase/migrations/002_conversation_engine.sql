-- Avara v2 — Conversation Engine Tables

CREATE TABLE conversation_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  state JSONB NOT NULL DEFAULT '{}',
  summary TEXT DEFAULT '',
  message_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE conversation_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own state" ON conversation_state FOR ALL USING (auth.uid() = user_id);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  chapter INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own messages" ON messages FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_messages_user_created ON messages(user_id, created_at);

CREATE TABLE financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  age INT, city TEXT, marital_status TEXT, dependents INT DEFAULT 0,
  employer TEXT, industry TEXT, role TEXT, tenure_years NUMERIC,
  housing TEXT, parent_financially_independent BOOLEAN, parent_health_insurance BOOLEAN,
  monthly_take_home NUMERIC, variable_pay_annual NUMERIC, side_income_monthly NUMERIC,
  monthly_expenses NUMERIC, expense_breakdown JSONB DEFAULT '{}', savings_rate NUMERIC,
  health_insurance_status TEXT, health_insurance_sum NUMERIC,
  term_life_insurance BOOLEAN, term_life_cover NUMERIC,
  has_endowment_ulip BOOLEAN, endowment_ulip_details JSONB DEFAULT '[]',
  tax_regime TEXT, deductions_claimed JSONB DEFAULT '{}',
  goals JSONB DEFAULT '[]', hurdle_rate NUMERIC,
  risk_willingness TEXT, risk_capacity TEXT,
  past_panic_sold BOOLEAN, career_trajectory TEXT, life_3_years TEXT,
  true_asset_allocation JSONB DEFAULT '{}', total_net_worth NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own profile" ON financial_profiles FOR ALL USING (auth.uid() = user_id);
