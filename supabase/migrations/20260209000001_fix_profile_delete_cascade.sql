-- Fix profile delete cascade
-- This script ensures that when a profile is deleted, all related data in other tables is also deleted automatically.

-- 1. organizationmember
ALTER TABLE "public"."organizationmember"
DROP CONSTRAINT IF EXISTS "organizationmember_profile_id_fkey",
ADD CONSTRAINT "organizationmember_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

-- 2. groupmember
ALTER TABLE "public"."groupmember"
DROP CONSTRAINT IF EXISTS "groupmember_profile_id_fkey",
ADD CONSTRAINT "groupmember_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

-- 3. lesson_completion
ALTER TABLE "public"."lesson_completion"
DROP CONSTRAINT IF EXISTS "lesson_completion_profile_id_fkey",
ADD CONSTRAINT "lesson_completion_profile_id_fkey"
FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;

-- 4. lesson_teacher (the foreign key column is teacher_id)
ALTER TABLE "public"."lesson"
DROP CONSTRAINT IF EXISTS "lesson_teacher_id_fkey",
ADD CONSTRAINT "lesson_teacher_id_fkey"
FOREIGN KEY ("teacher_id") REFERENCES "public"."profile"("id") ON DELETE CASCADE;
