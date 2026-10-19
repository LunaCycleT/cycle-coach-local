import type { QuotaStore } from "./ai-quota";

// Uses the privileged client: the quota functions are only executable by the server.
export async function getQuotaStore(): Promise<QuotaStore> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return {
    async reserve(userId, limit) {
      const { data, error } = await supabaseAdmin.rpc("reserve_ai_request", { _user_id: userId, _limit: limit });
      if (error) throw new Error("Could not check your daily message limit");
      return data as number;
    },
    async release(userId) {
      await supabaseAdmin.rpc("release_ai_request", { _user_id: userId });
    },
    async recordTokens(userId, tokens) {
      await supabaseAdmin.rpc("record_ai_tokens", { _user_id: userId, _tokens: tokens });
    },
  };
}
