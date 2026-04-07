-- Migration: RLS Policies for all tables
-- Enable Row Level Security on all public tables

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.parents FORCE ROW LEVEL SECURITY;

ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.child_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.conversation_scenarios ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.conversation_scenarios FORCE ROW LEVEL SECURITY;

ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.conversation_sessions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.pronunciation_scores ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.pronunciation_scores FORCE ROW LEVEL SECURITY;

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.badges FORCE ROW LEVEL SECURITY;

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.streaks FORCE ROW LEVEL SECURITY;

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.xp_transactions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.parental_consents ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.parental_consents FORCE ROW LEVEL SECURITY;

ALTER TABLE public.safety_flags ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.safety_flags FORCE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

-- ============================================
-- PARENTS TABLE POLICIES
-- ============================================

-- Parents can read their own profile
CREATE POLICY parents_select_own ON public.parents FOR
SELECT TO authenticated USING (auth.uid() = auth_user_id);

-- Parents can update their own profile
CREATE POLICY parents_update_own ON public.parents
FOR UPDATE
    TO authenticated USING (auth.uid() = auth_user_id);

-- ============================================
-- CHILD_PROFILES TABLE POLICIES (Parent-only access)
-- ============================================

-- Parents can SELECT their own child_profiles
CREATE POLICY child_profiles_select_parent ON public.child_profiles FOR
SELECT TO authenticated USING (
        parent_id IN (
            SELECT id
            FROM public.parents
            WHERE
                auth_user_id = auth.uid()
        )
    );

-- Parents can INSERT child_profiles
CREATE POLICY child_profiles_insert_parent ON public.child_profiles FOR INSERT TO authenticated
WITH
    CHECK (
        parent_id IN (
            SELECT id
            FROM public.parents
            WHERE
                auth_user_id = auth.uid()
        )
    );

-- Parents can UPDATE their own child_profiles
CREATE POLICY child_profiles_update_parent ON public.child_profiles
FOR UPDATE
    TO authenticated USING (
        parent_id IN (
            SELECT id
            FROM public.parents
            WHERE
                auth_user_id = auth.uid()
        )
    );

-- Parents can DELETE their own child_profiles
CREATE POLICY child_profiles_delete_parent ON public.child_profiles FOR DELETE TO authenticated USING (
    parent_id IN (
        SELECT id
        FROM public.parents
        WHERE
            auth_user_id = auth.uid()
    )
);

-- ============================================
-- CONVERSATION_SCENARIOS TABLE POLICIES
-- ============================================

-- All authenticated users can view active scenarios
CREATE POLICY scenarios_select_all ON public.conversation_scenarios FOR
SELECT TO authenticated USING (is_active = true);

-- ============================================
-- CONVERSATION_SESSIONS TABLE POLICIES
-- ============================================

-- Parents can view their children's sessions
CREATE POLICY sessions_select_parent ON public.conversation_sessions FOR
SELECT TO authenticated USING (
        child_id IN (
            SELECT cp.id
            FROM public.child_profiles cp
                JOIN public.parents p ON cp.parent_id = p.id
            WHERE
                p.auth_user_id = auth.uid()
        )
    );

-- Parents can insert sessions for their children
CREATE POLICY sessions_insert_parent ON public.conversation_sessions FOR INSERT TO authenticated
WITH
    CHECK (
        child_id IN (
            SELECT cp.id
            FROM public.child_profiles cp
                JOIN public.parents p ON cp.parent_id = p.id
            WHERE
                p.auth_user_id = auth.uid()
        )
    );

-- Parents can update their children's sessions
CREATE POLICY sessions_update_parent ON public.conversation_sessions
FOR UPDATE
    TO authenticated USING (
        child_id IN (
            SELECT cp.id
            FROM public.child_profiles cp
                JOIN public.parents p ON cp.parent_id = p.id
            WHERE
                p.auth_user_id = auth.uid()
        )
    );

-- Parents can delete their children's sessions
CREATE POLICY sessions_delete_parent ON public.conversation_sessions FOR DELETE TO authenticated USING (
    child_id IN (
        SELECT cp.id
        FROM public.child_profiles cp
            JOIN public.parents p ON cp.parent_id = p.id
        WHERE
            p.auth_user_id = auth.uid()
    )
);

-- ============================================
-- PRONUNCIATION_SCORES TABLE POLICIES
-- ============================================

