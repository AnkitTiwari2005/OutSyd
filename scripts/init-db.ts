// scripts/init-db.ts — Creates all SQLite tables directly (no TTY needed)
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'outsyd.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  email_verified TEXT,
  name TEXT,
  image TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'registered',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  expires TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  guest_token TEXT,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS building_inputs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  length_ft REAL NOT NULL,
  breadth_ft REAL NOT NULL,
  height_ft REAL NOT NULL,
  plot_area_sqft REAL NOT NULL,
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
  soil_bearing_capacity REAL,
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
  computed_bua_sqft REAL,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coefficient_datasets (
  version TEXT PRIMARY KEY,
  description TEXT,
  published_by TEXT,
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_active INTEGER NOT NULL DEFAULT 1,
  rates_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS regional_rate_index (
  id TEXT PRIMARY KEY,
  region_name TEXT NOT NULL,
  region_code TEXT,
  index_value REAL NOT NULL DEFAULT 1.0,
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
  plinth_area_estimate REAL,
  cubic_content_estimate REAL,
  grand_total_material_cost REAL NOT NULL,
  grand_total_with_labor REAL,
  regional_index_applied REAL DEFAULT 1.0,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  estimate_id TEXT NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  file_url TEXT,
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT
);
`;

sqlite.exec(CREATE_TABLES);
console.log('✓ All tables created in', dbPath);

// Seed coefficient dataset
import('../lib/engine/coefficients').then(({ DEFAULT_DATASET, REGIONAL_RATE_INDEX }) => {
  // Insert default coefficient dataset
  const insertDataset = sqlite.prepare(`
    INSERT OR IGNORE INTO coefficient_datasets (version, description, published_at, is_active, rates_json)
    VALUES (?, ?, datetime('now'), 1, ?)
  `);
  insertDataset.run(
    DEFAULT_DATASET.version,
    'Initial research-validated dataset. Sources: CPWD DSR 2024, market survey Sept 2026.',
    JSON.stringify(DEFAULT_DATASET),
  );
  console.log('✓ Coefficient dataset seeded:', DEFAULT_DATASET.version);

  // Insert regional rate index
  const insertRegion = sqlite.prepare(`
    INSERT OR IGNORE INTO regional_rate_index (id, region_name, index_value, effective_date, notes)
    VALUES (?, ?, ?, '2026-09-01', 'Initial seed')
  `);
  let count = 0;
  for (const [region, index] of Object.entries(REGIONAL_RATE_INDEX)) {
    if (region === 'default') continue;
    insertRegion.run(`region-${region.replace(/\s+/g, '-')}`, region, index);
    count++;
  }
  console.log(`✓ ${count} regional rate entries seeded`);
  console.log('\n✅ Database ready! Run: npm run dev');
  process.exit(0);
});
