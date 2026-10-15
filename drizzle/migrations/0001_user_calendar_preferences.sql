CREATE TABLE public.user_calendar_preferences (
  user_id uuid PRIMARY KEY,
  primary_calendar text NOT NULL DEFAULT 'gregorian' CHECK (primary_calendar IN ('gregorian','international-fixed','ethiopian','march-first')),
  secondary_calendar text CHECK (secondary_calendar IS NULL OR secondary_calendar IN ('gregorian','international-fixed','ethiopian','march-first')),
  show_moon_phases boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT distinct_calendars CHECK (secondary_calendar IS NULL OR secondary_calendar <> primary_calendar)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_calendar_preferences TO authenticated;
GRANT ALL ON public.user_calendar_preferences TO service_role;
ALTER TABLE public.user_calendar_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.user_calendar_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.user_calendar_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.user_calendar_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.user_calendar_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);