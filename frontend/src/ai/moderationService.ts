/**
 * Frontend-side moderation helper.
 *
 * The heavy lifting is done server-side via Groq in `backend/src/ai/moderationService.ts`.
 * This module provides:
 *   1. A lightweight heuristic check to optimistically highlight potential issues
 *      client-side before the server responds (zero latency user feedback).
 *   2. A helper to format and display safety warnings received from the backend
 *      via Socket.IO `safety-warning` events.
 */

// ── Types ─────────────────────────────────────────────────────────────────────
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ClientModerationResult {
  flagged: boolean;
  riskLevel: RiskLevel;
  reason: string;
}

// ── Heuristic word-list (client-side only, very light-weight) ─────────────────
// This is intentionally NOT a comprehensive filter — the server Groq AI does
// the real work.  These patterns catch obvious, unambiguous slurs/threats so
// the UI can give immediate visual feedback without waiting for the server.
const HIGH_RISK_PATTERNS: RegExp[] = [
  /\bkill\s+you\b/i,
  /\bi\s+will\s+(hurt|kill|harm)\b/i,
  /\bdie\b.*\byou\b/i,
];

const MEDIUM_RISK_PATTERNS: RegExp[] = [
  /\bstupid\b/i,
  /\bidiot\b/i,
  /\bmoron\b/i,
];

/**
 * Performs a synchronous, heuristic-only risk check on a chat message.
 * Call this immediately when the user sends a message to give instant UI feedback.
 * The server's Groq result will arrive asynchronously via socket events.
 */
export const checkMessageRiskLocally = (message: string): ClientModerationResult => {
  const trimmed = message.trim();

  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        flagged: true,
        riskLevel: 'HIGH',
        reason: 'Your message contains language that may violate community guidelines.',
      };
    }
  }

  for (const pattern of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        flagged: true,
        riskLevel: 'MEDIUM',
        reason: 'Please keep your messages respectful.',
      };
    }
  }

  return { flagged: false, riskLevel: 'LOW', reason: '' };
};

// ── Safety warning display helper ─────────────────────────────────────────────

/** Maps server risk levels to display colours for the safety banner. */
export const getRiskColour = (level: RiskLevel): string => {
  switch (level) {
    case 'CRITICAL':
      return '#ef4444'; // red-500
    case 'HIGH':
      return '#f97316'; // orange-500
    case 'MEDIUM':
      return '#eab308'; // yellow-500
    default:
      return '#22c55e'; // green-500
  }
};

/** Returns a user-friendly banner title for each risk level. */
export const getRiskTitle = (level: RiskLevel): string => {
  switch (level) {
    case 'CRITICAL':
      return '🚨 Safety Violation – Call Terminated';
    case 'HIGH':
      return '⚠️ High-Risk Message Detected';
    case 'MEDIUM':
      return '⚠️ Safety Warning';
    default:
      return 'ℹ️ Safety Notice';
  }
};
