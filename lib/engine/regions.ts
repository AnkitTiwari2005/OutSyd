// lib/engine/regions.ts — Regional Rate Index and Seismic Zone Lookup
// Extracted to separate file to prevent client components from bundling coefficients rate cards (U-7)

import type { SeismicZone } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// REGIONAL RATE INDEX — 160+ cities
// Index 1.000 = national average baseline (roughly Tier-2 city mid-market)
// Sources: CPWD Cost Index circulars, NBO price data, JLL/Knight Frank 2024
// ═══════════════════════════════════════════════════════════════════════════════
export const REGIONAL_RATE_INDEX: Record<string, number> = {
  // ── Mega cities (Tier 1) ─────────────────────────────────────────────────
  'mumbai'           : 1.38,
  'navi mumbai'      : 1.33,
  'thane'            : 1.28,
  'delhi'            : 1.27,
  'new delhi'        : 1.27,
  'south delhi'      : 1.30,
  'gurugram'         : 1.26,
  'gurgaon'          : 1.26,
  'noida'            : 1.22,
  'greater noida'    : 1.20,
  'faridabad'        : 1.18,
  'ghaziabad'        : 1.16,
  'bangalore'        : 1.22,
  'bengaluru'        : 1.22,
  'kolkata'          : 1.12,
  'chennai'          : 1.16,
  'hyderabad'        : 1.14,
  'secunderabad'     : 1.12,

  // ── Metro & large cities (Tier 1B / Tier 2A) ─────────────────────────────
  'pune'             : 1.19,
  'pcmc'             : 1.16,
  'pimpri'           : 1.15,
  'chinchwad'        : 1.15,
  'ahmedabad'        : 1.09,
  'gandhinagar'      : 1.07,
  'surat'            : 1.08,
  'vadodara'         : 1.04,
  'rajkot'           : 1.00,
  'jamnagar'         : 0.97,
  'kochi'            : 1.07,
  'ernakulam'        : 1.06,
  'thiruvananthapuram': 1.03,
  'kozhikode'        : 0.99,
  'thrissur'         : 0.98,
  'coimbatore'       : 1.06,
  'madurai'          : 0.97,
  'trichy'           : 0.95,
  'tiruchirappalli'  : 0.95,
  'salem'            : 0.93,
  'tirunelveli'      : 0.92,
  'vellore'          : 0.91,
  'jaipur'           : 0.96,
  'jodhpur'          : 0.90,
  'udaipur'          : 0.91,
  'kota'             : 0.88,
  'ajmer'            : 0.87,
  'nagpur'           : 1.00,
  'nashik'           : 0.96,
  'aurangabad'       : 0.94,
  'solapur'          : 0.90,
  'kolhapur'         : 0.92,
  'sangli'           : 0.88,
  'amravati'         : 0.87,
  'lucknow'          : 0.91,
  'kanpur'           : 0.89,
  'agra'             : 0.88,
  'varanasi'         : 0.87,
  'allahabad'        : 0.85,
  'prayagraj'        : 0.85,
  'meerut'           : 0.88,
  'mathura'          : 0.83,
  'bhopal'           : 0.89,
  'indore'           : 0.93,
  'jabalpur'         : 0.86,
  'gwalior'          : 0.84,
  'raipur'           : 0.87,
  'bhilai'           : 0.85,
  'bilaspur'         : 0.82,
  'patna'            : 0.86,
  'gaya'             : 0.80,
  'muzaffarpur'      : 0.78,
  'ranchi'           : 0.86,
  'jamshedpur'       : 0.88,
  'dhanbad'          : 0.83,
  'bokaro'           : 0.81,
  'bhubaneswar'      : 0.89,
  'cuttack'          : 0.85,
  'rourkela'         : 0.83,
  'guwahati'         : 1.18,   // North-East regional transit premium (CPWD PAR 2023 Table 4.1)
  'dibrugarh'        : 1.14,
  'jorhat'           : 0.85,
  'silchar'          : 0.83,
  'srinagar'         : 0.94,
  'jammu'            : 0.90,
  'chandigarh'       : 1.06,
  'mohali'           : 1.04,
  'panchkula'        : 1.02,
  'amritsar'         : 0.94,
  'ludhiana'         : 0.97,
  'jalandhar'        : 0.92,
  'patiala'          : 0.89,
  'dehradun'         : 0.96,
  'haridwar'         : 0.92,
  'rishikesh'        : 0.90,
  'nainital'         : 0.89,
  'shimla'           : 0.93,
  'manali'           : 0.96,
  'dharamsala'       : 0.91,
  'mysuru'           : 1.12,
  'mysore'           : 1.12,
  'hubli'            : 0.97,
  'dharwad'          : 0.95,
  'mangaluru'        : 1.05,
  'mangalore'        : 1.05,
  'belgaum'          : 0.93,
  'belagavi'         : 0.93,
  'davangere'        : 0.91,
  'bellary'          : 0.88,
  'vijayawada'       : 0.92,
  'visakhapatnam'    : 0.94,
  'vizag'            : 0.94,
  'guntur'           : 0.89,
  'nellore'          : 0.87,
  'kurnool'          : 0.85,
  'warangal'         : 0.88,
  'nizamabad'        : 0.84,
  'karimnagar'       : 0.82,

  // ── Tier 2 & 3 emerging cities ────────────────────────────────────────────
  'tirupati'         : 0.90,
  'pondicherry'      : 0.95,
  'puducherry'       : 0.95,
  'karur'            : 0.88,
  'thanjavur'        : 0.87,
  'erode'            : 0.90,
  'tirupur'          : 0.92,
  'hosur'            : 1.02,
  'shivamogga'       : 0.91,
  'tumakuru'         : 0.93,
  'udupi'            : 0.99,
  'hassan'           : 0.88,
  'chikkamagaluru'   : 0.86,
  'calicut'          : 0.99,
  'palakkad'         : 0.93,
  'alappuzha'        : 0.95,
  'kollam'           : 0.93,
  'kottayam'         : 0.95,
  'thalassery'       : 0.92,
  'kannur'           : 0.93,
  'kasaragod'        : 0.92,
  'leh'              : 1.20,   // remote/high altitude — transport premium
  'gangtok'          : 1.15,
  'shillong'         : 0.96,
  'aizawl'           : 0.98,
  'imphal'           : 0.96,
  'agartala'         : 0.90,
  'itanagar'         : 1.05,
  'kohima'           : 0.98,
  'port blair'       : 1.40,   // island logistics premium
  'silvassa'         : 1.05,
  'daman'            : 1.08,
  'panaji'           : 1.25,
  'goa'              : 1.25,
  'margao'           : 1.20,
  'mapusa'           : 1.18,
  'vasco'            : 1.16,
  'bhilwara'         : 0.86,
  'alwar'            : 0.88,
  'bikaner'          : 0.84,
  'sikar'            : 0.82,
  'sriganganagar'    : 0.81,
  'bharatpur'        : 0.83,
  'chittorgarh'      : 0.82,
  'ratlam'           : 0.84,
  'sagar'            : 0.82,
  'ujjain'           : 0.87,
  'satna'            : 0.80,
  'korba'            : 0.83,
  'durg'             : 0.82,
  'bhavnagar'        : 0.97,
  'anand'            : 1.00,
  'navsari'          : 0.97,
  'morbi'            : 0.95,
  'mehsana'          : 0.97,
  'surendranagar'    : 0.92,
  'bhuj'             : 0.93,
  'amreli'           : 0.90,
  'junagadh'         : 0.92,
  'porbandar'        : 0.90,
  'deesa'            : 0.88,
  'bareilly'         : 0.87,
  'aligarh'          : 0.85,
  'moradabad'        : 0.87,
  'saharanpur'       : 0.85,
  'gorakhpur'        : 0.84,
  'firozabad'        : 0.83,
  'jhansi'           : 0.82,
  'rampur'           : 0.83,
  'shahjahanpur'     : 0.82,
  'muzaffarnagar'    : 0.84,
  'ambala'           : 1.05,
  'panipat'          : 1.05,
  'karnal'           : 1.05,
  'haldwani'         : 1.02,
  'dispur'           : 1.08,
  'tezpur'           : 1.08,
  'dhubri'           : 1.06,
  'diphu'            : 1.06,
  'kargil'           : 1.25,

  // ── Default fallback ──────────────────────────────────────────────────────
  'default'          : 1.00,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEISMIC ZONE LOOKUP — IS 1893:2016 (active Indian standard)
// ═══════════════════════════════════════════════════════════════════════════════
export const SEISMIC_ZONE_LOOKUP: Record<string, string> = {
  // Zone V
  'guwahati': 'Zone_V', 'shillong': 'Zone_V', 'imphal': 'Zone_V',
  'jorhat': 'Zone_V', 'dibrugarh': 'Zone_V', 'bhuj': 'Zone_V',
  'gangtok': 'Zone_V', 'aizawl': 'Zone_V', 'kohima': 'Zone_V',
  'itanagar': 'Zone_V', 'agartala': 'Zone_V', 'silchar': 'Zone_V',
  'tezpur': 'Zone_V', 'port blair': 'Zone_V', 'leh': 'Zone_V',
  'kargil': 'Zone_V', 'dispur': 'Zone_V', 'dhubri': 'Zone_V',
  'diphu': 'Zone_V', 'srinagar': 'Zone_V',
  // Zone IV
  'delhi': 'Zone_IV', 'new delhi': 'Zone_IV', 'noida': 'Zone_IV',
  'gurugram': 'Zone_IV', 'gurgaon': 'Zone_IV', 'faridabad': 'Zone_IV',
  'ghaziabad': 'Zone_IV', 'greater noida': 'Zone_IV', 'patna': 'Zone_IV',
  'dehradun': 'Zone_IV', 'chandigarh': 'Zone_IV', 'amritsar': 'Zone_IV',
  'ludhiana': 'Zone_IV', 'shimla': 'Zone_IV', 'jammu': 'Zone_IV',
  'haridwar': 'Zone_IV', 'rishikesh': 'Zone_IV', 'meerut': 'Zone_IV',
  'muzaffarnagar': 'Zone_IV', 'saharanpur': 'Zone_IV', 'moradabad': 'Zone_IV',
  'rampur': 'Zone_IV', 'bareilly': 'Zone_IV', 'manali': 'Zone_IV',
  'dharamsala': 'Zone_IV', 'jalandhar': 'Zone_IV', 'patiala': 'Zone_IV',
  'mohali': 'Zone_IV', 'panchkula': 'Zone_IV', 'ambala': 'Zone_IV',
  'panipat': 'Zone_IV', 'karnal': 'Zone_IV', 'nainital': 'Zone_IV',
  'haldwani': 'Zone_IV',
  // Zone III
  'mumbai': 'Zone_III', 'navi mumbai': 'Zone_III', 'thane': 'Zone_III',
  'pune': 'Zone_III', 'kolkata': 'Zone_III', 'chennai': 'Zone_III',
  'ahmedabad': 'Zone_III', 'lucknow': 'Zone_III', 'kanpur': 'Zone_III',
  'kochi': 'Zone_III', 'bhubaneswar': 'Zone_III', 'agra': 'Zone_III',
  'varanasi': 'Zone_III', 'coimbatore': 'Zone_III', 'allahabad': 'Zone_III',
  'prayagraj': 'Zone_III', 'jaipur': 'Zone_III', 'ajmer': 'Zone_III',
  'bhopal': 'Zone_III', 'ujjain': 'Zone_III', 'jabalpur': 'Zone_III',
  'raipur': 'Zone_III', 'ranchi': 'Zone_III', 'jamshedpur': 'Zone_III',
  'vadodara': 'Zone_III', 'rajkot': 'Zone_III', 'panaji': 'Zone_III',
  'goa': 'Zone_III', 'mangaluru': 'Zone_III', 'mangalore': 'Zone_III',
  'surat': 'Zone_III', 'thiruvananthapuram': 'Zone_III', 'kozhikode': 'Zone_III',
  'aligarh': 'Zone_III', 'mathura': 'Zone_III', 'firozabad': 'Zone_III',
  'gorakhpur': 'Zone_III', 'jhansi': 'Zone_III',
  // Zone II
  'bangalore': 'Zone_II', 'bengaluru': 'Zone_II', 'hyderabad': 'Zone_II',
  'secunderabad': 'Zone_II', 'nagpur': 'Zone_II', 'jodhpur': 'Zone_II',
  'indore': 'Zone_II', 'visakhapatnam': 'Zone_II', 'vijayawada': 'Zone_II',
  'mysuru': 'Zone_II', 'mysore': 'Zone_II', 'hubli': 'Zone_II',
  'belgaum': 'Zone_II', 'belagavi': 'Zone_II', 'dharwad': 'Zone_II',
  'madurai': 'Zone_II', 'trichy': 'Zone_II', 'salem': 'Zone_II',
  'tirunelveli': 'Zone_II', 'vellore': 'Zone_II',
  'warangal': 'Zone_II', 'nizamabad': 'Zone_II', 'nashik': 'Zone_II',
  'aurangabad': 'Zone_II', 'solapur': 'Zone_II', 'kolhapur': 'Zone_II',
  'dhanbad': 'Zone_II', 'bokaro': 'Zone_II', 'cuttack': 'Zone_II',
  'udaipur': 'Zone_II', 'kota': 'Zone_II', 'bikaner': 'Zone_II',
  'gwalior': 'Zone_II', 'satna': 'Zone_II', 'bilaspur': 'Zone_II',
  'bhilai': 'Zone_II', 'korba': 'Zone_II', 'amravati': 'Zone_II',
  'nellore': 'Zone_II', 'kurnool': 'Zone_II', 'tirupati': 'Zone_II',
  'guntur': 'Zone_II', 'erode': 'Zone_II', 'tirupur': 'Zone_II',
  'pondicherry': 'Zone_II', 'puducherry': 'Zone_II', 'rourkela': 'Zone_II',
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOOKUP FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function lookupRegionalIndex(location: string): { index: number; matchedCity: string | null } {
  const loc = location.toLowerCase().trim();
  if (!loc) return { index: REGIONAL_RATE_INDEX.default, matchedCity: null };

  // 1. Exact match first
  if (loc in REGIONAL_RATE_INDEX && loc !== 'default') {
    return { index: REGIONAL_RATE_INDEX[loc], matchedCity: loc };
  }

  // Require minimum query length of 3 chars for partial matching
  if (loc.length < 3) {
    return { index: REGIONAL_RATE_INDEX.default, matchedCity: null };
  }

  // 2. Prefix match (canonical city starts with query loc)
  let bestPrefix: { key: string; index: number } | null = null;
  for (const [city, index] of Object.entries(REGIONAL_RATE_INDEX)) {
    if (city === 'default') continue;
    if (city.startsWith(loc)) {
      if (!bestPrefix || city.length > bestPrefix.key.length) {
        bestPrefix = { key: city, index };
      }
    }
  }
  if (bestPrefix) return { index: bestPrefix.index, matchedCity: bestPrefix.key };

  // 3. Substring match where loc contains city (e.g. query "North Bengaluru" contains "bengaluru")
  let bestSubstring: { key: string; index: number } | null = null;
  for (const [city, index] of Object.entries(REGIONAL_RATE_INDEX)) {
    if (city === 'default') continue;
    if (loc.includes(city)) {
      if (!bestSubstring || city.length > bestSubstring.key.length) {
        bestSubstring = { key: city, index };
      }
    }
  }
  if (bestSubstring) return { index: bestSubstring.index, matchedCity: bestSubstring.key };

  return { index: REGIONAL_RATE_INDEX.default, matchedCity: null };
}

export function lookupSeismicZone(location: string): SeismicZone | null {
  const loc = location.toLowerCase().trim();
  if (!loc) return null;

  // 1. Exact match first
  if (loc in SEISMIC_ZONE_LOOKUP) {
    return SEISMIC_ZONE_LOOKUP[loc] as SeismicZone;
  }

  // Require minimum query length of 3 chars for partial matching
  if (loc.length < 3) return null;

  // 2. Prefix match
  let bestPrefix: { key: string; zone: SeismicZone } | null = null;
  for (const [city, zone] of Object.entries(SEISMIC_ZONE_LOOKUP)) {
    if (city.startsWith(loc)) {
      if (!bestPrefix || city.length > bestPrefix.key.length) {
        bestPrefix = { key: city, zone: zone as SeismicZone };
      }
    }
  }
  if (bestPrefix) return bestPrefix.zone;

  // 3. Substring match
  let bestSubstring: { key: string; zone: SeismicZone } | null = null;
  for (const [city, zone] of Object.entries(SEISMIC_ZONE_LOOKUP)) {
    if (loc.includes(city)) {
      if (!bestSubstring || city.length > bestSubstring.key.length) {
        bestSubstring = { key: city, zone: zone as SeismicZone };
      }
    }
  }
  return bestSubstring ? bestSubstring.zone : null;
}
