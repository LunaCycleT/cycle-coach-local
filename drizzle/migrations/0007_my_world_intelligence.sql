ALTER TABLE public.personal_records ADD CONSTRAINT personal_records_id_user_uniq UNIQUE (id, user_id);

-- Edit history (append-only)
CREATE TABLE public.record_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  domain text NOT NULL,
  version_created_at timestamptz NOT NULL,
  replaced_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT record_revisions_record_fk FOREIGN KEY (record_id, user_id)
    REFERENCES public.personal_records (id, user_id) ON DELETE CASCADE);
CREATE INDEX record_revisions_user_record_idx ON public.record_revisions (user_id, record_id, replaced_at);
GRANT SELECT ON public.record_revisions TO authenticated;
GRANT ALL ON public.record_revisions TO service_role;
ALTER TABLE public.record_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON public.record_revisions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE FUNCTION public.personal_records_keep_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id OR NEW.created_at <> OLD.created_at OR NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Entry owner, id and creation time cannot change' USING ERRCODE = '42501';
  END IF;
  IF NEW.content IS DISTINCT FROM OLD.content OR NEW.domain IS DISTINCT FROM OLD.domain THEN
    INSERT INTO public.record_revisions (record_id, user_id, content, domain, version_created_at)
    VALUES (OLD.id, OLD.user_id, OLD.content, OLD.domain, OLD.updated_at);
  END IF;
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END $$;
ALTER FUNCTION public.personal_records_keep_history() OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.personal_records_keep_history() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER personal_records_history BEFORE UPDATE ON public.personal_records
  FOR EACH ROW EXECUTE FUNCTION public.personal_records_keep_history();

-- Follow-ups (Revisit)
CREATE TABLE public.record_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (length(btrim(content)) BETWEEN 1 AND 10000),
  kind text NOT NULL DEFAULT 'followup' CHECK (kind IN ('followup','outcome','action')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT record_followups_record_fk FOREIGN KEY (record_id, user_id)
    REFERENCES public.personal_records (id, user_id) ON DELETE CASCADE);
CREATE INDEX record_followups_user_record_idx ON public.record_followups (user_id, record_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.record_followups TO authenticated;
GRANT ALL ON public.record_followups TO service_role;
ALTER TABLE public.record_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON public.record_followups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_insert ON public.record_followups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_delete ON public.record_followups FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Intelligence permissions (all off by default)
CREATE TABLE public.intelligence_preferences (
  user_id uuid PRIMARY KEY,
  use_my_world_context boolean NOT NULL DEFAULT false,
  use_my_rhythms_context boolean NOT NULL DEFAULT false,
  allow_external_ai boolean NOT NULL DEFAULT false,
  allow_background_insights boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intelligence_preferences TO authenticated;
GRANT ALL ON public.intelligence_preferences TO service_role;
ALTER TABLE public.intelligence_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_all ON public.intelligence_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER intelligence_preferences_touch BEFORE UPDATE ON public.intelligence_preferences
  FOR EACH ROW EXECUTE FUNCTION public.sleep_nights_touch();

-- Derived insights: written only by the server, linked to source entries
CREATE TABLE public.derived_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','dismissed','invalidated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT derived_insights_id_user_uniq UNIQUE (id, user_id));
CREATE INDEX derived_insights_user_idx ON public.derived_insights (user_id, status, created_at);
GRANT SELECT, DELETE ON public.derived_insights TO authenticated;
GRANT UPDATE (status) ON public.derived_insights TO authenticated;
GRANT ALL ON public.derived_insights TO service_role;
ALTER TABLE public.derived_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON public.derived_insights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_delete ON public.derived_insights FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY own_dismiss ON public.derived_insights FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'active') WITH CHECK (auth.uid() = user_id AND status = 'dismissed');
CREATE TRIGGER derived_insights_touch BEFORE UPDATE ON public.derived_insights
  FOR EACH ROW EXECUTE FUNCTION public.sleep_nights_touch();

CREATE TABLE public.insight_sources (
  insight_id uuid NOT NULL,
  record_id uuid NOT NULL,
  user_id uuid NOT NULL,
  record_updated_at timestamptz NOT NULL,
  PRIMARY KEY (insight_id, record_id),
  CONSTRAINT insight_sources_insight_fk FOREIGN KEY (insight_id, user_id)
    REFERENCES public.derived_insights (id, user_id) ON DELETE CASCADE,
  CONSTRAINT insight_sources_record_fk FOREIGN KEY (record_id, user_id)
    REFERENCES public.personal_records (id, user_id) ON DELETE CASCADE);
CREATE INDEX insight_sources_record_idx ON public.insight_sources (user_id, record_id);
GRANT SELECT ON public.insight_sources TO authenticated;
GRANT ALL ON public.insight_sources TO service_role;
ALTER TABLE public.insight_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_select ON public.insight_sources FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Source edited: invalidate dependent insights. Source deleted: remove dependent insights.
CREATE FUNCTION public.personal_records_invalidate_insights()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.derived_insights d USING public.insight_sources s
    WHERE s.insight_id = d.id AND s.record_id = OLD.id AND s.user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  IF NEW.content IS DISTINCT FROM OLD.content OR NEW.domain IS DISTINCT FROM OLD.domain THEN
    UPDATE public.derived_insights d SET status = 'invalidated'
    FROM public.insight_sources s
    WHERE s.insight_id = d.id AND s.record_id = NEW.id AND s.user_id = NEW.user_id AND d.status <> 'invalidated';
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION public.personal_records_invalidate_insights() OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.personal_records_invalidate_insights() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER personal_records_insights_update AFTER UPDATE ON public.personal_records
  FOR EACH ROW EXECUTE FUNCTION public.personal_records_invalidate_insights();
CREATE TRIGGER personal_records_insights_delete BEFORE DELETE ON public.personal_records
  FOR EACH ROW EXECUTE FUNCTION public.personal_records_invalidate_insights();

-- Consent withdrawn: remove all derived insights
CREATE FUNCTION public.intelligence_consent_withdrawn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.derived_insights WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  IF (OLD.use_my_world_context AND NOT NEW.use_my_world_context)
     OR (OLD.allow_external_ai AND NOT NEW.allow_external_ai) THEN
    DELETE FROM public.derived_insights WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END $$;
ALTER FUNCTION public.intelligence_consent_withdrawn() OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.intelligence_consent_withdrawn() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER intelligence_preferences_withdraw AFTER UPDATE OR DELETE ON public.intelligence_preferences
  FOR EACH ROW EXECUTE FUNCTION public.intelligence_consent_withdrawn();