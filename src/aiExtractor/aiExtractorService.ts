import type { CampaignEmail } from "../gmail/gmailModels";
import type { CampaignExtractionMetadata } from "./strategies/all_in_one/models";
import { extractCampaignDetailsWithMeta as extractAllInOne } from "./strategies/all_in_one";

/**
 * Call OpenAI to extract structured campaign details from an email.
 */
export async function extractCampaignDetailsWithMeta(
  email: CampaignEmail,
): Promise<CampaignExtractionMetadata> {
  return extractAllInOne(email);
}
