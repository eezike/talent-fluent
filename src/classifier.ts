export type ParsedEmail = {
  from: string;
  subject: string;
  snippet: string;
};

export type Classification = {
  isCampaign: boolean;
  reason: string;
};

const STRONG_CAMPAIGN_KEYWORDS = [
  "statement of work",
  "sow",
  "usage rights",
  "whitelisting",
  "creator partnership",
  "brand deal",
  "paid partnership",
  "sponsorship",
  "creative brief",
  "campaign brief",
  "influencer campaign",
  "contract",
  "agreement",
];

const CAMPAIGN_KEYWORDS = [
  "campaign",
  "brief",
  "proposal",
  "deliverables",
  "ugc",
  "influencer",
  "collab",
  "collaboration",
  "content creator",
  "rate",
  "budget",
  "fee",
  "compensation",
  "payment",
  "timeline",
  "go live",
  "posting",
  "deliverable",
];

const NEGATIVE_KEYWORDS = [
  "password reset",
  "verification code",
  "security alert",
  "newsletter",
  "unsubscribe",
  "receipt",
  "order confirmation",
  "shipping",
  "tracking",
  "login",
  "support ticket",
  "job application",
  "careers",
  "webinar",
];

function matchKeywords(text: string, keywords: string[]) {
  return keywords.filter((kw) => text.includes(kw));
}

function hasMoneySignal(text: string) {
  return /\$\s?\d|usd\s?\d/.test(text);
}

/**
 * Quick keyword-based check to decide if an email is likely a campaign.
 */
export function classifyEmail(email: ParsedEmail): Classification {
  const text = `${email.subject} ${email.snippet}`.toLowerCase();
  const from = email.from.toLowerCase();

  const strongMatches = matchKeywords(text, STRONG_CAMPAIGN_KEYWORDS);
  const matches = matchKeywords(text, CAMPAIGN_KEYWORDS);
  const negativeMatches = matchKeywords(text, NEGATIVE_KEYWORDS);

  let score = strongMatches.length * 2 + matches.length;
  if (hasMoneySignal(text)) score += 1;
  if (from.includes("no-reply") || from.includes("noreply")) score -= 2;
  score -= negativeMatches.length * 2;

  if (score >= 3 || (strongMatches.length > 0 && score >= 1)) {
    return {
      isCampaign: true,
      reason: `Score ${score}; strong=${strongMatches.join(", ") || "none"}; matches=${
        matches.join(", ") || "none"
      }`,
    };
  }

  if (negativeMatches.length && !strongMatches.length && !matches.length) {
    return {
      isCampaign: false,
      reason: `Negative keywords only: ${negativeMatches.join(", ")}`,
    };
  }

  return {
    isCampaign: false,
    reason: `Score ${score}; strong=${strongMatches.join(", ") || "none"}; matches=${
      matches.join(", ") || "none"
    }`,
  };
}
