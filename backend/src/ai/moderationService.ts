import Groq from 'groq-sdk';
import ModerationIncident from '../models/ModerationIncident';
import CallSession from '../models/CallSession';
import User from '../models/User';

const getGroq = (): Groq | null => {
  const apiKey = process.env.GROQ_API_KEY;
  return apiKey ? new Groq({ apiKey }) : null;
};

export interface ModerationResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidenceScore: number;
  violationCategories: string[];
  recommendedAction: 'ALLOW' | 'WARN' | 'END_CALL' | 'TEMPORARY_RESTRICTION' | 'REVIEW_REQUIRED' | 'BLOCK_ACCOUNT';
  explanation: string;
}

export const moderateText = async (
  message: string, 
  userId: string, 
  callSessionId: string
): Promise<ModerationResult | null> => {
  const groq = getGroq();
  if (!groq) {
    console.warn('Groq API Key is not set, skipping AI moderation');
    return null;
  }

  try {
    const prompt = `
      You are an AI Safety Monitor for a video chat platform called VibeMeet.
      Analyze the following chat message for harassment, threats, hate speech, sexual exploitation, spam, and dangerous content.
      
      Message: "${message}"
      
      Return ONLY a JSON object with the following strict schema, no other text:
      {
        "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        "confidenceScore": number (0-100),
        "violationCategories": string[],
        "recommendedAction": "ALLOW" | "WARN" | "END_CALL" | "REVIEW_REQUIRED" | "BLOCK_ACCOUNT",
        "explanation": "brief reason"
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const resultStr = chatCompletion.choices[0]?.message?.content;
    if (!resultStr) return null;

    const result: ModerationResult = JSON.parse(resultStr);

    // If risk is high, record incident
    if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
      const incident = new ModerationIncident({
        userId,
        callSessionId,
        source: 'TEXT_CHAT',
        categories: result.violationCategories,
        riskLevel: result.riskLevel,
        confidenceScore: result.confidenceScore,
        recommendedAction: result.recommendedAction,
        finalAction: result.recommendedAction,
        status: 'PENDING'
      });
      await incident.save();

      // Automate action if CRITICAL
      if (result.riskLevel === 'CRITICAL' && result.confidenceScore > 85) {
        await User.findByIdAndUpdate(userId, { accountStatus: 'AI_BLOCKED' });
        await CallSession.findByIdAndUpdate(callSessionId, { status: 'AI_TERMINATED', aiSafetyStatus: 'DANGER', endedAt: new Date() });
      }
    }

    return result;

  } catch (err) {
    console.error('Groq AI Moderation Error:', err);
    return null;
  }
};
