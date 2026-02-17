-- Cursor-sync performance indexes for offline-first clients

CREATE INDEX IF NOT EXISTS idx_app_input_command_user_created
  ON app_input_command (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_app_recommendation_job_user_status
  ON app_recommendation_job (user_id, status, updated_at DESC);
