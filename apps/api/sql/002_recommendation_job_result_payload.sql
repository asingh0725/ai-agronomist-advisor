-- Safe migration for environments where app_recommendation_job already exists

ALTER TABLE IF EXISTS app_recommendation_job
  ADD COLUMN IF NOT EXISTS result_payload JSONB;
