import type OpenAI from "openai";

export type DealStageRouting = "INBOUND" | "NEGOTIATION" | "CONTRACTING";

export interface CampaignClassifierResult {
  isBrandDeal: boolean;
  dealStage: DealStageRouting | null;
}

export interface CampaignMinimalExtraction {
  budget: string | null;
  deliverables: string[];
  goLiveWindow: string | null;
}

export interface EvidenceField {
  value: string | null;
  evidence: string | null;
}

export interface CampaignDeepExtraction {
  usageRights: EvidenceField;
  exclusivity: EvidenceField;
  paymentTerms: EvidenceField;
  invoicingDetails: EvidenceField;
  cancellationTermination: EvidenceField;
}

export interface ExtractorCallMetadata {
  usage: OpenAI.Completions.CompletionUsage | null;
  latencyMs: number;
  model: string;
  retries: number;
}

export interface CampaignExtractionSteps {
  classifier: CampaignClassifierResult;
  minimal: CampaignMinimalExtraction | null;
  deep: CampaignDeepExtraction | null;
  metadata: {
    classifier: ExtractorCallMetadata;
    minimal?: ExtractorCallMetadata;
    deep?: ExtractorCallMetadata;
  };
}

export const campaignClassifierSchema = {
  name: "campaign_classifier",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      isBrandDeal: { type: "boolean" },
      dealStage: {
        type: ["string", "null"],
        enum: ["INBOUND", "NEGOTIATION", "CONTRACTING", null],
      },
    },
    required: ["isBrandDeal", "dealStage"],
    strict: true,
  },
} as const;

export const campaignMinimalSchema = {
  name: "campaign_minimal_extraction",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      budget: { type: ["string", "null"] },
      deliverables: {
        type: "array",
        items: { type: "string" },
      },
      goLiveWindow: { type: ["string", "null"] },
    },
    required: ["budget", "deliverables", "goLiveWindow"],
    strict: true,
  },
} as const;

const evidenceFieldSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    value: { type: ["string", "null"] },
    evidence: { type: ["string", "null"] },
  },
  required: ["value", "evidence"],
} as const;

export const campaignDeepSchema = {
  name: "campaign_deep_extraction",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      usageRights: evidenceFieldSchema,
      exclusivity: evidenceFieldSchema,
      paymentTerms: evidenceFieldSchema,
      invoicingDetails: evidenceFieldSchema,
      cancellationTermination: evidenceFieldSchema,
    },
    required: [
      "usageRights",
      "exclusivity",
      "paymentTerms",
      "invoicingDetails",
      "cancellationTermination",
    ],
    strict: true,
  },
} as const;
