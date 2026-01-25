import type { CampaignEmail } from "../aiExtractorModels";

/**
 * Build the prompt including schema hints and email context.
 */
export function buildEmailPrompt(email: CampaignEmail): string {
  const lines = [
    "Extract campaign data according to the output schema.",
    "Remember: If classification.isBrandDeal is false, set all other scalar fields to null and arrays to [].",
    "Prefer the newest reply content; ignore outdated quoted text.",
    "",
    "<EMAIL_METADATA>",
    `From: ${email.from ?? ""}`,
    `Subject: ${email.subject ?? ""}`,
    `ReceivedAt: ${email.receivedAt ?? ""}`,
    "</EMAIL_METADATA>",
    "",
    "<EMAIL_BODY>",
    email.body ?? "",
    "</EMAIL_BODY>",
  ];

  return lines.join("\n").trim();
}

export function buildEmailPromptSnippet(
  email: CampaignEmail,
  maxBodyChars: number,
): string {
  const bodySnippet = (email.body ?? "").slice(0, maxBodyChars);
  const lines = [
    "<EMAIL_METADATA>",
    `From: ${email.from ?? ""}`,
    `Subject: ${email.subject ?? ""}`,
    "</EMAIL_METADATA>",
    "",
    "<EMAIL_BODY_SNIPPET>",
    bodySnippet,
    "</EMAIL_BODY_SNIPPET>",
  ];

  return lines.join("\n").trim();
}
