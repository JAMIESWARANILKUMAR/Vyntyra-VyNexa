/**
 * Unified Multi-Provider AI Integration Layer
 * 
 * Architecture:
 * - Primary Provider: Google AI Studio (Gemini API) using GEMINI_API_KEY / GOOGLE_AI_API_KEY.
 * - Secondary / Fallback Provider: OpenRouter (OpenAI-compatible) using OPENROUTER_API_KEY.
 * - Failover: Automatic on rate-limits (429 / RESOURCE_EXHAUSTED), quota exhaustion, or 5xx server errors.
 * - Explicit Overrides: Allows tasks/models to explicitly route directly to OpenRouter or custom models.
 */

import { GoogleGenAI } from "@google/genai";
import { getEnv } from "@/lib/env";

export type AiProvider = "auto" | "gemini" | "openrouter";

export interface AiRequestOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  openRouterModel?: string;
  provider?: AiProvider;
  responseMimeType?: "text/plain" | "application/json" | string;
  temperature?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
}

export interface AiResponse {
  text: string;
  provider: "gemini" | "openrouter";
  model: string;
  didFailover: boolean;
  failoverReason?: string;
}

export interface AiJsonResponse<T = any> extends AiResponse {
  data: T;
}

// Default Model Mappings from Gemini canonical IDs to OpenRouter model slugs
const GEMINI_TO_OPENROUTER_MODEL_MAP: Record<string, string> = {
  "gemini-1.5-flash": "google/gemini-flash-1.5",
  "gemini-1.5-pro": "google/gemini-pro-1.5",
  "gemini-2.0-flash": "google/gemini-2.0-flash-001",
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "gemini-2.5-pro": "google/gemini-2.5-pro",
  "gemini-3-flash-preview": "google/gemini-2.5-flash",
  "gemini-3.6-flash": "google/gemini-2.5-flash",
};

const DEFAULT_PRIMARY_MODEL = "gemini-1.5-flash";
const DEFAULT_SECONDARY_MODEL = "google/gemini-2.5-flash";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Resolves current configured keys and gateway status
 */
export function getAiGatewayConfig() {
  const geminiKey = 
    getEnv("GEMINI_API_KEY") || 
    getEnv("GOOGLE_AI_API_KEY") || 
    getEnv("GOOGLE_API_KEY") || 
    "";

  const openRouterKey = 
    getEnv("OPENROUTER_API_KEY") || 
    getEnv("OPENROUTER_KEY") || 
    "";

  return {
    geminiKey: geminiKey.trim(),
    openRouterKey: openRouterKey.trim(),
    hasPrimary: Boolean(geminiKey.trim()),
    hasSecondary: Boolean(openRouterKey.trim()),
  };
}

/**
 * Determines whether an error is eligible for fallback to secondary provider
 */
function isFailoverEligibleError(error: any): boolean {
  if (!error) return false;
  const msg = String(error?.message || error || "").toLowerCase();
  const status = error?.status || error?.statusCode || error?.response?.status;

  // Rate limiting / Quota exhaustion
  if (status === 429 || status === 403 || status === 402) return true;
  if (
    msg.includes("429") || 
    msg.includes("quota") || 
    msg.includes("rate limit") || 
    msg.includes("resource_exhausted") || 
    msg.includes("resourceexhausted") || 
    msg.includes("too many requests") || 
    msg.includes("credits")
  ) {
    return true;
  }

  // Server downtime / unavailable
  if (status >= 500 && status < 600) return true;
  if (
    msg.includes("500") || 
    msg.includes("502") || 
    msg.includes("503") || 
    msg.includes("504") || 
    msg.includes("overloaded") || 
    msg.includes("unavailable") || 
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("fetch failed")
  ) {
    return true;
  }

  return false;
}

/**
 * Executes a call against Google AI Studio (Gemini)
 */
async function callGeminiPrimary(
  options: AiRequestOptions, 
  geminiKey: string
): Promise<{ text: string; model: string }> {
  const model = options.model || DEFAULT_PRIMARY_MODEL;
  
  // Use official @google/genai client
  const ai = new GoogleGenAI({ apiKey: geminiKey });
  
  const config: any = {};
  if (options.systemInstruction) {
    config.systemInstruction = options.systemInstruction;
  }
  if (options.responseMimeType) {
    config.responseMimeType = options.responseMimeType;
  }
  if (typeof options.temperature === "number") {
    config.temperature = options.temperature;
  }
  if (typeof options.maxTokens === "number") {
    config.maxOutputTokens = options.maxTokens;
  }

  const response = await ai.models.generateContent({
    model,
    contents: options.prompt,
    config: Object.keys(config).length > 0 ? config : undefined,
  });

  const text = response.text || "";
  if (!text) {
    throw new Error(`Empty response returned by Gemini model ${model}`);
  }

  return { text, model };
}

/**
 * Executes a call against OpenRouter (OpenAI-compatible endpoint)
 */
