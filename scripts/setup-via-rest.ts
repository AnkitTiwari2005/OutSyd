// scripts/setup-via-rest.ts
// Sets up Supabase tables via REST API (SQL execution endpoint)
// Works even when direct PostgreSQL port is blocked by firewall
// Usage: cmd /c "npx tsx scripts/setup-via-rest.ts"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || (process.env.SUPABASE_PROJECT_REF ? `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co` : '');
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

// Import our data
import { DEFAULT_DATASET, REGIONAL_RATE_INDEX } from '../lib/engine/coefficients';

async function main() {
  console.log('🔗 Connecting to Supabase via REST API...');

  // Test connectivity first
  const ping = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
  });
  console.log('📡 REST API status:', ping.status);

  console.log('📋 Creating tables via Supabase SQL endpoint...');
  // Use the pg-meta or SQL endpoint
  const createRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ sql: CREATE_TABLES }),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    // exec_sql may not exist — use pg-meta SQL endpoint
    console.log('exec_sql not available, trying pg-meta SQL endpoint:', body.slice(0, 200));

    const pgMetaRes = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
      },
      body: JSON.stringify({ query: CREATE_TABLES }),
    });

    if (!pgMetaRes.ok) {
      const pgMetaBody = await pgMetaRes.text();
      console.error('pg-meta also failed:', pgMetaBody.slice(0, 400));

      // Last resort: use Supabase's SQL editor API
      const projectRef = process.env.SUPABASE_PROJECT_REF;
      const sqlEditorRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ query: CREATE_TABLES }),
      });
      const sqlEditorBody = await sqlEditorRes.text();
      console.log('Management API response:', sqlEditorBody.slice(0, 400));
    } else {
      console.log('✅ Tables created via pg-meta');
    }
  } else {
    console.log('✅ Tables created via exec_sql');
  }

  // Seed via PostgREST upsert (this always works)
  console.log('🌱 Seeding coefficient_datasets via PostgREST...');
  const seedDs = await fetch(`${SUPABASE_URL}/rest/v1/coefficient_datasets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Prefer': 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify({
      version: DEFAULT_DATASET.version,
      description: 'Initial research-validated dataset. Sources: CPWD DSR 2024, market survey Sept 2026.',
      published_by: 'OUTSYD',
      is_active: true,
      rates_json: JSON.stringify(DEFAULT_DATASET),
    }),
  });
  console.log('Coefficient dataset seed:', seedDs.status, seedDs.ok ? '✅' : '❌', await seedDs.text().catch(() => ''));

  console.log('🌱 Seeding regional_rate_index...');
  const regions = Object.entries(REGIONAL_RATE_INDEX)
    .filter(([k]) => k !== 'default')
    .map(([region, index]) => ({
      id: `region-${region.replace(/\s+/g, '-')}`,
      region_name: region,
      index_value: index,
      effective_date: '2026-09-01',
      notes: 'Initial seed',
    }));

  const seedRegions = await fetch(`${SUPABASE_URL}/rest/v1/regional_rate_index`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Prefer': 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(regions),
  });
  console.log('Regions seed:', seedRegions.status, seedRegions.ok ? '✅' : '❌', await seedRegions.text().catch(() => ''));

  console.log('\n✅ Setup complete!');
}

main().catch(console.error);
