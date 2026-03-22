export interface ConversationState {
  // Chapter tracking
  currentChapter: 1 | 2 | 3 | 4;
  chapterStartedAt: Record<number, string>;
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
    bankStatement:
      | "not_uploaded"
      | "uploaded"
      | "processing"
      | "parsed"
      | "failed";
    mfStatement:
      | "not_uploaded"
      | "uploaded"
      | "processing"
      | "parsed"
      | "failed";
    dematStatement:
      | "not_uploaded"
      | "uploaded"
      | "processing"
      | "parsed"
      | "failed";
  };

  // Minimum viable data set gate
  minimumViableComplete: boolean;

  // Sophistication tier (1-4, starts at 2, adjusts progressively)
  sophisticationTier: 1 | 2 | 3 | 4;

  // Insights delivered so far
  insightsDelivered: string[];

  // Voice session tracking
  activeVoiceSession: string | null;
  completedVoiceSessions: string[];
  voiceSuggestionsShown: string[]; // tracks which voice suggestions have been shown ('ch2_ch3', 'post_document', 'ch4_summary')

  // Component injection tracking (prevents duplicate cards)
  componentsShown: string[]; // e.g., ["upload_card:bank_statement", "insight_card:asset_allocation"]

  // Session management
  lastActiveAt: string;
  totalTimeSpentSeconds: number;
  sessionCount: number;
}

export function createInitialState(): ConversationState {
  return {
    currentChapter: 1,
    chapterStartedAt: { 1: new Date().toISOString() },
    chapterCompletedAt: {},
    collected: {
      personal: {
        age: false,
        city: false,
        maritalStatus: false,
        dependents: false,
        employer: false,
        industry: false,
        housing: false,
        parentSituation: false,
      },
      income: {
        monthlyTakeHome: false,
        variablePay: false,
        sideIncome: false,
      },
      expenses: {
        monthlyExpenses: false,
        breakdown: false,
      },
      investments: {
        mutualFunds: false,
        stocks: false,
        fds: false,
        ppf: false,
        epf: false,
        nps: false,
        gold: false,
        realEstate: false,
        crypto: false,
        esopRsu: false,
      },
      insurance: {
        healthInsurance: false,
        lifeInsurance: false,
      },
      tax: {
        regime: false,
        deductions: false,
      },
      goals: {
        goalsOrHurdleRate: false,
        riskProfile: false,
        careerTrajectory: false,
      },
    },
    documents: {
      bankStatement: "not_uploaded",
      mfStatement: "not_uploaded",
      dematStatement: "not_uploaded",
    },
    minimumViableComplete: false,
    sophisticationTier: 2,
    insightsDelivered: [],
    activeVoiceSession: null,
    completedVoiceSessions: [],
    voiceSuggestionsShown: [],
    componentsShown: [],
    lastActiveAt: new Date().toISOString(),
    totalTimeSpentSeconds: 0,
    sessionCount: 1,
  };
}
