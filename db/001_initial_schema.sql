-- Hazentra AI v0.1 / Supabase PostgreSQL 15+
-- IMPORTANT: Apply to a dedicated Hazentra project. Review and test with two real tenants.
-- No credentials, service keys, or demo customer records are included in this migration.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE TABLE public.organizations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 150),
 country text NOT NULL DEFAULT 'Saudi Arabia' CHECK (char_length(country) BETWEEN 2 AND 80),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.org_members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 email text NOT NULL CHECK (char_length(email) <= 320),
 display_name text NOT NULL DEFAULT '',
 role text NOT NULL CHECK (role IN ('org_owner','admin','manager','officer','viewer')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (organization_id,user_id)
);
CREATE INDEX idx_members_user ON public.org_members (user_id,organization_id);
CREATE TABLE public.sites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
 name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 180),
 name_ar text,
 code text NOT NULL CHECK (char_length(code) BETWEEN 2 AND 32),
 location text NOT NULL CHECK (char_length(location) BETWEEN 2 AND 180),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (organization_id,code), UNIQUE (id,organization_id)
);
CREATE INDEX idx_sites_org ON public.sites (organization_id,created_at DESC);
CREATE TABLE public.incidents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
 site_id uuid NOT NULL,
 title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
 title_ar text,
 description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 6000),
 kind text NOT NULL CHECK (kind IN ('incident','near_miss')),
 severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
 status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','closed')),
 occurred_on date NOT NULL DEFAULT current_date,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (site_id,organization_id) REFERENCES public.sites(id,organization_id)
);
CREATE TABLE public.inspections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
 site_id uuid NOT NULL,
 title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
 title_ar text,
 description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 6000),
 category text NOT NULL CHECK (category IN ('housekeeping','general_safety','fire_safety','ppe','machinery')),
 result text NOT NULL CHECK (result IN ('pass','needs_attention','fail')),
 status text NOT NULL DEFAULT 'completed' CHECK (status IN ('open','in_progress','completed')),
 inspected_on date NOT NULL DEFAULT current_date,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (site_id,organization_id) REFERENCES public.sites(id,organization_id)
);
CREATE TABLE public.risks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
 site_id uuid NOT NULL,
 title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
 title_ar text,
 likelihood int NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
 impact int NOT NULL CHECK (impact BETWEEN 1 AND 5),
 controls text NOT NULL DEFAULT '' CHECK (char_length(controls) <= 6000),
 mitigation text NOT NULL DEFAULT '' CHECK (char_length(mitigation) <= 6000),
 status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','closed')),
 assessed_on date NOT NULL DEFAULT current_date,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (site_id,organization_id) REFERENCES public.sites(id,organization_id)
);
CREATE TABLE public.actions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
 site_id uuid NOT NULL,
 title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
 title_ar text,
 description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 6000),
 action_type text NOT NULL CHECK (action_type IN ('corrective','preventive')),
 source_type text NOT NULL DEFAULT 'general' CHECK (source_type IN ('general','incident','inspection','risk')),
 source_id uuid,
 assigned_to text NOT NULL CHECK (char_length(assigned_to) BETWEEN 2 AND 180),
 due_date date NOT NULL,
 status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (site_id,organization_id) REFERENCES public.sites(id,organization_id)
);
CREATE TABLE public.audit_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
 actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 entity_type text NOT NULL,
 entity_id uuid NOT NULL,
 action text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_org_date ON public.audit_events(organization_id,created_at DESC);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['incidents','inspections','risks','actions'] LOOP
  EXECUTE format('CREATE INDEX %I ON public.%I(organization_id,created_at DESC)', 'idx_'||t||'_org_created',t);
  EXECUTE format('CREATE INDEX %I ON public.%I(organization_id,site_id)', 'idx_'||t||'_site',t);
 END LOOP;
END $$;

-- Private SECURITY DEFINER lookups avoid infinite RLS recursion on org_members.
-- Both functions derive identity exclusively from auth.uid(), NOT editable user_metadata.
CREATE OR REPLACE FUNCTION private.is_member(p_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.org_members m WHERE m.organization_id=p_org AND m.user_id=(SELECT auth.uid())
 );
$$;
CREATE OR REPLACE FUNCTION private.has_role(p_org uuid,p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.org_members m WHERE m.organization_id=p_org AND m.user_id=(SELECT auth.uid()) AND m.role=ANY(p_roles)
 );
