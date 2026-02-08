-- Add route/dependencies metadata to permissions
ALTER TABLE "permissions"
  ADD COLUMN "route" TEXT,
  ADD COLUMN "dependencies" JSONB;

