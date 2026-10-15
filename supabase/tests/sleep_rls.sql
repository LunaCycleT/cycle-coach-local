-- RLS isolation + integrity checks for sleep tables. Runs inside a rolled-back transaction.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
INSERT INTO public.sleep_nights (id,user_id,sleep_date) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','2026-10-14');
INSERT INTO public.sleep_sessions (night_id,user_id,started_at,ended_at) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','2026-10-15T03:00Z','2026-10-15T07:00Z');
-- overlap must fail
DO $$ BEGIN
  INSERT INTO public.sleep_sessions (night_id,user_id,started_at,ended_at) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','2026-10-15T06:00Z','2026-10-15T08:00Z');
  RAISE EXCEPTION 'FAIL: overlap allowed';
EXCEPTION WHEN SQLSTATE '23P01' THEN RAISE NOTICE 'PASS overlap rejected'; END $$;
-- end before start must fail
DO $$ BEGIN
  INSERT INTO public.sleep_sessions (night_id,user_id,started_at,ended_at) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','2026-10-16T06:00Z','2026-10-16T05:00Z');
  RAISE EXCEPTION 'FAIL: reversed allowed';
EXCEPTION WHEN check_violation THEN RAISE NOTICE 'PASS reversed rejected'; END $$;
-- user B
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.sleep_nights) <> 0 OR (SELECT count(*) FROM public.sleep_sessions) <> 0 THEN RAISE EXCEPTION 'FAIL: B sees A data'; END IF;
  RAISE NOTICE 'PASS B cannot read A';
  UPDATE public.sleep_nights SET notes='x' WHERE id='10000000-0000-0000-0000-000000000001';
  DELETE FROM public.sleep_nights WHERE id='10000000-0000-0000-0000-000000000001';
END $$;
DO $$ BEGIN
  INSERT INTO public.sleep_sessions (night_id,user_id,started_at,ended_at) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000b','2026-10-20T03:00Z','2026-10-20T04:00Z');
  RAISE EXCEPTION 'FAIL: B attached to A night';
EXCEPTION WHEN foreign_key_violation OR insufficient_privilege THEN RAISE NOTICE 'PASS B cannot attach to A night'; END $$;
DO $$ BEGIN
  INSERT INTO public.sleep_nights (user_id,sleep_date) VALUES ('00000000-0000-0000-0000-00000000000a','2026-10-21');
  RAISE EXCEPTION 'FAIL: B wrote as A';
EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'PASS B cannot write as A'; END $$;
-- back to A: data intact, cascade delete
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
DO $$ BEGIN
  IF (SELECT notes FROM public.sleep_nights) IS NOT NULL THEN RAISE EXCEPTION 'FAIL: B modified A'; END IF;
  DELETE FROM public.sleep_nights;
  IF (SELECT count(*) FROM public.sleep_sessions) <> 0 THEN RAISE EXCEPTION 'FAIL: no cascade'; END IF;
  RAISE NOTICE 'PASS A intact and cascade delete works';
END $$;
ROLLBACK;
