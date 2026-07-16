import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateText, type LanguageModel } from "ai";
import { env } from "../../env.js";

export interface AiProvider {
  readonly status: "connected" | "unconfigured";
  complete(prompt: string): Promise<string>;
}

class MockAiProvider implements AiProvider {
  readonly status = "connected" as const;
  async complete(prompt: string) {
    return `Mock response for: ${prompt.slice(0, 120)}`;
  }
}
class ModelAiProvider implements AiProvider {
  readonly status: "connected" | "unconfigured";
  constructor(
    private model: LanguageModel,
    configured: boolean,
  ) {
    this.status = configured ? "connected" : "unconfigured";
  }
  async complete(prompt: string) {
    if (this.status === "unconfigured")
      throw new Error(`${env.AI_PROVIDER} is selected but its API key is not configured.`);
    return (await generateText({ model: this.model, prompt })).text;
  }
}
export function getAiProvider(): AiProvider {
  if (env.AI_PROVIDER === "openai")
    return new ModelAiProvider(openai(env.AI_MODEL || "gpt-5-mini"), Boolean(env.OPENAI_API_KEY));
  if (env.AI_PROVIDER === "anthropic")
    return new ModelAiProvider(
      anthropic(env.AI_MODEL || "claude-sonnet-4-5"),
      Boolean(env.ANTHROPIC_API_KEY),
    );
  return new MockAiProvider();
}
