ALTER TABLE public.user_calendar_preferences ADD COLUMN IF NOT EXISTS show_igbo_market_days boolean NOT NULL DEFAULT false;
ALTER TABLE public.user_calendar_preferences ADD COLUMN IF NOT EXISTS igbo_spelling text NOT NULL DEFAULT 'orie';
ALTER TABLE public.user_calendar_preferences ADD CONSTRAINT igbo_spelling_valid CHECK (igbo_spelling IN ('orie','oye'));