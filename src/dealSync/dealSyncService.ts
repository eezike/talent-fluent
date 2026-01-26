import { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignExtraction } from "../aiExtractor/strategies/all_in_one/models";
import type { CampaignEmail } from "../gmail/gmailModels";
import { PaymentStatus, UrgencyLevel } from "./dealSyncEnums";


/**
 * Parse a readable name from the email From header.
 */
function parseDisplayName(from: string) {
  const match = from.match(/^(.*)<.*>$/);
  if (match) {
    const name = match[1]?.replace(/"/g, "").trim();
    if (name) return name;
  }
  const email = from.trim();
  if (email.includes("@")) {
    return email.split("@")[0];
  }
  return email;
}

/**
 * Normalize payment status into the app's enum values.
 */
function normalizePaymentStatus(status: string | null | undefined): PaymentStatus {
  const normalized = status?.toLowerCase().trim();
  if (!normalized) return PaymentStatus.PENDING;
  if (normalized.includes("paid")) return PaymentStatus.PAID;
  if (normalized.includes("late") || normalized.includes("overdue")) return PaymentStatus.LATE;
  return PaymentStatus.PENDING;
}

/**
 * Pick the next deadline timestamp from known date fields.
 */
function pickNextDeadline(dates: Array<string | null | undefined>) {
  const now = Date.now();
  const parsed = dates
    .map((value) => (value ? Date.parse(value) : NaN))
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b);
  const upcoming = parsed.find((value) => value >= now);
  const earliest = parsed[0];
  if (!upcoming && earliest !== undefined) {
    return new Date(earliest).toISOString();
  }
  return upcoming ? new Date(upcoming).toISOString() : null;
}

/**
 * Compute urgency based on how soon the next deadline is.
 */
function computeUrgencyLevel(nextDeadline: string | null): UrgencyLevel {
  if (!nextDeadline) return UrgencyLevel.LOW;
  const target = Date.parse(nextDeadline);
  if (Number.isNaN(target)) return UrgencyLevel.LOW;
  const days = (target - Date.now()) / (1000 * 60 * 60 * 24);
  if (days <= 3) return UrgencyLevel.HIGH;
  if (days <= 14) return UrgencyLevel.MEDIUM;
  return UrgencyLevel.LOW;
}

/**
 * Build a short summary based on extracted actions or notes.
 */
function buildDeliverableSummary(extraction: CampaignExtraction) {
  if (extraction.deliverables.length) {
    const parts = extraction.deliverables.slice(0, 3).map((deliverable) => {
      const quantity = deliverable.quantity ?? 1;
      const label = formatDeliverableLabel(deliverable.platform, deliverable.type);
      return `${quantity} ${quantity === 1 ? label : pluralizeLabel(label)}`;
    });
    if (parts.length) {
      return parts.join(" • ");
    }
  }
  if (extraction.requiredActions?.length) {
    const names = extraction.requiredActions
      .map((action) => action.name)
      .filter(Boolean)
      .slice(0, 3);
    if (names.length) {
      return `Required actions: ${names.join(", ")}`;
    }
  }
  return "Imported from email";
}

function formatDeliverableLabel(platform: string, type: string) {
  const platformLabel = platformToLabel(platform);
  const typeLabel = typeToLabel(type);

  if (platformLabel && typeLabel) {
    if (platformLabel === "TikTok" && typeLabel === "TikTok") {
      return "TikTok";
    }
    return `${platformLabel} ${typeLabel}`;
  }

  return platformLabel ?? typeLabel ?? "Deliverable";
}

function pluralizeLabel(label: string) {
  switch (label) {
    case "Story":
      return "Stories";
    case "Blog post":
      return "Blog posts";
    case "Podcast episode":
      return "Podcast episodes";
    case "TikTok":
      return "TikToks";
    default:
      return `${label}s`;
  }
}

function platformToLabel(platform: string) {
  switch (platform) {
    case "INSTAGRAM":
      return "IG";
    case "TIKTOK":
      return "TikTok";
    case "YOUTUBE":
      return "YouTube";
    case "TWITCH":
      return "Twitch";
    case "X":
      return "X";
    case "PINTEREST":
      return "Pinterest";
    case "FACEBOOK":
      return "Facebook";
    case "BLOG":
      return "Blog";
    case "PODCAST":
      return "Podcast";
    case "OTHER":
    default:
      return null;
  }
}

