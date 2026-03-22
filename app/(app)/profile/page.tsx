"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@/lib/contexts/user-context";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { EditableField } from "@/components/profile/EditableField";
import { BridgeCTA } from "@/components/profile/BridgeCTA";

interface ProfileData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assets: Array<Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debts: Array<Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents: Array<Record<string, any>>;
  collected: Record<string, Record<string, boolean>>;
  currentChapter: number;
  minimumViableComplete: boolean;
  documentsStatus: Record<string, string>;
}

interface CompletenessData {
  sections: Array<{
    name: string;
    total: number;
    collected: number;
    missing: string[];
  }>;
  overallPercent: number;
  minimumViableComplete: boolean;
}

const SECTION_CONFIG = [
  { name: "personal", label: "Personal", icon: "👤" },
  { name: "income", label: "Income & Expenses", icon: "💰" },
  { name: "investments", label: "Investments", icon: "📈" },
  { name: "loans", label: "Loans & Debt", icon: "💳" },
  { name: "insurance", label: "Insurance", icon: "🛡️" },
  { name: "tax", label: "Tax", icon: "🧾" },
  { name: "goals", label: "Goals & Risk", icon: "🎯" },
];

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [completeness, setCompleteness] = useState<CompletenessData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const user = useUser();

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/profile/completeness").then((r) => r.json()),
    ])
      .then(([profileData, completenessData]) => {
        setData(profileData);
        setCompleteness(completenessData);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async (field: string, value: unknown) => {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    // Refresh data
    const res = await fetch("/api/profile");
    const updated = await res.json();
    setData(updated);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-dvh bg-[#F7F7FA] items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#E94560] animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 rounded-full bg-[#E94560] animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 rounded-full bg-[#E94560] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  if (!data || !completeness) {
    return (
      <div className="flex flex-col h-dvh bg-[#F7F7FA] items-center justify-center">
        <p className="text-[#6B7280]">Unable to load profile</p>
      </div>
    );
  }

  const { profile, assets, debts, documents, documentsStatus } = data;

  function getSection(name: string) {
    return completeness!.sections.find((s) => s.name === name);
  }

  function buildSummary(name: string): string | undefined {
    switch (name) {
      case "personal": {
        const parts = [];
        if (profile.age) parts.push(`${profile.age}`);
        if (profile.city) parts.push(profile.city);
        if (profile.employer) parts.push(profile.employer);
        return parts.length > 0 ? parts.join(" · ") : undefined;
      }
      case "income": {
        const parts = [];
        if (profile.monthly_take_home)
          parts.push(
            `₹${Number(profile.monthly_take_home).toLocaleString("en-IN")}/month`
          );
        if (profile.monthly_expenses)
          parts.push(
            `₹${Number(profile.monthly_expenses).toLocaleString("en-IN")} expenses`
          );
        return parts.length > 0 ? parts.join(" · ") : undefined;
      }
      case "investments": {
        const total = assets.reduce(
          (sum, a) => sum + (Number(a.current_value) || 0),
          0
        );
        if (total > 0) {
          const types = new Set(assets.map((a) => a.asset_type));
          return `₹${total.toLocaleString("en-IN")} across ${types.size} asset type(s)`;
        }
        return undefined;
      }
      case "loans": {
        if (debts.length > 0) {
          const totalEmi = debts.reduce((sum, d) => sum + (Number(d.emi) || 0), 0);
          return `${debts.length} loan(s)${totalEmi > 0 ? ` · ₹${totalEmi.toLocaleString("en-IN")}/mo EMI` : ""}`;
        }
        return undefined;
      }
      case "insurance":
        return profile.health_insurance_status
          ? `Health: ${profile.health_insurance_status}`
          : undefined;
      case "tax":
        return profile.tax_regime
          ? `${profile.tax_regime} regime`
          : undefined;
      case "goals":
        return profile.risk_willingness
          ? `Risk: ${profile.risk_willingness}`
          : undefined;
      default:
        return undefined;
    }
  }

  return (
    <div className="flex flex-col h-dvh bg-[#F7F7FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <Link
          href="/chat"
          className="flex items-center gap-2 text-[#0F3460] hover:underline text-sm"
        >
          <ArrowLeft size={16} />
          Back to Chat
        </Link>
        <span className="text-lg font-semibold text-[#1A1A2E] tracking-tight">
          Avara
        </span>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-lg mx-auto w-full">
        {/* Title + progress */}
        <div className="mb-2">
          <h2 className="text-xl font-bold text-[#1A1A2E]">
            {user.fullName ? `${user.fullName.split(" ")[0]}'s` : "Your"} Financial Profile
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E94560] rounded-full transition-all duration-500"
                style={{ width: `${completeness.overallPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium text-[#6B7280]">
              {completeness.overallPercent}%
            </span>
          </div>
        </div>

        {/* Section cards */}
        {SECTION_CONFIG.map(({ name, label, icon }) => {
          const section = getSection(name) || {
            collected: name === "loans" ? debts.length : 0,
            total: name === "loans" ? Math.max(debts.length, 1) : 1,
            missing: [],
          };

          return (
            <ProfileSection
              key={name}
              name={name}
              label={label}
              icon={icon}
              collected={section.collected}
              total={section.total}
              missing={section.missing}
              summary={buildSummary(name)}
            >
              {name === "personal" && (
                <>
                  <EditableField label="Age" value={profile.age} field="age" type="number" onSave={handleSave} />
                  <EditableField label="City" value={profile.city} field="city" onSave={handleSave} />
                  <EditableField label="Marital Status" value={profile.marital_status} field="maritalStatus" onSave={handleSave} />
                  <EditableField label="Dependents" value={profile.dependents} field="dependents" type="number" onSave={handleSave} />
                  <EditableField label="Employer" value={profile.employer} field="employer" onSave={handleSave} />
                  <EditableField label="Industry" value={profile.industry} field="industry" onSave={handleSave} />
                  <EditableField label="Housing" value={profile.housing} field="housing" onSave={handleSave} />
                </>
              )}
              {name === "income" && (
                <>
                  <EditableField label="Monthly Take-Home" value={profile.monthly_take_home} field="monthlyTakeHome" type="number" prefix="₹" onSave={handleSave} />
                  <EditableField label="Variable Pay" value={profile.variable_pay_annual} field="variablePayAnnual" type="number" prefix="₹" suffix="/yr" onSave={handleSave} />
                  <EditableField label="Side Income" value={profile.side_income_monthly} field="sideIncomeMonthly" type="number" prefix="₹" suffix="/mo" onSave={handleSave} />
                  <EditableField label="Monthly Expenses" value={profile.monthly_expenses} field="monthlyExpenses" type="number" prefix="₹" onSave={handleSave} />
                  {profile.savings_rate != null && (
                    <div className="flex items-center gap-2 py-1.5">
                      <span className="text-xs text-[#6B7280] w-28">Savings Rate</span>
                      <span className="text-sm font-medium text-[#059669]">
                        {Math.round(Number(profile.savings_rate) * 100)}%
                      </span>
                    </div>
                  )}
                </>
              )}
              {name === "investments" && (
                <>
                  {assets.length > 0 ? (
                    <div className="space-y-1.5">
                      {assets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between py-1">
                          <div>
                            <span className="text-xs text-[#6B7280]">{asset.asset_type.replace("_", " ")}</span>
                            {asset.name && <span className="text-xs text-[#1A1A2E] ml-1">{asset.name}</span>}
                          </div>
                          <span className="text-sm font-medium text-[#1A1A2E] font-mono">
                            ₹{Number(asset.current_value || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B7280]">No investment data yet</p>
                  )}
                </>
              )}
              {name === "loans" && (
                <>
                  {debts.length > 0 ? (
                    <div className="space-y-1.5">
                      {debts.map((debt) => (
                        <div key={debt.id} className="flex items-center justify-between py-1">
                          <div>
                            <span className="text-xs text-[#6B7280]">{(debt.debt_type || "").replace("_", " ")}</span>
                            {debt.lender && <span className="text-xs text-[#1A1A2E] ml-1">· {debt.lender}</span>}
                          </div>
                          <div className="text-right">
                            {debt.emi && (
                              <span className="text-sm font-medium text-[#1A1A2E] font-mono">
                                ₹{Number(debt.emi).toLocaleString("en-IN")}/mo
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B7280]">No loan data yet</p>
                  )}
                </>
              )}
              {name === "insurance" && (
                <>
                  <EditableField label="Health Insurance" value={profile.health_insurance_status} field="healthInsuranceStatus" onSave={handleSave} />
                  <EditableField label="Health Cover" value={profile.health_insurance_sum} field="healthInsuranceSum" type="number" prefix="₹" onSave={handleSave} />
                  <EditableField label="Term Life" value={profile.term_life_insurance} field="termLifeInsurance" type="boolean" onSave={handleSave} />
                  <EditableField label="Term Cover" value={profile.term_life_cover} field="termLifeCover" type="number" prefix="₹" onSave={handleSave} />
                </>
              )}
              {name === "tax" && (
                <>
                  <EditableField label="Tax Regime" value={profile.tax_regime} field="taxRegime" onSave={handleSave} />
                </>
              )}
              {name === "goals" && (
                <>
                  <EditableField label="Risk Willingness" value={profile.risk_willingness} field="riskWillingness" onSave={handleSave} />
                  <EditableField label="Career Trajectory" value={profile.career_trajectory} field="careerTrajectory" onSave={handleSave} />
                </>
              )}
            </ProfileSection>
          );
        })}

        {/* Documents section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📄</span>
            <h3 className="font-semibold text-sm text-[#1A1A2E]">Documents</h3>
          </div>
          <div className="space-y-2">
            {(["bankStatement", "mfStatement", "dematStatement"] as const).map(
              (key) => {
                const status = documentsStatus[key] || "not_uploaded";
                const labels: Record<string, string> = {
                  bankStatement: "Bank Statement",
                  mfStatement: "MF Statement",
                  dematStatement: "Demat Statement",
                };
                const statusColors: Record<string, string> = {
                  not_uploaded: "text-[#9CA3AF]",
                  uploaded: "text-[#D97706]",
                  processing: "text-[#D97706]",
                  parsed: "text-[#059669]",
                  failed: "text-[#EF4444]",
                };
                const statusLabels: Record<string, string> = {
                  not_uploaded: "Not uploaded",
                  uploaded: "Uploaded",
                  processing: "Processing...",
                  parsed: "✓ Analyzed",
                  failed: "Failed",
                };

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-[#1A1A2E]">
                      {labels[key]}
                    </span>
                    <span
                      className={`text-xs font-medium ${statusColors[status]}`}
                    >
                      {statusLabels[status]}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Bridge CTA */}
        {data.minimumViableComplete && <BridgeCTA />}
      </div>
    </div>
  );
}
