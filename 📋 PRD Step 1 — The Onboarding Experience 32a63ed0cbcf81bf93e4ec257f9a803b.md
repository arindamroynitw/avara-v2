# 📋 PRD: Step 1 — The Onboarding Experience

> **Product Requirements Document** · Avara Step 1 Onboarding · v1.0 · March 2026
> 

---

# Problem Statement

India's upwardly mobile early-career urban professionals (under 30, Tier-1 cities, net worth ₹15L–₹80L) are dramatically underserved by quality financial advice. Personalised investment advisory has historically been gated behind either Portfolio Management Services (minimum ₹50 lakh ticket size, average portfolios in crores) or SEBI-registered individual investment advisors charging ₹75,000+ annually — both untenable for this segment.

This demographic is not financially illiterate. They've consumed content from YouTube finfluencers, read Zerodha Varsity, and hold accounts on platforms like Groww or Zerodha. They have some investments in mutual funds, stocks, gold, and FDs. But they have never experienced the *deep, personalised discovery* that a great RIA performs — the holistic mapping of income, expenses, assets, liabilities, insurance gaps, tax situation, career trajectory, family dynamics, and behavioural risk profile that makes the difference between generic advice and genuinely useful guidance.

The cost of not solving this is compounding: every year of suboptimal allocation, hidden mutual fund commissions, missing insurance, and uninformed tax decisions costs this user segment lakhs over their lifetime. The traditional advisory model cannot scale to serve them. Technology and AI can.

**Avara's onboarding is the first and most critical step in delivering this value.** It must replicate the depth and empathy of a great RIA's discovery process — two sessions of intimate, wide-ranging financial conversation — through AI, digitally, in 15–30 minutes across 1–3 sessions, while respecting the user's time and earning their trust.

---

# Target Users

**Primary segment:** Urban professionals under 30 in India's top 100 PIN codes.

**Profile:**

- Salaried professionals in tech, finance, consulting, startups, or established corporates
- Monthly take-home typically ₹80K–₹2.5L
- Net worth ₹15L–₹80L (including EPF, PPF, existing investments)
- Native English speakers; digitally savvy; consume content online
- Already have accounts on Groww, Zerodha, or similar platforms
- Some investments in mutual funds, stocks, gold, FDs — depth varies by age
- Have consumed some level of financial education from YouTube, blogs, finfluencer content
- Naturally skeptical of financial advice; aware that most "advice" is product-pushing

**How they arrive at Avara:**

- Instagram/social media advertising
- Friend or colleague referral
- Life event triggers: first home purchase consideration, big bonus or salary jump, insurance claim event, new life goal, job change
- General wealth-building intent: "I want my money to work harder"

**User sophistication tiers** (the AI must calibrate to these in real-time):

- **Tier 1 (Novice):** Knows what SIPs are, has a few running, limited understanding of asset allocation or insurance. Needs concepts explained in plain language.
- **Tier 2 (Informed):** Reads financial blogs, understands mutual fund categories, has opinions on index vs. active. Wants data-backed reasoning, not basics.
- **Tier 3 (Sophisticated):** Thinks in terms of CAGR, asset allocation, tax optimization. Has a portfolio strategy. Wants to be challenged and shown blind spots.
- **Tier 4 (Expert):** Works in finance or has deep self-directed investing experience. Wants institutional-quality analysis. Skeptical until proven.

---

# Goals

**G1: Achieve onboarding completion rate of 60%+ within 30 days of sign-up.**

Completion defined as: the AI has collected the minimum viable data set (defined below) and the user has agreed to proceed to financial plan generation.

**G2: Collect sufficient data to produce a genuinely personalised financial plan.**

The onboarding must capture enough quantitative and qualitative information that the resulting financial plan (Step 2) contains at least one genuine surprise or non-obvious insight specific to the user's situation.

**G3: Build user trust in AI-delivered financial advice.**

Measured by: user willingness to share sensitive financial documents (bank statements, MF statements), and progression to Step 2 (financial plan) without requesting human advisor involvement.

**G4: Complete onboarding within 15–30 minutes of total user time.**

Spread across 1–3 sessions. Users should never feel the process is tedious or bureaucratic.

**G5: Deliver value during onboarding itself, not just after.**

Users should receive at least 2–3 genuine financial insights ("micro-mirrors") during the onboarding conversation, making the process feel valuable rather than extractive.

---

# Non-Goals

**NG1: Providing investment recommendations during onboarding.**

Onboarding is discovery, not prescription. The AI notes issues (e.g., revolving credit card debt, missing insurance) internally but does not deliver formal advice. That belongs in Step 2 (The Financial Plan). *Rationale: mixing discovery with advice creates cognitive overload and undermines the plan's impact.*

**NG2: Automated data ingestion via Account Aggregator or API integrations.**

All data collection in v1 is via document uploads and conversation. API-based data pull (CAMS, Account Aggregator, EPFO) is a planned enhancement. *Rationale: pending API agreements. The product should acknowledge this to users and promise it's coming.*

**NG3: Human advisor involvement in the onboarding flow.**

