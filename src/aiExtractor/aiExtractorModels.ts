import type OpenAI from "openai";
import {
  CompensationType,
  ContractStatus,
  DealStage,
  DeliverableFormat,
  DeliverablePlatform,
  DeliverableType,
  DraftRequirement,
  ExtractionConfidence,
  LastActionNeededBy,
  MentionedYesNo,
  PaymentCurrency,
  PaymentMethod,
  PaymentStatus,
} from "./aiExtractorEnums";

export interface CampaignEmail {
  threadId?: string;
  subject: string;
  from: string;
  body: string;
  receivedAt: string | null;
}

export interface CampaignKeyDate {
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface CampaignRequiredAction {
  name: string;
  description: string | null;
}

export interface CampaignExtraction {
  isBrandDeal: boolean;
  brandDealReason: string | null;
  campaignName: string | null;
  brand: string | null;
  draftRequired: DraftRequirement | null;
  draftDeadline: string | null;
  exclusivity: string | null;
  usageRights: string | null;
  goLiveStart: string | null;
  goLiveEnd: string | null;
  payment: number | null;
  paymentStatus: PaymentStatus | null;
  paymentTerms: string | null;
  invoiceSentDate: string | null;
  expectedPaymentDate: string | null;
  keyDates: CampaignKeyDate[];
  requiredActions: CampaignRequiredAction[];
  notes: string | null;
}

export interface CampaignExtractionMetadata {
  extraction: CampaignExtraction;
  usage: OpenAI.Completions.CompletionUsage | null;
  latencyMs: number;
  model: string;
  retries: number;
}

export const campaignExtractionSchema = {
  name: "campaign_extraction",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      isBrandDeal: { type: "boolean" },
      brandDealReason: { type: ["string", "null"] },
      campaignName: { type: ["string", "null"] },
      brand: { type: ["string", "null"] },
      draftRequired: {
        type: ["string", "null"],
        enum: [...Object.values(DraftRequirement), null],
      },
      draftDeadline: { type: ["string", "null"], format: "date-time" },
      exclusivity: { type: ["string", "null"] },
      usageRights: { type: ["string", "null"] },
      goLiveStart: { type: ["string", "null"], format: "date-time" },
      goLiveEnd: { type: ["string", "null"], format: "date-time" },
      payment: { type: ["number", "null"] },
      paymentStatus: {
        type: ["string", "null"],
        enum: [...Object.values(PaymentStatus), null],
      },
      paymentTerms: { type: ["string", "null"] },
      invoiceSentDate: { type: ["string", "null"], format: "date-time" },
      expectedPaymentDate: { type: ["string", "null"], format: "date-time" },
      keyDates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            description: { type: ["string", "null"] },
            startDate: { type: ["string", "null"], format: "date-time" },
            endDate: { type: ["string", "null"], format: "date-time" },
          },
          required: ["name", "description", "startDate", "endDate"],
        },
      },
      requiredActions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            description: { type: ["string", "null"] },
          },
          required: ["name", "description"],
        },
      },
      notes: { type: ["string", "null"] },
    },
    required: [
      "isBrandDeal",
      "brandDealReason",
      "campaignName",
      "brand",
      "draftRequired",
      "draftDeadline",
      "exclusivity",
      "usageRights",
      "goLiveStart",
      "goLiveEnd",
      "payment",
      "paymentStatus",
      "paymentTerms",
      "invoiceSentDate",
      "expectedPaymentDate",
      "keyDates",
      "requiredActions",
      "notes",
    ],
    strict: true,
  },
} as const;

// V2.1 schema changes:
// - Dates are now stored in 3 forms: *Raw (email text), *Date (YYYY-MM-DD), *At (UTC ISO datetime)
// - Added enums where they’re stable + added OTHER / NOT_MENTIONED to avoid brittleness
// - Kept strict + additionalProperties:false everywhere

