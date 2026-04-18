
-- RxSnap: Supabase Infrastructure Setup
-- This script initializes the clinical data schema and security policies.

-- 1. Tables
-- Migration: Add updated_at if missing from previous versions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='prescriptions' AND column_name='updated_at') THEN
        ALTER TABLE public.prescriptions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL,
    full_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    image_path TEXT,
    pdf_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON public.prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON public.prescriptions(created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Drop existing to avoid conflicts during re-run
DROP POLICY IF EXISTS "Users can view their own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Users can insert their own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Users can update their own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Users can delete their own prescriptions" ON public.prescriptions;

CREATE POLICY "Users can view their own prescriptions" 
    ON public.prescriptions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prescriptions" 
    ON public.prescriptions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prescriptions" 
    ON public.prescriptions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prescriptions" 
    ON public.prescriptions FOR DELETE 
    USING (auth.uid() = user_id);

-- 4. Storage Buckets
-- CRITICAL: You MUST create the following buckets in the Supabase Dashboard (Storage tab):
-- 1. 'prescriptions' (Public: No)
-- 2. 'reports' (Public: No)
-- 3. 'lab_reports' (Public: No)

-- Storage Policies for 'prescriptions'
DROP POLICY IF EXISTS "Users can upload their own prescription images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own prescription images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own prescription images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own prescription images" ON storage.objects;

CREATE POLICY "Users can upload their own prescription images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own prescription images"
ON storage.objects FOR SELECT
USING (bucket_id = 'prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own prescription images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own prescription images"
ON storage.objects FOR DELETE
USING (bucket_id = 'prescriptions' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage Policies for 'reports'
DROP POLICY IF EXISTS "Users can upload their own reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own reports" ON storage.objects;

CREATE POLICY "Users can upload their own reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own reports"
ON storage.objects FOR UPDATE
USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own reports"
ON storage.objects FOR DELETE
USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage Policies for 'lab_reports'
DROP POLICY IF EXISTS "Users can upload their own lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own lab reports" ON storage.objects;

CREATE POLICY "Users can upload their own lab reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lab_reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own lab reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'lab_reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own lab reports"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lab_reports' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'lab_reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own lab reports"
ON storage.objects FOR DELETE
USING (bucket_id = 'lab_reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5. Updated At Trigger
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

DROP TRIGGER IF EXISTS tr_prescriptions_updated_at ON public.prescriptions;
CREATE TRIGGER tr_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Lab Reports Table
-- Migration: Add updated_at if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='lab_reports' AND column_name='updated_at') THEN
        ALTER TABLE public.lab_reports ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.lab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL,
    full_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    image_path TEXT,
    pdf_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_reports_user_id ON public.lab_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_created_at ON public.lab_reports(created_at DESC);

ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lab reports" 
    ON public.lab_reports FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lab reports" 
    ON public.lab_reports FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lab reports" 
    ON public.lab_reports FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lab reports" 
    ON public.lab_reports FOR DELETE 
    USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS tr_lab_reports_updated_at ON public.lab_reports;
CREATE TRIGGER tr_lab_reports_updated_at
    BEFORE UPDATE ON public.lab_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Clinical Insights Table
-- Migration: Add updated_at if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clinical_insights' AND column_name='updated_at') THEN
        ALTER TABLE public.clinical_insights ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_clinical_insights_user_id ON public.clinical_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_insights_generated_at ON public.clinical_insights(generated_at DESC);

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

DROP TRIGGER IF EXISTS tr_clinical_insights_updated_at ON public.clinical_insights;
CREATE TRIGGER tr_clinical_insights_updated_at
    BEFORE UPDATE ON public.clinical_insights
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