This is a fully AI-first model. The AI (Ria) is the core advisor and is responsible for completing the onboarding conversation. No human escalation path in v1. *Rationale: Avara's thesis is that AI can deliver RIA-quality discovery at scale. The onboarding must prove this.*

**NG4: Onboarding for couples or joint financial planning.**

v1 serves individual users. Joint planning (where two partners with different risk profiles need a combined plan) is a future consideration. *Rationale: adds significant conversation complexity; serve the individual use case well first.*

**NG5: Charging for onboarding.**

Onboarding is free. Monetisation begins at or after the financial plan (Step 2). *Rationale: onboarding is both discovery and the primary trust-building / sales mechanism. Gating it reduces conversion.*

---

# Product Architecture

## Platform

**Mobile-first, web available.** The primary experience is a native mobile app (iOS and Android). A web application exists for users who prefer a larger screen, particularly for document uploads and reviewing their profile dashboard.

## Two Primary Surfaces

The onboarding product consists of two surfaces that work together:

### Surface 1: The Conversation (Primary)

A chat interface the user lands in immediately after sign-up. This is where onboarding happens. It supports two modalities:

- **Text chat** (default): Async-friendly. The user types or taps suggested replies. The AI responds in text with embedded rich components.
- **Live voice call**: User taps a button to switch to real-time voice conversation, powered by ElevenLabs or equivalent. The AI suggests voice at specific moments. The user can switch between chat and voice at any point.

The conversation includes four embedded component types:

1. **Quick-reply suggestions** — Tappable options at key decision points. Reduces typing friction. Used for common responses, not every message.
2. **Upload cards** — Visually distinct prompts for document uploads. Include: what document is needed, why it matters (one line), upload button, collapsible "How to get this" tutorial, and a data safety reassurance line.
3. **Insight cards** — Rich visual elements delivered when the AI has enough data to say something meaningful. Include a headline, a key number or simple visualisation, and a plain-language explanation. These are the "micro-mirrors."
4. **Progress nudge** — A subtle persistent element (top of chat) showing which areas are covered and which remain. Icons for: Personal, Income, Expenses, Investments, Insurance, Tax, Goals. Tapping navigates to the Profile (Surface 2).

### Surface 2: The Profile (Secondary)

A structured dashboard accessible from the conversation at any time. Shows everything the AI has learned, organised into sections:

- **Personal** — Name, age, city, family situation, dependents, career
- **Income** — Take-home salary, variable pay, side income, stability assessment
- **Expenses** — Monthly spending breakdown, savings rate
- **Investments** — Mutual funds, stocks, FDs, PPF, EPF, NPS, gold (physical + digital + SGBs), real estate, crypto, ESOPs/RSUs. Current values. True asset allocation visual (equity/debt/gold/real estate/other — including EPF and PPF)
- **Loans & Debt** — All liabilities, EMIs, interest rates
- **Insurance** — What they have, what's missing, coverage gaps flagged
- **Tax** — Current regime, key deductions, optimisation opportunities
- **Goals & Risk** — Goals (concrete or hurdle rate), risk willingness, risk capacity
- **Documents** — Upload status for each document type (uploaded / processing / analysed / not yet uploaded), with download guides

Each section has a completeness indicator. Incomplete sections show a prompt that links back to the conversation. All data is user-editable — the user is the source of truth.

At the bottom, once the minimum viable data set is complete: a **"Ready for your financial plan"** call-to-action bridging to Step 2.

---

# The AI Persona: Ria

## Identity

Ria is the user's named AI financial advisor. She represents Avara, a SEBI-registered investment advisor. This identity is established in the first message and reinforced throughout.

## Personality

Knowledgeable but not intimidating. Warm but not sycophantic. Direct but not judgmental. Speaks in the user's language — not finance jargon. Feels like a smart friend in her late 20s who happens to know a lot about money and is genuinely excited to help.

## Voice Characteristics (for live voice calls)

Warm, confident, unhurried. Sounds like a knowledgeable peer, not a financial advisor reading from a script or a customer service bot. Uses natural conversational markers ("hmm," "that makes sense," "interesting"). Pauses after the user speaks. Sounds like she's thinking, not retrieving.

## Key Behaviours

- **High transparency:** Frequently explains why she's asking what she's asking. "I'm asking about your parents because for a lot of people your age, the biggest financial risk isn't the stock market — it's an unexpected medical bill for a parent."
- **Calibrates to sophistication:** Detects whether the user uses terms like "CAGR" or says "good returns" and adapts language and depth accordingly. Never talks down to a sophisticated user; never overwhelms a novice.
- **Gently challenges inaccuracies:** When stated data doesn't match observable reality (e.g., claimed ₹30K expenses on ₹1.8L salary in Mumbai), Ria flags it warmly: "That feels a bit low for Mumbai — want to look at your bank statement together to get the real number?"
- **Notes but doesn't flag guardrail violations during onboarding:** If Ria discovers revolving credit card debt, missing insurance, or F&O trading, she records it internally for the financial plan but does not lecture during onboarding. Discovery mode, not advice mode.
- **Always represents Avara as a SEBI-registered IA:** Mentions this in the opening and whenever trust or credibility is relevant. Explains what it means in plain language when asked.

