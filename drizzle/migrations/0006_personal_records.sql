CREATE TABLE public.personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(btrim(content)) > 0 AND char_length(content) <= 10000),
  domain text NOT NULL DEFAULT 'reflections' CHECK (domain IN ('reflections','career','relationships','growth','routines','finances','wellness')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal_records TO authenticated;
GRANT ALL ON public.personal_records TO service_role;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.personal_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.personal_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.personal_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.personal_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX personal_records_user_created_idx ON public.personal_records (user_id, created_at DESC);
CREATE TRIGGER personal_records_touch BEFORE UPDATE ON public.personal_records FOR EACH ROW EXECUTE FUNCTION public.sleep_nights_touch();