/*
  Warnings:

  - You are about to drop the column `created_at` on the `roles` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `roles` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(50)`.
  - You are about to drop the column `created_at` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `student_profiles` table. All the data in the column will be lost.
  - The `grade` column on the `student_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `created_at` on the `teacher_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `teacher_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `user_roles` table. All the data in the column will be lost.
  - You are about to alter the column `username` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(20)`.
  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[name]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `roles` required. This step will fail if there are existing NULL values in that column.
  - Made the column `real_name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `user_type` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "user_type" AS ENUM ('student', 'teacher');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'banned');

-- CreateEnum
CREATE TYPE "organization_type" AS ENUM ('club', 'student_organization', 'administration');

-- CreateEnum
CREATE TYPE "organization_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "activity_application_status" AS ENUM ('draft', 'submitted', 'approving', 'need_more', 'rejected', 'approved', 'archived');

-- CreateEnum
CREATE TYPE "review_result" AS ENUM ('approved', 'rejected', 'need_more');

-- CreateEnum
CREATE TYPE "activity_status" AS ENUM ('planned', 'recruiting', 'ongoing', 'finished', 'closed');

-- CreateEnum
CREATE TYPE "recruitment_target_user_type" AS ENUM ('student', 'teacher', 'all');

-- CreateEnum
CREATE TYPE "recruitment_status" AS ENUM ('draft', 'published', 'closed');

-- CreateEnum
CREATE TYPE "signup_status" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "checkin_mode" AS ENUM ('qrcode', 'code', 'manual');

-- CreateEnum
CREATE TYPE "checkin_session_status" AS ENUM ('pending', 'open', 'closed');

-- CreateEnum
CREATE TYPE "checkin_record_status" AS ENUM ('checked_in', 'late');

-- CreateEnum
CREATE TYPE "closure_application_status" AS ENUM ('draft', 'submitted', 'approving', 'rejected', 'approved');

-- CreateEnum
CREATE TYPE "role_application_status" AS ENUM ('draft', 'submitted', 'approving', 'rejected', 'approved');

-- CreateEnum
CREATE TYPE "pending_task_type" AS ENUM ('application_review', 'closure_review', 'signup_review', 'role_application_review');

-- CreateEnum
CREATE TYPE "related_resource_type" AS ENUM ('activity_application', 'closure_application', 'recruitment_signup', 'role_application');

-- CreateEnum
CREATE TYPE "pending_task_status" AS ENUM ('pending', 'processed', 'cancelled');

-- CreateEnum
CREATE TYPE "announcement_type" AS ENUM ('news', 'notice', 'recruitment_notice', 'system_notice');

-- CreateEnum
CREATE TYPE "announcement_status" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "notification_target_type" AS ENUM ('all_users', 'role', 'org', 'user');

-- CreateEnum
CREATE TYPE "notification_source_type" AS ENUM ('activity_application', 'closure_application', 'recruitment_signup', 'activity', 'announcement', 'role_application', 'system');

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "created_at",
ADD COLUMN     "description" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "student_profiles" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
DROP COLUMN "grade",
ADD COLUMN     "grade" INTEGER;

-- AlterTable
ALTER TABLE "teacher_profiles" DROP COLUMN "created_at",
DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "user_roles" DROP COLUMN "created_at",
ADD COLUMN     "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_login_at" TIMESTAMP(3),
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "username" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "real_name" SET NOT NULL,
DROP COLUMN "user_type",
ADD COLUMN     "user_type" "user_type" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "user_status" NOT NULL DEFAULT 'active';

-- DropEnum
DROP TYPE "UserStatus";

-- DropEnum
DROP TYPE "UserType";

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "org_code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "organization_type" NOT NULL,
    "parent_org_id" UUID,
    "status" "organization_status" NOT NULL DEFAULT 'active',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_organizations" (
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("user_id","organization_id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(50),
    "resource_id" UUID,
    "ip_address" INET,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_applications" (
    "id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT,
    "location" VARCHAR(200),
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "status" "activity_application_status" NOT NULL DEFAULT 'draft',
    "current_level" INTEGER,
    "current_reviewer_id" UUID,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_attachments" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size" BIGINT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_records" (
    "id" UUID NOT NULL,
    "activity_application_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "reviewer_organization_id" UUID NOT NULL,
    "result" "review_result" NOT NULL,
    "comment" TEXT,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "organizer_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "status" "activity_status" NOT NULL DEFAULT 'planned',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitments" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "quota" INTEGER,
    "description" TEXT,
    "signup_start_time" TIMESTAMP(3),
    "signup_end_time" TIMESTAMP(3),
    "target_user_type" "recruitment_target_user_type" NOT NULL DEFAULT 'all',
    "min_grade" INTEGER,
    "max_grade" INTEGER,
    "requires_attachment" BOOLEAN NOT NULL DEFAULT false,
    "status" "recruitment_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_allowed_majors" (
    "recruitment_id" UUID NOT NULL,
    "major_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "recruitment_allowed_majors_pkey" PRIMARY KEY ("recruitment_id","major_name")
);

-- CreateTable
CREATE TABLE "recruitment_signups" (
    "id" UUID NOT NULL,
    "recruitment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "signup_status" NOT NULL DEFAULT 'pending',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" UUID,

    CONSTRAINT "recruitment_signups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signup_attachments" (
    "id" UUID NOT NULL,
    "signup_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signup_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkin_sessions" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "mode" "checkin_mode" NOT NULL,
    "checkin_code" VARCHAR(20),
    "qrcode_token" VARCHAR(255),
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "checkin_session_status" NOT NULL DEFAULT 'pending',
    "created_by" UUID NOT NULL,

    CONSTRAINT "checkin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkin_records" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "checkin_record_status" NOT NULL DEFAULT 'checked_in',
    "checked_in_at" TIMESTAMP(3),

    CONSTRAINT "checkin_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "closure_applications" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "summary" TEXT,
    "participant_count" INTEGER,
    "status" "closure_application_status" NOT NULL DEFAULT 'draft',
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "closure_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "closure_attachments" (
    "id" UUID NOT NULL,
    "closure_application_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "closure_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "closure_review_records" (
    "id" UUID NOT NULL,
    "closure_application_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "reviewer_organization_id" UUID NOT NULL,
    "result" "review_result" NOT NULL,
    "comment" TEXT,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "closure_review_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_applications" (
    "id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "target_role_code" VARCHAR(50) NOT NULL,
    "organization_id" UUID,
    "reason" TEXT,
    "status" "role_application_status" NOT NULL DEFAULT 'draft',
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" UUID,
    "review_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_tasks" (
    "id" UUID NOT NULL,
    "assignee_id" UUID NOT NULL,
    "task_type" "pending_task_type" NOT NULL,
    "related_resource_type" "related_resource_type" NOT NULL,
    "related_resource_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "status" "pending_task_status" NOT NULL DEFAULT 'pending',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "pending_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "activity_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "type" "announcement_type" NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "publisher_id" UUID,
    "status" "announcement_status" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "target_type" "notification_target_type" NOT NULL,
    "target_value" VARCHAR(100),
    "source_type" "notification_source_type",
    "source_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_receipts" (
    "id" UUID NOT NULL,
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notification_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_org_code_key" ON "organizations"("org_code");

-- CreateIndex
CREATE INDEX "organizations_parent_org_id_idx" ON "organizations"("parent_org_id");

-- CreateIndex
CREATE INDEX "organizations_type_idx" ON "organizations"("type");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "permissions_action_idx" ON "permissions"("action");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "user_organizations_organization_id_idx" ON "user_organizations"("organization_id");

-- CreateIndex
CREATE INDEX "system_logs_user_id_idx" ON "system_logs"("user_id");

-- CreateIndex
CREATE INDEX "system_logs_created_at_idx" ON "system_logs"("created_at");

-- CreateIndex
CREATE INDEX "activity_applications_organization_id_idx" ON "activity_applications"("organization_id");

-- CreateIndex
CREATE INDEX "activity_applications_applicant_id_idx" ON "activity_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "activity_applications_status_idx" ON "activity_applications"("status");

-- CreateIndex
CREATE INDEX "activity_applications_current_reviewer_id_idx" ON "activity_applications"("current_reviewer_id");

-- CreateIndex
CREATE INDEX "application_attachments_application_id_idx" ON "application_attachments"("application_id");

-- CreateIndex
CREATE INDEX "approval_records_activity_application_id_idx" ON "approval_records"("activity_application_id");

-- CreateIndex
CREATE INDEX "approval_records_reviewer_id_idx" ON "approval_records"("reviewer_id");

-- CreateIndex
CREATE INDEX "approval_records_reviewer_organization_id_idx" ON "approval_records"("reviewer_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "activities_application_id_key" ON "activities"("application_id");

-- CreateIndex
CREATE INDEX "activities_organization_id_idx" ON "activities"("organization_id");

-- CreateIndex
CREATE INDEX "activities_organizer_id_idx" ON "activities"("organizer_id");

-- CreateIndex
CREATE INDEX "activities_status_idx" ON "activities"("status");

-- CreateIndex
CREATE INDEX "recruitments_activity_id_idx" ON "recruitments"("activity_id");

-- CreateIndex
CREATE INDEX "recruitments_status_idx" ON "recruitments"("status");

-- CreateIndex
CREATE INDEX "recruitments_target_user_type_idx" ON "recruitments"("target_user_type");

-- CreateIndex
CREATE INDEX "recruitment_signups_user_id_idx" ON "recruitment_signups"("user_id");

-- CreateIndex
CREATE INDEX "recruitment_signups_status_idx" ON "recruitment_signups"("status");

-- CreateIndex
CREATE INDEX "recruitment_signups_reviewed_by_idx" ON "recruitment_signups"("reviewed_by");

-- CreateIndex
CREATE UNIQUE INDEX "recruitment_signups_recruitment_id_user_id_key" ON "recruitment_signups"("recruitment_id", "user_id");

-- CreateIndex
CREATE INDEX "signup_attachments_signup_id_idx" ON "signup_attachments"("signup_id");

-- CreateIndex
CREATE INDEX "checkin_sessions_activity_id_idx" ON "checkin_sessions"("activity_id");

-- CreateIndex
CREATE INDEX "checkin_sessions_status_idx" ON "checkin_sessions"("status");

-- CreateIndex
CREATE INDEX "checkin_sessions_created_by_idx" ON "checkin_sessions"("created_by");

-- CreateIndex
CREATE INDEX "checkin_records_activity_id_idx" ON "checkin_records"("activity_id");

-- CreateIndex
CREATE INDEX "checkin_records_user_id_idx" ON "checkin_records"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "checkin_records_session_id_user_id_key" ON "checkin_records"("session_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "closure_applications_activity_id_key" ON "closure_applications"("activity_id");

-- CreateIndex
CREATE INDEX "closure_applications_applicant_id_idx" ON "closure_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "closure_applications_status_idx" ON "closure_applications"("status");

-- CreateIndex
CREATE INDEX "closure_attachments_closure_application_id_idx" ON "closure_attachments"("closure_application_id");

-- CreateIndex
CREATE INDEX "closure_review_records_closure_application_id_idx" ON "closure_review_records"("closure_application_id");

-- CreateIndex
CREATE INDEX "closure_review_records_reviewer_id_idx" ON "closure_review_records"("reviewer_id");

-- CreateIndex
CREATE INDEX "closure_review_records_reviewer_organization_id_idx" ON "closure_review_records"("reviewer_organization_id");

-- CreateIndex
CREATE INDEX "role_applications_applicant_id_idx" ON "role_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "role_applications_target_role_code_idx" ON "role_applications"("target_role_code");

-- CreateIndex
CREATE INDEX "role_applications_organization_id_idx" ON "role_applications"("organization_id");

-- CreateIndex
CREATE INDEX "role_applications_status_idx" ON "role_applications"("status");

-- CreateIndex
CREATE INDEX "role_applications_reviewed_by_idx" ON "role_applications"("reviewed_by");

-- CreateIndex
CREATE INDEX "pending_tasks_assignee_id_idx" ON "pending_tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "pending_tasks_task_type_idx" ON "pending_tasks"("task_type");

-- CreateIndex
CREATE INDEX "pending_tasks_status_idx" ON "pending_tasks"("status");

-- CreateIndex
CREATE INDEX "pending_tasks_created_by_idx" ON "pending_tasks"("created_by");

-- CreateIndex
CREATE INDEX "announcements_activity_id_idx" ON "announcements"("activity_id");

-- CreateIndex
CREATE INDEX "announcements_publisher_id_idx" ON "announcements"("publisher_id");

-- CreateIndex
CREATE INDEX "announcements_status_idx" ON "announcements"("status");

-- CreateIndex
CREATE INDEX "announcements_published_at_idx" ON "announcements"("published_at");

-- CreateIndex
CREATE INDEX "notifications_target_type_idx" ON "notifications"("target_type");

-- CreateIndex
CREATE INDEX "notifications_target_value_idx" ON "notifications"("target_value");

-- CreateIndex
CREATE INDEX "notifications_source_type_idx" ON "notifications"("source_type");

-- CreateIndex
CREATE INDEX "notifications_source_id_idx" ON "notifications"("source_id");

-- CreateIndex
CREATE INDEX "notifications_created_by_idx" ON "notifications"("created_by");

-- CreateIndex
CREATE INDEX "notification_receipts_user_id_idx" ON "notification_receipts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_receipts_notification_id_user_id_key" ON "notification_receipts"("notification_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_user_type_idx" ON "users"("user_type");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_org_id_fkey" FOREIGN KEY ("parent_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_applications" ADD CONSTRAINT "activity_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_applications" ADD CONSTRAINT "activity_applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_applications" ADD CONSTRAINT "activity_applications_current_reviewer_id_fkey" FOREIGN KEY ("current_reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_attachments" ADD CONSTRAINT "application_attachments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "activity_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_records" ADD CONSTRAINT "approval_records_activity_application_id_fkey" FOREIGN KEY ("activity_application_id") REFERENCES "activity_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_records" ADD CONSTRAINT "approval_records_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_records" ADD CONSTRAINT "approval_records_reviewer_organization_id_fkey" FOREIGN KEY ("reviewer_organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "activity_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitments" ADD CONSTRAINT "recruitments_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_allowed_majors" ADD CONSTRAINT "recruitment_allowed_majors_recruitment_id_fkey" FOREIGN KEY ("recruitment_id") REFERENCES "recruitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_signups" ADD CONSTRAINT "recruitment_signups_recruitment_id_fkey" FOREIGN KEY ("recruitment_id") REFERENCES "recruitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_signups" ADD CONSTRAINT "recruitment_signups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_signups" ADD CONSTRAINT "recruitment_signups_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signup_attachments" ADD CONSTRAINT "signup_attachments_signup_id_fkey" FOREIGN KEY ("signup_id") REFERENCES "recruitment_signups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_sessions" ADD CONSTRAINT "checkin_sessions_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_sessions" ADD CONSTRAINT "checkin_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_records" ADD CONSTRAINT "checkin_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "checkin_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_records" ADD CONSTRAINT "checkin_records_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_records" ADD CONSTRAINT "checkin_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closure_applications" ADD CONSTRAINT "closure_applications_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closure_applications" ADD CONSTRAINT "closure_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closure_attachments" ADD CONSTRAINT "closure_attachments_closure_application_id_fkey" FOREIGN KEY ("closure_application_id") REFERENCES "closure_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closure_review_records" ADD CONSTRAINT "closure_review_records_closure_application_id_fkey" FOREIGN KEY ("closure_application_id") REFERENCES "closure_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closure_review_records" ADD CONSTRAINT "closure_review_records_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closure_review_records" ADD CONSTRAINT "closure_review_records_reviewer_organization_id_fkey" FOREIGN KEY ("reviewer_organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_applications" ADD CONSTRAINT "role_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_applications" ADD CONSTRAINT "role_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_applications" ADD CONSTRAINT "role_applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_tasks" ADD CONSTRAINT "pending_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_tasks" ADD CONSTRAINT "pending_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_receipts" ADD CONSTRAINT "notification_receipts_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_receipts" ADD CONSTRAINT "notification_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