---

# Conversation Design

## Chapter Structure

The onboarding conversation has four visible chapters. The user sees which chapter they're in via a subtle label or header in the chat. Ria signals transitions conversationally. Chapters are sequential by default but adaptive — if a user arrives with a specific trigger, Ria follows that energy and weaves chapter content around it.

### Chapter 1: Getting to know you

**Covers:** Who you are — work, city, family, life stage, what brought you here.

**Target time:** 3–5 minutes.

**Default modality:** Chat (light, factual, quick-reply friendly).

### Chapter 2: Your money today

**Covers:** Income, expenses, investments (all asset classes), loans, insurance. Bank statement and MF statement uploads happen here. Data safety and compliance framing delivered at the start of this chapter.

**Target time:** 7–12 minutes.

**Default modality:** Chat for data collection. Voice suggested for insight walkthrough after document analysis.

### Chapter 3: What you want

**Covers:** Goals (concrete or hurdle rate), risk appetite, fears, aspirations, career trajectory.

**Target time:** 5–8 minutes.

**Default modality:** Voice suggested (open-ended discovery extracts richer data in voice).

### Chapter 4: The picture so far

**Covers:** Ria plays back the full financial snapshot, confirms accuracy, bridges to financial plan.

**Target time:** 3–5 minutes.

**Default modality:** Voice (the mirror moment — deliver in voice for impact).

## The Opening

After sign-up (phone OTP, name captured), the user lands in the chat. Ria's first message:

> *Hey [Name], I'm Ria — your financial advisor at Avara. We're a SEBI-registered investment advisor, which means the advice I give you is regulated, unbiased, and built entirely around your interest — I don't earn commissions on anything I recommend. What brings you here?*
> 

Below this, suggested quick replies:

- "I want to grow my money faster"
- "I have a specific question"
- "A friend recommended Avara"
- "I want someone to check if I'm doing things right"

## Conversation Flows by Entry Type

### Flow A: General wealth growth (most common)

Ria's hook: a provocative question about whether the user knows their actual equity-to-debt ratio including EPF/PF. Most users don't. This creates curiosity and frames the onboarding as something that delivers insight, not just collects data. Ria sets a time expectation (15–20 minutes) and frames onboarding as valuable in itself.

### Flow B: Impatient user ("just tell me what to invest in")

Ria acknowledges the directness, explains why generic recommendations are no better than a YouTube top-10 list, and offers a provocative taste — a question about their actual savings rate or allocation. The insight from their answer pulls them into the discovery. Pattern: acknowledge impatience → give a taste of insight → redirect to discovery by demonstrating that the discovery itself is valuable.

### Flow C: Trigger-driven user (bonus, home purchase, insurance event, etc.)

Ria goes deep on the trigger immediately, demonstrating competence (e.g., the hierarchy of financial priorities for a bonus, the real math on renting vs buying). The trigger-specific conversation naturally expands into broader discovery as Ria explains what else she needs to give a genuinely useful answer.

### Flow D: Referral user (curious but passive)

Ria asks what their friend told them and whether they have something specific on their mind, or are in explore mode. Offers the value proposition: 15–20 minutes of conversation, discover things about your money you didn't know.

## Chapter 1 Detail: Getting to Know You

Light, fast, mostly quick-reply friendly. Covers:

- Work: industry, employer, role, tenure
- Location: city, renting vs owning
- Family: marital status, dependents
- Parental situation: financial independence, health insurance (asked with high transparency about why — "biggest financial risk for people your age is often an unexpected medical bill for a parent")

Clear transition at end: "Okay, I've got a good picture of your life. Now let's look at the money side."

## Chapter 2 Detail: Your Money Today

### Data Safety Framing (delivered at chapter transition)

Before requesting any financial data, Ria proactively addresses data safety:

> *Before we get into the money side — I want to be upfront about something: everything you share with me is completely confidential. As a SEBI-registered advisor, we're legally bound by client confidentiality norms — your data can't be shared with anyone, ever. We're also fully compliant with India's data protection laws under the DPDP Act. Your documents are encrypted, only used to build your financial plan, and you can ask us to delete everything at any time.*
> 

In chat, this includes a collapsible "Learn more about our data practices" link. Each upload card also includes a brief reassurance line: "Your documents are encrypted and only used to build your financial plan."

### Income

Capture take-home salary (actual bank credit, not CTC), variable pay, side income. If user gives CTC, Ria helps them distinguish in-hand.

### Bank Statement Upload (Priority Document)

Prompted after income discussion. Framed as saving time and getting the real picture:

> *If you can share the last 3 months from your primary salary account, I can see your real income, your actual spending patterns, your EMIs, your SIP debits — basically the truth about where your money goes, without you having to estimate anything.*
> 

3 months ideal. 1 month acceptable. 6+ months even better for seasonal patterns. Upload card includes download instructions for major banks (SBI, HDFC, ICICI, Kotak, Axis). If user defers, conversation continues — not a blocker.

