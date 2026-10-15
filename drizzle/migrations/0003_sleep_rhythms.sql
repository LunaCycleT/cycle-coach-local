CREATE TABLE public.sleep_nights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sleep_date date NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  restfulness_rating smallint CHECK (restfulness_rating BETWEEN 1 AND 5),
  reported_awakening_count smallint CHECK (reported_awakening_count >= 0 AND reported_awakening_count <= 50),
  notes text CHECK (char_length(notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sleep_nights_user_date_unique UNIQUE (user_id, sleep_date),
  CONSTRAINT sleep_nights_id_user_unique UNIQUE (id, user_id)
);

CREATE TABLE public.sleep_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  night_id uuid NOT NULL,
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  session_label text CHECK (session_label IN ('first_sleep','second_sleep','nap','other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sleep_sessions_valid_times CHECK (ended_at > started_at),
  CONSTRAINT sleep_sessions_max_length CHECK (ended_at - started_at <= interval '24 hours'),
  CONSTRAINT sleep_sessions_night_fk FOREIGN KEY (night_id, user_id)
    REFERENCES public.sleep_nights (id, user_id) ON DELETE CASCADE
);

CREATE TABLE public.sleep_awakenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  night_id uuid NOT NULL,
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sleep_awakenings_valid_times CHECK (ended_at > started_at),
  CONSTRAINT sleep_awakenings_night_fk FOREIGN KEY (night_id, user_id)
    REFERENCES public.sleep_nights (id, user_id) ON DELETE CASCADE
);

CREATE INDEX sleep_sessions_user_started_idx ON public.sleep_sessions (user_id, started_at);
CREATE INDEX sleep_sessions_night_idx ON public.sleep_sessions (night_id);
CREATE INDEX sleep_awakenings_night_idx ON public.sleep_awakenings (night_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_nights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_awakenings TO authenticated;
GRANT ALL ON public.sleep_nights TO service_role;
GRANT ALL ON public.sleep_sessions TO service_role;
GRANT ALL ON public.sleep_awakenings TO service_role;

ALTER TABLE public.sleep_nights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_awakenings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select" ON public.sleep_nights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.sleep_nights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.sleep_nights FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.sleep_nights FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own select" ON public.sleep_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.sleep_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.sleep_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.sleep_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own select" ON public.sleep_awakenings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.sleep_awakenings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.sleep_awakenings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.sleep_awakenings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sleep_sessions_prevent_overlap()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.sleep_sessions s
    WHERE s.user_id = NEW.user_id AND s.id <> NEW.id
      AND s.started_at < NEW.ended_at AND NEW.started_at < s.ended_at
  ) THEN
    RAISE EXCEPTION 'Sleep session overlaps an existing session' USING ERRCODE = '23P01';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER sleep_sessions_overlap_check BEFORE INSERT OR UPDATE ON public.sleep_sessions
FOR EACH ROW EXECUTE FUNCTION public.sleep_sessions_prevent_overlap();

CREATE OR REPLACE FUNCTION public.sleep_nights_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

CREATE TRIGGER sleep_nights_touch BEFORE UPDATE ON public.sleep_nights
FOR EACH ROW EXECUTE FUNCTION public.sleep_nights_touch();