// scripts/setup-supabase.ts
// Run this ONCE to create all tables and seed data in Supabase
// Usage: cmd /c "npx tsx scripts/setup-supabase.ts"

import { Pool } from 'pg';
import { DEFAULT_DATASET, REGIONAL_RATE_INDEX } from '../lib/engine/coefficients';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || '',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  email_verified TIMESTAMPTZ,
  name TEXT,
  image TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'registered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  session_token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  guest_token TEXT,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS building_inputs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  length_ft DOUBLE PRECISION NOT NULL,
  breadth_ft DOUBLE PRECISION NOT NULL,
  height_ft DOUBLE PRECISION NOT NULL,
  plot_area_sqft DOUBLE PRECISION NOT NULL,
  num_floors INTEGER NOT NULL,
  typology TEXT NOT NULL,
  building_use TEXT NOT NULL,
  soil_type TEXT NOT NULL,
  location_region TEXT NOT NULL,
  quality_tier TEXT NOT NULL,
  structural_system TEXT DEFAULT 'Not_sure',
  foundation_type TEXT DEFAULT 'Not_sure',
  num_lifts INTEGER DEFAULT 0,
  num_staircases INTEGER DEFAULT 1,
  parking_levels INTEGER DEFAULT 0,
  units_per_floor INTEGER,
  seismic_zone TEXT DEFAULT 'Not_sure',
  soil_bearing_capacity DOUBLE PRECISION,
  wind_zone TEXT DEFAULT 'Not_sure',
  service_floors INTEGER DEFAULT 0,
  podium_levels INTEGER DEFAULT 0,
  facade_type TEXT DEFAULT 'Not_sure',
  hvac_scope TEXT DEFAULT 'Not_sure',
  structural_drawing_url TEXT,
  target_timeline_months INTEGER,
  green_cert_target TEXT,
  local_rate_overrides TEXT,
  classification_tier TEXT,
  building_category TEXT,
  computed_bua_sqft DOUBLE PRECISION,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coefficient_datasets (
  version TEXT PRIMARY KEY,
  description TEXT,
  published_by TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  rates_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS regional_rate_index (
  id TEXT PRIMARY KEY,
  region_name TEXT NOT NULL,
  region_code TEXT,
  index_value DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  effective_date TEXT NOT NULL,
  updated_by TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS estimates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  building_input_id TEXT NOT NULL REFERENCES building_inputs(id),
  coefficient_dataset_version TEXT NOT NULL REFERENCES coefficient_datasets(version),
  accuracy_band TEXT NOT NULL,
  classification_tier TEXT NOT NULL,
  building_category TEXT NOT NULL,
  classification_reasons TEXT,
  plinth_area_estimate DOUBLE PRECISION,
  cubic_content_estimate DOUBLE PRECISION,
  grand_total_material_cost DOUBLE PRECISION NOT NULL,
  grand_total_with_labor DOUBLE PRECISION,
  regional_index_applied DOUBLE PRECISION DEFAULT 1.0,
  result_json TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  estimate_id TEXT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  file_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
`;

async function main() {
  const client = await pool.connect();
  try {
    console.log('🔗 Connected to Supabase PostgreSQL');

    // Create tables
    console.log('📋 Creating tables...');
    await client.query(CREATE_TABLES);
    console.log('✅ Tables created');

    // Seed coefficient_datasets
    console.log('🌱 Seeding coefficient_datasets...');
    await client.query(
      `INSERT INTO coefficient_datasets (version, description, published_by, is_active, rates_json)
       VALUES ($1, $2, $3, TRUE, $4)
       ON CONFLICT (version) DO NOTHING`,
      [
        DEFAULT_DATASET.version,
        'Initial research-validated dataset. Sources: CPWD DSR 2024, market survey Sept 2026.',
        'OUTSYD',
        JSON.stringify(DEFAULT_DATASET),
      ]
    );
    console.log('✅ Coefficient dataset seeded');

    // Seed regional_rate_index
    console.log('🌱 Seeding regional_rate_index...');
    let regionCount = 0;
    for (const [region, index] of Object.entries(REGIONAL_RATE_INDEX)) {
      if (region === 'default') continue;
      const id = `region-${region.replace(/\s+/g, '-')}`;
      await client.query(
        `INSERT INTO regional_rate_index (id, region_name, index_value, effective_date, notes)
         VALUES ($1, $2, $3, '2026-09-01', 'Initial seed')
         ON CONFLICT (id) DO NOTHING`,
        [id, region, index]
      );
      regionCount++;
    }
    console.log(`✅ ${regionCount} regions seeded`);

    console.log('\n🎉 Supabase setup complete! All tables created and seeded.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