export const campaignExtractionSchemaV2 = {
  name: "campaign_extraction_v2",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      // --- Classification ---
      classification: {
        type: "object",
        additionalProperties: false,
        properties: {
          isBrandDeal: { type: "boolean" },
          reason: { type: ["string", "null"] },
          confidence: {
            type: ["string", "null"],
            enum: [...Object.values(ExtractionConfidence), null],
          },
        },
        required: ["isBrandDeal", "reason", "confidence"],
      },

      // --- Parties / identity ---
      campaignName: { type: ["string", "null"] },
      brand: { type: ["string", "null"] },
      agency: { type: ["string", "null"] },
      brandRepresentative: { type: ["string", "null"] },
      brandEmailDomain: { type: ["string", "null"] },

      // --- Creative / approvals ---
      draftRequired: {
        type: ["string", "null"],
        enum: [...Object.values(DraftRequirement), null],
      },

      // Draft deadline: raw + normalized
      draftDeadlineRaw: { type: ["string", "null"] },
      draftDeadlineDate: { type: ["string", "null"], format: "date" }, // YYYY-MM-DD
      draftDeadlineAt: { type: ["string", "null"], format: "date-time" }, // UTC ISO datetime

      draftRounds: { type: ["number", "null"] },
      revisionPolicy: { type: ["string", "null"] },

      // --- Deal terms ---
      exclusivity: { type: ["string", "null"] },
      usageRights: { type: ["string", "null"] },
      whitelisting: {
        type: ["string", "null"],
        enum: [...Object.values(MentionedYesNo), null],
      },
      paidUsage: {
        type: ["string", "null"],
        enum: [...Object.values(MentionedYesNo), null],
      },
      usageTermDays: { type: ["number", "null"] },

      // --- Scheduling (go-live window) ---
      goLiveStartRaw: { type: ["string", "null"] },
      goLiveStartDate: { type: ["string", "null"], format: "date" },
      goLiveStartAt: { type: ["string", "null"], format: "date-time" },

      goLiveEndRaw: { type: ["string", "null"] },
      goLiveEndDate: { type: ["string", "null"], format: "date" },
      goLiveEndAt: { type: ["string", "null"], format: "date-time" },

      // --- Deliverables ---
      deliverables: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            platform: {
              type: ["string", "null"],
              enum: [...Object.values(DeliverablePlatform), null],
            },
            format: {
              type: ["string", "null"],
              enum: [...Object.values(DeliverableFormat), null],
            },
            quantity: { type: ["number", "null"] },

            // due date: raw + normalized
            dueDateRaw: { type: ["string", "null"] },
            dueDateDate: { type: ["string", "null"], format: "date" },
            dueDateAt: { type: ["string", "null"], format: "date-time" },

            // posting window (optional but common)
            postingWindowStartRaw: { type: ["string", "null"] },
            postingWindowStartDate: {
              type: ["string", "null"],
              format: "date",
            },
            postingWindowStartAt: {
              type: ["string", "null"],
              format: "date-time",
            },

            postingWindowEndRaw: { type: ["string", "null"] },
            postingWindowEndDate: { type: ["string", "null"], format: "date" },
            postingWindowEndAt: {
              type: ["string", "null"],
              format: "date-time",
            },

            requirements: { type: ["string", "null"] }, // CTA, tags, talking points
            linkTracking: { type: ["string", "null"] }, // URL/UTM/coupon code
          },
          required: [
            "platform",
            "format",
            "quantity",
            "dueDateRaw",
            "dueDateDate",
            "dueDateAt",
            "postingWindowStartRaw",
            "postingWindowStartDate",
            "postingWindowStartAt",
            "postingWindowEndRaw",
            "postingWindowEndDate",
            "postingWindowEndAt",
            "requirements",
            "linkTracking",
          ],
        },
      },

      // --- Compensation ---
      compensationType: {
        type: ["string", "null"],
        enum: [...Object.values(CompensationType), null],
      },

      // Keep legacy single-number field (still useful as "primary amount")
      payment: { type: ["number", "null"] },

      // Add more structured compensation details
      paymentCurrency: {
        type: ["string", "null"],
        enum: [...Object.values(PaymentCurrency), null],
      },
      paymentRangeMin: { type: ["number", "null"] },
      paymentRangeMax: { type: ["number", "null"] },
      paymentBreakdown: { type: ["string", "null"] },

      paymentMethod: {
        type: ["string", "null"],
        enum: [...Object.values(PaymentMethod), null],
      },

      paymentStatus: {
        type: ["string", "null"],
        enum: [...Object.values(PaymentStatus), null],
      },
      paymentTerms: { type: ["string", "null"] },

      // Invoice sent: raw + normalized
      invoiceSentRaw: { type: ["string", "null"] },
      invoiceSentDate: { type: ["string", "null"], format: "date" },
      invoiceSentAt: { type: ["string", "null"], format: "date-time" },

      // Expected payment: raw + normalized
      expectedPaymentRaw: { type: ["string", "null"] },
      expectedPaymentDate: { type: ["string", "null"], format: "date" },
      expectedPaymentAt: { type: ["string", "null"], format: "date-time" },

      // --- Contract / compliance ---
      contractStatus: {
        type: ["string", "null"],
        enum: [...Object.values(ContractStatus), null],
      },
      w9Required: { type: ["boolean", "null"] },

      // --- Links / assets ---
      briefLink: { type: ["string", "null"] },
      assetLinks: { type: "array", items: { type: "string" } },

      // --- Key dates / actions ---
      keyDates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            description: { type: ["string", "null"] },

            startRaw: { type: ["string", "null"] },
            startDate: { type: ["string", "null"], format: "date" },
            startAt: { type: ["string", "null"], format: "date-time" },

            endRaw: { type: ["string", "null"] },
            endDate: { type: ["string", "null"], format: "date" },
            endAt: { type: ["string", "null"], format: "date-time" },
          },
          required: [
            "name",
            "description",
            "startRaw",
            "startDate",
            "startAt",
            "endRaw",
            "endDate",
            "endAt",
          ],
        },
      },

      requiredActions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            description: { type: ["string", "null"] },
          },
          required: ["name", "description"],
        },
      },

      // --- Debuggability ---
      evidence: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            field: { type: "string" },
            quote: { type: "string" },
          },
          required: ["field", "quote"],
        },
      },

      notes: { type: ["string", "null"] },
    },

    required: [
      "classification",

      "campaignName",
      "brand",
      "agency",
      "brandRepresentative",
      "brandEmailDomain",

      "draftRequired",
      "draftDeadlineRaw",
      "draftDeadlineDate",
      "draftDeadlineAt",
      "draftRounds",
      "revisionPolicy",

      "exclusivity",
      "usageRights",
      "whitelisting",
      "paidUsage",
      "usageTermDays",

      "goLiveStartRaw",
      "goLiveStartDate",
      "goLiveStartAt",
      "goLiveEndRaw",
      "goLiveEndDate",
      "goLiveEndAt",

      "deliverables",

      "compensationType",
      "payment",
      "paymentCurrency",
      "paymentRangeMin",
      "paymentRangeMax",
      "paymentBreakdown",
      "paymentMethod",

      "paymentStatus",
      "paymentTerms",

      "invoiceSentRaw",
      "invoiceSentDate",
      "invoiceSentAt",

      "expectedPaymentRaw",
      "expectedPaymentDate",
      "expectedPaymentAt",

      "contractStatus",
      "w9Required",

      "briefLink",
      "assetLinks",

      "keyDates",
      "requiredActions",
      "evidence",
      "notes",
    ],

    strict: true,
  },
} as const;

