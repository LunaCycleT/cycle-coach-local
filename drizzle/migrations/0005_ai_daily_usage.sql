CREATE TABLE public.ai_daily_usage (
  user_id uuid NOT NULL,
  usage_date date NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  total_tokens bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, usage_date)
);
GRANT SELECT ON public.ai_daily_usage TO authenticated;
GRANT ALL ON public.ai_daily_usage TO service_role;
ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own read" ON public.ai_daily_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Atomically reserve one request; returns new count, or -1 if the limit is reached.
CREATE OR REPLACE FUNCTION public.reserve_ai_request(_user_id uuid, _limit integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c integer;
BEGIN
  INSERT INTO public.ai_daily_usage AS u (user_id, usage_date, request_count)
  VALUES (_user_id, (now() AT TIME ZONE 'UTC')::date, 1)
  ON CONFLICT (user_id, usage_date) DO UPDATE
    SET request_count = u.request_count + 1, updated_at = now()
    WHERE u.request_count < _limit
  RETURNING request_count INTO c;
  RETURN COALESCE(c, -1);
END $$;

CREATE OR REPLACE FUNCTION public.release_ai_request(_user_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.ai_daily_usage SET request_count = GREATEST(request_count - 1, 0), updated_at = now()
  WHERE user_id = _user_id AND usage_date = (now() AT TIME ZONE 'UTC')::date;
$$;

CREATE OR REPLACE FUNCTION public.record_ai_tokens(_user_id uuid, _tokens integer)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.ai_daily_usage SET total_tokens = total_tokens + GREATEST(_tokens, 0), updated_at = now()
  WHERE user_id = _user_id AND usage_date = (now() AT TIME ZONE 'UTC')::date;
$$;

REVOKE ALL ON FUNCTION public.reserve_ai_request(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_ai_request(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_ai_tokens(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_request(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_ai_request(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_ai_tokens(uuid, integer) TO service_role;