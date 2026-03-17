
-- RxSnap: Supabase Infrastructure Setup
-- This script initializes the clinical data schema and security policies.

-- 1. Tables
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
-- Note: Buckets must be created in the Supabase Dashboard or via API.
-- These policies assume buckets 'prescriptions' and 'reports' exist.

-- 5. Updated At Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
