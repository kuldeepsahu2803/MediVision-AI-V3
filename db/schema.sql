
-- RxSnap: Database Schema
-- This file is a reference for the clinical data structure.

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    patient_name TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL,
    full_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    image_path TEXT,
    pdf_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