### Expenses

Validated against bank statement if available. If not, captured conversationally with gentle challenge when numbers seem implausible for the user's income and city. Ria names specific spending categories this demographic relates to (Swiggy, Zomato, Amazon, subscriptions).

### Investments: Full Asset Sweep

**Mutual Fund Statement Upload** (Second Priority Document):

Prompted when MF discussion begins. Framed as enabling portfolio-level analysis.

**Comprehensive Asset Inventory** (conversational, with upload option for each):

Ria presents common asset types as multi-select quick replies: Stocks, Fixed Deposits, PPF, NPS, Gold (physical or digital), Real estate / property, Crypto, ESOPs/RSUs.

For each selected asset, specific follow-ups:

- **Stocks:** Rough value, active trading vs buy-and-hold. Offer demat statement upload as alternative to verbal description.
- **Gold:** Physical (jewellery, coins) vs digital (SGBs, ETFs, Groww). Rough value.
- **Real estate:** Owner-occupied, investment, or ancestral. Rough current value. Loan against it.
- **ESOPs/RSUs:** Company, vested vs unvesting, current estimated value.
- **Crypto:** Rough value. Ria explains why she asks (30% flat tax, no loss offset — affects portfolio thinking).
- **PPF/NPS/EPF:** Current balances. EPF check via EPFO portal.
- **FDs:** Amounts, maturity dates.

**Document Upload Flexibility:** At any point during the asset sweep, the user can upload documents instead of explaining verbally. A persistent "Share a document" button is always accessible in the chat. Accepted document types:

- Bank account statement (PDF, any duration)
- CAMS / KFintech consolidated MF statement (PDF)
- Demat / stock holding statement (PDF — Zerodha Console, Groww, Angel One, CDSL, NSDL)
- Salary slips (PDF or image)
- Form 16 / ITR (PDF)
- Insurance policy documents (PDF or image)
- Loan statements (PDF)
- ESOP/RSU grant letters (PDF or image)
- NPS statement (PDF from CRA portal)
- EPF passbook (PDF from EPFO portal)

When the user uploads any document, Ria acknowledges it, processes it, extracts structured data, and asks the user to confirm key details: "I'm seeing 150 shares of Infosys and 80 shares of TCS in your demat statement — does that sound right?"

### Debts

All liabilities: home loan, education loan, car loan, personal loan, credit card revolving balance, BNPL, family borrowings. Cross-referenced with bank statement EMIs if available.

### Insurance

Health insurance (personal vs employer-only), term life, endowment/ULIP/money-back policies, critical illness, personal accident. Asked with transparency: "Insurance is genuinely the area where I find the most hidden risk for people your age." If LIC/endowment policies found, noted for plan — not flagged as bad during onboarding.

## Chapter 3 Detail: What You Want

Ria suggests switching to voice at this chapter transition: "This next part is less about numbers and more about you. A lot of people find it easier to just talk through this. Want to switch to a call? About 5 minutes."

### Goals Discovery

Using the three-tier framework conversationally:

- **Tier 1 (Foundations):** Not framed as goals — these are prerequisites. Emergency fund, insurance, zero high-interest debt.
- **Tier 2 (Concrete goals):** If they exist — home, car, MBA, wedding, travel. Capture: what, how much, when, how firm.
- **Tier 3 (Growth mandate):** For users without specific goals. Accept hurdle rate approach. Engage honestly with aggressive targets (15–20%) — acknowledge it's possible, note it requires specific allocation and stomach for volatility, save the detailed education for the plan.

### Risk Discovery (Behavioural, Not Questionnaire)

Past behaviour: "Have you ever panicked about your investments? Seen the value drop and thought about pulling out?"

Loss framing in real rupees: "Say your ₹20 lakh portfolio drops to ₹13 lakh in 6 months. How does that sit with you?"

In voice, Ria listens for tone, hesitation, confidence.

### Career Trajectory (The Life-in-3-Years Question)

"Forget money for a second — where do you see your life in 3 years? Same job? Different city? Married? Running a startup? Doing an MBA abroad?" This unlocks career plans, life-stage planning, and unstated aspirations. Directly shapes the financial plan.

## Chapter 4 Detail: The Picture So Far

Ria suggests voice if not already on a call. Delivers a conversational summary of the user's financial life:

- Who they are, what they earn, what they save
- True asset allocation (the full picture including EPF, PPF, FDs, gold, real estate)
- 2–3 key observations that are specific to this user
- Positive framing: opportunities, not problems

Then the bridge to Step 2:

> *I have what I need to build your personalised financial plan. This is where I go deep — specific recommendations on where to invest, how much, what to fix, what to keep. It's free, and it's built entirely around everything you've just told me. Want me to go ahead?*
> 

## Handling Edge Cases

**Minimal responder (one-word answers):** Ria adapts by being more specific, using more quick-replies, asking closed questions. Gets minimum viable data set and flags gaps for later.

