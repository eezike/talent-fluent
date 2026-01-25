const sharedRules = [
  "OUTPUT RULES (shared):",
  "- Output JSON only.",
  "- No prose, no explanations.",
  "- Evidence must be exact substrings from the input.",
  "- Prefer null over guessing.",
].join("\n");

export const classifierPromptV1 = [
  "Classifier: routing only.",
  "Decide if this is a brand deal and pick the deal stage.",
  "No extraction.",
  "No summaries.",
  "No explanations.",
  "",
  sharedRules,
].join("\n");

export const minimalExtractionPromptV1 = [
  "Extractor: minimal UI payload.",
  "Extract ONLY: budget, deliverables, goLiveWindow.",
  "",
  "Rules:",
  "- Use exact substrings from the input.",
  "- If missing, return null (or [] for deliverables).",
  "- No legal or payment terms.",
  "",
  sharedRules,
].join("\n");

export const deepExtractionPromptV1 = [
  "Extractor: deep legal + money fields.",
  "Extract ONLY: usage rights, exclusivity, payment terms, invoicing details, cancellation/termination.",
  "",
  "Rules:",
  "- Evidence is required for every field.",
  "- Evidence must be an exact substring.",
  "- Never infer; return null if unclear.",
  "",
  sharedRules,
].join("\n");