$$;
REVOKE ALL ON FUNCTION private.is_member(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION private.has_role(uuid,text[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.is_member(uuid),private.has_role(uuid,text[]) TO authenticated;


-- Corrective and preventive actions must reference a finding at the SAME site/tenant.
CREATE OR REPLACE FUNCTION private.validate_action_source() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_valid boolean := false;
BEGIN
 IF NEW.source_type='general' THEN
  IF NEW.source_id IS NOT NULL THEN RAISE EXCEPTION 'General actions cannot have a source ID'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.source_id IS NULL THEN RAISE EXCEPTION 'Linked action requires a source record'; END IF;
 IF NEW.source_type='incident' THEN
  SELECT EXISTS(SELECT 1 FROM public.incidents r WHERE r.id=NEW.source_id AND r.organization_id=NEW.organization_id AND r.site_id=NEW.site_id) INTO v_valid;
 ELSIF NEW.source_type='inspection' THEN
  SELECT EXISTS(SELECT 1 FROM public.inspections r WHERE r.id=NEW.source_id AND r.organization_id=NEW.organization_id AND r.site_id=NEW.site_id) INTO v_valid;
 ELSIF NEW.source_type='risk' THEN
  SELECT EXISTS(SELECT 1 FROM public.risks r WHERE r.id=NEW.source_id AND r.organization_id=NEW.organization_id AND r.site_id=NEW.site_id) INTO v_valid;
 END IF;
 IF NOT v_valid THEN RAISE EXCEPTION 'Linked finding must belong to the same site and organization'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER action_link_before_write BEFORE INSERT OR UPDATE ON public.actions
FOR EACH ROW EXECUTE FUNCTION private.validate_action_source();

-- Disallow moving records between tenants on UPDATE even when user belongs to both.
CREATE OR REPLACE FUNCTION private.stable_org_id() RETURNS trigger LANGUAGE plpgsql
SET search_path = '' AS $$ BEGIN
 IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
  RAISE EXCEPTION 'organization_id cannot be changed';
 END IF;
 RETURN NEW;
END; $$;

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['sites','org_members','incidents','inspections','risks','actions'] LOOP
  EXECUTE format('CREATE TRIGGER stable_org_before_update BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.stable_org_id()', t);
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION private.audit_mutation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE r record;
BEGIN
 IF TG_OP='DELETE' THEN r:=OLD; ELSE r:=NEW; END IF;
 INSERT INTO public.audit_events(organization_id,actor_id,entity_type,entity_id,action)
 VALUES (r.organization_id,(SELECT auth.uid()),TG_TABLE_NAME,r.id,TG_OP);
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END; $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['sites','org_members','incidents','inspections','risks','actions'] LOOP
  EXECUTE format('CREATE TRIGGER audit_after_change AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.audit_mutation()', t);
 END LOOP;
END $$;

-- RPC: org bootstrap; each authenticated account gets its initial org_owner membership.
CREATE OR REPLACE FUNCTION public.bootstrap_organization(p_name text,p_country text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_org uuid; v_user auth.users%ROWTYPE;
BEGIN
 IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF char_length(trim(p_name)) NOT BETWEEN 2 AND 150 OR char_length(trim(p_country)) NOT BETWEEN 2 AND 80 THEN
  RAISE EXCEPTION 'Invalid organization input';
 END IF;
 SELECT * INTO v_user FROM auth.users WHERE id=(SELECT auth.uid()) AND email_confirmed_at IS NOT NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Verified account required'; END IF;
 IF EXISTS (SELECT 1 FROM public.org_members WHERE user_id=v_user.id) THEN RAISE EXCEPTION 'Already assigned to a workspace'; END IF;
 INSERT INTO public.organizations(name,country) VALUES(trim(p_name),trim(p_country)) RETURNING id INTO v_org;
 INSERT INTO public.org_members(organization_id,user_id,email,display_name,role)
 VALUES(v_org,v_user.id,v_user.email,coalesce(nullif(v_user.raw_user_meta_data->>'display_name',''),split_part(v_user.email,'@',1)),'org_owner');
 RETURN v_org;
END; $$;

-- RPC: add only an existing, email-verified user; no unauthenticated public invites.
CREATE OR REPLACE FUNCTION public.add_organization_member(p_organization_id uuid,p_email text,p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user auth.users%ROWTYPE;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT private.has_role(p_organization_id,ARRAY['org_owner','admin']) THEN
  RAISE EXCEPTION 'Not permitted';
 END IF;
 IF p_role NOT IN ('admin','manager','officer','viewer') OR char_length(p_email)>320 THEN
  RAISE EXCEPTION 'Invalid role/email';
 END IF;
 SELECT * INTO v_user FROM auth.users
 WHERE lower(email)=lower(trim(p_email)) AND email_confirmed_at IS NOT NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'User must register and verify an account first'; END IF;
 INSERT INTO public.org_members(organization_id,user_id,email,display_name,role)
 VALUES(p_organization_id,v_user.id,v_user.email,
 coalesce(nullif(v_user.raw_user_meta_data->>'display_name',''),split_part(v_user.email,'@',1)),p_role)
 ON CONFLICT(organization_id,user_id) DO UPDATE SET role=EXCLUDED.role;
END; $$;
REVOKE ALL ON FUNCTION public.bootstrap_organization(text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.add_organization_member(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_organization(text,text),public.add_organization_member(uuid,text,text) TO authenticated;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_read ON public.organizations FOR SELECT TO authenticated USING (private.is_member(id));
CREATE POLICY org_update ON public.organizations FOR UPDATE TO authenticated
 USING (private.has_role(id,ARRAY['org_owner','admin'])) WITH CHECK (private.has_role(id,ARRAY['org_owner','admin']));
CREATE POLICY members_read ON public.org_members FOR SELECT TO authenticated USING (private.is_member(organization_id));
CREATE POLICY sites_read ON public.sites FOR SELECT TO authenticated USING (private.is_member(organization_id));
CREATE POLICY sites_create ON public.sites FOR INSERT TO authenticated
 WITH CHECK (private.has_role(organization_id,ARRAY['org_owner','admin']));
CREATE POLICY sites_update ON public.sites FOR UPDATE TO authenticated
 USING (private.has_role(organization_id,ARRAY['org_owner','admin']))
 WITH CHECK (private.has_role(organization_id,ARRAY['org_owner','admin']));
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['incidents','inspections','risks','actions'] LOOP
  EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (private.is_member(organization_id))',t||'_read',t);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.has_role(organization_id,ARRAY[''org_owner'',''admin'',''manager'',''officer'']))',t||'_create',t);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (private.has_role(organization_id,ARRAY[''org_owner'',''admin'',''manager'',''officer''])) WITH CHECK (private.has_role(organization_id,ARRAY[''org_owner'',''admin'',''manager'',''officer'']))',t||'_update',t);
 END LOOP;
END $$;
CREATE POLICY audit_read ON public.audit_events FOR SELECT TO authenticated
 USING (private.has_role(organization_id,ARRAY['org_owner','admin','manager']));


-- Server-side AI usage control: a transactional 20 reports/user/day cap.
-- This is intentionally not directly readable/writable through the Data API.
CREATE TABLE public.ai_usage_daily (
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 use_date date NOT NULL DEFAULT current_date,
 requests int NOT NULL DEFAULT 0 CHECK (requests BETWEEN 0 AND 20),
 PRIMARY KEY (organization_id,user_id,use_date)
);
ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.consume_ai_quota(p_organization_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_updated int;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT private.is_member(p_organization_id) THEN
  RAISE EXCEPTION 'Workspace access denied';
 END IF;
 INSERT INTO public.ai_usage_daily(organization_id,user_id,use_date,requests)
 VALUES(p_organization_id,(SELECT auth.uid()),current_date,1)
 ON CONFLICT(organization_id,user_id,use_date) DO UPDATE
 SET requests=public.ai_usage_daily.requests+1
 WHERE public.ai_usage_daily.requests<20;
 GET DIAGNOSTICS v_updated=ROW_COUNT;
 RETURN v_updated=1;
END; $$;
REVOKE ALL ON FUNCTION public.consume_ai_quota(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(uuid) TO authenticated;

-- Explicit API grants: RLS remains the final row-level permission boundary.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT,UPDATE ON public.organizations TO authenticated;
GRANT SELECT ON public.org_members TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.sites,public.incidents,public.inspections,public.risks,public.actions TO authenticated;
GRANT SELECT ON public.audit_events TO authenticated;
-- No grants for anon, no DELETE grants, no writes to membership or audit tables.
COMMIT;