-- Parents can view their children's scores
CREATE POLICY scores_select_parent ON public.pronunciation_scores FOR
SELECT TO authenticated USING (
        child_id IN (
            SELECT cp.id
            FROM public.child_profiles cp
                JOIN public.parents p ON cp.parent_id = p.id
            WHERE
                p.auth_user_id = auth.uid()
        )
    );

-- Parents can insert scores for their children
CREATE POLICY scores_insert_parent ON public.pronunciation_scores FOR INSERT TO authenticated
WITH
    CHECK (
        child_id IN (
            SELECT cp.id
            FROM public.child_profiles cp
                JOIN public.parents p ON cp.parent_id = p.id
            WHERE
                p.auth_user_id = auth.uid()
        )
    );

-- ============================================
-- BADGES TABLE POLICIES
-- ============================================

-- Parents can view their children's badges
CREATE POLICY badges_select_parent ON public.badges FOR
SELECT TO authenticated USING (
        child_id IN (
            SELECT cp.id
            FROM public.child_profiles cp
                JOIN public.parents p ON cp.parent_id = p.id
            WHERE
                p.auth_user_id = auth.uid()
        )
    );

-- ============================================
-- STREAKS TABLE POLICIES
-- ============================================

-- Parents can view their children's streaks
CREATE POLICY streaks_select_parent ON public.streaks FOR
SELECT TO authenticated USING (
        child_id IN (
            SELECT cp.id
            FROM public.child_profiles cp
                JOIN public.parents p ON cp.parent_id = p.id
            WHERE
                p.auth_user_id = auth.uid()
        )
    );

-- ============================================
-- XP_TRANSACTIONS TABLE POLICIES
-- ============================================

-- Parents can view their children's XP transactions
CREATE POLICY xp_select_parent ON public.xp_transactions FOR
SELECT TO authenticated USING (
        child_id IN (
            SELECT cp.id
            FROM public.child_profiles cp
                JOIN public.parents p ON cp.parent_id = p.id
            WHERE
                p.auth_user_id = auth.uid()
        )
    );

-- ============================================
-- PARENTAL_CONSENTS TABLE POLICIES
-- ============================================

-- Parents can view their own consent
CREATE POLICY consents_select_own ON public.parental_consents FOR
SELECT TO authenticated USING (
        parent_id IN (
            SELECT id
            FROM public.parents
            WHERE
                auth_user_id = auth.uid()
        )
    );

-- Parents can insert their own consent
CREATE POLICY consents_insert_own ON public.parental_consents FOR INSERT TO authenticated
WITH
    CHECK (
        parent_id IN (
            SELECT id
            FROM public.parents
            WHERE
                auth_user_id = auth.uid()
        )
    );

-- Parents can update their own consent
CREATE POLICY consents_update_own ON public.parental_consents
FOR UPDATE
    TO authenticated USING (
        parent_id IN (
            SELECT id
            FROM public.parents
            WHERE
                auth_user_id = auth.uid()
        )
    );

-- ============================================
-- SAFETY_FLAGS TABLE POLICIES
-- ============================================

-- Parents can view safety flags for their children
CREATE POLICY safety_flags_select_parent ON public.safety_flags FOR
SELECT TO authenticated USING (
        child_id IN (
            SELECT cp.id
            FROM public.child_profiles cp
                JOIN public.parents p ON cp.parent_id = p.id
            WHERE
                p.auth_user_id = auth.uid()
        )
    );

-- ============================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================

-- Parents can view their own subscriptions
CREATE POLICY subscriptions_select_own ON public.subscriptions FOR
SELECT TO authenticated USING (
        parent_id IN (
            SELECT id
            FROM public.parents
            WHERE
                auth_user_id = auth.uid()
        )
    );

-- Parents can insert their own subscriptions
CREATE POLICY subscriptions_insert_own ON public.subscriptions FOR INSERT TO authenticated
WITH
    CHECK (
        parent_id IN (
            SELECT id
            FROM public.parents
            WHERE
                auth_user_id = auth.uid()
        )
    );

-- Parents can update their own subscriptions
CREATE POLICY subscriptions_update_own ON public.subscriptions
FOR UPDATE
    TO authenticated USING (
        parent_id IN (
            SELECT id
            FROM public.parents
            WHERE
                auth_user_id = auth.uid()
        )
    );
