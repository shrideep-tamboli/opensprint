import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
if (!process.env.DISCORD_BOT_TOKEN) dotenv.config(); // fallback to .env

import {
  Client,
  GatewayIntentBits,
  Message,
} from "discord.js";

type ParsedRequest = {
  title: string;
  description: string;
  repo: string;
};

type CloseRequest = {
  repo: string;
  issueNumber: number;
};

const REPO_PATTERN = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

function parsePmAgentMessage(content: string): ParsedRequest | null {
  if (!content.includes("PM Agent")) {
    return null;
  }

  const titleMatch = content.match(/^\s*Title:\s*(.+)\s*$/m);
  const repoMatch = content.match(/^\s*Repo:\s*([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)\s*$/m);

  const descriptionMatch = content.match(
    /^\s*Description:\s*([\s\S]*?)(?:\n\s*Repo:\s*|$)/m
  );

  const title = titleMatch?.[1]?.trim();
  const repo = repoMatch?.[1]?.trim();
  const description = (descriptionMatch?.[1] ?? "").trim();

  if (!title || !repo) {
    return null;
  }

  if (!REPO_PATTERN.test(repo)) {
    return null;
  }

  return { title, description, repo };
}

function parseCloseIssueMessage(content: string): CloseRequest | null {
  if (!content.includes("PM Agent")) {
    return null;
  }

  const repoMatch = content.match(/^\s*Repo:\s*([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)\s*$/m);
  const issueMatch = content.match(/^\s*Issue:\s*(\d+)\s*$/m);

  const repo = repoMatch?.[1]?.trim();
  const issueNumber = issueMatch ? Number(issueMatch[1]) : undefined;

  if (!repo || typeof issueNumber !== "number") {
    return null;
  }

  if (!REPO_PATTERN.test(repo)) {
    return null;
  }

  return { repo, issueNumber };
}

async function triggerWorkflow(payload: ParsedRequest): Promise<number> {
  const response = await fetch("http://localhost:3000/api/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Workflow trigger failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    workflowId?: unknown;
    result?: { issueNumber?: unknown };
  };

  const issueNumber =
    typeof data?.result?.issueNumber === "number" ? data.result.issueNumber : undefined;

  if (typeof issueNumber !== "number") {
    throw new Error("Missing issueNumber in workflow result.");
  }

  return issueNumber;
}

async function triggerCloseWorkflow(payload: CloseRequest): Promise<void> {
  const response = await fetch("http://localhost:3000/api/close", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Close workflow trigger failed: ${response.status}`);
  }
}

async function handleMessage(message: Message) {
  if (message.author.bot) {
    return;
  }

  if (!message.content.includes("PM Agent")) {
    return;
  }

  // Try create command first
  const parsed = parsePmAgentMessage(message.content);
  if (parsed) {
    try {
      const issueNumber = await triggerWorkflow(parsed);
      await message.reply(`✅ Issue #${issueNumber} created in ${parsed.repo}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("GitHub") || msg.includes("issue") || msg.includes("GITHUB")) {
        await message.reply("⚠️ Issue creation failed.");
        return;
      }

      if (msg.includes("Workflow")) {
        await message.reply("🚨 Automation failed.");
        return;
      }

      await message.reply("🚨 Automation failed.");
    }
    return;
  }

  // Try close command
  const closeParsed = parseCloseIssueMessage(message.content);
  if (closeParsed) {
    try {
      await triggerCloseWorkflow(closeParsed);
      await message.reply(`✅ Issue #${closeParsed.issueNumber} closed in ${closeParsed.repo}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("GitHub") || msg.includes("issue") || msg.includes("GITHUB")) {
        await message.reply("⚠️ Issue close failed.");
        return;
      }

      if (msg.includes("Close workflow")) {
        await message.reply("🚨 Automation failed.");
        return;
      }

      await message.reply("🚨 Automation failed.");
    }
    return;
  }

  // Neither command matched
  await message.reply("❌ Invalid format. Use:\n• Title + Repo (to create)\n• Issue + Repo (to close)");
}

const token = process.env.DISCORD_BOT_TOKEN;
if (typeof token !== "string" || token.length === 0) {
  throw new Error("Missing DISCORD_BOT_TOKEN.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("messageCreate", (message: Message) => {
  void handleMessage(message);
});

client.once("ready", () => {
  console.log("Discord bot is ready.");
});

void client.login(token);
