import "dotenv/config";
import fs from "node:fs";
import readline from "node:readline";
import { google } from "googleapis";
import { PubSub, Subscription } from "@google-cloud/pubsub";
import { createGmailClient } from "./gmailClient";
import { classifyEmail, ParsedEmail } from "./classifier";
import { getLastHistoryId, setLastHistoryId } from "./historyStore";

const TOKENS_PATH = "tokens.json";
const HISTORY_FILE = "history.json";

const PROJECT_ID = process.env.GCP_PROJECT_ID!;
const TOPIC_ID = process.env.PUBSUB_TOPIC_ID!;
const SUBSCRIPTION_ID = process.env.PUBSUB_SUB_ID || "gmail-events-local-sub";
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

function assertEnv() {
  const missing = [
    ["GCP_PROJECT_ID", PROJECT_ID],
    ["PUBSUB_TOPIC_ID", TOPIC_ID],
    ["GOOGLE_CLIENT_ID", CLIENT_ID],
    ["GOOGLE_CLIENT_SECRET", CLIENT_SECRET],
    ["GOOGLE_REDIRECT_URI", REDIRECT_URI],
  ].filter(([, val]) => !val);

  if (missing.length) {
    throw new Error(
      `Missing env vars: ${missing.map(([k]) => k).join(", ")}. Check .env.`
    );
  }
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}

async function ensureTokens(): Promise<void> {
  if (fs.existsSync(TOKENS_PATH)) {
    console.log("✅ Found tokens.json");
    return;
  }

  console.log("tokens.json not found. Running OAuth flow...");
  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("\nAuthorize this app by visiting this URL:\n");
  console.log(authUrl);
  console.log("\nAfter approving, copy the 'code' query param and paste it here.\n");

  const code = (await ask("Enter the code from the URL: ")).trim();
  const { tokens } = await oAuth2Client.getToken(code);

  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
  console.log(`\nSaved tokens to ${TOKENS_PATH}`);
}

async function ensureSubscription(pubsub: PubSub): Promise<Subscription> {
  const subscription = pubsub.subscription(SUBSCRIPTION_ID);

  try {
    await subscription.getMetadata();
    console.log(`✅ Subscription exists: ${SUBSCRIPTION_ID}`);
    return subscription;
  } catch (err: any) {
    if (err?.code !== 5) {
      throw err;
    }
  }

  console.log(`Creating subscription "${SUBSCRIPTION_ID}" on topic "${TOPIC_ID}"...`);
  const [created] = await pubsub.topic(TOPIC_ID).createSubscription(SUBSCRIPTION_ID);
  console.log("✅ Created subscription:", created.name);
  return created;
}

async function setupWatch(): Promise<string> {
  const gmail = createGmailClient();
  const topicName = `projects/${PROJECT_ID}/topics/${TOPIC_ID}`;

  console.log("Setting up Gmail watch on topic:", topicName);
  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName,
      labelIds: ["INBOX"],
    },
  });

  const historyId = res.data.historyId;
  if (!historyId) {
    throw new Error("No historyId returned from Gmail watch");
  }

  setLastHistoryId(historyId);
  console.log("✅ Gmail watch set. Initial historyId stored in", HISTORY_FILE);
  return historyId;
}

async function processGmailNotification(payload: { emailAddress: string; historyId: string }) {
  const gmail = createGmailClient();
  const lastHistoryId = getLastHistoryId();
  const startHistoryId = lastHistoryId ?? payload.historyId;

  console.log("Last historyId:", lastHistoryId);
  console.log("New historyId from push:", payload.historyId);
  console.log("Using startHistoryId:", startHistoryId);

  const historyRes = await gmail.users.history.list({
    userId: "me",
    startHistoryId,
    historyTypes: ["messageAdded"],
  });

  const history = historyRes.data.history || [];
  console.log(`Found ${history.length} history items`);

  for (const h of history) {
    const messagesAdded = h.messagesAdded || [];
    for (const added of messagesAdded) {
      const msg = added.message;
      if (!msg?.id) continue;

      const messageId = msg.id;
      console.log("Fetching message:", messageId);

      const msgRes = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      const message = msgRes.data;
      const snippet = message.snippet;
      const headers = message.payload?.headers || [];

      const subject =
        headers.find((h) => h.name === "Subject")?.value || "(no subject)";
      const from =
        headers.find((h) => h.name === "From")?.value || "(unknown sender)";

      console.log("---- New Email ----");
      console.log("From:", from);
      console.log("Subject:", subject);
      console.log("Snippet:", snippet);
      console.log("-------------------\n");

      const parsed: ParsedEmail = { from, subject, snippet: snippet || "" };
      const classification = classifyEmail(parsed);
      console.log("Classification:", classification);

      if (classification.isCampaign) {
        console.log(
          "👉 This looks like a campaign email. (In the future: create/find campaign, add notes.)"
        );
      }
    }
  }

  setLastHistoryId(payload.historyId);
}

async function startWorker(pubsub: PubSub, subscription: Subscription) {
  console.log(
    `Listening for messages on subscription: ${SUBSCRIPTION_ID} (project ${PROJECT_ID})`
  );

  subscription.on("message", async (message) => {
    try {
      const dataStr = message.data.toString("utf8");
      const payload = JSON.parse(dataStr) as { emailAddress: string; historyId: string };

      console.log("\n📩 Received Gmail push notification:", payload);

      await processGmailNotification(payload);
      message.ack();
    } catch (err) {
      console.error("Error handling message:", err);
    }
  });

  subscription.on("error", (err) => {
    console.error("Subscription error:", err);
    process.exit(1);
  });
}

async function main() {
  assertEnv();

  console.log("Step 1/4: Ensure tokens");
  await ensureTokens();

  const pubsub = new PubSub({ projectId: PROJECT_ID });

  console.log("\nStep 2/4: Ensure Pub/Sub subscription");
  const subscription = await ensureSubscription(pubsub);

  console.log("\nStep 3/4: Set up Gmail watch");
  const initialHistoryId = await setupWatch();
  console.log("Watch ready. Initial historyId:", initialHistoryId);

  console.log("\nStep 4/4: Start worker listener");
  await startWorker(pubsub, subscription);

  console.log("\nAll set! Send yourself an email to INBOX to see logs stream in.");
}

main().catch((err) => {
  console.error("Runner crashed:", err);
  process.exit(1);
});
