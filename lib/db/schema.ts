// lib/db/schema.ts — Drizzle ORM schema (PostgreSQL / Supabase)
import {
  pgTable, text, integer, doublePrecision, boolean, timestamp, uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id           : text('id').primaryKey(),
  email        : text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  name         : text('name'),
  image        : text('image'),
  passwordHash : text('password_hash'),
  role         : text('role').default('registered').notNull(), // 'guest' | 'registered' | 'admin'
  createdAt    : timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt    : timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Auth.js v5 required adapter tables
export const accounts = pgTable('accounts', {
  userId           : text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type             : text('type').notNull(),
  provider         : text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token    : text('refresh_token'),
  access_token     : text('access_token'),
  expires_at       : integer('expires_at'),
  token_type       : text('token_type'),
  scope            : text('scope'),
  id_token         : text('id_token'),
  session_state    : text('session_state'),
});

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId      : text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires     : timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token     : text('token').notNull(),
  expires   : timestamp('expires', { withTimezone: true }).notNull(),
});

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projects = pgTable('projects', {
  id        : text('id').primaryKey(),
  userId    : text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  guestToken: text('guest_token'),
  name      : text('name').notNull().default('Untitled Project'),
  createdAt : timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt : timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Building Inputs ──────────────────────────────────────────────────────────
export const buildingInputs = pgTable('building_inputs', {
  id               : text('id').primaryKey(),
  projectId        : text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  lengthFt         : doublePrecision('length_ft').notNull(),
  breadthFt        : doublePrecision('breadth_ft').notNull(),
  heightFt         : doublePrecision('height_ft').notNull(),
  plotAreaSqft     : doublePrecision('plot_area_sqft').notNull(),
  numFloors        : integer('num_floors').notNull(),
  typology         : text('typology').notNull(),
  buildingUse      : text('building_use').notNull(),
  soilType         : text('soil_type').notNull(),
  locationRegion   : text('location_region').notNull(),
  qualityTier      : text('quality_tier').notNull(),
  structuralSystem : text('structural_system').default('Not_sure'),
  foundationType   : text('foundation_type').default('Not_sure'),
  numLifts         : integer('num_lifts').default(0),
  numStaircases    : integer('num_staircases').default(1),
  parkingLevels    : integer('parking_levels').default(0),
  unitsPerFloor    : integer('units_per_floor'),
  seismicZone      : text('seismic_zone').default('Not_sure'),
  soilBearingCapacity: doublePrecision('soil_bearing_capacity'),
  windLoadZone     : text('wind_zone').default('Not_sure'),
  serviceFloors    : integer('service_floors').default(0),
  podiumLevels     : integer('podium_levels').default(0),
  facadeType       : text('facade_type').default('Not_sure'),
  fireHvacScope    : text('hvac_scope').default('Not_sure'),
  structuralDrawingUrl: text('structural_drawing_url'),
  targetTimelineMonths: integer('target_timeline_months'),
  greenCertTarget  : text('green_cert_target'),
  localRateOverrides: text('local_rate_overrides'), // JSON string
  classificationTier: text('classification_tier'),
  buildingCategory : text('building_category'),
  computedBuaSqft  : doublePrecision('computed_bua_sqft'),
  submittedAt      : timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Coefficient Datasets (IMMUTABLE) ─────────────────────────────────────────
export const coefficientDatasets = pgTable('coefficient_datasets', {
  version    : text('version').primaryKey(),
  description: text('description'),
  publishedBy: text('published_by'),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  isActive   : boolean('is_active').default(true).notNull(),
  ratesJson  : text('rates_json').notNull(), // JSON string
});

// ─── Regional Rate Index ──────────────────────────────────────────────────────
export const regionalRateIndex = pgTable('regional_rate_index', {
  id           : text('id').primaryKey(),
  regionName   : text('region_name').notNull(),
  regionCode   : text('region_code'),
  indexValue   : doublePrecision('index_value').notNull().default(1.0),
  effectiveDate: text('effective_date').notNull(),
  updatedBy    : text('updated_by'),
  notes        : text('notes'),
});

// ─── Estimates ────────────────────────────────────────────────────────────────
export const estimates = pgTable('estimates', {
  id                       : text('id').primaryKey(),
  projectId                : text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  buildingInputId          : text('building_input_id').references(() => buildingInputs.id).notNull(),
  coefficientDatasetVersion: text('coefficient_dataset_version').references(() => coefficientDatasets.version).notNull(),
  accuracyBand             : text('accuracy_band').notNull(),
  classificationTier       : text('classification_tier').notNull(),
  buildingCategory         : text('building_category').notNull(),
  classificationReasons    : text('classification_reasons'), // JSON array
  plinthAreaEstimate       : doublePrecision('plinth_area_estimate'),
  cubicContentEstimate     : doublePrecision('cubic_content_estimate'),
  grandTotalMaterialCost   : doublePrecision('grand_total_material_cost').notNull(),
  grandTotalWithLabor      : doublePrecision('grand_total_with_labor'),
  regionalIndexApplied     : doublePrecision('regional_index_applied').default(1.0),
  resultJson               : text('result_json').notNull(), // JSON string
  createdAt                : timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reports = pgTable('reports', {
  id         : text('id').primaryKey(),
  estimateId : text('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }).notNull(),
  fileUrl    : text('file_url'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt  : timestamp('expires_at', { withTimezone: true }),
});
