/**
 * Voice-specific system prompt for Ria.
 * This is used when generating the post-call summary and extraction.
 * The actual ElevenLabs agent uses the system prompt configured in its dashboard.
 *
 * This prompt is for the GPT-4o extraction call that runs on the transcript
 * after the voice call ends.
 */

export function buildVoiceExtractionPrompt(): string {
  return `You are analyzing a transcript of a voice call between Ria (a financial advisor) and a user.

Extract ALL financial data points discussed during the call into a JSON object.
Only extract explicitly stated information — do not infer.

Fields to extract (use null for fields not discussed):
{
  "age": number | null,
  "city": string | null,
  "maritalStatus": string | null,
  "dependents": number | null,
  "employer": string | null,
  "industry": string | null,
  "housing": string | null,
  "monthlyTakeHome": number | null,
  "monthlyExpenses": number | null,
  "healthInsuranceStatus": string | null,
  "termLifeInsurance": boolean | null,
  "goals": [{ "type": string, "description": string, "amount": number | null }] | null,
  "riskWillingness": string | null,
  "careerTrajectory": string | null,
  "lifeIn3Years": string | null,
  "hurdleRate": number | null
}

Return only the JSON object. Omit fields that were not discussed.`;
}

export function buildVoiceSummaryPrompt(): string {
  return `Summarize this voice call transcript between a financial advisor (Ria) and a client.

Create a summary with:
1. A list of 3-5 key topics covered (as short phrases)
2. A 2-3 sentence narrative summary of what was discussed

Format as JSON:
{
  "coveredTopics": ["topic 1", "topic 2", ...],
  "fullSummary": "narrative summary here"
}`;
}
