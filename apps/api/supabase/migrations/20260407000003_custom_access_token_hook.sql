-- Migration: Custom access token hook
-- Adds role, user_id, and children_ids to JWT claims

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    claims jsonb;
    parent_record RECORD;
    children_ids jsonb;
BEGIN
    claims := event->'claims';

    -- Look up parent by auth user id
    SELECT id, role, email
    INTO parent_record
    FROM public.parents
    WHERE auth_user_id = (event->>'user_id')::uuid;

    IF parent_record IS NOT NULL THEN
        -- Add custom claims
        claims := jsonb_set(claims, '{user_role}', to_jsonb(parent_record.role::text));
        claims := jsonb_set(claims, '{user_id}', to_jsonb(parent_record.id::text));

        -- Get children IDs
        SELECT COALESCE(jsonb_agg(cp.id), '[]'::jsonb)
        INTO children_ids
        FROM public.child_profiles cp
        WHERE cp.parent_id = parent_record.id;

        claims := jsonb_set(claims, '{children_ids}', children_ids);
    END IF;

    -- Update the claims in the event
    event := jsonb_set(event, '{claims}', claims);

    RETURN event;
END;
$$;

-- Grant execute permission to supabase_auth_admin
GRANT
EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke from public
REVOKE
EXECUTE ON FUNCTION public.custom_access_token_hook
FROM public;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM anon;

REVOKE
EXECUTE ON FUNCTION public.custom_access_token_hook
FROM authenticated;
