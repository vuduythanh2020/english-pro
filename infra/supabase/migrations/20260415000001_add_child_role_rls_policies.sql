-- Migration: Add child-role RLS policies
-- Deferred from Story 1.3 → 2.5 → resolved in Epic 2 retro prep
-- Child JWT claims: { role: 'child', childId: uuid, parentId: uuid }
-- Child can only SELECT own data — no INSERT, UPDATE, or DELETE

-- ============================================
-- CHILD_PROFILES: Child can SELECT own profile
-- ============================================

CREATE POLICY child_profiles_select_child ON public.child_profiles FOR
SELECT TO authenticated USING (
        auth.jwt () ->> 'role' = 'child'
        AND id::text = auth.jwt () ->> 'childId'
    );

-- ============================================
-- CONVERSATION_SESSIONS: Child can SELECT and INSERT own sessions
-- ============================================

CREATE POLICY sessions_select_child ON public.conversation_sessions FOR
SELECT TO authenticated USING (
        auth.jwt () ->> 'role' = 'child'
        AND child_id::text = auth.jwt () ->> 'childId'
    );

CREATE POLICY sessions_insert_child ON public.conversation_sessions FOR INSERT TO authenticated
WITH
    CHECK (
        auth.jwt () ->> 'role' = 'child'
        AND child_id::text = auth.jwt () ->> 'childId'
    );

CREATE POLICY sessions_update_child ON public.conversation_sessions
FOR UPDATE
    TO authenticated USING (
        auth.jwt () ->> 'role' = 'child'
        AND child_id::text = auth.jwt () ->> 'childId'
    );

-- ============================================
-- PRONUNCIATION_SCORES: Child can SELECT and INSERT own scores
-- ============================================

CREATE POLICY scores_select_child ON public.pronunciation_scores FOR
SELECT TO authenticated USING (
        auth.jwt () ->> 'role' = 'child'
        AND child_id::text = auth.jwt () ->> 'childId'
    );

CREATE POLICY scores_insert_child ON public.pronunciation_scores FOR INSERT TO authenticated
WITH
    CHECK (
        auth.jwt () ->> 'role' = 'child'
        AND child_id::text = auth.jwt () ->> 'childId'
    );

-- ============================================
-- BADGES: Child can SELECT own badges
-- ============================================

CREATE POLICY badges_select_child ON public.badges FOR
SELECT TO authenticated USING (
        auth.jwt () ->> 'role' = 'child'
        AND child_id::text = auth.jwt () ->> 'childId'
    );

-- ============================================
-- STREAKS: Child can SELECT own streaks
-- ============================================

CREATE POLICY streaks_select_child ON public.streaks FOR
SELECT TO authenticated USING (
        auth.jwt () ->> 'role' = 'child'
        AND child_id::text = auth.jwt () ->> 'childId'
    );

-- ============================================
-- XP_TRANSACTIONS: Child can SELECT own XP
-- ============================================

CREATE POLICY xp_select_child ON public.xp_transactions FOR
SELECT TO authenticated USING (
        auth.jwt () ->> 'role' = 'child'
        AND child_id::text = auth.jwt () ->> 'childId'
    );