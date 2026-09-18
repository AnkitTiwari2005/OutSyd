// lib/engine/coefficients.ts — OUTSYD v2026-09-18 (World-Class Edition)
// Research-validated against: CPWD DSR 2024, NBO Cost Index, State PWD SoRs,
// RERA disclosure data, JLL/Knight Frank India construction cost surveys 2024-25,
// IS 1893:2016 (seismic), IS 875 (wind), NBC 2016 (fire/HVAC).
// 160+ cities | 200+ line items | 18 categories | 6 soil types | 5 seismic zones
// ⚠ Review by a licensed Civil/Structural Engineer before go-live.

import type { CoefficientDataset } from './types';

export const LABOUR_INCLUSIVE_RATES: Record<string, boolean> = {
  MAT_FOUND_EXCAV         : false,
  MAT_FOUND_EXCAV_ROCK    : false,
  MAT_FOUND_PCC           : false,
  MAT_FOUND_CONC          : false,
  MAT_FOUND_RAFT          : false,
  MAT_FOUND_PILE          : false,
  MAT_FOUND_PILE_STEEL    : false,
  MAT_FOUND_STEEL         : false,
  MAT_FOUND_DPC           : false,
  MAT_FOUND_ANTITERM      : false,
  MAT_FOUND_BACKFILL      : false,
  MAT_FOUND_FORMWORK      : false,
  MAT_FOUND_WATERBAR      : false,
  MAT_FOUND_CURING        : false,
  MAT_RCC_CEMENT          : false,
  MAT_RCC_STEEL           : false,
  MAT_RCC_STEEL_550D      : false,
  MAT_RCC_SAND            : false,
  MAT_RCC_AGGREGATE_20MM  : false,
  MAT_RCC_AGGREGATE_10MM  : false,
  MAT_RCC_COL_CONC        : false,
  MAT_RCC_HIGH_CONC       : false,
  MAT_RCC_FORMWORK        : false,
  MAT_RCC_SLAB_FORM       : false,
  MAT_RCC_BINDING_WIRE    : false,
  MAT_RCC_SPACERS         : false,
  MAT_RCC_ADMIX           : false,
  MAT_RCC_FLYASH          : false,
  MAT_RCC_GROUT           : false,
  MAT_STEEL_STRUCT        : false,
  MAT_MASON_BRICK         : false,
  MAT_MASON_BLOCK         : false,
  MAT_MASON_FLY_BRICK     : false,
  MAT_MASON_HOLLOW_CONC   : false,
  MAT_MASON_CEMENT        : false,
  MAT_MASON_SAND          : false,
  MAT_MASON_LINTEL        : false,
  MAT_MASON_PARAPET       : false,
  MAT_PLAST_INT           : true,
  MAT_PLAST_EXT           : true,
  MAT_PLAST_POP           : true,
  MAT_PLAST_GYPSUM        : true,
  MAT_PLAST_CEMENT        : true,
  MAT_WP_IPS              : true,
  MAT_WP_LIQ_PU           : true,
  MAT_WP_LIQ_ACR          : true,
  MAT_WP_CRYS             : true,
  MAT_WP_TORCH            : true,
  MAT_WP_BATH             : true,
  MAT_WP_KITCH            : true,
  MAT_WP_BASEMENT         : true,
  MAT_WP_EXPANSION        : true,
  MAT_ANTITERM_CHEMICAL   : false,
  MAT_ROOF_TERRACE        : false,
  MAT_ROOF_SLOPE          : false,
  MAT_ROOF_METAL_DECK     : false,
  MAT_ROOF_GI_SHEET       : false,
  MAT_CEIL_POP            : true,
  MAT_CEIL_GYPS           : true,
  MAT_CEIL_GRID           : true,
  MAT_CEIL_ACOU           : true,
  MAT_CEIL_WOODEN         : true,
  MAT_CEIL_STRETCH        : true,
  MAT_DOOR_FLUSH          : true,
  MAT_DOOR_PANEL          : true,
  MAT_DOOR_TEAK           : true,
  MAT_DOOR_FRP            : true,
  MAT_DOOR_SLIDE          : true,
  MAT_DOOR_SECURITY       : true,
  MAT_DOOR_FIRE_RATED     : true,
  MAT_DOOR_FRAME          : true,
  MAT_DOOR_HARDWARE       : true,
  MAT_WIN_ALUM            : true,
  MAT_WIN_UPVC            : true,
  MAT_WIN_THERMBREAK      : true,
  MAT_WIN_GLASS_TOUGHENED : true,
  MAT_WIN_GLASS_DBLE      : true,
  MAT_WIN_HARDWARE        : true,
  MAT_GRILLE              : true,
  MAT_VENT                : true,
  MAT_ELEC_POINT          : true,
  MAT_ELEC_WIRE_6         : false,
  MAT_ELEC_WIRE_2_5       : false,
  MAT_ELEC_WIRE_1_5       : false,
  MAT_ELEC_CONDUIT_25     : false,
  MAT_ELEC_DB_MAIN        : true,
  MAT_ELEC_DB_FLOOR       : true,
  MAT_ELEC_MCB            : false,
  MAT_ELEC_RCCB           : false,
  MAT_ELEC_SWITCH_MOD     : false,
  MAT_ELEC_SOCKET_16A     : false,
  MAT_ELEC_EARTHING       : false,
  MAT_ELEC_UPS_INVERTER   : false,
  MAT_ELEC_GENSET         : true,
  MAT_ELEC_CCTV           : true,
  MAT_ELEC_FIRE_ALARM     : true,
  MAT_ELEC_ACCESS_CTRL    : true,
  MAT_ELEC_INTERCOM       : true,
  MAT_ELEC_EV_CHARGER     : true,
  MAT_ELEC_CABLE_TRAY     : false,
  MAT_ELEC_BUSDUCT        : true,
  MAT_PLUMB_EWC           : true,
  MAT_PLUMB_WC            : true,
  MAT_PLUMB_WASH          : true,
  MAT_PLUMB_BATH          : true,
  MAT_PLUMB_BATHTUB       : true,
  MAT_PLUMB_SINK_SS       : true,
  MAT_PLUMB_URINAL        : true,
  MAT_PLUMB_FAUCET_BASIN  : true,
  MAT_PLUMB_FAUCET_BATH   : true,
  MAT_PLUMB_FAUCET_KITCH  : true,
  MAT_PLUMB_PIPE_CPVC     : false,
  MAT_PLUMB_PIPE_PPR      : false,
  MAT_PLUMB_PIPE_PVC      : false,
  MAT_PLUMB_PIPE_GI       : false,
  MAT_PLUMB_GULLY         : true,
  MAT_PLUMB_TANK_OHT      : true,
  MAT_PLUMB_TANK_SUMP     : true,
  MAT_PLUMB_PUMP_BOOSTER  : true,
  MAT_PLUMB_PUMP_SEWAGE   : true,
  MAT_PLUMB_STP           : true,
  MAT_PLUMB_SOLAR_HWS     : true,
  MAT_PLUMB_GAS_PIPE      : false,
  MAT_FLOOR_CER           : true,
  MAT_FLOOR_VIT           : true,
  MAT_FLOOR_VIT_LVT       : true,
  MAT_FLOOR_MARBLE_IND    : true,
  MAT_FLOOR_MARBLE_IMP    : true,
  MAT_FLOOR_GRANITE       : true,
  MAT_FLOOR_KOTA          : true,
  MAT_FLOOR_HARDWOOD      : true,
  MAT_FLOOR_EPOXY         : true,
  MAT_FLOOR_IPS           : true,
  MAT_FLOOR_MORTAR        : false,
  MAT_FLOOR_SKIRTING      : true,
  MAT_FLOOR_DADO_BATH     : true,
  MAT_FLOOR_DADO_KITCH    : true,
  MAT_PAINT_PUTTY         : false,
  MAT_PAINT_PRIMER        : false,
  MAT_PAINT_INT_EMU       : false,
  MAT_PAINT_INT_LUSTER    : false,
  MAT_PAINT_EXT_EMU       : false,
  MAT_PAINT_EXT_ELAST     : false,
  MAT_PAINT_DISTEM        : false,
  MAT_PAINT_TEXTURE       : false,
  MAT_WOOD_KITCH_ECO      : true,
  MAT_WOOD_KITCH          : true,
  MAT_WOOD_KITCH_PREM     : true,
  MAT_WOOD_CARPEN         : true,
  MAT_WOOD_WARDROBE       : true,
  MAT_WOOD_WARDROBE_PREM  : true,
  MAT_WOOD_LOFT           : true,
  MAT_WOOD_STUDY_TABLE    : true,
  MAT_WOOD_PANEL          : true,
  MAT_WOOD_POLISH         : true,
  MAT_WOOD_TV_UNIT        : true,
  MAT_WOOD_POOJA_MANDIR   : true,
  MAT_EXT_PLAST           : true,
  MAT_EXT_PAINT           : true,
  MAT_EXT_TEXTURE         : false,
  MAT_EXT_CLADDING_ACP    : true,
  MAT_EXT_CURTWALL        : true,
  MAT_EXT_CURTWALL_UHV    : true,
  MAT_EXT_STONE_CLADDING  : true,
  MAT_EXT_BOUNDARY_WALL   : true,
  MAT_EXT_GATE_MAIN       : true,
  MAT_EXT_GATE_PEDES      : true,
  MAT_EXT_PAVING          : true,
  MAT_EXT_ROAD_BITUMEN    : true,
  MAT_EXT_LANDSCAPE       : true,
  MAT_STAIR_CONC          : false,
  MAT_STAIR_STEEL         : false,
  MAT_STAIR_RAILING_SS    : true,
  MAT_STAIR_RAILING_MS    : true,
  MAT_STAIR_RAILING_GLASS : true,
  MAT_STAIR_MARBLE        : true,
  MAT_STAIR_GRANITE       : true,
  MAT_LIFT_4P             : true,
  MAT_LIFT_8P             : true,
  MAT_LIFT_13P            : true,
  MAT_LIFT_HYDRO          : true,
  MAT_HVAC_SPLIT          : true,
  MAT_HVAC_CASSET         : true,
  MAT_HVAC_VRF            : true,
  MAT_HVAC_CENTRAL_AHU    : true,
  MAT_HVAC_DUCT_INSUL     : true,
  MAT_HVAC_FRESH_AIR      : true,
  MAT_FIRE_HYDRANT        : true,
  MAT_FIRE_PUMP_SET       : true,
  MAT_FIRE_EXTINGUISHER   : true,
  MAT_FIRE_SPRINKLER      : true,
  MAT_EXHAUST_FAN         : true,
  MAT_PARK_RCC_EXCAV      : false,
  MAT_PARK_RCC_WALLS      : false,
  MAT_PARK_FLOOR_SCREED   : false,
  MAT_PARK_LINING         : false,
  MAT_PARK_VENTILATION    : false,
  MAT_PARK_PUMP_SUMP      : false,
  MAT_PARK_STRIPING       : false,
  MAT_PARK_EV_CHARGING    : false,
  MAT_POOL_EXCAV          : true,
  MAT_POOL_RCC            : true,
  MAT_POOL_TILE           : true,
  MAT_POOL_PUMP_FILTER    : true,
  MAT_POOL_CHLORINATOR    : true,
  MAT_GYM_EQUIP           : true,
  MAT_CLUB_FINISH         : true,
  MAT_SOLAR_PANEL_ROO     : true,
  MAT_SOLAR_INV_ROO       : true,
  MAT_GREEN_RAINWATER     : true,
  MAT_GREEN_DUAL_FLUSH    : true,
  MAT_MISC_SCAFFOLD       : true,
  MAT_MISC_TOTAL          : true,
};

