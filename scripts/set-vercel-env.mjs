// scripts/set-vercel-env.mjs
// Sets DATABASE_URL cleanly on Vercel using REST API

const TOKEN = process.env.VERCEL_TOKEN || '';
const PROJECT_SLUG = process.env.VERCEL_PROJECT_SLUG || 'outsyd';

// Read pooler URL from environment variable
const DB_URL = process.env.DATABASE_URL || '';
const NEXTAUTH_URL = 'https://outsyd-three.vercel.app';

async function run() {
  // First get project ID
  const projRes = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_SLUG}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const proj = await projRes.json();
  if (!proj.id) {
    console.error('Could not find project:', JSON.stringify(proj));
    process.exit(1);
  }
  const projectId = proj.id;
  console.log('Project ID:', projectId);

  const vars = [
    { key: 'DATABASE_URL', value: DB_URL },
    { key: 'NEXTAUTH_URL', value: NEXTAUTH_URL },
  ];

  for (const { key, value } of vars) {
    // Delete existing first
    const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const { envs } = await listRes.json();
    const existing = (envs || []).find(e => e.key === key && e.target?.includes('production'));
    if (existing) {
      const delRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      console.log(`Deleted existing ${key}:`, delRes.status);
    }

    // Add new
    const addRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        value,
        type: 'encrypted',
        target: ['production'],
      }),
    });
    const result = await addRes.json();
    if (result.key) {
      console.log(`✅ Set ${key} → ${key === 'DATABASE_URL' ? '[redacted]' : value}`);
    } else {
      console.error(`❌ Failed to set ${key}:`, JSON.stringify(result));
    }
  }
}

run().catch(console.error);