**Oversharer:** Ria is patient, extracts relevant data from narrative, gently steers: "That's really helpful context. Let me make sure I've got the key details right: [summary]. Okay, let me ask about..."

**Skeptic ("Why should I trust an AI?"):** Ria doesn't get defensive. Acknowledges skepticism as reasonable. Pitches: go through the conversation, judge based on the insights. No commitment, no payment, just a conversation. References SEBI registration and fiduciary duty.

**Sophisticated user:** Ria calibrates up. Drops simplified explanations, engages at their level: "You clearly know your way around this — let me ask the stuff that actually matters for a plan."

**Returning user after long gap:** Warm, no guilt. Recaps where they left off, estimates remaining time, offers to pick up or start fresh.

---

# Voice Strategy

Voice is not a passive alternative to chat. It is a strategic tool the AI deploys at specific moments because it unlocks things chat structurally cannot.

## Three Tactical Voice Moments

### Moment 1: The "Let's Just Talk" Transition (Minute 5–8)

After initial chat has established rapport and captured basic factual data, Ria suggests a voice call to cover qualitative discovery: career trajectory, family situation, goals, relationship with money.

**Purpose:** Efficiency (voice covers ground faster than chat) + Depth (people give richer, less filtered answers in voice) + Re-engagement (modality switch resets attention at the point where chat momentum typically fades).

Framed with a time box: "Want to hop on a quick call? 5–7 minutes."

### Moment 2: The Insight Walkthrough (Post-Upload Analysis)

After document upload and analysis, Ria offers to walk through findings via voice rather than sending a wall of text in chat.

**Purpose:** Impact (insights land harder with conversational pacing, emphasis, and pauses) + Trust (the user can ask follow-up questions in real-time) + Delight (feels like a premium advisory experience).

### Moment 3: The Wrap-Up and Alignment (End of Onboarding)

Once Ria has sufficient data, a voice call to confirm the picture: "Can I walk you through what I've learned in a 3-minute call? I want to make sure I've got it right before I build your plan."

**Purpose:** Completeness (user hears their financial life reflected back, corrects errors) + Commitment (emotional investment in proceeding to the plan).

## What Voice Unlocks That Chat Cannot

**Richer qualitative data:** People edit themselves when they type. In voice, they ramble — and the ramble contains career anxiety, family dynamics, unstated fears, and spending psychology that never comes through in chat.

**Emotional and behavioural signals:** Hesitation before answering about risk tolerance. Confidence or anxiety about career. Guilt about the LIC policy. These shape the risk profile and communication approach far more than any questionnaire.

**Second-order information:** A single voice answer to "tell me about your parents' situation" can reveal: parental retirement status, pension income, real estate, health insurance gaps, recent medical events, sibling dynamics, and caregiver burden — data that would require 8–10 chat questions.

## Principle

**Chat for data, voice for understanding.** Transactional parts (uploads, factual confirmations, async catch-ups) stay in chat. Qualitative, emotional, and insight-delivery moments move to voice.

---

# Data Requirements

## Minimum Viable Data Set (Hard Minimum — must have before proceeding to Step 2)

| Data Point | Source |
| --- | --- |
| Age, city, family/dependent situation | Conversation |
| Monthly take-home income | Conversation or salary slip |
| Rough monthly expenses (even estimated) | Conversation or bank statement |
| Basic view of existing investments (types and rough values) | Conversation, MF statement, or demat statement |
| Health insurance status (yes / no / employer-only) | Conversation |
| Life insurance status (yes / no / type) | Conversation |
| Expression of intent: a goal, a hurdle rate, or "grow my money" | Conversation |

## Comprehensive Data Set (Soft Set — strongly encouraged, collected over time)

| Data Point | Source | Priority |
| --- | --- | --- |
| Bank statement (3 months from primary salary account) | Upload | High |
| CAMS/KFintech consolidated MF statement | Upload | High |
| Demat / stock holding statement | Upload | Medium |
| Detailed expense breakdown by category | Bank statement analysis or conversation | High |
| Insurance policy details (sum assured, premium, provider) | Upload or conversation | Medium |
| Tax regime and deductions (80C, 80D, HRA, NPS) | Conversation or ITR/Form 16 upload | Medium |
| Loan/debt details (outstanding, EMI, rate, tenure) | Conversation or bank statement | Medium |
| EPF and PPF balances | Conversation or EPFO passbook upload | Medium |
| Gold holdings (physical + digital, rough value) | Conversation | Medium |
| Real estate (type, estimated value, loan against it) | Conversation | Medium |
| ESOP/RSU details (grant, vesting, valuation) | Conversation or grant letter upload | Medium |
| NPS balance and allocation choice | Conversation or NPS statement upload | Low |
| Crypto holdings and rough value | Conversation | Low |
| Career stability assessment and trajectory | Conversation (ideally voice) | High |
| Behavioural risk profile (past behaviour, loss tolerance) | Conversation (ideally voice) | High |
| Parental financial health and insurance status | Conversation (ideally voice) | Medium |
| Salary slips (last 3 months) | Upload | Low |
| Form 16 / ITR | Upload | Low |

## Document Parsing Requirements

