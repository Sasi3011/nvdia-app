-- Live QR refresh interval moved from 15s to 30s (FR-VERIF-01).
ALTER TABLE "event_sessions" ALTER COLUMN "qr_window_seconds" SET DEFAULT 30;

-- Existing sessions still on the old 15s default move to 30s too.
UPDATE "event_sessions" SET "qr_window_seconds" = 30 WHERE "qr_window_seconds" = 15;
