# Avara v1 — Technical Specification
## Step 1: The Onboarding Experience

> **Version:** 1.0 · **Date:** March 2026 · **Status:** Implementation-Ready
>
> This document translates the PRD into an actionable technical specification with all architectural decisions resolved.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Authentication & User Management](#4-authentication--user-management)
5. [Database Schema](#5-database-schema)
6. [Conversation Engine](#6-conversation-engine)
7. [AI Integration](#7-ai-integration)
8. [Voice Integration](#8-voice-integration)
9. [Document Processing](#9-document-processing)
10. [Chat UI & Frontend Architecture](#10-chat-ui--frontend-architecture)
11. [Profile Dashboard](#11-profile-dashboard)
12. [Rules Engine](#12-rules-engine)
13. [Insight System](#13-insight-system)
14. [Market Data Integration](#14-market-data-integration)
15. [File Storage & Security](#15-file-storage--security)
16. [API Design](#16-api-design)
17. [Deployment & Infrastructure](#17-deployment--infrastructure)
18. [Design System](#18-design-system)
19. [Key Flows](#19-key-flows)
20. [Open Items & Deferred](#20-open-items--deferred)

---

## 1. Executive Summary

Avara v1 is an AI-powered onboarding experience for a SEBI-registered investment advisory platform targeting urban Indian professionals under 30. The product collects comprehensive financial data through a conversational AI (Ria) across text and voice modalities, producing a structured financial profile that feeds into a future financial plan (Step 2, not in scope for v1).

**Scope:** Onboarding only. The "Bridge to Step 2" CTA will display a holding state ("Your financial plan is being prepared — we'll notify you").

**Launch target:** Public launch. Production-quality UX, error handling, and reliability required.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client (PWA)                          │
│  Next.js App Router · Vercel AI SDK · Tailwind/shadcn   │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Chat UI  │  │ Profile      │  │ Document Upload    │  │
│  │ (useChat)│  │ Dashboard    │  │ (File picker)      │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
└───────┼────────────────┼──────────────────┼──────────────┘
        │                │                  │
        ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                 Vercel (API Layer)                        │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────┐  │
│  │ /api/chat      │  │ /api/profile   │  │ /api/docs  │  │
│  │ (streaming)    │  │ (CRUD)         │  │ (upload)   │  │
│  └───────┬────────┘  └───────┬────────┘  └─────┬─────┘  │
│          │                   │                  │        │
│  ┌───────┴───────────────────┴──────────────────┴─────┐  │
│  │              Conversation Engine                    │  │
│  │  State Manager · Rules Engine · Data Extractor      │  │
│  └───────┬───────────────────┬──────────────────┬─────┘  │
└──────────┼───────────────────┼──────────────────┼────────┘
           │                   │                  │
     ┌─────┴─────┐      ┌─────┴─────┐     ┌─────┴──────┐
     │  OpenAI   │      │ Supabase  │     │ ElevenLabs │
     │  GPT-4o   │      │ DB/Auth/  │     │ Conv. AI   │
     │           │      │ Storage   │     │ Agent      │
     └───────────┘      └───────────┘     └────────────┘
```

**Key architectural decisions:**
- **Two parallel LLM calls per user turn:** One for Ria's conversational response (streaming), one for structured data extraction (non-streaming). Both use OpenAI.
- **Rules engine (TypeScript):** Determines when to inject UI components (upload cards, insights, quick replies) based on conversation state. The LLM generates text only; components are injected by the backend.
- **Structured state + rolling summary:** Conversation state is a JSON object tracking collected data, current chapter, and pending items. A rolling summary of past conversation is maintained for context. The LLM receives state + summary + last N messages (not full history).
- **Batch profile updates:** The financial profile updates at the end of each chapter, not after every message. User sees a confirmation summary at chapter transitions.
- **Post-call voice sync:** After an ElevenLabs voice call ends, the transcript and tool logs are processed to update conversation state.

---

## 3. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 15 (App Router) | Best Vercel integration, API routes, server components for profile, React Server Components |
| **Language** | TypeScript | Type safety critical for financial data handling |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first with customizable component primitives. Premium, trust-evoking design achievable |
| **Chat State** | Vercel AI SDK (`useChat`) | Native streaming support, lightweight, designed for AI chat UIs |
| **Charts** | Recharts | Lightweight, React-native charting for insight cards (donut, bar, comparisons) |
| **Auth** | Supabase Auth (email + password) | Simple for v1. No OTP cost. Built into Supabase |
| **Database** | Supabase (PostgreSQL) | Relational data, RLS for user isolation, real-time subscriptions available |
| **File Storage** | Supabase Storage | S3-compatible, RLS policies, sufficient for v1 |
| **LLM** | OpenAI GPT-4o | Conversation, data extraction, document parsing — single provider |
| **Voice** | ElevenLabs Conversational AI Agent | Hosted agent handles turn-taking, latency, and real-time voice. System prompt + tools provided |
| **MF Data** | mfapi.in | Free API for mutual fund NAV data |
| **Deployment** | Vercel | Native Next.js hosting, edge functions, serverless API routes |
| **Background Jobs** | Simple async (Vercel serverless) | No job queue for v1. Document parsing runs in extended-timeout serverless functions |

---

## 4. Authentication & User Management

### Auth Flow
1. User lands on signup page
2. Enters email, password, and full name
3. Supabase Auth creates account + sends verification email
4. On email verification, user is redirected to the chat interface
5. Ria's first message fires immediately

### Supabase Auth Configuration
- **Provider:** Email + password (Supabase built-in)
- **Session management:** JWT tokens via Supabase client SDK, auto-refresh
- **Password requirements:** Minimum 8 characters (Supabase default)
- **Email verification:** Required before accessing the app
- **Rate limiting:** Supabase built-in rate limits for auth endpoints

### User Record
On signup, create a `users` profile record linked to `auth.users`:
```
users
├── id (UUID, references auth.users)
├── full_name (text)
├── email (text)
├── created_at (timestamptz)
├── onboarding_status (enum: in_progress | completed)
├── current_chapter (int, 1-4)
└── updated_at (timestamptz)
```

---

## 5. Database Schema

All tables use Supabase RLS with `auth.uid() = user_id` policies.

### Core Tables

```sql
-- User profile (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  onboarding_status TEXT DEFAULT 'in_progress' CHECK (onboarding_status IN ('in_progress', 'completed')),
  current_chapter INT DEFAULT 1 CHECK (current_chapter BETWEEN 1 AND 4),
  sophistication_tier INT DEFAULT 2 CHECK (sophistication_tier BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation state (structured JSON state + rolling summary)
CREATE TABLE conversation_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  state JSONB NOT NULL DEFAULT '{}',        -- structured data collected so far
  summary TEXT DEFAULT '',                    -- rolling conversation summary
  chapter_data JSONB DEFAULT '{}',           -- per-chapter collected data before commit
  pending_confirmations JSONB DEFAULT '[]',  -- data awaiting user confirmation
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN (
    'text', 'quick_reply', 'upload_card', 'insight_card',
    'progress_nudge', 'voice_summary', 'document_status'
  )),
  metadata JSONB DEFAULT '{}',  -- type-specific data (chart data, quick reply options, etc.)
  chapter INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Financial profile (the structured data that Ria collects)
CREATE TABLE financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,

  -- Personal
  age INT,
  city TEXT,
  marital_status TEXT,
  dependents INT DEFAULT 0,
  employer TEXT,
  industry TEXT,
  role TEXT,
  tenure_years NUMERIC,
  housing TEXT CHECK (housing IN ('renting', 'owning', 'family', NULL)),
  parent_financially_independent BOOLEAN,
  parent_health_insurance BOOLEAN,

  -- Income
  monthly_take_home NUMERIC,
  variable_pay_annual NUMERIC,
  side_income_monthly NUMERIC,
  income_stability TEXT CHECK (income_stability IN ('stable', 'variable', 'uncertain', NULL)),

  -- Expenses
  monthly_expenses NUMERIC,
  expense_breakdown JSONB DEFAULT '{}',  -- {rent, food, transport, subscriptions, ...}
  savings_rate NUMERIC,                   -- computed: (income - expenses) / income

  -- Insurance
  health_insurance_status TEXT CHECK (health_insurance_status IN ('personal', 'employer_only', 'both', 'none', NULL)),
  health_insurance_sum NUMERIC,
  term_life_insurance BOOLEAN,
  term_life_cover NUMERIC,
  has_endowment_ulip BOOLEAN,
  endowment_ulip_details JSONB DEFAULT '[]',

  -- Tax
  tax_regime TEXT CHECK (tax_regime IN ('old', 'new', NULL)),
  deductions_claimed JSONB DEFAULT '{}',  -- {80C, 80D, HRA, NPS, ...}

  -- Goals & Risk
  goals JSONB DEFAULT '[]',              -- [{type, description, amount, timeline, firmness}]
  hurdle_rate NUMERIC,                    -- target return % if no concrete goals
  risk_willingness TEXT CHECK (risk_willingness IN ('conservative', 'moderate', 'aggressive', NULL)),
  risk_capacity TEXT CHECK (risk_capacity IN ('low', 'medium', 'high', NULL)),
  past_panic_sold BOOLEAN,
  career_trajectory TEXT,                 -- free text from conversation
  life_3_years TEXT,                      -- free text from "life in 3 years" question

  -- Computed
  true_asset_allocation JSONB DEFAULT '{}',  -- {equity_pct, debt_pct, gold_pct, real_estate_pct, other_pct}
  total_net_worth NUMERIC,

  -- Completeness tracking
  completeness JSONB DEFAULT '{}',  -- {personal: [...items], income: [...items], ...}

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Investment assets (one row per asset)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'mutual_fund', 'stock', 'fd', 'ppf', 'epf', 'nps',
    'gold_physical', 'gold_digital', 'gold_sgb',
    'real_estate', 'crypto', 'esop_rsu', 'other'
  )),
  name TEXT,                     -- fund name, stock name, property description
  current_value NUMERIC,
  invested_value NUMERIC,        -- if known
  details JSONB DEFAULT '{}',    -- type-specific details
  source TEXT CHECK (source IN ('conversation', 'document', 'mfapi')),
  source_document_id UUID,       -- references uploaded_documents if from a doc
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Loans and debts
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  debt_type TEXT NOT NULL CHECK (debt_type IN (
    'home_loan', 'education_loan', 'car_loan', 'personal_loan',
    'credit_card', 'bnpl', 'family', 'other'
  )),
  outstanding NUMERIC,
  emi NUMERIC,
  interest_rate NUMERIC,
  tenure_remaining_months INT,
  lender TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Uploaded documents
CREATE TABLE uploaded_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'bank_statement', 'mf_statement', 'demat_statement',
    'salary_slip', 'form_16', 'itr', 'insurance_policy',
    'loan_statement', 'esop_grant', 'nps_statement', 'epf_passbook', 'other'
  )),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,    -- Supabase Storage path
  file_size INT,
  status TEXT DEFAULT 'uploaded' CHECK (status IN (
    'uploaded', 'processing', 'parsed', 'failed'
  )),
  parsed_data JSONB DEFAULT '{}',  -- extracted structured data
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Voice call sessions
CREATE TABLE voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  elevenlabs_conversation_id TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  transcript_summary TEXT,          -- summary shown in chat
  extracted_data JSONB DEFAULT '{}', -- data extracted from transcript
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  chapter INT
);

-- Insight cards generated during onboarding
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  insight_type TEXT NOT NULL,       -- e.g., 'asset_allocation', 'savings_rate', 'insurance_gap'
  headline TEXT NOT NULL,
  key_number TEXT,                   -- e.g., "23%", "₹4.2L"
  explanation TEXT NOT NULL,
  chart_type TEXT,                   -- 'donut', 'bar', 'comparison', null for text-only
  chart_data JSONB DEFAULT '{}',
  is_demographic BOOLEAN DEFAULT false,  -- true if based on benchmarks, not user data
  chapter INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Indexes
```sql
CREATE INDEX idx_messages_user_created ON messages(user_id, created_at);
CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_debts_user ON debts(user_id);
CREATE INDEX idx_documents_user ON uploaded_documents(user_id);
CREATE INDEX idx_voice_sessions_user ON voice_sessions(user_id);
CREATE INDEX idx_insights_user ON insights(user_id);
```

### Row-Level Security
Every table has RLS enabled with the policy:
```sql
CREATE POLICY "Users can only access own data"
  ON [table_name]
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## 6. Conversation Engine

The conversation engine is the central orchestrator. It processes each user message through a pipeline:

```
User Message
    │
    ▼
┌─────────────────────┐
│ 1. Load State       │  Read conversation_state, financial_profile,
│                     │  last N messages, rolling summary
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐     ┌─────────────────────┐
│ 2a. Generate Ria's  │     │ 2b. Extract          │
│     Response         │     │     Structured Data   │
│  (OpenAI streaming)  │     │  (OpenAI non-stream)  │
│                     │     │                       │
│  System prompt +    │     │  User message +       │
│  state + summary +  │     │  current state →      │
│  last N messages    │     │  JSON extraction      │
└────────┬────────────┘     └────────┬──────────────┘
         │                           │
         ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│ 3. Rules Engine     │     │ 4. State Update      │
│                     │     │                       │
│  Evaluate state →   │     │  Merge extracted      │
│  Inject components  │     │  data into            │
│  (upload cards,     │     │  chapter_data         │
│   insights, quick   │     │  (pending commit)     │
│   replies)          │     │                       │
└────────┬────────────┘     └───────────────────────┘
         │
         ▼
┌─────────────────────┐
│ 5. Stream Response  │  Send Ria's text + any injected
│    to Client        │  components as structured messages
└─────────────────────┘
```

### State Object Structure

```typescript
interface ConversationState {
  // Chapter tracking
  currentChapter: 1 | 2 | 3 | 4;
  chapterStartedAt: Record<number, string>; // ISO timestamps
  chapterCompletedAt: Record<number, string>;

  // Data collection tracking (checklist items per section)
  collected: {
    personal: {
      age: boolean;
      city: boolean;
      maritalStatus: boolean;
      dependents: boolean;
      employer: boolean;
      industry: boolean;
      housing: boolean;
      parentSituation: boolean;
    };
    income: {
      monthlyTakeHome: boolean;
      variablePay: boolean;
      sideIncome: boolean;
    };
    expenses: {
      monthlyExpenses: boolean;
      breakdown: boolean;
    };
    investments: {
      mutualFunds: boolean;
      stocks: boolean;
      fds: boolean;
      ppf: boolean;
      epf: boolean;
      nps: boolean;
      gold: boolean;
      realEstate: boolean;
      crypto: boolean;
      esopRsu: boolean;
    };
    insurance: {
      healthInsurance: boolean;
      lifeInsurance: boolean;
    };
    tax: {
      regime: boolean;
      deductions: boolean;
    };
    goals: {
      goalsOrHurdleRate: boolean;
      riskProfile: boolean;
      careerTrajectory: boolean;
    };
  };

  // Document tracking
  documents: {
    bankStatement: 'not_uploaded' | 'uploaded' | 'processing' | 'parsed' | 'failed';
    mfStatement: 'not_uploaded' | 'uploaded' | 'processing' | 'parsed' | 'failed';
    dematStatement: 'not_uploaded' | 'uploaded' | 'processing' | 'parsed' | 'failed';
  };

  // Minimum viable data set gate
  minimumViableComplete: boolean;

  // Sophistication tier (1-4, starts at 2, adjusts progressively)
  sophisticationTier: 1 | 2 | 3 | 4;

  // Insights delivered so far
  insightsDelivered: string[]; // insight IDs

  // Voice session tracking
  activeVoiceSession: string | null; // elevenlabs conversation ID
  completedVoiceSessions: string[];

  // Session management
  lastActiveAt: string; // ISO timestamp
  totalTimeSpentSeconds: number;
  sessionCount: number;
}
```

### Rolling Summary
After every N messages (configurable, default 10), the backend generates a summary of recent conversation using a lightweight LLM call:
```
Prompt: "Summarize the following conversation between Ria (AI financial advisor) and the user.
Focus on: what was discussed, key data points shared, user's tone and sophistication level,
and any notable moments. Keep it under 300 words."
```
This summary is appended to the existing rolling summary (with older summaries condensed).

### Context Window Management
Each Ria response call includes:
1. **System prompt** (monolithic, ~2000-3000 tokens)
2. **Conversation state JSON** (~500-1000 tokens)
3. **Rolling summary** (capped at ~500 tokens)
4. **Last 20 messages** (variable, ~1000-3000 tokens)
5. **User's latest message**

Total per-call context: ~5000-8000 tokens input. Well within GPT-4o's 128K window.

---

## 7. AI Integration

### OpenAI Configuration

**Model:** `gpt-4o` (latest) for both conversation and extraction.

**Two parallel calls per user turn:**

#### Call 1: Ria's Conversational Response (Streaming)
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  stream: true,
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `Current state: ${JSON.stringify(state)}` },
    { role: 'system', content: `Conversation summary: ${summary}` },
    ...lastNMessages,
    { role: 'user', content: userMessage }
  ],
  temperature: 0.7,
  max_tokens: 800
});
```

#### Call 2: Data Extraction (Non-streaming)
```typescript
const extraction = await openai.chat.completions.create({
  model: 'gpt-4o',
  response_format: { type: 'json_object' },
  messages: [
    { role: 'system', content: EXTRACTION_PROMPT },
    { role: 'system', content: `Current state: ${JSON.stringify(state)}` },
    { role: 'user', content: userMessage }
  ],
  temperature: 0,
  max_tokens: 1000
});
```

The extraction prompt instructs the model to output structured JSON with any new data points found in the user's message. Returns `{}` if no extractable data.

### System Prompt (Monolithic)

The system prompt is a single, comprehensive document covering:

1. **Identity & persona** — Ria, AI financial advisor at Avara (SEBI-registered IA). Warm, knowledgeable, direct. Smart friend in her late 20s who knows money.
2. **Current chapter instructions** — What to cover, what to ask, how to transition.
3. **Sophistication calibration** — Current tier injected from state. Instructions to adjust language complexity. Progressive: start Tier 2, move up/down based on vocabulary, product knowledge, response depth.
4. **Conversation rules:**
   - Strict chapter sequence: Ch1 → Ch2 → Ch3 → Ch4.
   - Always explain why you're asking.
   - Frame observations, never advice. Can say "this is unusual for your age/income" but never "you should change this."
   - Note guardrail violations (revolving CC debt, missing insurance, F&O) internally but do not flag during onboarding.
   - Gently challenge implausible data (e.g., ₹30K expenses on ₹1.8L salary in Mumbai).
5. **Entry type handling** — How to respond to each of the 4 entry types (general growth, impatient, trigger-driven, referral).
6. **Data safety framing** — Exact language for the Chapter 2 transition data safety message.
7. **Response format** — Text only. No markdown formatting. Conversational tone. Keep responses under 3-4 sentences for chat. Use the user's name occasionally.
8. **What NOT to do** — Don't use unexplained jargon with novice users. Don't lecture. Don't be sycophantic. Don't give investment advice. Don't mention specific products or funds.

The prompt is stored as a constant in `lib/prompts/system-prompt.ts` and is ~2500 tokens.

### Extraction Prompt

A separate, focused prompt for structured data extraction:
```
You are a data extraction assistant. Given a user message in a financial advisory conversation,
extract any structured data points mentioned. Return a JSON object with only the fields that
have new information. Use null for ambiguous values. Do not infer — only extract explicitly stated data.

Fields to extract: age, city, marital_status, dependents, employer, industry, role,
housing, monthly_take_home, variable_pay, side_income, monthly_expenses,
health_insurance_status, life_insurance, goals, risk_indicators, ...

Return {} if no extractable data is found.
```

### Sophistication Tier Detection

Progressive calibration starting at Tier 2 (Informed). The extraction call also returns a `sophistication_signals` field:
```json
{
  "sophistication_signals": {
    "financial_terms_used": ["CAGR", "expense ratio"],
    "product_knowledge": "mentions index funds vs active",
    "suggested_tier_adjustment": "+1"  // or "-1" or "0"
  }
}
```
The backend adjusts the tier gradually (never more than 1 level per 5 messages, to avoid whiplash).

---

## 8. Voice Integration

### ElevenLabs Conversational AI Agent

**Mode:** Hosted Conversational AI agent. ElevenLabs handles real-time voice, turn-taking, interruptions, and latency.

**Voice selection:** Start with pre-built Indian English female voices from ElevenLabs library. Test and evaluate. If none match Ria's persona (warm, confident, unhurried, late-20s peer), create a custom voice before launch.

### Voice Call Flow

```
1. User taps "Switch to voice" button in chat
2. Frontend initiates ElevenLabs conversation session via their SDK
3. System prompt + tools are provided to ElevenLabs agent
4. Voice conversation happens in real-time (ElevenLabs manages everything)
5. User taps "End call" or conversation naturally concludes
6. Frontend receives end-of-conversation event
7. Backend fetches transcript + tool call logs from ElevenLabs API
8. Backend processes transcript:
   a. Generate summary for chat display
   b. Extract structured data from transcript
   c. Update conversation state
9. Summary block appears in chat: "Voice call — X min — Key topics: ..."
```

### ElevenLabs Agent Configuration

The ElevenLabs agent receives:
- **System prompt:** A voice-specific version of Ria's persona (adjusted for spoken conversation — shorter sentences, more conversational markers like "hmm," "interesting," natural pauses).
- **Tools:** Functions the agent can call during the conversation:
  - `update_data_point(field, value)` — records extracted data
  - `get_user_context()` — retrieves current state so the voice agent knows what's been covered
- **First message:** Contextual based on where in the conversation the voice call starts.

### Voice Transcript Processing (Post-Call Sync)

After a voice call ends:
1. Fetch full transcript from ElevenLabs API
2. Run extraction LLM call on the transcript to get structured data
3. Generate a summary (3-5 bullet points of what was covered)
4. Store in `voice_sessions` table
5. Merge extracted data into `conversation_state.chapter_data`
6. Insert a `voice_summary` message in the chat

### Voice UI in Chat

Voice calls appear in the chat as a summary block:
```
┌─────────────────────────────────┐
│ 🎤 Voice call · 6 min           │
│                                  │
│ Covered:                         │
│ • Career goals and trajectory    │
│ • Risk tolerance discussion      │
│ • Family financial situation     │
│                                  │
│ [View details]                   │
└─────────────────────────────────┘
```
"View details" expands to show the full summary text (not the raw transcript).

### When Voice is Suggested

The rules engine triggers voice suggestions at three moments (from PRD):
1. **Chapter 2→3 transition** (~minute 5-8): "This next part is less about numbers. Want to switch to a call? About 5 minutes."
2. **Post-document analysis**: "I've found some interesting things in your portfolio. Want me to walk you through them on a call?"
3. **Chapter 4 summary**: "Can I walk you through what I've learned in a 3-minute call?"

These are suggestions, not forced transitions. The user can decline and stay in text.

---

## 9. Document Processing

### Upload Flow

1. User taps upload button (persistent in chat) or an upload card prompt
2. File picker opens (PDF or image)
3. File uploaded to Supabase Storage
4. **Chat pauses with processing animation** (progress indicator, "Analyzing your document...")
5. Backend triggers document parsing
6. On completion, Ria presents findings as a summary in chat
7. User confirms key details

### Parsing Pipeline

All document parsing uses **GPT-4o with vision** for maximum flexibility across format variations.

```typescript
async function parseDocument(file: Buffer, type: DocumentType): Promise<ParsedData> {
  // 1. Convert PDF to images (one per page)
  const pages = await pdfToImages(file);

  // 2. Send to GPT-4o with type-specific extraction prompt
  const result = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: PARSING_PROMPTS[type] // type-specific extraction instructions
      },
      {
        role: 'user',
        content: pages.map(page => ({
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${page}` }
        }))
      }
    ],
    temperature: 0,
    max_tokens: 4000
  });

  return JSON.parse(result.choices[0].message.content);
}
```

### Document Type Parsing Specifications

#### Bank Statement (P0)
**Input:** PDF from any Indian bank (focus: SBI, HDFC, ICICI, Kotak, Axis)
**Extract:**
```json
{
  "account_holder": "string",
  "bank": "string",
  "period": { "from": "date", "to": "date" },
  "salary_credits": [{ "date": "date", "amount": "number", "description": "string" }],
  "emi_debits": [{ "date": "date", "amount": "number", "description": "string" }],
  "sip_debits": [{ "date": "date", "amount": "number", "fund_name": "string" }],
  "insurance_premiums": [{ "date": "date", "amount": "number", "provider": "string" }],
  "expense_categories": {
    "food_delivery": "number",
    "shopping": "number",
    "subscriptions": "number",
    "rent": "number",
    "utilities": "number",
    "transfers": "number",
    "other": "number"
  },
  "average_monthly_income": "number",
  "average_monthly_expenses": "number"
}
```

#### MF Statement — CAMS/KFintech (P0)
**Input:** Consolidated Account Statement PDF
**Extract:**
```json
{
  "funds": [{
    "fund_name": "string",
    "folio_number": "string",
    "plan": "direct | regular",
    "current_value": "number",
    "invested_value": "number",
    "units": "number",
    "nav": "number",
    "sip_amount": "number | null",
    "category": "equity | debt | hybrid | other"
  }],
  "total_current_value": "number",
  "total_invested_value": "number"
}
```

#### Demat Statement (P0)
**Input:** Holding statement from Zerodha, Groww, CDSL, NSDL
**Extract:**
```json
{
  "holdings": [{
    "stock_name": "string",
    "isin": "string",
    "quantity": "number",
    "average_price": "number",
    "current_value": "number"
  }],
  "total_value": "number"
}
```

### Password-Protected PDFs

Many Indian bank statements are password-protected (typically: first 3 letters of name in caps + DOB in DDMMYYYY format).

**Flow:**
1. User uploads a password-protected PDF
2. Backend detects it's encrypted
3. Ria asks: "This PDF is password-protected. Could you share the password? I'll use it to open the document and discard it immediately — it won't be stored anywhere."
4. User provides password in chat
5. Backend decrypts PDF using the password, processes it, **discards the password immediately** (never persisted)
6. If password fails, Ria asks user to double-check or remove the password before re-uploading

### Parse Failure Handling (Graceful Fallback)

If GPT-4o cannot extract meaningful data from a document:
1. Ria acknowledges the upload: "I had some trouble reading this document clearly."
2. Falls back to conversational extraction: "Could you tell me a few key details? For your bank statement, I mainly need: your monthly salary credit amount, your biggest regular expenses, and any SIPs or EMIs."
3. Document status set to `failed` with error details
4. User can re-upload or provide info verbally

### Processing Time

- **Target:** < 30 seconds for a 3-page bank statement
- **Approach:** Convert PDF pages to images in parallel, send all pages in a single GPT-4o call
- **During processing:** Chat shows animated processing state. No other messages sent until parsing completes.
- **Timeout:** 60 seconds. If exceeded, treat as failure and use graceful fallback.

---

## 10. Chat UI & Frontend Architecture

### Page Structure

```
/                   → Landing page (marketing, not in v1 scope — redirect to /signup)
/signup             → Email + password registration
/login              → Email + password login
/chat               → Primary chat interface (Surface 1)
/profile            → Financial profile dashboard (Surface 2)
/profile/[section]  → Deep link into a profile section
```

### Chat Interface Layout (Mobile-First)

```
┌──────────────────────────────┐
│ ◀ Avara    [Profile] [Voice] │  ← Header with nav
├──────────────────────────────┤
│ ┌──────────────────────────┐ │  ← Progress nudge (collapsible)
│ │ ● ● ○ ○ ○ ○ ○           │ │     Filled = covered, Empty = remaining
│ │ Personal Income Expenses..│ │     Tap to expand or go to profile
│ └──────────────────────────┘ │
├──────────────────────────────┤
│                              │
│  Ria: Hey Arindam, I'm Ria  │  ← Message list
│  — your financial advisor... │
│                              │
│  ┌────────┐ ┌────────────┐  │  ← Quick reply suggestions
│  │ Grow $ │ │ Question   │  │
│  └────────┘ └────────────┘  │
│  ┌────────────────────────┐  │
│  │ Friend recommended     │  │
│  └────────────────────────┘  │
│                              │
│  User: I want to grow my     │
│  money faster                │
│                              │
│  Ria: Great! Before we...    │
│                              │
│          ...                 │
│                              │
├──────────────────────────────┤
│ [📎] [Type a message...  ] ▶ │  ← Input bar with upload button
└──────────────────────────────┘
```

### Message Components

Each message type has a dedicated React component:

#### 1. TextMessage
Standard chat bubble. Ria's messages on the left (with avatar), user's on the right.

#### 2. QuickReplyMessage
Ria's text + tappable option chips below. Selecting a chip sends it as a user message and removes the options.

```typescript
interface QuickReplyData {
  options: string[];  // e.g., ["I want to grow my money faster", "I have a specific question"]
}
```

#### 3. UploadCard
Visually distinct card with:
- Document type label (e.g., "Bank Statement")
- One-line rationale ("See your real spending patterns without guessing")
- Upload button
- Collapsible "How to get this" instructions
- Data safety line ("Your documents are encrypted and only used to build your financial plan")

```typescript
interface UploadCardData {
  documentType: DocumentType;
  rationale: string;
  howToGet: string;  // collapsible instructions (bank-specific)
  dataReassurance: string;
}
```

#### 4. InsightCard
Rich visual card with:
- Headline ("Your True Asset Allocation")
- Key number or chart (donut chart, bar chart, comparison)
- Plain-language explanation
- Optional "Based on people like you" label if demographic-based

```typescript
interface InsightCardData {
  headline: string;
  keyNumber?: string;           // e.g., "23%"
  explanation: string;
  chartType?: 'donut' | 'bar' | 'comparison';
  chartData?: Record<string, number>;
  isDemographic: boolean;
}
```

#### 5. ProgressNudge
Inline message showing chapter progress (used at transitions).

#### 6. VoiceSummary
Summary block for completed voice calls (described in Section 8).

#### 7. DocumentStatus
Processing indicator for uploads ("Analyzing your bank statement...").

### Vercel AI SDK Integration

```typescript
// app/chat/page.tsx
'use client';

import { useChat } from 'ai/react';

export default function ChatPage() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useChat({
    api: '/api/chat',
    // Messages include structured metadata for rich rendering
  });

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader />
      <ProgressNudge />
      <MessageList messages={messages} />
      <ChatInput
        input={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Streaming Response Handling

The `/api/chat` endpoint streams Ria's text response. Rich components (upload cards, insights, quick replies) are sent as separate structured messages *after* the text stream completes, based on the rules engine evaluation.

```typescript
// api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();
  const userId = await getAuthUserId(req);

  // Load state
  const state = await loadConversationState(userId);
  const summary = state.summary;
  const recentMessages = await getRecentMessages(userId, 20);

  // Parallel calls
  const [riaStream, extraction] = await Promise.all([
    generateRiaResponse(state, summary, recentMessages, messages),
    extractStructuredData(state, messages[messages.length - 1])
  ]);

  // Process extraction results (non-blocking)
  processExtraction(userId, state, extraction);

  // Evaluate rules engine for component injection
  const components = evaluateRules(state, extraction);

  // Stream Ria's response, then append components
  return new StreamingTextResponse(riaStream, {
    // Components sent as data stream annotations
    data: components
  });
}
```

---

## 11. Profile Dashboard

### Layout (Surface 2)

```
┌──────────────────────────────┐
│ ◀ Back to Chat        Avara  │
├──────────────────────────────┤
│                              │
│  Your Financial Profile      │
│  Last updated: 5 min ago     │
│                              │
│  ┌────────────────────────┐  │
│  │ ● Personal         ✓  │  │  ← Section cards
│  │   Arindam, 27, Mumbai  │  │     ● = complete, ○ = incomplete
│  │   Tech, Flipkart       │  │     Tap to expand/edit
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ ● Income           ✓  │  │
│  │   ₹1.8L/month + var   │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ ○ Expenses         ⚠  │  │  ← Incomplete: shows what's missing
│  │   Missing: breakdown   │  │     Links back to chat
│  │   [Continue in chat →] │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ ● Investments      ✓  │  │
│  │   ₹12.4L across 5     │  │
│  │   asset types          │  │
│  │   [True allocation 🔵] │  │  ← Mini donut chart
│  └────────────────────────┘  │
│                              │
│  ... (Loans, Insurance,      │
│       Tax, Goals & Risk)     │
│                              │
│  ┌────────────────────────┐  │
│  │ 📄 Documents           │  │
│  │   Bank stmt: ✓ Parsed  │  │
│  │   MF stmt: Not yet     │  │
│  │   Demat: ✓ Parsed      │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │  ← Only shown when minimum viable
│  │ Ready for your         │  │     data set is complete
│  │ financial plan →       │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

### Completeness Tracking (Checklist Style)

Each section has a defined set of items. Items are either:
- **Collected** (✓) — data point captured
- **Not applicable** (—) — user confirmed they don't have this (e.g., no crypto)
- **Missing** (○) — not yet discussed

A section is "complete" when all items are either collected or explicitly not applicable.

```typescript
interface SectionCompleteness {
  personal: {
    items: ['age', 'city', 'maritalStatus', 'dependents', 'employer', 'housing', 'parentSituation'];
    collected: string[];
    notApplicable: string[];
  };
  // ... etc for each section
}
```

### Editing

All data points are user-editable. Tapping a section expands it to show individual fields with edit icons. Edits are saved to `financial_profiles` immediately but Ria only becomes aware of them at the next session (per decision).

### Bridge to Step 2

When `minimumViableComplete` is true in conversation state:
- A CTA appears at the bottom of the profile
- Ria delivers the Chapter 4 summary and bridge message in chat
- Tapping the CTA shows: "Your financial plan is being prepared. We'll notify you when it's ready." (Holding state for v1)
- `onboarding_status` updated to `completed`

---

## 12. Rules Engine

The rules engine is a set of TypeScript functions that evaluate conversation state and return component injection decisions.

```typescript
// lib/rules/engine.ts

interface RuleResult {
  components: ComponentInjection[];
}

interface ComponentInjection {
  type: 'quick_reply' | 'upload_card' | 'insight_card' | 'progress_nudge' | 'voice_suggestion';
  data: Record<string, any>;
  position: 'after_response' | 'replace_response';
}

export function evaluateRules(state: ConversationState, extraction: any): RuleResult {
  const components: ComponentInjection[] = [];

  // Opening quick replies
  if (state.sessionCount === 1 && !state.collected.personal.age) {
    components.push({
      type: 'quick_reply',
      data: {
        options: [
          "I want to grow my money faster",
          "I have a specific question",
          "A friend recommended Avara",
          "I want someone to check if I'm doing things right"
        ]
      },
      position: 'after_response'
    });
  }

  // Bank statement upload card (Chapter 2, after income discussed)
  if (state.currentChapter === 2
      && state.collected.income.monthlyTakeHome
      && state.documents.bankStatement === 'not_uploaded') {
    components.push({
      type: 'upload_card',
      data: {
        documentType: 'bank_statement',
        rationale: "See your real spending patterns without guessing",
        // ...
      },
      position: 'after_response'
    });
  }

  // Asset allocation insight (Chapter 2, after investments discussed)
  if (state.currentChapter >= 2
      && state.collected.investments.mutualFunds
      && !state.insightsDelivered.includes('asset_allocation')) {
    components.push({
      type: 'insight_card',
      data: computeAssetAllocationInsight(state),
      position: 'after_response'
    });
  }

  // Voice suggestion at Chapter 2→3 transition
  if (state.currentChapter === 2
      && isChapterComplete(state, 2)
      && !state.completedVoiceSessions.length) {
    components.push({
      type: 'voice_suggestion',
      data: {
        message: "This next part is less about numbers and more about you. Want to switch to a call? About 5 minutes."
      },
      position: 'after_response'
    });
  }

  // ... more rules for each chapter and state combination

  return { components };
}
```

### Rule Categories

1. **Quick Reply Rules** — When to show tappable options (opening, asset type selection, yes/no confirmations, chapter transitions)
2. **Upload Card Rules** — When to prompt for document uploads (bank statement after income, MF statement when discussing MFs, demat when discussing stocks)
3. **Insight Card Rules** — When enough data exists to generate a meaningful insight (minimum 2, target 3 during onboarding)
4. **Voice Suggestion Rules** — The three tactical moments defined in the PRD
5. **Chapter Transition Rules** — When to move from one chapter to the next
6. **Progress Nudge Rules** — When to show progress updates (chapter transitions, returning users)
7. **Data Safety Rules** — When to deliver the compliance framing (start of Chapter 2)

---

## 13. Insight System

### Insight Types

| Insight | Trigger | Data Source | Chart |
|---------|---------|-------------|-------|
| **True Asset Allocation** | After investment data collected | User data (all assets including EPF, PPF, FD) | Donut chart |
| **Savings Rate Reality** | After income + expenses | User data or bank statement | Single number + comparison |
| **Equity-Debt Ratio** | After investment data | User data | Bar comparison |
| **Insurance Coverage Gap** | After insurance info | User data + demographic benchmark | Number + explanation |
| **Expense Pattern** | After bank statement parsed | Bank statement data | Bar chart (categories) |
| **Peer Comparison** | Any chapter, if data sparse | Demographic benchmarks (age, city, income) | Comparison bars |

### Demographic Benchmarks

For early insights before user-specific data is available, use demographic benchmarks:

```typescript
// lib/insights/benchmarks.ts
const BENCHMARKS = {
  savings_rate: {
    '25-30_mumbai_tech': { median: 0.35, p25: 0.20, p75: 0.45 },
    '25-30_bangalore_tech': { median: 0.40, p25: 0.25, p75: 0.50 },
    // ...
  },
  equity_allocation: {
    '25-30': { recommended_min: 0.60, typical: 0.30 },
    // ...
  }
};
```

Demographic-based insights are clearly labeled: "Based on what we see for people your age in Mumbai" vs. "Based on what you've told me."

### Insight Card Rendering

Rich visual cards using Recharts:

```typescript
// components/chat/InsightCard.tsx
export function InsightCard({ data }: { data: InsightCardData }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 my-3">
      {data.isDemographic && (
        <span className="text-xs text-gray-500">Based on people like you</span>
      )}
      <h3 className="font-semibold text-lg">{data.headline}</h3>
      {data.keyNumber && (
        <div className="text-3xl font-bold text-primary my-2">{data.keyNumber}</div>
      )}
      {data.chartType === 'donut' && (
        <DonutChart data={data.chartData} />
      )}
      {data.chartType === 'bar' && (
        <BarChart data={data.chartData} />
      )}
      <p className="text-sm text-gray-600 mt-2">{data.explanation}</p>
    </div>
  );
}
```

---

## 14. Market Data Integration

### Mutual Fund NAVs

Use [mfapi.in](https://www.mfapi.in/) — a free, open API for Indian mutual fund NAV data.

```typescript
// lib/market-data/mf-nav.ts
export async function getMFNav(schemeCode: string): Promise<number> {
  const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`);
  const data = await res.json();
  return parseFloat(data.data[0].nav);
}
```

**Usage:** When parsing a MF statement, cross-reference fund names with mfapi.in to get current NAVs. Update `current_value` for mutual fund assets.

### Other Asset Types

All other asset types (stocks, FDs, gold, real estate, crypto, EPF, PPF, NPS) use **user-stated values**. No live price feeds in v1.

---

## 15. File Storage & Security

### Supabase Storage Configuration

- **Bucket:** `documents` (private, no public access)
- **Path structure:** `{user_id}/{document_type}/{filename}`
- **RLS Policy:** Users can only read/write their own files
- **Accepted formats:** PDF, PNG, JPG, JPEG
- **Max file size:** 10MB

### Security Measures

1. **RLS on all tables** — Users can only access their own data
2. **Supabase Storage policies** — Files isolated by user_id path
3. **Document passwords** — Never persisted. Used in-memory for decryption, then discarded
4. **Parsed data** — Extracted data stored in DB; original documents retained in storage for audit
5. **HTTPS everywhere** — Vercel enforces HTTPS by default
6. **Legal pages** — Placeholder Privacy Policy and ToS for v1 (to be replaced with proper legal docs before real user exposure)

---

## 16. API Design

### API Routes (Next.js App Router)

```
POST   /api/auth/signup          — Create account (email + password)
POST   /api/auth/login           — Login
POST   /api/auth/logout          — Logout

POST   /api/chat                 — Send message, get streaming response
GET    /api/chat/history         — Get message history (paginated)
GET    /api/chat/state           — Get current conversation state

GET    /api/profile              — Get financial profile
PATCH  /api/profile              — Update profile fields (user edits)
GET    /api/profile/completeness — Get completeness checklist

POST   /api/documents/upload     — Upload a document
GET    /api/documents            — List user's documents
GET    /api/documents/:id        — Get document status + parsed data
POST   /api/documents/:id/password — Submit password for encrypted PDF

POST   /api/voice/start          — Initialize ElevenLabs voice session
POST   /api/voice/end            — Process completed voice session
GET    /api/voice/:id            — Get voice session summary

GET    /api/insights             — Get all generated insights
GET    /api/mf/nav/:schemeCode   — Proxy for mfapi.in NAV lookup
```

### Authentication

All API routes (except `/api/auth/*`) require a valid Supabase session. The middleware extracts the user from the Supabase JWT:

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && req.nextUrl.pathname.startsWith('/api/') && !req.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

---

## 17. Deployment & Infrastructure

### Vercel Configuration

- **Framework:** Next.js (auto-detected)
- **Node.js:** 20.x
- **Region:** Mumbai (ap-south-1) — closest to target users
- **Function timeout:** 60 seconds (Pro plan) for API routes
- **Environment variables:**
  ```
  OPENAI_API_KEY=
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ELEVENLABS_API_KEY=
  ELEVENLABS_AGENT_ID=
  ```

### Background Processing (Simple Async)

For v1, document parsing runs in Vercel serverless functions with the 60-second timeout. This is sufficient for most documents (target < 30 seconds).

If a document exceeds the timeout:
1. The upload is acknowledged immediately
2. A flag is set in the DB (`status: 'processing'`)
3. The user is told "This is taking a bit longer than usual — I'll have the results when you come back"
4. A retry mechanism re-processes on the next API call that checks document status

If this becomes a bottleneck in production, migrate to Inngest or a dedicated worker service. The architecture is designed to make this migration straightforward (parsing logic is isolated in `lib/parsing/`).

### Supabase Configuration

- **Region:** South Asia (Mumbai) — `ap-south-1`
- **Plan:** Pro (for production reliability and support)
- **Database:** PostgreSQL 15
- **Auth:** Email + password provider enabled
- **Storage:** Private bucket for documents
- **Real-time:** Enabled but not used in v1 (profile updates are session-based)

---

## 18. Design System

### Brand Direction

Avara needs to feel **trustworthy, modern, and premium** — a financial product that respects the user's intelligence. Not a generic fintech with bright colors and playful illustrations. Not a corporate bank either. Think: the visual equivalent of Ria's personality — warm, confident, knowledgeable.

### Color Palette

```
Primary:     #1A1A2E (Deep Navy)       — Trust, authority, text
Secondary:   #16213E (Dark Blue)       — Backgrounds, cards
Accent:      #0F3460 (Rich Blue)       — Interactive elements
Highlight:   #E94560 (Warm Coral)      — CTAs, key numbers, alerts
Surface:     #F7F7FA (Off White)       — Page backgrounds
Card:        #FFFFFF (White)           — Card surfaces
Text:        #1A1A2E (Deep Navy)       — Primary text
TextMuted:   #6B7280 (Gray)            — Secondary text
Success:     #059669 (Green)           — Positive indicators
Warning:     #D97706 (Amber)           — Caution indicators
```

### Typography

- **Headings:** Inter (weight 600-700)
- **Body:** Inter (weight 400-500)
- **Numbers/Data:** JetBrains Mono or tabular Inter — monospace for financial figures

### Component Tokens (Tailwind)

```javascript
// tailwind.config.ts
{
  theme: {
    extend: {
      colors: {
        primary: '#1A1A2E',
        secondary: '#16213E',
        accent: '#0F3460',
        highlight: '#E94560',
        surface: '#F7F7FA',
      },
      borderRadius: {
        'card': '12px',
        'chip': '20px',
        'button': '8px',
      },
      fontSize: {
        'key-number': ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
      }
    }
  }
}
```

### Component Patterns

- **Chat bubbles:** Ria (left, white bg, subtle shadow) / User (right, accent bg, white text)
- **Cards:** White surface, 12px radius, subtle shadow, generous padding
- **Quick reply chips:** Outlined, pill-shaped, tap state with fill
- **Upload cards:** Distinct from chat bubbles — left-aligned, colored left border (accent), white bg
- **Insight cards:** White bg, colored top accent bar (highlight), slightly larger than chat bubbles
- **Input bar:** Fixed bottom, clean white bg, subtle top border, attachment icon left, send icon right
- **Progress icons:** Filled circles (covered) / outlined circles (remaining), small, horizontal strip

---

## 19. Key Flows

### Flow 1: New User Signup → First Message

```
1. User visits /signup
2. Enters full name, email, password → Supabase Auth creates account
3. Email verification (click link in email)
4. Redirect to /chat
5. On mount, frontend calls /api/chat with empty message (trigger: "session_start")
6. Backend:
   a. Creates conversation_state record
   b. Creates financial_profiles record
   c. Evaluates rules → inject opening message + quick replies
7. Ria's first message streams in:
   "Hey [Name], I'm Ria — your financial advisor at Avara..."
8. Quick reply options appear below
9. User taps or types a response → onboarding begins
```

### Flow 2: Document Upload (Bank Statement)

```
1. Rules engine injects upload card after income discussion
2. Upload card renders with rationale + instructions
3. User taps upload → file picker opens
4. User selects PDF → file uploads to Supabase Storage
5. Chat shows "Analyzing your bank statement..." with animation
6. Backend:
   a. Creates uploaded_documents record (status: processing)
   b. If encrypted: returns "password needed" status
      → Ria asks for password → user provides → decrypt
   c. Convert PDF to images
   d. Send to GPT-4o with bank statement extraction prompt
   e. Parse response → update uploaded_documents (status: parsed, parsed_data)
7. Chat animation clears
8. Ria presents summary: "I can see your salary of ₹1.8L coming in from Flipkart,
   your monthly expenses averaging about ₹85K, and 3 SIPs totaling ₹25K/month.
   Does that look right?"
9. User confirms or corrects
```

### Flow 3: Chapter Transition (Ch1 → Ch2)

```
1. During conversation, extraction call detects all Ch1 items collected
2. Rules engine detects chapter completion
3. Ria delivers transition message:
   "Okay, I've got a good picture of your life. Now let's look at the money side."
4. Rules engine injects data safety framing message:
   "Before we get into the money side — everything you share is completely confidential..."
5. State updated: currentChapter = 2
6. Chapter 1 data committed to financial_profiles (batch update)
7. Progress nudge updates in top bar
```

### Flow 4: Voice Call

```
1. Rules engine injects voice suggestion at Ch2→Ch3 transition
2. Ria suggests: "Want to switch to a call? About 5 minutes."
3. User taps "Start voice call" button
4. Frontend:
   a. Initializes ElevenLabs Conversational AI widget/SDK
   b. Passes agent ID + session context (current state, what to discuss)
5. Voice call begins — ElevenLabs agent handles the conversation
6. User taps "End call" (or agent naturally wraps up)
7. Frontend calls /api/voice/end with conversation ID
8. Backend:
   a. Fetches transcript from ElevenLabs
   b. Runs extraction on transcript (GPT-4o)
   c. Generates summary (3-5 bullets)
   d. Creates voice_sessions record
   e. Updates conversation_state with extracted data
9. Voice summary block appears in chat
10. Ria continues in text from where voice left off
```

### Flow 5: Returning User

```
1. User opens app after 2 days
2. Frontend loads /chat
3. On mount, sends "session_start" trigger to /api/chat
4. Backend:
   a. Loads conversation state
   b. Detects returning user (lastActiveAt > 24h ago)
   c. Checks if documents were uploaded between sessions → process if pending
5. Ria's return greeting:
   "Welcome back, [Name]! Last time we covered your income and expenses.
   We still need to look at your investments and insurance.
   Should take about 10 minutes — ready to pick up?"
6. Quick replies: ["Let's go", "Remind me what we covered", "Start fresh"]
```

### Flow 6: Onboarding Completion

```
1. Chapter 4 begins — Ria has all minimum viable data
2. Rules engine suggests voice for the summary
3. Ria delivers (voice or text) the full financial snapshot:
   - Who they are, what they earn, what they save
   - True asset allocation visualization
   - 2-3 specific observations
4. Ria confirms accuracy: "Does this feel right?"
5. User confirms
6. Ria bridges to Step 2:
   "I have what I need to build your personalised financial plan..."
7. User agrees to proceed
8. Backend:
   a. onboarding_status → 'completed'
   b. Final batch update to financial_profiles
9. Profile dashboard shows "Your financial plan is being prepared" CTA
```

---

## 20. Open Items & Deferred

### Open Items for v1

| # | Item | Decision Needed | Owner |
|---|------|----------------|-------|
| 1 | **ElevenLabs voice selection** | Test pre-built Indian English voices, decide if custom voice needed | Engineering + Product |
| 2 | **Legal pages** | Placeholder text needed before first deployment. Real legal review before any external users | Legal |
| 3 | **SEBI consent requirements** | Is conversational consent sufficient or do we need explicit consent forms? | Legal |
| 4 | **System prompt finalization** | Draft complete, needs iteration based on testing | Product + Engineering |
| 5 | **Demographic benchmark data** | Need real data sources for peer comparison insights | Data |
| 6 | **Error copy** | User-facing error messages for all failure states | Product |

### Deferred to Post-v1

| Item | Rationale |
|------|-----------|
| **Analytics (PostHog/Mixpanel)** | Focus on product quality first. Add before measuring conversion. |
| **Push notifications** | PWA push notification support is limited. Evaluate post-launch. |
| **Account Aggregator integration** | Pending API agreements. |
| **Phone OTP auth** | Email+password for v1. OTP adds cost and complexity. |
| **Advanced document parsing** (salary slips, ITR, insurance, loan docs) | P1. Bank/MF/demat statements cover the P0 data needs. |
| **Upload tutorials** (bank-specific download instructions) | P1. Include basic instructions in upload card "How to get this" section. |
| **Step 2 (Financial Plan)** | Separate build. v1 onboarding ends at holding state. |
| **Couples/joint onboarding** | P2. Individual only. |
| **Multi-language** | P2. English only. |
| **Human advisor escalation** | P2. AI-only. |

---

## Appendix A: Project Structure

```
avara-v2/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing/redirect
│   ├── (auth)/
│   │   ├── signup/page.tsx
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # Authenticated layout
│   │   ├── chat/page.tsx           # Chat interface (Surface 1)
│   │   └── profile/
│   │       ├── page.tsx            # Profile dashboard (Surface 2)
│   │       └── [section]/page.tsx  # Section deep links
│   └── api/
│       ├── chat/route.ts
│       ├── profile/route.ts
│       ├── documents/
│       │   ├── upload/route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── password/route.ts
│       ├── voice/
│       │   ├── start/route.ts
│       │   └── end/route.ts
│       ├── insights/route.ts
│       └── mf/nav/[code]/route.ts
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── chat/
│   │   ├── ChatHeader.tsx
│   │   ├── ChatInput.tsx
│   │   ├── MessageList.tsx
│   │   ├── TextMessage.tsx
│   │   ├── QuickReplyMessage.tsx
│   │   ├── UploadCard.tsx
│   │   ├── InsightCard.tsx
│   │   ├── ProgressNudge.tsx
│   │   ├── VoiceSummary.tsx
│   │   ├── DocumentStatus.tsx
│   │   └── VoiceCallButton.tsx
│   ├── profile/
│   │   ├── ProfileSection.tsx
│   │   ├── CompletenessChecklist.tsx
│   │   ├── EditableField.tsx
│   │   └── BridgeCTA.tsx
│   └── charts/
│       ├── DonutChart.tsx
│       ├── BarChart.tsx
│       └── ComparisonChart.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   ├── server.ts               # Server Supabase client
│   │   └── middleware.ts            # Auth middleware
│   ├── openai/
│   │   ├── client.ts
│   │   ├── conversation.ts         # Ria response generation
│   │   └── extraction.ts           # Structured data extraction
│   ├── elevenlabs/
│   │   ├── client.ts
│   │   └── session.ts              # Voice session management
│   ├── prompts/
│   │   ├── system-prompt.ts        # Monolithic Ria system prompt
│   │   ├── extraction-prompt.ts    # Data extraction prompt
│   │   └── parsing-prompts.ts      # Per-document-type parsing prompts
│   ├── rules/
│   │   ├── engine.ts               # Rules engine entry point
│   │   ├── quick-replies.ts
│   │   ├── upload-cards.ts
│   │   ├── insights.ts
│   │   ├── voice-suggestions.ts
│   │   └── chapter-transitions.ts
│   ├── parsing/
│   │   ├── pdf-to-images.ts        # PDF → image conversion
│   │   ├── bank-statement.ts
│   │   ├── mf-statement.ts
│   │   └── demat-statement.ts
│   ├── insights/
│   │   ├── compute.ts              # Insight computation logic
│   │   ├── benchmarks.ts           # Demographic benchmark data
│   │   └── types.ts
│   ├── market-data/
│   │   └── mf-nav.ts              # mfapi.in integration
│   ├── state/
│   │   ├── manager.ts              # Conversation state CRUD
│   │   ├── summary.ts              # Rolling summary generation
│   │   └── completeness.ts         # Completeness calculation
│   └── types/
│       ├── conversation.ts
│       ├── profile.ts
│       ├── messages.ts
│       └── documents.ts
├── public/
│   ├── manifest.json               # PWA manifest
│   └── sw.js                       # Service worker (basic caching)
├── supabase/
│   └── migrations/                 # SQL migration files
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

---

> **End of Technical Specification**
>
> This document, combined with the PRD, provides everything needed to begin implementation. The architecture prioritizes simplicity (single LLM provider, Supabase for everything data-related, Vercel for deployment) while supporting the product's ambitious conversation design through a clean separation of concerns: LLM for conversation, rules engine for UX components, structured state for data tracking.
