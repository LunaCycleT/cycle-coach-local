REVOKE ALL ON public.record_revisions, public.record_followups, public.intelligence_preferences, public.derived_insights, public.insight_sources FROM anon;
REVOKE ALL ON public.record_revisions, public.record_followups, public.intelligence_preferences, public.derived_insights, public.insight_sources FROM authenticated;
GRANT SELECT ON public.record_revisions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.record_followups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intelligence_preferences TO authenticated;
GRANT SELECT, DELETE ON public.derived_insights TO authenticated;
GRANT UPDATE (status) ON public.derived_insights TO authenticated;
GRANT SELECT ON public.insight_sources TO authenticated;
REVOKE ALL ON public.personal_records FROM anon;