-- Avara v2 — Documents, Assets, Debts Tables

-- Track uploaded documents and their parsing status
CREATE TABLE uploaded_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'bank_statement','mf_statement','demat_statement','salary_slip',
    'form_16','itr','insurance_policy','loan_statement',
    'esop_grant','nps_statement','epf_passbook','other'
  )),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INT NOT NULL,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded','processing','parsed','failed')),
  parsed_data JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own documents" ON uploaded_documents FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_docs_user_type ON uploaded_documents(user_id, document_type);

-- Individual assets (from conversation or document parsing)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'mutual_fund','stock','fd','ppf','epf','nps',
    'gold_physical','gold_digital','gold_sgb',
    'real_estate','crypto','esop_rsu','other'
  )),
  name TEXT,
  current_value NUMERIC,
  invested_value NUMERIC,
  details JSONB DEFAULT '{}',
  source TEXT DEFAULT 'conversation' CHECK (source IN ('conversation','document','mfapi')),
  source_document_id UUID REFERENCES uploaded_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own assets" ON assets FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_assets_user ON assets(user_id);

-- Individual debts/liabilities
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  debt_type TEXT NOT NULL CHECK (debt_type IN (
    'home_loan','education_loan','car_loan','personal_loan',
    'credit_card','bnpl','family','other'
  )),
  outstanding NUMERIC,
  emi NUMERIC,
  interest_rate NUMERIC,
  tenure_remaining_months INT,
  lender TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own debts" ON debts FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_debts_user ON debts(user_id);
