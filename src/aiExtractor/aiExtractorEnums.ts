export const DraftRequirement = {
  NONE: "none",
  OPTIONAL: "optional",
  REQUIRED: "required",
} as const;

export type DraftRequirement =
  (typeof DraftRequirement)[keyof typeof DraftRequirement];

export const PaymentStatus = {
  PENDING: "pending",
  PAID: "paid",
  LATE: "late",
} as const;

export type PaymentStatus =
  (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const UrgencyLevel = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export type UrgencyLevel =
  (typeof UrgencyLevel)[keyof typeof UrgencyLevel];

export enum ExtractionConfidence {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum MentionedYesNo {
  YES = "YES",
  NO = "NO",
  NOT_MENTIONED = "NOT_MENTIONED",
}

export enum CompensationType {
  FLAT = "FLAT",
  PER_DELIVERABLE = "PER_DELIVERABLE",
  AFFILIATE = "AFFILIATE",
  GIFTED = "GIFTED",
  HYBRID = "HYBRID",
  OTHER = "OTHER",
}

export enum ContractStatus {
  NOT_MENTIONED = "NOT_MENTIONED",
  SENT = "SENT",
  SIGNED = "SIGNED",
  PENDING = "PENDING",
  NEEDS_CHANGES = "NEEDS_CHANGES",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethod {
  ACH = "ACH",
  PAYPAL = "PAYPAL",
  WIRE = "WIRE",
  WISE = "WISE",
  CHECK = "CHECK",
  VENMO = "VENMO",
  ZELLE = "ZELLE",
  GIFTCARD = "GIFTCARD",
  OTHER = "OTHER",
  NOT_MENTIONED = "NOT_MENTIONED",
}

export enum DeliverablePlatform {
  INSTAGRAM = "INSTAGRAM",
  TIKTOK = "TIKTOK",
  YOUTUBE = "YOUTUBE",
  TWITTER_X = "TWITTER_X",
  TWITCH = "TWITCH",
  PINTEREST = "PINTEREST",
  SNAPCHAT = "SNAPCHAT",
  FACEBOOK = "FACEBOOK",
  BLOG = "BLOG",
  PODCAST = "PODCAST",
  OTHER = "OTHER",
}

export enum DeliverableFormat {
  VIDEO = "VIDEO",
  SHORT_FORM = "SHORT_FORM",
  LONG_FORM = "LONG_FORM",
  STORY = "STORY",
  STATIC_POST = "STATIC_POST",
  CAROUSEL = "CAROUSEL",
  LIVE = "LIVE",
  BLOG_POST = "BLOG_POST",
  PODCAST_EPISODE = "PODCAST_EPISODE",
  OTHER = "OTHER",
}

export enum PaymentCurrency {
  USD = "USD",
  CAD = "CAD",
  GBP = "GBP",
  EUR = "EUR",
  AUD = "AUD",
  OTHER = "OTHER",
}

export enum DealStage {
  NOT_MENTIONED = "NOT_MENTIONED",
  PROPOSED = "PROPOSED",
  NEGOTIATING = "NEGOTIATING",
  AWAITING_CREATOR = "AWAITING_CREATOR",
  AWAITING_BRAND = "AWAITING_BRAND",
  ACCEPTED = "ACCEPTED",
  CONTRACTING = "CONTRACTING",
  SCHEDULED = "SCHEDULED",
  IN_PRODUCTION = "IN_PRODUCTION",
  SUBMITTED_FOR_APPROVAL = "SUBMITTED_FOR_APPROVAL",
  APPROVED_TO_POST = "APPROVED_TO_POST",
  POSTED = "POSTED",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  ON_HOLD = "ON_HOLD",
}

export enum LastActionNeededBy {
  CREATOR = "CREATOR",
  BRAND = "BRAND",
  BOTH = "BOTH",
  NONE = "NONE",
}

export enum DeliverableType {
  IG_STORY = "IG_STORY",
  IG_REEL = "IG_REEL",
  IG_POST = "IG_POST",
  IG_CAROUSEL = "IG_CAROUSEL",
  IG_LIVE = "IG_LIVE",
  TIKTOK_VIDEO = "TIKTOK_VIDEO",
  TIKTOK_LIVE = "TIKTOK_LIVE",
  YOUTUBE_SHORT = "YOUTUBE_SHORT",
  YOUTUBE_VIDEO = "YOUTUBE_VIDEO",
  YOUTUBE_COMMUNITY_POST = "YOUTUBE_COMMUNITY_POST",
  YOUTUBE_LIVE = "YOUTUBE_LIVE",
  TWITCH_STREAM = "TWITCH_STREAM",
  PODCAST_EPISODE = "PODCAST_EPISODE",
  BLOG_POST = "BLOG_POST",
  NEWSLETTER = "NEWSLETTER",
  OTHER = "OTHER",
  NOT_MENTIONED = "NOT_MENTIONED",
}