export const DEFAULT_DATASET: CoefficientDataset = {
  version: 'v2026.09.3',

  // ─── Cement coefficients (bags/sqft BUA) — per floor height band ─────────
  // Sources: CPWD DSR Schedule-I, IS 456, standard mix design tables
  floorCementCoeff: {
    G1_G3   : 0.40,   // G+0 to G+2 (low-rise)
    G4_G7   : 0.46,   // G+3 to G+6 (mid-rise)
    G8_G15  : 0.52,   // G+7 to G+14 (high-rise)
    G16_PLUS: 0.58,   // G+15+ (super high-rise, M35+)
  },

  // ─── Steel coefficients (kg/sqft BUA) ────────────────────────────────────
  // Includes columns, beams, slabs, footings proportional split
  floorSteelCoeff: {
    G1_G3   : 4.00,
    G4_G7   : 4.60,
    G8_G15  : 5.20,
    G16_PLUS: 6.20,
  },

  // ─── Seismic zone steel multipliers (IS 1893:2016) ───────────────────────
  seismicMultipliers: {
    Zone_II : 1.000,
    Zone_III: 1.055,
    Zone_IV : 1.110,
    Zone_V  : 1.175,
    Not_sure: 1.055,  // conservative
  },

  // ─── Quality tier multipliers ─────────────────────────────────────────────
  qualityMultipliers: {
    Economy : 0.82,
    Standard: 1.00,
    Premium : 1.50,
  },

  // ─── Structural system modifiers (cm=cement, sm=steel, mm=masonry) ────────
  structMultipliers: {
    RCC_Frame   : { cm: 1.00, sm: 1.00, mm: 1.00 },
    Load_bearing: { cm: 0.70, sm: 0.50, mm: 1.55 },
    Shear_Wall  : { cm: 1.12, sm: 1.04, mm: 0.85 },
    Steel       : { cm: 0.38, sm: 0.00, mm: 0.75 },  // structural steel — sm handled separately
    Not_sure    : { cm: 1.00, sm: 1.00, mm: 1.00 },
  },

  miscPct: 0.035,  // CAT_18 @ 3.5% (was 3.3%)

  // ═══════════════════════════════════════════════════════════════════════════
  // REFERENCE UNIT RATES — National average baseline (INR, Sep 2026)
  // Standard quality. Regional index and quality multiplier applied separately.
  // ═══════════════════════════════════════════════════════════════════════════
  labourInclusive: LABOUR_INCLUSIVE_RATES,

  rates: {
    // ── CAT_01: Substructure & Excavation ────────────────────────────────────
    MAT_FOUND_EXCAV        : 280,    // ₹/cu.m  — mechanical excavation
    MAT_FOUND_EXCAV_ROCK   : 1800,   // ₹/cu.m  — rock excavation (blasting)
    MAT_FOUND_PCC          : 4800,   // ₹/cu.m  — 1:4:8 plain cement concrete
    MAT_FOUND_CONC         : 6200,   // ₹/cu.m  — M20 RCC isolated footings
    MAT_FOUND_RAFT         : 6800,   // ₹/cu.m  — M25 raft foundation
    MAT_FOUND_PILE         : 7400,   // ₹/cu.m  — M25 bored cast-in-situ pile
    MAT_FOUND_PILE_STEEL   : 63,     // ₹/kg    — pile reinforcement
    MAT_FOUND_STEEL        : 63,     // ₹/kg    — Fe 500D TMT
    MAT_FOUND_DPC          : 58,     // ₹/sq.m  — 75mm DPC
    MAT_FOUND_ANTITERM     : 13,     // ₹/sqft  — soil poisoning (IS 6313)
    MAT_FOUND_BACKFILL     : 285,    // ₹/cu.m  — compacted earth filling
    MAT_FOUND_FORMWORK     : 300,    // ₹/sq.m  — plywood shuttering
    MAT_FOUND_WATERBAR     : 650,    // ₹/rmt   — PVC waterstop
    MAT_FOUND_CURING       : 4,      // ₹/sqft  — curing compound

    // ── CAT_02: RCC Superstructure ───────────────────────────────────────────
    MAT_RCC_CEMENT         : 420,    // ₹/bag 50kg — OPC 53 / PPC
    MAT_RCC_STEEL          : 63,     // ₹/kg  — Fe 500D TMT
    MAT_RCC_STEEL_550D     : 70,     // ₹/kg  — Fe 550D (premium/high-rise)
    MAT_RCC_SAND           : 34,     // ₹/cu.ft — M-sand
    MAT_RCC_AGGREGATE_20MM : 44,     // ₹/cu.ft — 20mm crushed aggregate
    MAT_RCC_AGGREGATE_10MM : 48,     // ₹/cu.ft — 10mm (slab top)
    MAT_RCC_COL_CONC       : 6600,   // ₹/cu.m — M25 column concrete
    MAT_RCC_HIGH_CONC      : 8200,   // ₹/cu.m — M40 (high-rise G16+)
    MAT_RCC_FORMWORK       : 320,    // ₹/sq.m — column/beam shuttering
    MAT_RCC_SLAB_FORM      : 280,    // ₹/sq.m — slab soffit shuttering
    MAT_RCC_BINDING_WIRE   : 115,    // ₹/kg
    MAT_RCC_SPACERS        : 5,      // ₹/unit — PVC cover blocks
    MAT_RCC_ADMIX          : 200,    // ₹/litre — superplasticizer
    MAT_RCC_FLYASH         : 8,      // ₹/kg   — fly ash (PPC blend)
    MAT_RCC_GROUT          : 85,     // ₹/kg   — non-shrink grout (column bases)
    MAT_STEEL_STRUCT       : 95,     // ₹/kg   — structural steel sections (Steel sys only)

    // ── CAT_03: Masonry & Internal Plaster ──────────────────────────────────
    MAT_MASON_BRICK        : 9.5,    // ₹/unit — FPS clay bricks
    MAT_MASON_BLOCK        : 45,     // ₹/unit — AAC block 600×200×200
    MAT_MASON_FLY_BRICK    : 8,      // ₹/unit — fly ash brick
    MAT_MASON_HOLLOW_CONC  : 55,     // ₹/unit — hollow concrete block
    MAT_MASON_CEMENT       : 420,    // ₹/bag  — OPC 43 / PPC for mortar
    MAT_MASON_SAND         : 34,     // ₹/cu.ft — plastering sand
    MAT_MASON_LINTEL       : 6300,   // ₹/cu.m — M20 lintel concrete
    MAT_MASON_PARAPET      : 1300,   // ₹/rmt  — parapet wall (0.9m ht)
    MAT_PLAST_INT          : 22,     // ₹/sqft — 12mm internal plaster
    MAT_PLAST_EXT          : 32,     // ₹/sqft — 20mm external plaster
    MAT_PLAST_POP          : 18,     // ₹/sqft — POP skim coat
    MAT_PLAST_GYPSUM       : 28,     // ₹/sqft — gypsum plaster (premium)
    MAT_PLAST_CEMENT       : 420,    // ₹/bag  — plastering cement

    // ── CAT_04: Waterproofing & Chemical Treatment ──────────────────────────
    MAT_WP_IPS             : 48,     // ₹/sqft — IPS cement screed
    MAT_WP_LIQ_PU          : 60,     // ₹/sqft — liquid PU membrane (2 coats)
    MAT_WP_LIQ_ACR         : 45,     // ₹/sqft — acrylic cementitious coating
    MAT_WP_CRYS            : 90,     // ₹/sqft — crystalline (Kryton/Dr.Fixit)
    MAT_WP_TORCH           : 75,     // ₹/sqft — torch-applied bitumen membrane
    MAT_WP_BATH            : 38,     // ₹/sqft — bathroom cementitious WP
    MAT_WP_KITCH           : 32,     // ₹/sqft — kitchen WP
    MAT_WP_BASEMENT        : 95,     // ₹/sqft — basement tanking system
    MAT_WP_EXPANSION       : 850,    // ₹/rmt  — expansion joint sealant
    MAT_ANTITERM_CHEMICAL  : 280,    // ₹/litre — termiticide concentrate

    // ── CAT_05: Roofing & False Ceiling ─────────────────────────────────────
    MAT_ROOF_TERRACE       : 38,     // ₹/sqft — terrace finish + WP
    MAT_ROOF_SLOPE         : 55,     // ₹/sqft — sloped RCC + waterproofing
    MAT_ROOF_METAL_DECK    : 280,    // ₹/sqft — metal deck roofing
    MAT_ROOF_GI_SHEET      : 180,    // ₹/sqft — GI Corrugated sheet
    MAT_CEIL_POP           : 95,     // ₹/sqft — POP false ceiling (installed)
    MAT_CEIL_GYPS          : 140,    // ₹/sqft — gypsum board (Armstrong/Saint-Gobain)
    MAT_CEIL_GRID          : 185,    // ₹/sqft — metal grid (commercial)
    MAT_CEIL_ACOU          : 265,    // ₹/sqft — acoustic ceiling tiles
    MAT_CEIL_WOODEN        : 320,    // ₹/sqft — wooden/bamboo ceiling
    MAT_CEIL_STRETCH       : 450,    // ₹/sqft — stretch/PVC ceiling (premium)

    // ── CAT_06: Doors, Windows & Glazing ────────────────────────────────────
    MAT_DOOR_FLUSH         : 7500,   // ₹/unit — flush door + frame + fitting
    MAT_DOOR_PANEL         : 15000,  // ₹/unit — panel/carved main door
    MAT_DOOR_TEAK          : 28000,  // ₹/unit — CPWD teak wood panel main door
    MAT_DOOR_FRP           : 3800,   // ₹/unit — factory-made FRP bathroom door (CPWD DSR 9.120)
    MAT_DOOR_SLIDE         : 20000,  // ₹/unit — sliding/folding door
    MAT_DOOR_SECURITY      : 35000,  // ₹/unit — steel security door
    MAT_DOOR_FIRE_RATED    : 45000,  // ₹/unit — 2-hr fire-rated door (IS 3614)
    MAT_DOOR_FRAME         : 3800,   // ₹/unit — door frame (teak/sal equivalent)
    MAT_DOOR_HARDWARE      : 800,    // ₹/set  — mortise lock + hinges + stopper
    MAT_WIN_ALUM           : 360,    // ₹/sqft — aluminium window (fabricated)
    MAT_WIN_UPVC           : 480,    // ₹/sqft — UPVC sliding window
    MAT_WIN_THERMBREAK     : 850,    // ₹/sqft — thermally broken aluminium (premium)
    MAT_WIN_GLASS_TOUGHENED: 220,    // ₹/sqft — 12mm toughened glass
    MAT_WIN_GLASS_DBLE     : 380,    // ₹/sqft — double-glazed unit (DGU)
    MAT_WIN_HARDWARE       : 750,    // ₹/set  — espag handle + stays + rubber
    MAT_GRILLE             : 130,    // ₹/sqft — MS grille (painted)
    MAT_VENT               : 1900,   // ₹/unit — ventilator (aluminium louvre)

    // ── CAT_07: Electrical & Low-Voltage Systems ─────────────────────────────
    MAT_ELEC_POINT         : 1500,   // ₹/point — complete wiring point
    MAT_ELEC_WIRE_6        : 85,     // ₹/m    — 6 sq.mm FRLS PVC wire
    MAT_ELEC_WIRE_2_5      : 58,     // ₹/m    — 2.5 sq.mm (power)
    MAT_ELEC_WIRE_1_5      : 40,     // ₹/m    — 1.5 sq.mm (light)
    MAT_ELEC_CONDUIT_25    : 32,     // ₹/m    — 25mm PVC conduit
    MAT_ELEC_DB_MAIN       : 12000,  // ₹/unit — main LT panel/MCCB board
    MAT_ELEC_DB_FLOOR      : 5500,   // ₹/unit — floor distribution board
    MAT_ELEC_MCB           : 200,    // ₹/unit — 20A SP MCB
    MAT_ELEC_RCCB          : 1200,   // ₹/unit — 30mA RCCB
    MAT_ELEC_SWITCH_MOD    : 750,    // ₹/plate — modular switch plate (4 module)
    MAT_ELEC_SOCKET_16A    : 650,    // ₹/unit — 16A socket (AC/geyser)
    MAT_ELEC_EARTHING      : 3500,   // ₹/set  — pipe/plate chemical earthing pit (IS 3043)
    MAT_ELEC_UPS_INVERTER  : 25000,  // ₹/unit — pure sine wave home inverter + battery
    // MAT_ELEC_GENSET: ₹22,000/kVA installed rate for CPCB IV+ compliant acoustic DG set
    // (Cummins/Kirloskar/Mahindra) with AMF panel, acoustic enclosure, GI earthing,
    // exhaust piping and commissioning per CPWD DSR 2023 and Indian market norms.
    MAT_ELEC_GENSET        : 22000,  // ₹/kVA  — diesel generator set (CPCB IV+ acoustic, installed)
    MAT_ELEC_CCTV          : 6000,   // ₹/camera — IP CCTV (4MP)
    MAT_ELEC_FIRE_ALARM    : 2500,   // ₹/detector — ionisation detector
    MAT_ELEC_ACCESS_CTRL   : 18000,  // ₹/door — access control system
    MAT_ELEC_INTERCOM      : 6500,   // ₹/unit — video door phone
    MAT_ELEC_EV_CHARGER    : 35000,  // ₹/point — EV charging point (32A)
    MAT_ELEC_CABLE_TRAY    : 280,    // ₹/m    — perforated cable tray (150mm)
    MAT_ELEC_BUSDUCT       : 3500,   // ₹/m    — busduct (rise main, commercial)

    // ── CAT_08: Plumbing, Sanitary & STP ────────────────────────────────────
    MAT_PLUMB_EWC          : 9500,   // ₹/unit — wall-hung WC (premium)
    MAT_PLUMB_WC           : 8500,   // ₹/unit — floor-mount WC (EWC)
    MAT_PLUMB_WASH         : 5000,   // ₹/unit — wash basin (wall-hung)
    MAT_PLUMB_BATH         : 13000,  // ₹/unit — shower cubicle (glass)
    MAT_PLUMB_BATHTUB      : 45000,  // ₹/unit — free-standing bathtub
    MAT_PLUMB_SINK_SS      : 6000,   // ₹/unit — SS double bowl kitchen sink
    MAT_PLUMB_URINAL       : 4500,   // ₹/unit — urinal (commercial)
    MAT_PLUMB_FAUCET_BASIN : 2500,   // ₹/unit — basin mixer tap
    MAT_PLUMB_FAUCET_BATH  : 4500,   // ₹/unit — bath shower mixer
    MAT_PLUMB_FAUCET_KITCH : 3000,   // ₹/unit — kitchen mixer
    MAT_PLUMB_PIPE_CPVC    : 80,     // ₹/m    — CPVC pipe (IS 15778)
    MAT_PLUMB_PIPE_PPR     : 95,     // ₹/m    — PPR pipe (hot/cold)
    MAT_PLUMB_PIPE_PVC     : 50,     // ₹/m    — PVC drain pipe
    MAT_PLUMB_PIPE_GI      : 220,    // ₹/m    — GI pipe (fire hydrant)
    MAT_PLUMB_GULLY        : 320,    // ₹/unit — floor trap / gully trap
    MAT_PLUMB_TANK_OHT     : 5.5,    // ₹/litre— HDPE overhead tank
    MAT_PLUMB_TANK_SUMP    : 3.8,    // ₹/litre— RCC underground sump
    MAT_PLUMB_PUMP_BOOSTER : 22000,  // ₹/set  — booster pump set
    MAT_PLUMB_PUMP_SEWAGE  : 18000,  // ₹/set  — sewage submersible pump
    MAT_PLUMB_STP          : 90000,  // ₹/KLD  — STP (MBR technology)
    MAT_PLUMB_SOLAR_HWS    : 28000,  // ₹/unit — solar water heater (200LPD)
    MAT_PLUMB_GAS_PIPE     : 180,    // ₹/m    — PNG gas piping (copper)

    // ── CAT_09: Flooring & Tiling ────────────────────────────────────────────
    MAT_FLOOR_CER          : 85,     // ₹/sqft — ceramic tile (installed, 600×600)
    MAT_FLOOR_VIT          : 145,    // ₹/sqft — vitrified tile (polished)
    MAT_FLOOR_VIT_LVT      : 210,    // ₹/sqft — LVT/SPC luxury vinyl tile
    MAT_FLOOR_MARBLE_IND   : 220,    // ₹/sqft — Indian white marble
    MAT_FLOOR_MARBLE_IMP   : 650,    // ₹/sqft — imported marble (Italian)
    MAT_FLOOR_GRANITE      : 240,    // ₹/sqft — Indian granite (polished)
    MAT_FLOOR_KOTA         : 70,     // ₹/sqft — Kota stone
    MAT_FLOOR_HARDWOOD     : 380,    // ₹/sqft — engineered hardwood
    MAT_FLOOR_EPOXY        : 90,     // ₹/sqft — epoxy screed (industrial)
    MAT_FLOOR_IPS          : 45,     // ₹/sqft — IPS (industrial floor)
    MAT_FLOOR_MORTAR       : 20,     // ₹/sqft — mortar bed
    MAT_FLOOR_SKIRTING     : 60,     // ₹/rft  — tile skirting
    MAT_FLOOR_DADO_BATH    : 120,    // ₹/sqft — bathroom wall tile (upto 7ft)
    MAT_FLOOR_DADO_KITCH   : 100,    // ₹/sqft — kitchen dado (3ft)

    // ── CAT_10: Wall Finishing & Painting ───────────────────────────────────
    MAT_PAINT_PUTTY        : 32,     // ₹/kg   — white cement putty
    MAT_PAINT_PRIMER       : 200,    // ₹/litre — PVA primer
    MAT_PAINT_INT_EMU      : 260,    // ₹/litre — interior emulsion (Royale/Ultima)
    MAT_PAINT_INT_LUSTER   : 380,    // ₹/litre — semi-gloss / lustre paint
    MAT_PAINT_EXT_EMU      : 300,    // ₹/litre — exterior weathershield
    MAT_PAINT_EXT_ELAST    : 450,    // ₹/litre — elastomeric exterior paint
    MAT_PAINT_DISTEM       : 65,     // ₹/kg   — distemper (economy)
    MAT_PAINT_TEXTURE      : 150,    // ₹/sqft — texture paint (installed)

    // ── CAT_11: Modular Kitchen, Joinery & Woodwork ──────────────────────────
    MAT_WOOD_KITCH_ECO     : 2800,   // ₹/lft  — economy modular kitchen
    MAT_WOOD_KITCH         : 3800,   // ₹/lft  — standard modular kitchen
    MAT_WOOD_KITCH_PREM    : 7500,   // ₹/lft  — premium modular kitchen (HDF/PU)
    MAT_WOOD_CARPEN        : 950,    // ₹/sqft — general carpentry
    MAT_WOOD_WARDROBE      : 38000,  // ₹/unit — full wardrobe (HDF/lam)
    MAT_WOOD_WARDROBE_PREM : 75000,  // ₹/unit — premium walk-in wardrobe
    MAT_WOOD_LOFT          : 1300,   // ₹/rft  — loft/storage unit
    MAT_WOOD_STUDY_TABLE   : 18000,  // ₹/unit — study/work table
    MAT_WOOD_PANEL         : 1200,   // ₹/sqft — decorative wall panelling
    MAT_WOOD_POLISH        : 90,     // ₹/sqft — melamine/PU polish
    MAT_WOOD_TV_UNIT       : 35000,  // ₹/unit — TV unit + back panel
    MAT_WOOD_POOJA_MANDIR  : 25000,  // ₹/unit — pooja unit (teak)

    // ── CAT_12: Exterior Finishing & Cladding ───────────────────────────────
    MAT_EXT_PLAST          : 42,     // ₹/sqft — 20mm external cement plaster
    MAT_EXT_PAINT          : 35,     // ₹/sqft — exterior emulsion (2 coats)
    MAT_EXT_TEXTURE        : 95,     // ₹/sqft — texture coat (sand/pebble)
    MAT_EXT_CLADDING_ACP   : 480,    // ₹/sqft — ACP cladding installed
    MAT_EXT_CURTWALL       : 1300,   // ₹/sqft — structural glazing curtain wall
    MAT_EXT_CURTWALL_UHV   : 1850,   // ₹/sqft — unitised high-performance CW (Saint-Gobain Low-E DGU)
    MAT_EXT_STONE_CLADDING : 350,    // ₹/sqft — natural stone cladding
    MAT_EXT_BOUNDARY_WALL  : 1500,   // ₹/rmt  — 6ft compound wall
    MAT_EXT_GATE_MAIN      : 65000,  // ₹/unit — motorised sliding main gate
    MAT_EXT_GATE_PEDES     : 18000,  // ₹/unit — pedestrian gate
    MAT_EXT_PAVING         : 75,     // ₹/sqft — interlocking paver (external)
    MAT_EXT_ROAD_BITUMEN   : 180,    // ₹/sqft — internal road (60mm bitumen)
    MAT_EXT_LANDSCAPE      : 45,     // ₹/sqft — basic landscaping (turfing)

    // ── CAT_13: Staircase, Railings & Lifts ─────────────────────────────────
    MAT_STAIR_CONC         : 6300,   // ₹/cu.m — M25 stair concrete
    MAT_STAIR_STEEL        : 63,     // ₹/kg   — stair reinforcement
    MAT_STAIR_RAILING_SS   : 700,    // ₹/rft  — SS 304 railing
    MAT_STAIR_RAILING_MS   : 350,    // ₹/rft  — MS painted railing
    MAT_STAIR_RAILING_GLASS: 1800,   // ₹/rft  — frameless glass railing
    MAT_STAIR_MARBLE       : 220,    // ₹/sqft — marble stair treads
    MAT_STAIR_GRANITE      : 240,    // ₹/sqft — granite stair treads
    MAT_LIFT_4P            : 900000, // ₹/unit — 4-person elevator (KONE/Otis)
    MAT_LIFT_8P            : 1500000,// ₹/unit — 8-person elevator
    MAT_LIFT_13P           : 2400000,// ₹/unit — 13-person (commercial)
    MAT_LIFT_HYDRO         : 750000, // ₹/unit — hydraulic lift (low-rise)

    // ── CAT_14: HVAC, Fire Protection & MEP ─────────────────────────────────
    MAT_HVAC_SPLIT         : 45000,  // ₹/ton  — split AC (BEE 3-star)
    MAT_HVAC_CASSET        : 65000,  // ₹/ton  — cassette AC
    MAT_HVAC_VRF           : 85000,  // ₹/ton  — VRF/VRV system
    MAT_HVAC_CENTRAL_AHU   : 120000, // ₹/ton  — central AHU (duct)
    MAT_HVAC_DUCT_INSUL    : 280,    // ₹/sqft — insulated ducting
    MAT_HVAC_FRESH_AIR     : 35,     // ₹/sqft — fresh air ventilation
    MAT_FIRE_HYDRANT       : 85000,  // ₹/set  — wet riser hydrant system per floor
    MAT_FIRE_PUMP_SET      : 250000, // ₹/set  — fire pump set (main+jockey+diesel)
    MAT_FIRE_EXTINGUISHER  : 2500,   // ₹/unit — ABC CO2 extinguisher
    MAT_FIRE_SPRINKLER     : 4500,   // ₹/head — fire sprinkler head (wet pipe, IS 15105)
    MAT_EXHAUST_FAN        : 3500,   // ₹/unit — axial exhaust fan

    // ── CAT_15: Parking & Basement ──────────────────────────────────────────
    MAT_PARK_RCC_EXCAV     : 480,    // ₹/cu.m — basement excavation + strutting + carting (CPWD DSR 2024)
    MAT_PARK_RCC_WALLS     : 7200,   // ₹/cu.m — M30 basement retaining wall
    MAT_PARK_FLOOR_SCREED  : 55,     // ₹/sqft — 75mm floor screed
    MAT_PARK_LINING        : 95,     // ₹/sqft — basement WP + lining
    MAT_PARK_VENTILATION   : 280,    // ₹/sqft — basement ventilation
    MAT_PARK_PUMP_SUMP     : 25000,  // ₹/set  — stormwater / de-watering pump
    MAT_PARK_STRIPING      : 120,    // ₹/bay  — parking bay markings
    MAT_PARK_EV_CHARGING   : 35000,  // ₹/point— EV charging in parking

    // ── CAT_16: Swimming Pool & Recreational ─────────────────────────────────
    MAT_POOL_EXCAV         : 7200,   // ₹/cu.m
    MAT_POOL_RCC           : 8500,   // ₹/cu.m — M35 WS pool concrete
    MAT_POOL_TILE          : 380,    // ₹/sqft — pool tile (vitrified)
    MAT_POOL_PUMP_FILTER   : 180000, // ₹/set  — filtration + pump system
    MAT_POOL_CHLORINATOR   : 45000,  // ₹/set  — salt chlorination system
    MAT_GYM_EQUIP          : 4500,   // ₹/sqft — gym equipment + flooring
    MAT_CLUB_FINISH        : 2500,   // ₹/sqft — clubhouse premium finishing

    // ── CAT_17: Solar & Green Building ──────────────────────────────────────
    MAT_SOLAR_PANEL_ROO    : 38,     // ₹/Wp   — rooftop solar panel
    MAT_SOLAR_INV_ROO      : 12000,  // ₹/kW   — grid-tied inverter
    MAT_GREEN_RAINWATER    : 45000,  // ₹/unit — RWH system
    MAT_GREEN_DUAL_FLUSH   : 12000,  // ₹/unit — dual-flush valve set

    // ── CAT_18: Preliminaries, Site & Miscellaneous ──────────────────────────
    // CAT_18 is auto-computed as 3.5% of all other categories (miscPct)
    // The following rates are used for high-rise / complex additions
    MAT_MISC_SCAFFOLD      : 18,     // ₹/sqft/month — external scaffolding
    MAT_MISC_TOTAL         : 1,      // placeholder (cost computed as % of total)
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GRADE RECOMMENDATIONS BY QUALITY TIER
  // ═══════════════════════════════════════════════════════════════════════════
  grades: {
    Economy: {
      MAT_RCC_CEMENT        : 'OPC 43 Grade (IS 8112)',
      MAT_RCC_STEEL         : 'Fe 415 TMT (ISI Certified)',
      MAT_MASON_BRICK       : 'Local FPS Clay Bricks (3rd class)',
      MAT_MASON_FLY_BRICK   : 'Fly Ash Brick (7.5 N/mm²)',
      MAT_FLOOR_CER         : 'Ceramic Tile 300×300 — Johnson/Somany',
      MAT_PLUMB_WC          : 'Parryware Coral / Cera (Basic)',
      MAT_PAINT_DISTEM      : 'Asian Paints Tractor Distemper',
      MAT_PAINT_EXT_EMU     : 'Apex Weatherproof (500ml coverage)',
      MAT_WIN_ALUM          : 'Aluminium Section — Plain (1.4mm)',
      MAT_ELEC_WIRE_2_5     : 'ISI-Marked FR PVC Wire (2.5 sq.mm)',
      MAT_WP_IPS            : 'IPS Cement Screed (1:3 mix)',
      MAT_DOOR_FLUSH        : 'Commercial Flush Door (30mm block board)',
      MAT_DOOR_FRP          : 'Moulded FRP Door (Water-Resistant)',
      MAT_FLOOR_SKIRTING    : 'Ceramic Skirting (matching floor)',
      MAT_CEIL_POP          : 'POP False Ceiling (12mm)',
      MAT_HVAC_SPLIT        : 'Window AC / Non-inverter Split',
    },
    Standard: {
      MAT_RCC_CEMENT        : 'OPC 53 Grade / PPC Blended (IS 1489)',
      MAT_RCC_STEEL         : 'Fe 500D TMT (IS 1786, BIS Hallmark)',
      MAT_MASON_BLOCK       : 'AAC Blocks 600×200×200 — Aerocon/Siporex',
      MAT_FLOOR_VIT         : 'Double Charge Vitrified 600×600 — Kajaria/Somany',
      MAT_PLUMB_WC          : 'Cera Quartz / Hindware Flair (Mid-range)',
      MAT_PLUMB_FAUCET_BASIN: 'Jaquar/Marc Basin Mixer',
      MAT_PAINT_INT_EMU     : 'Asian Paints Royale Aspira (WB)',
      MAT_PAINT_EXT_EMU     : 'Asian Paints Apex Ultima Protek',
      MAT_WIN_UPVC          : 'UPVC Sliding — Fenesta/Encraft (1.8mm wall)',
      MAT_ELEC_WIRE_2_5     : 'Finolex / Havells FRLS Wire 2.5 sq.mm',
      MAT_WP_LIQ_PU         : 'Dr. Fixit LW+ / Roff Tile-Mate PU',
      MAT_DOOR_FLUSH        : 'Hardwood Flush Door — Century/Archidply',
      MAT_DOOR_PANEL        : 'Teak/Sal Wood Panel Door (38mm)',
      MAT_DOOR_FRP          : 'Factory-made FRP Shutter — Sintex/Rajshri',
      MAT_FLOOR_SKIRTING    : 'Vitrified Skirting 600×100 — Kajaria',
      MAT_CEIL_GYPS         : 'Gypsum Board 12.5mm — Saint-Gobain/Armstrong',
      MAT_HVAC_SPLIT        : 'Inverter Split AC (BEE 5-star) — Daikin/Carrier',
    },
    Premium: {
      MAT_RCC_CEMENT        : 'UltraTech 53S / ACC Gold PPC (IS 1489)',
      MAT_RCC_STEEL         : 'Fe 550D / CRS Corrosion-Resistant (SAIL/Tata)',
      MAT_MASON_BLOCK       : 'AAC + Autoclaved Fly-ash — Aerocon Eco',
      MAT_FLOOR_MARBLE_IND  : 'Statuario/Makrana White Marble (20mm polished)',
      MAT_FLOOR_MARBLE_IMP  : 'Italian Carrara / Calacatta Marble',
      MAT_PLUMB_WC          : 'TOTO Washlet / Kohler Veil / Duravit D-Neo',
      MAT_PLUMB_FAUCET_BASIN: 'Grohe / American Standard / Roca Premium',
      MAT_PLUMB_BATHTUB     : 'Jacuzzi Hydrotherapy / Kohler Freestanding',
      MAT_PAINT_INT_EMU     : 'Royale Glitz / Birla Opus Silkseal',
      MAT_PAINT_EXT_EMU     : 'Durapol / Apex Shyne Elastomeric',
      MAT_WIN_THERMBREAK    : 'Schüco / Reynaers Thermally-Broken Al (65mm)',
      MAT_WIN_GLASS_DBLE    : 'DGU Low-E Glass — 4-12-4 argon-filled',
      MAT_ELEC_WIRE_2_5     : 'Polycab FRLS Zero Halogen (IS 7098)',
      MAT_WP_CRYS           : 'Kryton KIM / Penetron Crystalline System',
      MAT_DOOR_SECURITY     : 'Godrej / Yale Steel Security Door (3-pt lock)',
      MAT_DOOR_TEAK         : 'Burma Teak Hand-Carved Panel Door (45mm)',
      MAT_DOOR_FRP          : 'Heavy-Duty FRP Shutter with PU Core',
      MAT_FLOOR_SKIRTING    : 'Marble Skirting (matching floor, 20mm)',
      MAT_CEIL_GYPS         : 'Gypsum Board with Acoustic Insulation',
      MAT_HVAC_VRF          : 'Daikin VRV / Mitsubishi VRF (COP 4.0+)',
      MAT_WOOD_KITCH_PREM   : 'Hettich/Hafele Hardware, HDF Acrylic Shutters',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// REGIONAL RATE INDEX & SEISMIC LOOKUPS (U-7)
// Extracted to ./regions.ts for lightweight client bundling
// ═══════════════════════════════════════════════════════════════════════════════
export {
  REGIONAL_RATE_INDEX,
  SEISMIC_ZONE_LOOKUP,
  lookupRegionalIndex,
  lookupSeismicZone,
} from './regions';

