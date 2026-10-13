-- Migration: Add pdf_url and csv_url columns to cbt_exams for Cloudflare paper storage
ALTER TABLE public.cbt_exams
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS csv_url TEXT;