The system must parse and extract structured data from the following document types. Parsing accuracy does not need to be perfect in v1 — Ria confirms extracted data with the user.

| Document | Format | Key Data Extracted |
| --- | --- | --- |
| Bank statement | PDF (varies by bank) | Income credits, expense debits by category, EMI payments, SIP debits, insurance premiums, UPI transfers, savings patterns |
| CAMS/KFintech MF statement | PDF (standardised) | Fund names, folio numbers, purchase dates, current values, SIP amounts, regular vs direct plan, gain/loss |
| Demat holding statement | PDF (Zerodha/Groww/CDSL/NSDL) | Stock names, quantities, purchase prices, current values |
| Salary slips | PDF or image | Gross salary, deductions, net pay, PF contribution, tax deducted |
| Insurance policies | PDF or image | Policy type, provider, sum assured, premium, term, riders, nominee |
| Loan statements | PDF | Outstanding principal, EMI, interest rate, tenure remaining |
| ESOP/RSU grant letters | PDF or image | Grant size, vesting schedule, exercise price, company |
| ITR / Form 16 | PDF | Gross income, deductions claimed, tax paid, regime used |
| EPF passbook | PDF | Current balance, contribution history, employer contribution |
| NPS statement | PDF | Current value, asset allocation, contribution history |

---

# User Stories

## As a new user arriving from an Instagram ad...

- As a new user, I want to start a conversation immediately after sign-up so that I don't lose momentum between downloading the app and getting value.
- As a new user, I want to understand who Avara is and why I should trust them within the first message so that I feel safe sharing financial information.
- As a new user with a specific trigger (bonus, home purchase, insurance concern), I want the AI to engage with my specific situation immediately so that I feel heard rather than funnelled through a generic process.
- As a new user without a specific trigger, I want a clear reason to continue the conversation so that I don't abandon the app after the first screen.

## As a user going through onboarding...

- As a user, I want to see which areas of my financial life the AI has covered and which remain so that I know how much more time is needed.
- As a user, I want to receive genuine financial insights during the onboarding itself so that the process feels valuable, not extractive.
- As a user, I want to upload documents instead of answering questions verbally when I have documents available so that I save time and the AI gets more accurate data.
- As a user, I want clear instructions on how to download each document type (CAMS statement, bank statement, demat statement) so that I'm not stuck figuring it out.
- As a user, I want reassurance about data safety before sharing sensitive financial documents so that I trust the platform with my information.
- As a user, I want to pause the conversation and come back later without losing progress so that the onboarding fits my schedule.
- As a user, I want to switch between typing and voice calls depending on the situation so that I can talk through complex topics and type through quick ones.
- As a user, I want the AI to adapt its language to my level of financial knowledge so that I don't feel talked down to or overwhelmed.
- As a user who already knows a lot about investing, I want the AI to skip basic explanations and get to the substantive questions so that my time isn't wasted.
- As a user who gave an inaccurate expense estimate, I want the AI to gently challenge me with a reasonable explanation so that the data underlying my plan is accurate.

## As a user completing onboarding...

- As a user, I want to see a structured profile of everything the AI has learned about me so that I can verify accuracy and feel confident the plan will be personalised.
- As a user, I want to be able to edit any data point the AI captured incorrectly so that the source of truth is always accurate.
- As a user, I want the AI to walk me through a summary of my financial picture before building my plan so that I feel understood and aligned.
- As a user, I want a clear call-to-action to proceed to my financial plan once onboarding is complete so that I know what happens next.

## As a returning user...

- As a user returning after days, I want the AI to recap where we left off and tell me how much more time is needed so that I can pick up efficiently.
- As a user who uploaded a document between sessions, I want the AI to acknowledge it processed the document and share what it found so that my effort feels recognised.

---

# Requirements

## Must-Have (P0)

