-- Add optional description to projects (run if your DB was created before this column existed)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