function typeToLabel(type: string) {
  switch (type) {
    case "POST":
      return "Post";
    case "REEL":
      return "Reel";
    case "STORY":
      return "Story";
    case "TIKTOK":
      return "TikTok";
    case "SHORT":
      return "Short";
    case "VIDEO":
      return "Video";
    case "LIVESTREAM":
      return "Livestream";
    case "CAROUSEL":
      return "Carousel";
    case "THREAD":
      return "Thread";
    case "BLOG_POST":
      return "Blog post";
    case "PODCAST_EPISODE":
      return "Podcast episode";
    case "OTHER":
    default:
      return null;
  }
}

type ReminderInsert = {
  deal_id: string;
  type: "deliverable" | "do" | "dont";
  text: string;
  is_critical: boolean;
  order_index: number;
  source: "email";
};

function buildActionReminderText(name: string, description: string | null) {
  const trimmedName = name.trim();
  if (!trimmedName) return "";
  if (description?.trim()) {
    return `${trimmedName}: ${description.trim()}`;
  }
  return trimmedName;
}

function buildDeliverableReminderText(deliverable: CampaignExtraction["deliverables"][number]) {
  const quantity = deliverable.quantity ?? 1;
  const label = formatDeliverableLabel(deliverable.platform, deliverable.type) ?? "Deliverable";
  const base = `${quantity} ${quantity === 1 ? label : pluralizeLabel(label)}`;
  const description = deliverable.description?.trim()
    ? `: ${deliverable.description.trim()}`
    : "";
  const dueDate = deliverable.dueDateRawText ?? deliverable.dueDate;
  const due = dueDate ? ` (Due ${dueDate})` : "";
  return `${base}${description}${due}`.trim();
}

function buildReminderPayloads(
  dealId: string,
  extraction: CampaignExtraction
): ReminderInsert[] {
  const reminders: ReminderInsert[] = [];

  extraction.requiredActions.forEach((action, index) => {
    const text = buildActionReminderText(action.name, action.description);
    if (!text) return;
    reminders.push({
      deal_id: dealId,
      type: "do",
      text,
      is_critical: false,
      order_index: index,
      source: "email",
    });
  });

  extraction.mustAvoids.forEach((action, index) => {
    const text = buildActionReminderText(action.name, action.description);
    if (!text) return;
    reminders.push({
      deal_id: dealId,
      type: "dont",
      text,
      is_critical: false,
      order_index: index,
      source: "email",
    });
  });

  extraction.deliverables.forEach((deliverable, index) => {
    const text = buildDeliverableReminderText(deliverable);
    if (!text) return;
    reminders.push({
      deal_id: dealId,
      type: "deliverable",
      text,
      is_critical: false,
      order_index: index,
      source: "email",
    });
  });

  return reminders;
}

async function syncRemindersFromExtraction(
  supabase: SupabaseClient,
  dealId: string,
  extraction: CampaignExtraction
) {
  const { error: deleteError } = await supabase
    .from("reminders")
    .delete()
    .eq("deal_id", dealId)
    .eq("source", "email");

  if (deleteError) {
    throw new Error(`Failed to clear email reminders: ${deleteError.message}`);
  }

  const reminders = buildReminderPayloads(dealId, extraction);
  if (!reminders.length) return;

  const { error: insertError } = await supabase
    .from("reminders")
    .insert(reminders);

  if (insertError) {
    throw new Error(`Failed to insert reminders: ${insertError.message}`);
  }
}

/**
 * Convert a go-live window into a display-ready string.
 */
function buildGoLiveWindow(start: string | null, end: string | null) {
  if (start && end) return `${start} - ${end}`;
  if (start) return `Starts ${start}`;
  if (end) return `Ends ${end}`;
  return null;
}

/**
 * Normalize date strings to UTC ISO 8601 timestamps.
 */