| # | Requirement | Acceptance Criteria |
| --- | --- | --- |
| P0-1 | **Conversational onboarding via text chat** | User lands in chat immediately after sign-up. Ria's first message includes SEBI IA identity, no-commission framing, and an open question. Conversation flows through all four chapters. |
| P0-2 | **AI persona (Ria) with calibrated responses** | Ria adapts language complexity based on detected user sophistication. Never uses unexplained jargon with novice users. Engages at peer level with sophisticated users. |
| P0-3 | **Quick-reply suggestions** | Tappable options appear at key decision points (entry, asset type selection, yes/no questions). Minimum 3 taps available at conversation start. |
| P0-4 | **Document upload capability** | Users can upload PDF and image files in-conversation. Upload cards appear at prompted moments with one-line rationale and data safety reassurance. Persistent "Share a document" button accessible at all times. |
| P0-5 | **Bank statement parsing** | System extracts income, expense categories, EMIs, SIP debits, and insurance premiums from uploaded bank statements. Supports major banks: SBI, HDFC, ICICI, Kotak, Axis. Ria confirms extracted data with user. |
| P0-6 | **MF statement parsing** | System extracts fund names, current values, SIP amounts, and direct/regular plan status from CAMS/KFintech consolidated statements. Ria confirms extracted data with user. |
| P0-7 | **Demat statement parsing** | System extracts stock names, quantities, and current values from demat holding statements. Supports Zerodha, Groww, CDSL, NSDL formats. Ria confirms extracted data with user. |
| P0-8 | **Structured client profile (Surface 2)** | Dashboard shows all captured data organised by section (Personal, Income, Expenses, Investments, Loans, Insurance, Tax, Goals). Each section has completeness indicator. All fields are user-editable. |
| P0-9 | **True asset allocation calculation** | System computes actual equity/debt/gold/real estate/other allocation including EPF, PPF, NPS, FDs, insurance policies — not just the MF portfolio. Displayed as a visual in the profile and delivered as an insight card in conversation. |
| P0-10 | **Insight cards (micro-mirrors)** | At least 2–3 insight cards delivered during onboarding based on actual user data. Each includes a headline, a key number or visual, and a plain-language explanation. |
| P0-11 | **Data safety and compliance framing** | SEBI confidentiality, DPDP Act compliance, encryption, and right to deletion communicated proactively at the start of Chapter 2 and on every upload card. |
| P0-12 | **Session persistence and async support** | Conversation state, profile data, and all uploads persist across sessions. Return greeting includes recap and estimated remaining time. |
| P0-13 | **Chapter progress indicator** | Visual element showing which areas are covered (filled) and which remain (outlined). Tapping navigates to the profile. |
| P0-14 | **Minimum viable data set gate** | System tracks data completeness against the hard minimum. "Ready for your financial plan" CTA only appears when the minimum is met. |
| P0-15 | **Bridge to Step 2** | Clear transition from completed onboarding to financial plan generation. User confirms they want to proceed. Ria confirms timeline for plan delivery. |

## Nice-to-Have (P1)

| # | Requirement | Acceptance Criteria |
| --- | --- | --- |
| P1-1 | **Live voice call capability** | User can switch to real-time voice conversation at any point. AI suggests voice at three tactical moments (Chapter 2→3 transition, post-upload insight, Chapter 4 summary). Voice persona matches defined characteristics. |
| P1-2 | **Upload tutorials with bank-specific instructions** | Each upload card includes a collapsible "How to get this" section with step-by-step instructions for downloading from major providers (top 5 banks, CAMS, KFintech, Zerodha, Groww). |
| P1-3 | **Push notifications for re-engagement** | Contextual notification at 24 hours if user drops off mid-onboarding ("I've been looking at your portfolio — I found something interesting"). One more at 72 hours. Then quiet. |
| P1-4 | **Salary slip and ITR parsing** | Extract gross salary, deductions, PF contribution from salary slips. Extract income, deductions, regime from ITR/Form 16. |
| P1-5 | **Insurance and loan document parsing** | Extract policy details from insurance PDFs. Extract loan terms from loan statements. |
| P1-6 | **Gentle challenge on suspected inaccuracies** | When stated expenses don't match income/city profile, Ria flags warmly and suggests reviewing bank statement together. |
| P1-7 | **ESOP/RSU, NPS, EPF document parsing** | Extract structured data from grant letters, NPS statements, EPF passbooks. |

## Future Considerations (P2)

| # | Requirement | Rationale |
| --- | --- | --- |
| P2-1 | **Account Aggregator integration** | Auto-pull bank statements, loan data, and insurance details via AA framework. Eliminates upload friction. Pending API agreements. |
| P2-2 | **CAMS/KFintech API integration** | Auto-pull MF portfolio data. Eliminates statement upload. |
| P2-3 | **EPFO portal integration** | Auto-pull EPF balance and contribution history. |
| P2-4 | **Couple / joint onboarding** | Support two users with different risk profiles building a combined plan. |
| P2-5 | **Voice message (async voice) support** | User sends voice notes, AI responds with voice notes. WhatsApp-style. |
| P2-6 | **Multi-language support** | Hindi and regional language support for broader reach beyond English-native users. |
| P2-7 | **Human advisor escalation** | Routing to a human advisor for edge cases (complex ESOP situations, couples with disagreements, users in emotional crisis). |

---

# Success Metrics

## Primary Metric: Onboarding Completion Rate

**Definition:** % of users who sign up and reach the "Ready for your financial plan" state (minimum viable data set collected, user agrees to proceed to Step 2).

**Target:** 60% within 30 days of sign-up.

**Stretch:** 70% within 30 days.

**Measurement:** Track sign-up → minimum data set → Step 2 consent funnel in analytics. Evaluated weekly.

## Supporting Metrics

### Leading Indicators (days to weeks)

| Metric | Definition | Target |
| --- | --- | --- |
| First-session engagement | % of sign-ups who send at least 5 messages in first session | 80%+ |
| Document upload rate | % of users who upload at least one document during onboarding | 50%+ |
| Bank statement upload rate | % of users who upload their bank statement specifically | 40%+ |
| Voice call adoption | % of onboarding users who switch to voice at least once | 25%+ (P1) |
| Session return rate | % of users who return for a second session if they didn't complete in one | 50%+ |
| Time to completion | Median total time spent in onboarding across all sessions | 15–25 minutes |
| Insight card engagement | % of insight cards where user responds or asks a follow-up | 60%+ |

