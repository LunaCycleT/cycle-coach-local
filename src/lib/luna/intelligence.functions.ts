import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withAiQuota, QuotaExceededError } from "./ai-quota";
import { decideContext, type IntelligencePrefs } from "./intelligence-policy";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";
type Sb = any;

async function gateway(messages: { role: string; content: string }[], json = false) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 45000);
  try {
    const res = await fetch(GATEWAY, {
      method: "POST",
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, ...(json ? { response_format: { type: "json_object" } } : {}) }),
    });
    if (res.status === 429) throw new Error("Too many requests, please try again shortly.");
    if (res.status === 402) throw new Error("AI credits are used up.");
    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const data = await res.json();
    const content = (data.choices?.[0]?.message?.content ?? "") as string;
    if (!content) throw new Error("Ask Ordiva didn't return an answer. Please try again.");
    return { result: content, tokens: Number(data.usage?.total_tokens ?? 0) };
  } finally {
    clearTimeout(t);
  }
}

// Permissions are always read on the server for the signed-in user (RLS-scoped).
async function loadPrefs(sb: Sb, userId: string): Promise<Partial<IntelligencePrefs> | null> {
  const { data, error } = await sb.from("intelligence_preferences").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Could not check your privacy settings");
  return data;
}

async function rhythmsSummary(sb: Sb) {
  const [{ data: cycle }, { data: nights }] = await Promise.all([
    sb.from("cycle_settings").select("last_period_date, cycle_length").maybeSingle(),
    sb.from("sleep_nights").select("sleep_date, restfulness_rating").order("sleep_date", { ascending: false }).limit(7),
  ]);
  const lines: string[] = [];
  if (cycle?.last_period_date) {
    const day = Math.floor((Date.now() - new Date(cycle.last_period_date).getTime()) / 86400000) % (cycle.cycle_length || 28) + 1;
    lines.push(`Cycle day about ${day} of a ${cycle.cycle_length}-day cycle.`);
  }
  if (nights?.length) {
    const rated = nights.filter((n: any) => n.restfulness_rating);
    lines.push(`${nights.length} recent nights logged${rated.length ? `, average restfulness ${(rated.reduce((a: number, n: any) => a + n.restfulness_rating, 0) / rated.length).toFixed(1)}/5` : ""}.`);
  }
  return lines.join(" ");
}

const SYSTEM = `You are Ask Ordiva, a thoughtful, warm, grounded assistant inside Ordiva's private My World space. Only use the personal material given below; never invent memories or details. Distinguish what the user wrote from your interpretation. Do not make decisions for the user. Plain text only, no markdown. Keep it reasonably concise.`;

const exploreInput = z.object({
  recordId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) })).max(20),
});

export const exploreEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => exploreInput.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as Sb;
    const decision = decideContext(await loadPrefs(sb, context.userId), "explore_entry");
    if (!decision.allowed) return { blocked: decision.reason!, response: "", sources: [] as string[], limitReached: false };
    const { data: entry } = await sb.from("personal_records").select("id, content, domain, created_at").eq("id", data.recordId).maybeSingle();
    if (!entry) throw new Error("Entry not found");
    const { data: follow } = await sb.from("record_followups").select("content, kind, created_at").eq("record_id", entry.id).order("created_at");
    const sources = ["This entry"];
    let ctx = `Entry (${entry.domain}, ${entry.created_at.slice(0, 10)}):\n${entry.content}`;
    if (follow?.length) { ctx += `\n\nFollow-ups:\n${follow.map((f: any) => `- [${f.kind}, ${f.created_at.slice(0, 10)}] ${f.content}`).join("\n")}`; sources.push(`${follow.length} follow-up${follow.length > 1 ? "s" : ""}`); }
    if (decision.includeRhythms) { const r = await rhythmsSummary(sb); if (r) { ctx += `\n\nMy Rhythms summary: ${r}`; sources.push("My Rhythms summary"); } }
    const { getQuotaStore } = await import("./ai-quota.server");
    try {
      const response = await withAiQuota(await getQuotaStore(), context.userId, () =>
        gateway([{ role: "system", content: `${SYSTEM}\n\n${ctx}` }, ...data.history, { role: "user", content: data.message }]));
      return { blocked: null, response, sources, limitReached: false };
    } catch (e) {
      if (e instanceof QuotaExceededError) return { blocked: null, response: "", sources: [], limitReached: true };
      throw e;
    }
  });

export const generateConnectionInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as Sb;
    const decision = decideContext(await loadPrefs(sb, context.userId), "connect_insight");
    if (!decision.allowed) return { blocked: decision.reason!, limitReached: false, created: false };
    const { data: rows } = await sb.from("personal_records").select("id, content, domain, created_at, updated_at").order("created_at", { ascending: false }).limit(30);
    if (!rows || rows.length < 2) return { blocked: "Write at least two entries first.", limitReached: false, created: false };
    const list = rows.map((r: any, i: number) => `[${i}] (${r.domain}, ${r.created_at.slice(0, 10)}) ${r.content.slice(0, 800)}`).join("\n");
    const prompt = `Find one meaningful pattern that genuinely connects two or more of these entries, across life areas if real. If none, return {"insight":null}. Respond only JSON: {"insight":"one or two gentle sentences, tentative wording","entries":[indexes]}\n\n${list}`;
    const { getQuotaStore } = await import("./ai-quota.server");
    let text: string;
    try {
      text = await withAiQuota(await getQuotaStore(), context.userId, () => gateway([{ role: "system", content: SYSTEM }, { role: "user", content: prompt }], true));
    } catch (e) {
      if (e instanceof QuotaExceededError) return { blocked: null, limitReached: true, created: false };
      throw e;
    }
    let parsed: { insight?: string | null; entries?: number[] } = {};
    try { parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}"); } catch { /* treated as none */ }
    const used = [...new Set((parsed.entries ?? []).filter((i) => Number.isInteger(i) && rows[i]))].map((i) => rows[i]);
    if (!parsed.insight || used.length < 2) return { blocked: "No clear connection yet. Try again as your garden grows.", limitReached: false, created: false };
    // Server-only write; consent re-checked right before storing in case it was withdrawn mid-request.
    if (!decideContext(await loadPrefs(sb, context.userId), "connect_insight").allowed) return { blocked: "Permission was switched off.", limitReached: false, created: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ins, error } = await supabaseAdmin.from("derived_insights").insert({ user_id: context.userId, content: parsed.insight.slice(0, 1000) }).select("id").single();
    if (error || !ins) throw new Error("Could not save the insight");
    const { error: e2 } = await supabaseAdmin.from("insight_sources").insert(
      used.map((r: any) => ({ insight_id: ins.id, record_id: r.id, user_id: context.userId, record_updated_at: r.updated_at })));
    if (e2) { await supabaseAdmin.from("derived_insights").delete().eq("id", ins.id); throw new Error("Could not save the insight"); }
    return { blocked: null, limitReached: false, created: true };
  });
