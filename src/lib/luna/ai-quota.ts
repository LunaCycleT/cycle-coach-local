// Daily Ask Ordiva limit. Pure orchestration so it can be tested without a database.
export const DAILY_AI_LIMIT = 10;
export const QUOTA_MESSAGE =
  "You've reached your daily limit of 10 messages with Ask Ordiva. It resets at midnight UTC.";

export class QuotaExceededError extends Error {
  constructor() {
    super(QUOTA_MESSAGE);
    this.name = "QuotaExceededError";
  }
}

export interface QuotaStore {
  reserve(userId: string, limit: number): Promise<number>; // new count, or -1 when full
  release(userId: string): Promise<void>;
  recordTokens(userId: string, tokens: number): Promise<void>;
}

/** Reserve a slot, run the AI call, then record tokens — or give the slot back if the call failed. */
export async function withAiQuota<T>(
  store: QuotaStore,
  userId: string,
  run: () => Promise<{ result: T; tokens: number }>,
): Promise<T> {
  const count = await store.reserve(userId, DAILY_AI_LIMIT);
  if (count < 0) throw new QuotaExceededError();
  let out: { result: T; tokens: number };
  try {
    out = await run();
  } catch (err) {
    await store.release(userId).catch(() => {});
    throw err;
  }
  await store.recordTokens(userId, out.tokens).catch(() => {});
  return out.result;
}