async function callOpenRouterSecondary(
  options: AiRequestOptions, 
  openRouterKey: string
): Promise<{ text: string; model: string }> {
  // Determine appropriate OpenRouter model
  let model = options.openRouterModel;
  if (!model) {
    if (options.model && options.model.includes("/")) {
      // Model passed is already namespaced (e.g., anthropic/claude-3.5-sonnet, google/gemini-2.5-flash)
      model = options.model;
    } else if (options.model && GEMINI_TO_OPENROUTER_MODEL_MAP[options.model]) {
      model = GEMINI_TO_OPENROUTER_MODEL_MAP[options.model];
    } else {
      model = DEFAULT_SECONDARY_MODEL;
    }
  }

  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  messages.push({ role: "user", content: options.prompt });

  const bodyPayload: any = {
    model,
    messages,
  };

  if (typeof options.temperature === "number") {
    bodyPayload.temperature = options.temperature;
  }
  if (typeof options.maxTokens === "number") {
    bodyPayload.max_tokens = options.maxTokens;
  }
  if (options.responseMimeType === "application/json") {
    bodyPayload.response_format = { type: "json_object" };
  }

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${openRouterKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://vyntyraconsultancyservices.in",
    "X-Title": "VyNexa Connect",
    ...(options.headers || {})
  };

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError = errorText;
    try {
      const jsonErr = JSON.parse(errorText);
      parsedError = jsonErr?.error?.message || errorText;
    } catch {}
    throw new Error(`OpenRouter API error (${response.status}): ${parsedError}`);
  }

  const resJson = await response.json();
  const text = resJson?.choices?.[0]?.message?.content || "";
  if (!text) {
    throw new Error(`OpenRouter returned empty choices for model ${model}`);
  }

  return { text, model };
}

/**
 * Main AI Text Generation Dispatcher
 * Automatically routes through Primary (Gemini) with seamless failover to Secondary (OpenRouter).
 */
export async function generateAiText(options: AiRequestOptions): Promise<AiResponse> {
  const { geminiKey, openRouterKey, hasPrimary, hasSecondary } = getAiGatewayConfig();
  const requestedProvider = options.provider || "auto";

  // Check if caller explicitly requested OpenRouter or provided an OpenRouter slug (e.g. "anthropic/...")
  const forceOpenRouter = 
    requestedProvider === "openrouter" || 
    (options.model && options.model.includes("/") && requestedProvider !== "gemini");

  if (forceOpenRouter) {
    if (!hasSecondary) {
      throw new Error(
        "OpenRouter provider explicitly requested, but OPENROUTER_API_KEY is not configured in environment."
      );
    }
    const result = await callOpenRouterSecondary(options, openRouterKey);
    return {
      text: result.text,
      provider: "openrouter",
      model: result.model,
      didFailover: false,
    };
  }

  // If caller explicitly requested Gemini
  if (requestedProvider === "gemini") {
    if (!hasPrimary) {
      throw new Error(
        "Gemini provider explicitly requested, but GEMINI_API_KEY is not configured in environment."
      );
    }
    const result = await callGeminiPrimary(options, geminiKey);
    return {
      text: result.text,
      provider: "gemini",
      model: result.model,
      didFailover: false,
    };
  }

  // AUTO Mode: Try Primary (Gemini) first if key is present
  if (hasPrimary) {
    try {
      const result = await callGeminiPrimary(options, geminiKey);
      return {
        text: result.text,
        provider: "gemini",
        model: result.model,
        didFailover: false,
      };
    } catch (primaryError: any) {
      console.warn(
        `[AI Gateway] Primary Gemini provider encountered error: ${primaryError.message || primaryError}`
      );

      // Check if secondary is available and error qualifies for failover
      if (hasSecondary && (isFailoverEligibleError(primaryError) || true)) {
        console.info(
          `[AI Gateway] Failing over to Secondary provider (OpenRouter)...`
        );
        try {
          const fallbackResult = await callOpenRouterSecondary(options, openRouterKey);
          return {
            text: fallbackResult.text,
            provider: "openrouter",
            model: fallbackResult.model,
            didFailover: true,
            failoverReason: primaryError.message || "Primary provider error",
          };
        } catch (secondaryError: any) {
          console.error(
            `[AI Gateway] Both Primary and Secondary providers failed. Primary: ${primaryError.message}, Secondary: ${secondaryError.message}`
          );
          throw new Error(
            `AI Providers failed. Primary (Gemini): ${primaryError.message}. Secondary (OpenRouter): ${secondaryError.message}`
          );
        }
      }

      // If secondary is not configured, rethrow primary error
      throw primaryError;
    }
  }

  // If Primary is not configured, but Secondary is available
  if (hasSecondary) {
    console.info(
      "[AI Gateway] GEMINI_API_KEY not configured; routing directly to OpenRouter secondary provider."
    );
    const fallbackResult = await callOpenRouterSecondary(options, openRouterKey);
    return {
      text: fallbackResult.text,
      provider: "openrouter",
      model: fallbackResult.model,
      didFailover: false,
    };
  }

  throw new Error(
    "No AI API Keys configured. Please set GEMINI_API_KEY (primary) and/or OPENROUTER_API_KEY (secondary) in your environment variables."
  );
}

/**
 * JSON Helper: Generates text with responseMimeType="application/json" and parses the result.
 */
export async function generateAiJson<T = any>(
  options: Omit<AiRequestOptions, "responseMimeType">
): Promise<AiJsonResponse<T>> {
  const res = await generateAiText({
    ...options,
    responseMimeType: "application/json",
  });

  let raw = res.text.trim();
  // Strip Markdown code fences if returned (e.g. ```json ... ```)
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  try {
    const data = JSON.parse(raw) as T;
    return {
      ...res,
      data,
    };
  } catch (parseError: any) {
    throw new Error(
      `Failed to parse AI JSON response (${res.provider} / ${res.model}): ${parseError.message}. Output was: ${raw.slice(0, 300)}`
    );
  }
}
