import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Enums
export type AppRole = "admin" | "moderator" | "user";
export type ApplicationStatus = "new" | "reviewing" | "shortlisted" | "rejected" | "hired";

export const adminNotifications = sqliteTable('admin_notifications', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  metadata: text('metadata', { mode: 'json' }),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const applicantAccessTokens = sqliteTable('applicant_access_tokens', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  applicationId: text('application_id').notNull(), // FK to applications
  tokenHash: text('token_hash').notNull(),
  usedAt: text('used_at'),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const applicationProjects = sqliteTable('application_projects', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  applicationId: text('application_id').notNull(), // FK to applications
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  projectUrl: text('project_url'),
  documentPath: text('document_path'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const applicationStatusEvents = sqliteTable('application_status_events', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  applicationId: text('application_id').notNull(), // FK to applications
  fromStatus: text('from_status').$type<ApplicationStatus>(),
  toStatus: text('to_status').notNull().$type<ApplicationStatus>(),
  note: text('note').notNull(),
  changedBy: text('changed_by'), // FK to users
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const applications = sqliteTable('applications', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  jobPostingId: text('job_posting_id'), // FK to job_postings
  roleApplied: text('role_applied').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  college: text('college'),
  graduationYear: integer('graduation_year'),
  company: text('company'),
  position: text('position'),
  yearsExperience: text('years_experience'),
  state: text('state'),
  linkedinUrl: text('linkedin_url'),
  portfolioUrl: text('portfolio_url'),
  message: text('message'),
  availability: text('availability'),
  resumePath: text('resume_path'),
  agreementAccepted: integer('agreement_accepted', { mode: 'boolean' }).notNull(),
  agreementVersion: text('agreement_version').notNull(),
  status: text('status').notNull().default('new').$type<ApplicationStatus>(),
  adminNotes: text('admin_notes'),
  interviewQuestions: text('interview_questions'),
  interviewQuestionsGeneratedAt: text('interview_questions_generated_at'),
  hodName: text('hod_name'),
  hodEmail: text('hod_email'),
  hodContact: text('hod_contact'),
  tpOfficerName: text('tp_officer_name'),
  tpOfficerEmail: text('tp_officer_email'),
  tpOfficerContact: text('tp_officer_contact'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const jobPostings = sqliteTable('job_postings', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  department: text('department').notNull(),
  location: text('location').notNull(),
  type: text('type').notNull(),
  description: text('description').notNull(),
  requirements: text('requirements'),
  salaryRange: text('salary_range'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdBy: text('created_by'), // FK to users
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const siteSettings = sqliteTable('site_settings', {
  key: text('key').primaryKey().notNull(),
  value: text('value', { mode: 'json' }).notNull(),
  updatedBy: text('updated_by'), // FK to users
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const statusEmailTemplates = sqliteTable('status_email_templates', {
  status: text('status').primaryKey().notNull().$type<ApplicationStatus>(),
  subject: text('subject').notNull(),
  htmlBody: text('html_body').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  updatedBy: text('updated_by'), // FK to users
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const userRoles = sqliteTable('user_roles', {
  id: text('id').primaryKey().notNull().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  role: text('role').notNull().$type<AppRole>(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const visitorCounts = sqliteTable('visitor_counts', {
  pageKey: text('page_key').primaryKey().notNull(),
  count: integer('count').notNull().default(0),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
