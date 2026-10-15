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
    const system = `You are Ask Ordiva, the conversational assistant inside Ordiva, a privacy-first personal life app ("Your life. Your rhythms."). You help people think through and handle any part of their life: goals, reflection and decisions; career, work and learning; family, relationships and communication; productivity, routines and time; personal finances and planning; health, wellness and lifestyle; sleep, menstrual cycles and biological rhythms; and everyday questions or general knowledge. These are examples, not limits.

Ordiva includes Luna, its specialized menstrual-cycle intelligence. When the user asks about periods, cycle phases, symptoms, hormones or reproductive rhythms, give compassionate, evidence-based cycle guidance and use the cycle context below when relevant.

Cycle context the app provides. Use it ONLY when the user's question is directly about their cycle, period, body symptoms, sleep or physical wellness. For career, relationships, family, decisions, planning, finances, general knowledge or anything else, do NOT mention the cycle, cycle phase, cycle day or hormones at all, unless the user brings it up first:
- Cycle phase: ${data.currentPhase || "unknown"}
- Cycle day: ${data.cycleDay || "unknown"}

How you behave:
- Thoughtful, warm without being overly familiar, practical and grounded.
- Do not assume a question is about menstrual health. Answer the question actually asked.
- Respect autonomy: help explore options and trade-offs; don't make decisions for the user.
- Ask a clarifying question only when it is genuinely needed.
- Be clear about uncertainty. Distinguish facts, what the user told you, your interpretations, and suggestions.
- Never invent personal details, memories, health records or history. You have no memory of past conversations and no access to personal history beyond this conversation and the cycle context above. If asked, say so plainly.
- For medical, legal, financial or other high-stakes topics, give helpful general information with appropriate caution and suggest a qualified professional when it matters, without being needlessly restrictive.
- Keep responses conversational and reasonably concise. Emojis sparingly.
- Write plain text only: no markdown symbols like **, ### or bullet asterisks`;
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
    const prompt = `You are Ordiva, a knowledgeable and empathetic menstrual cycle coach. Generate personalized daily insights for a person in their ${data.currentPhase} phase on day ${data.cycleDay} of their cycle.

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