function normalizeDateTime(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

export type DealUpsertPayload = {
  user_id: string;
  title: string;
  brand_name: string;
  deliverable_summary: string;
  draft_deadline: string | null;
  live_deadline: string | null;
  next_deadline: string | null;
  urgency_level: UrgencyLevel;
  created_from: "email";
  email_thread_id: string | null;
  draft_required: boolean | null;
  go_live_window: string | null;
  exclusivity: string | null;
  usage_rights: string | null;
  payment_amount: number | null;
  payment_status: PaymentStatus;
  payment_terms: string | null;
  invoice_sent_date: string | null;
  expected_payment_date: string | null;
};

type DealSyncLogInsert = {
  deal_id: string;
  user_id: string;
  email_thread_id: string | null;
  created_from: "email";
  status: "created" | "updated";
  deliverable_summary: string;
};

async function insertDealSyncLog(
  supabase: SupabaseClient,
  log: DealSyncLogInsert
) {
  const { error } = await supabase.from("deal_sync_logs").insert(log);
  if (error) {
    console.error("Failed to write deal sync log:", error.message);
  }
}


export function buildDealPayloadFromExtraction(
  extraction: CampaignExtraction,
  context: CampaignEmail,
  userId: string
): DealUpsertPayload {
  const goLiveStart = normalizeDateTime(extraction.goLiveWindow?.startDate ?? null);
  const goLiveEnd = normalizeDateTime(extraction.goLiveWindow?.endDate ?? null);
  const liveDeadline = goLiveEnd ?? null;
  const invoiceSentDate = normalizeDateTime(
    extraction.payment?.invoiceSentAt ?? null
  );
  const expectedPaymentDate = normalizeDateTime(
    extraction.payment?.invoiceExpectedAt ?? null
  );
  const keyDateCandidates = extraction.keyDates.flatMap((date) => [
    normalizeDateTime(date.startDate),
    normalizeDateTime(date.endDate),
  ]);
  const nextDeadline = pickNextDeadline([
    goLiveStart,
    liveDeadline,
    expectedPaymentDate,
    ...keyDateCandidates,
  ]);
  const urgency = computeUrgencyLevel(nextDeadline);

  const payload: DealUpsertPayload = {
    user_id: userId,
    title: extraction.campaignName?.value ?? context.subject ?? "New campaign",
    brand_name: extraction.brandName?.value ?? parseDisplayName(context.from) ?? "Unknown",
    deliverable_summary: buildDeliverableSummary(extraction),
    draft_deadline: null,
    live_deadline: liveDeadline,
    next_deadline: nextDeadline,
    urgency_level: urgency,
    created_from: "email",
    email_thread_id: context.threadId ?? null,
    draft_required: extraction.draftRequired?.value ?? null,
    go_live_window: buildGoLiveWindow(goLiveStart, goLiveEnd),
    exclusivity: extraction.exclusivityRightsSummary?.value ?? null,
    usage_rights: extraction.usageRightsSummary?.value ?? null,
    payment_amount: extraction.payment?.amount ?? null,
    payment_status: normalizePaymentStatus(extraction.payment?.paymentStatus),
    payment_terms: extraction.payment?.paymentTerms ?? null,
    invoice_sent_date: invoiceSentDate,
    expected_payment_date: expectedPaymentDate,
  };

  return payload;
}

/**
 * Upsert a deal record based on the extraction payload.
 */
export async function upsertDealFromExtraction(
  supabase: SupabaseClient,
  extraction: CampaignExtraction,
  context: CampaignEmail,
  userId: string
) {
  const payload = buildDealPayloadFromExtraction(extraction, context, userId);

  if (context.threadId) {
    const { data: existing, error: existingError } = await supabase
      .from("deals")
      .select("id")
      .eq("user_id", userId)
      .eq("email_thread_id", context.threadId)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed to query existing deal: ${existingError.message}`);
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("deals")
        .update(payload)
        .eq("id", existing.id);

      if (updateError) {
        throw new Error(`Failed to update deal: ${updateError.message}`);
      }

      await syncRemindersFromExtraction(supabase, existing.id, extraction);
      await insertDealSyncLog(supabase, {
        deal_id: existing.id,
        user_id: userId,
        email_thread_id: context.threadId ?? null,
        created_from: "email",
        status: "updated",
        deliverable_summary: payload.deliverable_summary,
      });

      return { id: existing.id, created: false };
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("deals")
    .insert(payload)
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Failed to insert deal: ${insertError.message}`);
  }

  await syncRemindersFromExtraction(supabase, inserted.id, extraction);
  await insertDealSyncLog(supabase, {
    deal_id: inserted.id,
    user_id: userId,
    email_thread_id: context.threadId ?? null,
    created_from: "email",
    status: "created",
    deliverable_summary: payload.deliverable_summary,
  });

  return { id: inserted.id, created: true };
}