### Lagging Indicators (weeks to months)

| Metric | Definition | Target |
| --- | --- | --- |
| Step 2 conversion | % of completed onboardings that result in a delivered financial plan | 80%+ |
| Data completeness score | Average % of comprehensive data set filled at onboarding completion | 65%+ |
| Profile correction rate | % of users who edit a data point on their profile (lower is better — means AI captured accurately) | <15% |
| NPS / satisfaction | Post-onboarding satisfaction score | 8+ / 10 |
| Referral rate | % of users who refer a friend within 30 days of onboarding | 15%+ |

---

# Session Management and Re-engagement

## Async Behaviour

- Conversation, profile, and uploads persist across sessions indefinitely.
- Every return visit opens with a recap: what's been covered, what's remaining, estimated time to finish.
- If user uploaded documents between sessions, Ria acknowledges and shares findings on return.

## Push Notifications

- **24 hours after drop-off:** Contextual, not generic. References something specific: "I've been looking at your portfolio — I found something interesting. Come back when you have a few minutes."
- **72 hours after drop-off:** One more attempt. "Still want to get that financial picture sorted? I've got all your info saved — we can pick up where we left off in 5 minutes."
- **After 72 hours:** No more notifications. Respect the user's decision.

---

# Technical Considerations

## Preferred Stack (All Negotiable)

- **AI Intelligence:** OpenAI (preferred provider for LLM)
- **Voice:** ElevenLabs or equivalent real-time conversational AI voice
- **Deployment:** Vercel
- **Database:** Supabase
- **Mobile:** PWA - mobile first, but fully desktop compatible.
- **Document Parsing:** To be determined by engineering. Must handle PDF extraction with varying formats across banks and institutions.

## Key Technical Decisions for Engineering

- Document parsing pipeline architecture (especially bank statements, which vary dramatically across banks)
- Real-time voice integration architecture (latency requirements for conversational feel)
- AI conversation state management (maintaining context across sessions and modality switches)
- Profile data schema (must support the full data model from the onboarding guide's Section 7 templates)
- Data encryption and compliance architecture (SEBI and DPDP requirements)

---

# Open Questions

| # | Question | Owner | Blocking? |
| --- | --- | --- | --- |
| OQ-1 | What is the final name for the AI persona? "Ria" is a working placeholder. Need to validate with target users. | Product / Brand | No |
| OQ-2 | What is the exact scope of SEBI compliance documentation required for AI-delivered onboarding? Do we need explicit consent forms, or is conversational consent sufficient? | Legal / Compliance | Yes |
| OQ-3 | What is the DPDP Act's requirement for data retention and deletion? How does this interact with SEBI's 5-year record-keeping requirement? | Legal | Yes |
| OQ-4 | How reliable is document parsing for bank statements across the long tail of Indian banks beyond the top 5? What is the fallback for unparseable documents? | Engineering | No |
| OQ-5 | What is the latency budget for the voice experience to feel conversational? ElevenLabs benchmarks needed. | Engineering | No (P1) |
| OQ-6 | Should the AI persona be gendered (current assumption: female) or gender-neutral? User testing needed. | Product / Design | No |
| OQ-7 | What is the minimum viable set of insight cards that can be generated from conversation data alone (no document uploads)? | Product / Data Science | No |
| OQ-8 | How do we handle the user who completes onboarding but has significant data gaps in the soft set? Is the financial plan quality-gated, or do we produce the best plan possible with available data? | Product | Yes |

---

# Timeline Considerations

## Phasing

**Phase 1 (MVP):** P0 requirements. Text chat onboarding with document uploads, structured profile, insight cards, session persistence, bridge to Step 2. Bank statement, MF statement, and demat statement parsing.

**Phase 2 (Fast Follow):** P1 requirements. Live voice calls, expanded document parsing (salary slips, insurance, loans, ESOP/RSU, NPS, EPF), push notifications, upload tutorials, gentle challenge on inaccuracies.

**Phase 3 (Platform):** P2 requirements. Account Aggregator integration, CAMS API, couple onboarding, multi-language, human escalation.

## Dependencies

- Voice (P1) depends on ElevenLabs integration and latency testing
- Account Aggregator (P2) depends on API agreements (in progress)
- SEBI and DPDP compliance sign-off required before any user data collection (blocking for Phase 1)

---

# Reference Documents

- Step 1: The Onboarding Guide (The Modern RIA) — the source framework for all discovery methodology, conversation techniques, data capture templates, and quality checklists
- Step 2: The Financial Plan (The Modern RIA) — the downstream consumer of onboarding data; defines what the plan needs and therefore what onboarding must capture

---

> *This PRD synthesises Avara's advisory methodology (The Modern RIA, Steps 1–2) into a product specification for AI-delivered onboarding. The onboarding is not a gate before value — it is the first act of value delivery. Every minute of the user's attention is repaid with genuine insight about their financial life.*
>