// =========================
// Schema V3 (copy/paste)
// Adds: dealStage, dealStageReason, lastActionNeededBy
// Updates deliverables: format -> deliverableType + deliverableText
// =========================

export const campaignExtractionSchemaV3 = {
  name: "campaign_extraction_v3",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      // --- Classification ---
      classification: {
        type: "object",
        additionalProperties: false,
        properties: {
          isBrandDeal: { type: "boolean" },
          reason: { type: ["string", "null"] },
          confidence: {
            type: ["string", "null"],
            enum: [...Object.values(ExtractionConfidence), null],
          },
        },
        required: ["isBrandDeal", "reason", "confidence"],
      },

      // --- Deal Stage ---
      dealStage: {
        type: ["string", "null"],
        enum: [...Object.values(DealStage), null],
      },
      dealStageReason: { type: ["string", "null"] },
      lastActionNeededBy: {
        type: ["string", "null"],
        enum: [...Object.values(LastActionNeededBy), null],
      },

      // --- Parties / identity ---
      campaignName: { type: ["string", "null"] },
      brand: { type: ["string", "null"] },
      agency: { type: ["string", "null"] },
      brandRepresentative: { type: ["string", "null"] },
      brandEmailDomain: { type: ["string", "null"] },

      // --- Creative / approvals ---
      draftRequired: {
        type: ["string", "null"],
        enum: [...Object.values(DraftRequirement), null],
      },

      // Draft deadline: raw + normalized
      draftDeadlineRaw: { type: ["string", "null"] },
      draftDeadlineDate: { type: ["string", "null"], format: "date" },
      draftDeadlineAt: { type: ["string", "null"], format: "date-time" },

      draftRounds: { type: ["number", "null"] },
      revisionPolicy: { type: ["string", "null"] },

      // --- Deal terms ---
      exclusivity: { type: ["string", "null"] },
      usageRights: { type: ["string", "null"] },
      whitelisting: {
        type: ["string", "null"],
        enum: [...Object.values(MentionedYesNo), null],
      },
      paidUsage: {
        type: ["string", "null"],
        enum: [...Object.values(MentionedYesNo), null],
      },
      usageTermDays: { type: ["number", "null"] },

      // --- Scheduling (go-live window) ---
      goLiveStartRaw: { type: ["string", "null"] },
      goLiveStartDate: { type: ["string", "null"], format: "date" },
      goLiveStartAt: { type: ["string", "null"], format: "date-time" },

      goLiveEndRaw: { type: ["string", "null"] },
      goLiveEndDate: { type: ["string", "null"], format: "date" },
      goLiveEndAt: { type: ["string", "null"], format: "date-time" },

      // --- Deliverables ---
      deliverables: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            platform: {
              type: ["string", "null"],
              enum: [...Object.values(DeliverablePlatform), null],
            },

            // Replaces old "format"
            deliverableType: {
              type: ["string", "null"],
              enum: [...Object.values(DeliverableType), null],
            },

            // Store original phrase if helpful (e.g., "IG feed post", "60s TikTok", "carousel")
            deliverableText: { type: ["string", "null"] },

            quantity: { type: ["number", "null"] },

            // due date: raw + normalized
            dueDateRaw: { type: ["string", "null"] },
            dueDateDate: { type: ["string", "null"], format: "date" },
            dueDateAt: { type: ["string", "null"], format: "date-time" },

            // posting window (optional but common)
            postingWindowStartRaw: { type: ["string", "null"] },
            postingWindowStartDate: { type: ["string", "null"], format: "date" },
            postingWindowStartAt: { type: ["string", "null"], format: "date-time" },

            postingWindowEndRaw: { type: ["string", "null"] },
            postingWindowEndDate: { type: ["string", "null"], format: "date" },
            postingWindowEndAt: { type: ["string", "null"], format: "date-time" },

            requirements: { type: ["string", "null"] },
            linkTracking: { type: ["string", "null"] },
          },
          required: [
            "platform",
            "deliverableType",
            "deliverableText",
            "quantity",

            "dueDateRaw",
            "dueDateDate",
            "dueDateAt",

            "postingWindowStartRaw",
            "postingWindowStartDate",
            "postingWindowStartAt",

            "postingWindowEndRaw",
            "postingWindowEndDate",
            "postingWindowEndAt",

            "requirements",
            "linkTracking",
          ],
        },
      },

      // --- Compensation ---
      compensationType: {
        type: ["string", "null"],
        enum: [...Object.values(CompensationType), null],
      },

      payment: { type: ["number", "null"] },

      paymentCurrency: {
        type: ["string", "null"],
        enum: [...Object.values(PaymentCurrency), null],
      },
      paymentRangeMin: { type: ["number", "null"] },
      paymentRangeMax: { type: ["number", "null"] },
      paymentBreakdown: { type: ["string", "null"] },

      paymentMethod: {
        type: ["string", "null"],
        enum: [...Object.values(PaymentMethod), null],
      },

      paymentStatus: {
        type: ["string", "null"],
        enum: [...Object.values(PaymentStatus), null],
      },
      paymentTerms: { type: ["string", "null"] },

      // Invoice sent: raw + normalized
      invoiceSentRaw: { type: ["string", "null"] },
      invoiceSentDate: { type: ["string", "null"], format: "date" },
      invoiceSentAt: { type: ["string", "null"], format: "date-time" },

      // Expected payment: raw + normalized
      expectedPaymentRaw: { type: ["string", "null"] },
      expectedPaymentDate: { type: ["string", "null"], format: "date" },
      expectedPaymentAt: { type: ["string", "null"], format: "date-time" },

      // --- Contract / compliance ---
      contractStatus: {
        type: ["string", "null"],
        enum: [...Object.values(ContractStatus), null],
      },
      w9Required: { type: ["boolean", "null"] },

      // --- Links / assets ---
      briefLink: { type: ["string", "null"] },
      assetLinks: { type: "array", items: { type: "string" } },

      // --- Key dates / actions ---
      keyDates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            description: { type: ["string", "null"] },

            startRaw: { type: ["string", "null"] },
            startDate: { type: ["string", "null"], format: "date" },
            startAt: { type: ["string", "null"], format: "date-time" },

            endRaw: { type: ["string", "null"] },
            endDate: { type: ["string", "null"], format: "date" },
            endAt: { type: ["string", "null"], format: "date-time" },
          },
          required: [
            "name",
            "description",
            "startRaw",
            "startDate",
            "startAt",
            "endRaw",
            "endDate",
            "endAt",
          ],
        },
      },

      requiredActions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            description: { type: ["string", "null"] },
          },
          required: ["name", "description"],
        },
      },

      // --- Debuggability ---
      evidence: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            field: { type: "string" },
            quote: { type: "string" },
          },
          required: ["field", "quote"],
        },
      },

      notes: { type: ["string", "null"] },
    },

    required: [
      "classification",

      "dealStage",
      "dealStageReason",
      "lastActionNeededBy",

      "campaignName",
      "brand",
      "agency",
      "brandRepresentative",
      "brandEmailDomain",

      "draftRequired",
      "draftDeadlineRaw",
      "draftDeadlineDate",
      "draftDeadlineAt",
      "draftRounds",
      "revisionPolicy",

      "exclusivity",
      "usageRights",
      "whitelisting",
      "paidUsage",
      "usageTermDays",

      "goLiveStartRaw",
      "goLiveStartDate",
      "goLiveStartAt",
      "goLiveEndRaw",
      "goLiveEndDate",
      "goLiveEndAt",

      "deliverables",

      "compensationType",
      "payment",
      "paymentCurrency",
      "paymentRangeMin",
      "paymentRangeMax",
      "paymentBreakdown",
      "paymentMethod",

      "paymentStatus",
      "paymentTerms",

      "invoiceSentRaw",
      "invoiceSentDate",
      "invoiceSentAt",

      "expectedPaymentRaw",
      "expectedPaymentDate",
      "expectedPaymentAt",

      "contractStatus",
      "w9Required",

      "briefLink",
      "assetLinks",

      "keyDates",
      "requiredActions",
      "evidence",
      "notes",
    ],

    strict: true,
  },
} as const;
