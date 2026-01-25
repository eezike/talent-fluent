import type OpenAI from "openai";
import {
  campaignExtractionSchemaV3,
  type CampaignEmail,
  type CampaignExtraction,
  type CampaignExtractionMetadata,
} from "./aiExtractorModels";
import { OPENAI_MODEL } from "./aiExtractorConstants";
import { buildEmailPrompt, systemPromptV1 } from "./prompts";
import { withOpenAIRetry, openai } from "./aiExtractorOpenAI";

/**
 * Call OpenAI to extract structured campaign details from an email.
 */
export async function extractCampaignDetailsWithMeta(
  email: CampaignEmail,
): Promise<CampaignExtractionMetadata> {
  const prompt = buildEmailPrompt(email);
  const start = Date.now();

  const { value: completion, retries } =
    await withOpenAIRetry<OpenAI.Chat.Completions.ChatCompletion>(
      () =>
        openai.chat.completions.create({
          model: OPENAI_MODEL,
          response_format: {
            type: "json_schema",
            json_schema: campaignExtractionSchemaV3,
          },
          messages: [
            {
              role: "system",
              content: systemPromptV1,
            },
            { role: "user", content: prompt },
          ],
        }),
      "openai.chat.completions.create",
    );
  const latencyMs = Date.now() - start;

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned no content");
  }

  try {
    const parsed = JSON.parse(content) as CampaignExtraction;
    return {
      extraction: parsed,
      usage: completion.usage ?? null,
      latencyMs,
      model: completion.model ?? OPENAI_MODEL,
      retries,
    };
  } catch (err) {
    throw new Error(`Failed to parse OpenAI response: ${err}`);
  }
}

export async function extractCampaignDetails(
  email: CampaignEmail,
): Promise<CampaignExtraction> {
  const { extraction } = await extractCampaignDetailsWithMeta(email);
  return extraction;
}
