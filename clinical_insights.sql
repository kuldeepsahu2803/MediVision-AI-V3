-- MediVision AI: Clinical Intelligence Schema
-- This script defines the table for storing clinical insights and alerts.

-- 1. Migration: Add updated_at if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clinical_insights' AND column_name='updated_at') THEN
        ALTER TABLE public.clinical_insights ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

-- 2. Clinical Insights Table
CREATE TABLE IF NOT EXISTS public.clinical_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alerts JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary TEXT NOT NULL,
    risk_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinical_insights_user_id ON public.clinical_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_insights_generated_at ON public.clinical_insights(generated_at DESC);

-- 4. Row Level Security (RLS)
ALTER TABLE public.clinical_insights ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own clinical insights" ON public.clinical_insights;
DROP POLICY IF EXISTS "Users can insert their own clinical insights" ON public.clinical_insights;
DROP POLICY IF EXISTS "Users can update their own clinical insights" ON public.clinical_insights;
DROP POLICY IF EXISTS "Users can delete their own clinical insights" ON public.clinical_insights;

CREATE POLICY "Users can view their own clinical insights" 
    ON public.clinical_insights FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clinical insights" 
    ON public.clinical_insights FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clinical insights" 
    ON public.clinical_insights FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clinical insights" 
    ON public.clinical_insights FOR DELETE 
    USING (auth.uid() = user_id);

-- 5. Updated At Trigger
-- Ensure the function exists (it's also in supabase_setup.sql)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set updated_at if the column exists to avoid "record has no field" errors
    IF (to_jsonb(NEW) ? 'updated_at') THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_clinical_insights_updated_at ON public.clinical_insights;
CREATE TRIGGER tr_clinical_insights_updated_at
    BEFORE UPDATE ON public.clinical_insights
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
