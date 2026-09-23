-- Co-teaching support for CoE Class teaching logs: when a class is taught
-- by 2+ faculty, the submitting mentor can tag co-mentors so the same
-- report shows up under their own "My Teaching Logs" list too.
ALTER TABLE "class_teaching_logs" ADD COLUMN IF NOT EXISTS "co_mentor_ids" TEXT[] NOT NULL DEFAULT '{}';
