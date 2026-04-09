-- MediVision AI: Clinical Intelligence Schema
-- This script defines the table for storing clinical insights and alerts.

-- 1. Clinical Insights Table
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

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinical_insights_user_id ON public.clinical_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_insights_generated_at ON public.clinical_insights(generated_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.clinical_insights ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- 4. Updated At Trigger
CREATE TRIGGER tr_clinical_insights_updated_at
    BEFORE UPDATE ON public.clinical_insights
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
