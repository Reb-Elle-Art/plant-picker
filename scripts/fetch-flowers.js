#!/usr/bin/env node
/**
 * fetch-flowers.js
 * Pulls flower data from Trefle and Permapeople APIs,
 * merges and deduplicates, writes to data/flowers.json
 *
 * Usage:
 *   node scripts/fetch-flowers.js          # dry run (no API calls)
 *   PERMAPEOPLE_TOKEN=xxx TREFLE_TOKEN=xxx node scripts/fetch-flowers.js
 *
 * Tokens:
 *   Permapeople: https://permapeople.org — sign up, create API key under My API keys
 *   Trefle: https://trefle.io — sign up, grab free token
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUT_FILE = path.join(DATA_DIR, 'flowers.json');

const PERMAPEOPLE_KEY_ID     = process.env.PERMAPEOPLE_KEY_ID || '';
const PERMAPEOPLE_KEY_SECRET = process.env.PERMAPEOPLE_KEY_SECRET || '';
const TREFLE_TOKEN           = process.env.TREFLE_TOKEN || '';

// ─── Trefle ────────────────────────────────────────────────

async function fetchFromTrefle(token) {
  console.log('[Trefle] Fetching ornamental flowers...');
  // Trefle plant fields we care about
  const fields = [
    'id', 'common_name', 'scientific_name', 'family',
    'flower_color', 'bloom_months', 'duration',
    'sun_requirements', 'watering', 'soil_depth',
    'ph_minimum', 'ph_maximum', 'minimum_temperature',
    'hardiness_zone', 'height', 'spread',
    'edible', 'image_url', 'links'
  ].join(',');

  // Search for ornamental/fantasy flowers — broad set to start
  const queries = ['flower', 'perennial flower', 'annual flower', 'ornamental'];
  const allPlants = [];

  for (const q of queries) {
    try {
      const url = `https://trefle.io/api/v1/plants/search?q=${encodeURIComponent(q)}&token=${token}&fields=${fields}&filter[not_null][common_name]=true`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[Trefle] Query "${q}" failed: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const plants = data.data || [];
      console.log(`[Trefle] "${q}" → ${plants.length} results`);
      allPlants.push(...plants);
    } catch (err) {
      console.warn(`[Trefle] Query "${q}" error: ${err.message}`);
    }
    // Be nice to free tier
    await sleep(500);
  }

  // Dedupe by scientific name
  const seen = new Set();
  const unique = allPlants.filter(p => {
    if (!p.scientific_name || seen.has(p.scientific_name)) return false;
    seen.add(p.scientific_name);
    return true;
  });

  return unique.map(p => normalizeTrefle(p));
}

function normalizeTrefle(p) {
  return {
    id: `trefle-${p.id}`,
    source: 'trefle',
    scientific_name: p.scientific_name || '',
    common_name: p.common_name || '',
    bloom_season: (p.bloom_months || []).map(m => monthToSeason(m)),
    flower_color: (p.flower_color || []).map(c => c.toLowerCase()),
    sun_needs: normalizeSun(p.sun_requirements),
    water_needs: normalizeWater(p.watering),
    soil_type: p.soil_type || '',
    hardiness_zones: (p.hardiness_zone || []).map(z => String(z)),
    duration: (p.duration || [])[0] || null,
    height_inches: p.height?.cm ? Math.round(p.height.cm / 2.54) : null,
    spread_inches: p.spread?.cm ? Math.round(p.spread.cm / 2.54) : null,
    deer_resistant: false,
    pollinator_friendly: true,
    image_url: p.image_url || '',
    notes: ''
  };
}

// ─── Permapeople ────────────────────────────────────────────

async function fetchFromPermapeople() {
  console.log('[Permapeople] Fetching all plants (cursor pagination)...');
  const allPlants = [];
  let lastId = null;
  let hasMore = true;
  let page = 0;
  const maxPages = 20; // safety cap (~2000 plants — plenty for ornamental filtering)

  while (hasMore && page < maxPages) {
    page++;
    try {
      const url = lastId
        ? `https://permapeople.org/api/plants?per_page=100&last_id=${lastId}`
        : `https://permapeople.org/api/plants?per_page=100`;
      const res = await fetch(url, {
        headers: {
          'x-permapeople-key-id': PERMAPEOPLE_KEY_ID,
          'x-permapeople-key-secret': PERMAPEOPLE_KEY_SECRET
        }
      });
      if (!res.ok) {
        if (res.status === 401) { console.error('[Permapeople] Invalid token'); return []; }
        console.warn(`[Permapeople] page ${page} → ${res.status}`);
        break;
      }
      const data = await res.json();
      const plants = data.plants || [];
      if (!plants.length) break;
      allPlants.push(...plants);
      hasMore = data.pagination?.has_more;
      lastId = data.pagination?.last_id;
      console.log(`[Permapeople] page ${page} → ${plants.length} (total: ${allPlants.length})`);
      if (plants.length < 100) break;
      await sleep(300);
    } catch (err) {
      console.warn(`[Permapeople] page ${page} err: ${err.message}`);
      break;
    }
  }
  console.log(`[Permapeople] Total: ${allPlants.length} plants fetched`);
  return allPlants.map(p => normalizePermapeople(p));
}

function normalizePermapeople(p) {
  const rawData = (p.data || []).reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  return {
    id: `permapeople-${p.id}`,
    source: 'permapeople',
    scientific_name: p.scientific_name || '',
    common_name: p.name || '',
    bloom_season: parseBloomSeason(rawData['Blooming season'] || rawData['Bloom season'] || ''),
    flower_color: parseColors(rawData['Flower colour'] || rawData['Flower color'] || ''),
    sun_needs: normalizeSun(rawData['Sun requirement'] || rawData['Light'] || ''),
    water_needs: normalizeWater(rawData['Water requirement'] || ''),
    soil_type: rawData['Soil type'] || '',
    hardiness_zones: parseZones(rawData['USDA Hardiness zone'] || rawData['Hardiness zones'] || ''),
    duration: normalizeDuration(rawData['Duration'] || ''),
    height_inches: parseHeight(rawData['Height'] || ''),
    spread_inches: null,
    deer_resistant: rawData['Deer resistant'] === 'true',
    pollinator_friendly: rawData['Pollinator'] === 'true',
    image_url: p.images?.thumb || '',
    notes: p.description || ''
  };
}

// ─── Merge & dedupe ─────────────────────────────────────────

function mergeFlowers(trefleData, permapeopleData) {
  // Combine, dedupe by scientific name (case-insensitive)
  const combined = [...permapeopleData, ...trefleData];
  const seen = new Map();

  combined.forEach(f => {
    const key = f.scientific_name.toLowerCase().trim();
    if (!key) return;
    if (!seen.has(key)) {
      seen.set(key, f);
    } else {
      // Merge: prefer entries with more fields filled in
      const existing = seen.get(key);
      seen.set(key, fillGaps(existing, f));
    }
  });

  // Filter to ornamental flowers (remove trees, shrubs, vegetables unless they have flowers)
  const all = Array.from(seen.values());
  return all;
}

function fillGaps(a, b) {
  // Prefer the entry with more data
  const merged = { ...a };
  Object.keys(b).forEach(k => {
    if (!merged[k] || merged[k] === '' || merged[k] === null || merged[k] === undefined) {
      merged[k] = b[k];
    }
  });
  return merged;
}

// ─── Output ────────────────────────────────────────────────

function writeFlowers(flowers) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(flowers, null, 2));
  console.log(`[Output] Wrote ${flowers.length} flowers to ${OUT_FILE}`);
}

// ─── Helpers ───────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function monthToSeason(monthStr) {
  const month = String(monthStr).toLowerCase();
  const spring = ['march', 'april', 'may'];
  const summer = ['june', 'july', 'august'];
  const fall = ['september', 'october', 'november'];
  const seasons = [];
  if (spring.some(m => month.includes(m))) seasons.push('spring');
  if (summer.some(m => month.includes(m))) seasons.push('summer');
  if (fall.some(m => month.includes(m))) seasons.push('fall');
  return seasons.length ? seasons : ['summer'];
}

function normalizeSun(val) {
  if (!val) return null;
  const v = String(val).toLowerCase();
  if (v.includes('full sun') || v === '10' || v.includes('full_sun')) return 'full_sun';
  if (v.includes('partial') || v.includes('part')) return 'part_shade';
  if (v.includes('shade') || v.includes('full shade')) return 'full_shade';
  if (v.includes('any') || v.includes('半')) return 'part_shade';
  return null;
}

function normalizeWater(val) {
  if (!val) return null;
  const v = String(val).toLowerCase();
  if (v.includes('low') || v.includes('dry') || v.includes('minimum')) return 'low';
  if (v.includes('medium') || v.includes('moderate')) return 'medium';
  if (v.includes('high') || v.includes('wet') || v.includes('abundant')) return 'high';
  return null;
}

function normalizeDuration(val) {
  if (!val) return null;
  const v = String(val).toLowerCase();
  if (v.includes('annual')) return 'annual';
  if (v.includes('biennial')) return 'biennial';
  if (v.includes('perennial') || v.includes('rhizome') || v.includes('shrub')) return 'perennial';
  return null;
}

function parseBloomSeason(val) {
  if (!val) return [];
  const v = String(val).toLowerCase();
  const seasons = [];
  if (v.includes('spring') || v.includes('mar') || v.includes('apr') || v.includes('may')) seasons.push('spring');
  if (v.includes('summer') || v.includes('jun') || v.includes('jul') || v.includes('aug')) seasons.push('summer');
  if (v.includes('fall') || v.includes('autumn') || v.includes('sep') || v.includes('oct') || v.includes('nov')) seasons.push('fall');
  return seasons.length ? seasons : [];
}

function parseColors(val) {
  if (!val) return [];
  return String(val).split(/[,\/]/).map(c => c.trim().toLowerCase()).filter(Boolean);
}

function parseZones(val) {
  if (!val) return [];
  return String(val).split(/[,;/-]/).map(z => z.trim()).filter(Boolean);
}

function parseHeight(val) {
  if (!val) return null;
  const match = String(val).match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  const hasPermapeople = PERMAPEOPLE_KEY_ID.length > 0 && PERMAPEOPLE_KEY_SECRET.length > 0;
  const hasTrefle = TREFLE_TOKEN.length > 0;

  if (!hasPermapeople && !hasTrefle) {
    console.log('No API tokens provided — checking for existing data...');
    if (fs.existsSync(OUT_FILE)) {
      const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
      console.log(`Found ${existing.length} flowers in ${OUT_FILE}`);
      console.log('To refresh, set PERMAPEOPLE_KEY_ID + PERMAPEOPLE_KEY_SECRET and/or TREFLE_TOKEN');
    } else {
      console.log(`No data file at ${OUT_FILE}`);
      console.log('Set env vars and run again to fetch fresh data.');
    }
    return;
  }

  const [trefleData, permapeopleData] = await Promise.all([
    hasTrefle ? fetchFromTrefle(TREFLE_TOKEN) : Promise.resolve([]),
    hasPermapeople ? fetchFromPermapeople() : Promise.resolve([])
  ]);

  const merged = mergeFlowers(trefleData, permapeopleData);
  writeFlowers(merged);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
