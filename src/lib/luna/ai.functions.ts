import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

async function callAI(messages: { role: string; content: string }[], json = false) {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error("AI is not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (res.status === 429) throw new Error("Too many requests, please try again shortly.");
  if (res.status === 402) throw new Error("AI credits are used up.");
  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "") as string;
}

const chatInput = z.object({
  message: z.string().min(1).max(4000),
  conversationHistory: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) }))
    .max(20),
  currentPhase: z.string().nullable(),
  cycleDay: z.number().nullable(),
});

export const cycleCoachChat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => chatInput.parse(d))
  .handler(async ({ data }) => {
    const system = `You are Luna, an expert menstrual cycle coach and women's health specialist. You provide compassionate, evidence-based guidance about menstrual health, cycle tracking, hormonal changes, and overall wellness.

Current user context:
- Cycle phase: ${data.currentPhase || "unknown"}
- Cycle day: ${data.cycleDay || "unknown"}

Guidelines:
- Always be empathetic and supportive
- Provide practical, actionable advice
- Reference the user's current cycle phase when relevant
- If medical concerns arise, recommend consulting a healthcare provider
- Keep responses conversational but informative
- Use emojis appropriately to maintain a friendly tone`;
    const response = await callAI([
      { role: "system", content: system },
      ...data.conversationHistory,
      { role: "user", content: data.message },
    ]);
    return { response };
  });

const insightsInput = z.object({ currentPhase: z.string(), cycleDay: z.number() });

export const generateInsights = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => insightsInput.parse(d))
  .handler(async ({ data }) => {
    const prompt = `You are Luna, a knowledgeable and empathetic menstrual cycle coach. Generate personalized daily insights for a person in their ${data.currentPhase} phase on day ${data.cycleDay} of their cycle.

Provide a warm 2-3 sentence daily message, 3-4 DO recommendations and 2-3 AVOID recommendations (categories: Nutrition, Exercise, Self-care, Productivity), an energy level (1-5) and a mood insight.

Respond ONLY with JSON:
{"dailyMessage":"string","energyLevel":number,"moodInsight":"string","recommendations":{"do":[{"category":"string","advice":"string","emoji":"string"}],"avoid":[{"category":"string","advice":"string","emoji":"string"}]}}`;
    const text = await callAI([{ role: "user", content: prompt }], true);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not read AI insights");
    return JSON.parse(match[0]) as {
      dailyMessage: string;
      energyLevel: number;
      moodInsight: string;
      recommendations: {
        do: Array<{ category: string; advice: string; emoji: string }>;
        avoid: Array<{ category: string; advice: string; emoji: string }>;
      };
    };
  });
