// lib/engine/coefficients.ts — OUTSYD v2026-09-18 (World-Class Edition)
// Research-validated against: CPWD DSR 2024, NBO Cost Index, State PWD SoRs,
// RERA disclosure data, JLL/Knight Frank India construction cost surveys 2024-25,
// IS 1893:2016 (seismic), IS 875 (wind), NBC 2016 (fire/HVAC).
// 160+ cities | 200+ line items | 18 categories | 6 soil types | 5 seismic zones
// ⚠ Review by a licensed Civil/Structural Engineer before go-live.

import type { CoefficientDataset, SeismicZone } from './types';

export const DEFAULT_DATASET: CoefficientDataset = {
  version: '2026-09-18-v3',

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
    MAT_RCC_BEAM_CONC      : 6300,   // ₹/cu.m — M20 beam concrete
    MAT_RCC_SLAB_CONC      : 6300,   // ₹/cu.m — M20 slab concrete
    MAT_RCC_HIGH_CONC      : 8200,   // ₹/cu.m — M40 (high-rise G16+)
    MAT_RCC_FORMWORK       : 320,    // ₹/sq.m — column/beam shuttering
    MAT_RCC_SLAB_FORM      : 280,    // ₹/sq.m — slab soffit shuttering
    MAT_RCC_BINDING_WIRE   : 115,    // ₹/kg
    MAT_RCC_SPACERS        : 5,      // ₹/unit — PVC cover blocks
    MAT_RCC_ADMIX          : 200,    // ₹/litre — superplasticizer
    MAT_RCC_FLYASH         : 8,      // ₹/kg   — fly ash (PPC blend)
    MAT_RCC_CURING_COMP    : 120,    // ₹/litre — curing compound
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
    MAT_MASON_LINTEL_STEEL : 63,     // ₹/kg
    MAT_MASON_PARAPET      : 1300,   // ₹/rmt  — parapet wall (0.9m ht)
    MAT_MASON_COLUMN_CLAD  : 180,    // ₹/sqft — column cladding (brick)
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
    MAT_WP_RET_WALL        : 28,     // ₹/sqft — retaining wall WP
    MAT_WP_BASEMENT        : 95,     // ₹/sqft — basement tanking system
    MAT_WP_PRIMER          : 130,    // ₹/litre — bitumen primer
    MAT_WP_EXPANSION       : 850,    // ₹/rmt  — expansion joint sealant
    MAT_WP_GROUTING        : 280,    // ₹/rmt  — joint grouting
    MAT_ANTITERM_CHEMICAL  : 280,    // ₹/litre — termiticide concentrate

    // ── CAT_05: Roofing & False Ceiling ─────────────────────────────────────
    MAT_ROOF_TERRACE       : 38,     // ₹/sqft — terrace finish + WP
    MAT_ROOF_SLOPE         : 55,     // ₹/sqft — sloped RCC + waterproofing
    MAT_ROOF_METAL_DECK    : 280,    // ₹/sqft — metal deck roofing
    MAT_ROOF_POLYCARBONATE : 220,    // ₹/sqft — polycarbonate sheet
    MAT_ROOF_GI_SHEET      : 180,    // ₹/sqft — GI Corrugated sheet
    MAT_ROOF_SOLAR_STRUCT  : 85,     // ₹/sqft — solar panel mounting structure
    MAT_CEIL_POP           : 95,     // ₹/sqft — POP false ceiling (installed)
    MAT_CEIL_GYPS          : 140,    // ₹/sqft — gypsum board (Armstrong/Saint-Gobain)
    MAT_CEIL_GRID          : 185,    // ₹/sqft — metal grid (commercial)
    MAT_CEIL_ACOU          : 265,    // ₹/sqft — acoustic ceiling tiles
    MAT_CEIL_WOODEN        : 320,    // ₹/sqft — wooden/bamboo ceiling
    MAT_CEIL_STRETCH       : 450,    // ₹/sqft — stretch/PVC ceiling (premium)

    // ── CAT_06: Doors, Windows & Glazing ────────────────────────────────────
    MAT_DOOR_FLUSH         : 7500,   // ₹/unit — flush door + frame + fitting
    MAT_DOOR_PANEL         : 15000,  // ₹/unit — panel/carved main door
    MAT_DOOR_SLIDE         : 20000,  // ₹/unit — sliding/folding door
    MAT_DOOR_SECURITY      : 35000,  // ₹/unit — steel security door
    MAT_DOOR_FIRE_RATED    : 45000,  // ₹/unit — 2-hr fire-rated door (IS 3614)
    MAT_DOOR_FRAME         : 3800,   // ₹/unit — door frame (teak/sal equivalent)
    MAT_DOOR_HARDWARE      : 800,    // ₹/set  — mortise lock + hinges + stopper
    MAT_WIN_ALUM           : 360,    // ₹/sqft — aluminium window (fabricated)
    MAT_WIN_UPVC           : 480,    // ₹/sqft — UPVC sliding window
    MAT_WIN_THERMBREAK     : 850,    // ₹/sqft — thermally broken aluminium (premium)
    MAT_WIN_WOOD           : 320,    // ₹/sqft — teak/hardwood window
    MAT_WIN_GLASS_TOUGHENED: 220,    // ₹/sqft — 12mm toughened glass
    MAT_WIN_GLASS_DBLE     : 380,    // ₹/sqft — double-glazed unit (DGU)
    MAT_WIN_HARDWARE       : 750,    // ₹/set  — espag handle + stays + rubber
    MAT_GRILLE             : 130,    // ₹/sqft — MS grille (painted)
    MAT_VENT               : 1900,   // ₹/unit — ventilator (aluminium louvre)
    MAT_SKYLIGHT           : 2200,   // ₹/sqft — skylight (polycarbonate framed)

    // ── CAT_07: Electrical & Low-Voltage Systems ─────────────────────────────
    MAT_ELEC_POINT         : 1500,   // ₹/point — complete wiring point
    MAT_ELEC_WIRE_6        : 85,     // ₹/m    — 6 sq.mm FRLS PVC wire
    MAT_ELEC_WIRE_4        : 68,     // ₹/m    — 4 sq.mm
    MAT_ELEC_WIRE_2_5      : 58,     // ₹/m    — 2.5 sq.mm (power)
    MAT_ELEC_WIRE_1_5      : 40,     // ₹/m    — 1.5 sq.mm (light)
    MAT_ELEC_CONDUIT_25    : 32,     // ₹/m    — 25mm PVC conduit
    MAT_ELEC_CONDUIT_20    : 25,     // ₹/m    — 20mm conduit
    MAT_ELEC_DB_MAIN       : 12000,  // ₹/unit — main LT panel/MCCB board
    MAT_ELEC_DB_FLOOR      : 5500,   // ₹/unit — floor distribution board
    MAT_ELEC_MCB           : 200,    // ₹/unit — 20A SP MCB
    MAT_ELEC_RCCB          : 1200,   // ₹/unit — 30mA RCCB
    MAT_ELEC_SWITCH_MOD    : 750,    // ₹/plate — modular switch plate (4 module)
    MAT_ELEC_SOCKET_5A     : 380,    // ₹/unit — 5A socket
    MAT_ELEC_SOCKET_16A    : 650,    // ₹/unit — 16A socket (AC/geyser)
    MAT_ELEC_EARTHING      : 3500,   // ₹/set  — pipe/plate chemical earthing pit (IS 3043)
    MAT_ELEC_UPS_INVERTER  : 25000,  // ₹/unit — pure sine wave home inverter + battery
    // MAT_ELEC_GENSET: ₹22,000/kVA installed rate for CPCB IV+ compliant acoustic DG set
    // (Cummins/Kirloskar/Mahindra) with AMF panel, acoustic enclosure, GI earthing,
    // exhaust piping and commissioning per CPWD DSR 2023 and Indian market norms.
    MAT_ELEC_GENSET        : 22000,  // ₹/kVA  — diesel generator set (CPCB IV+ acoustic, installed)
    MAT_ELEC_SOLAR_PANEL   : 38,     // ₹/W    — mono PERC solar panel
    MAT_ELEC_SOLAR_INV     : 12000,  // ₹/kW   — string inverter
    MAT_ELEC_CCTV          : 6000,   // ₹/camera — IP CCTV (4MP)
    MAT_ELEC_FIRE_ALARM    : 2500,   // ₹/detector — ionisation detector
    MAT_ELEC_FIRE_SPRINKLER: 4500,   // ₹/head — fire sprinkler (wet system)
    MAT_ELEC_ACCESS_CTRL   : 18000,  // ₹/door — access control system
    MAT_ELEC_INTERCOM      : 6500,   // ₹/unit — video door phone
    MAT_ELEC_AUTOMATION    : 85000,  // ₹/room — smart home per room
    MAT_ELEC_EV_CHARGER    : 35000,  // ₹/point — EV charging point (32A)
    MAT_ELEC_STREET_LIGHT  : 12000,  // ₹/unit — LED street light (site)
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
    MAT_PLUMB_PIPE_SWR     : 45,     // ₹/m    — SWR soil waste rain pipe
    MAT_PLUMB_PIPE_GI      : 220,    // ₹/m    — GI pipe (fire hydrant)
    MAT_PLUMB_GULLY        : 320,    // ₹/unit — floor trap / gully trap
    MAT_PLUMB_TANK_OHT     : 5.5,    // ₹/litre— HDPE overhead tank
    MAT_PLUMB_TANK_SUMP    : 3.8,    // ₹/litre— RCC underground sump
    MAT_PLUMB_PUMP_BOOSTER : 22000,  // ₹/set  — booster pump set
    MAT_PLUMB_PUMP_SEWAGE  : 18000,  // ₹/set  — sewage submersible pump
    MAT_PLUMB_STP          : 90000,  // ₹/KLD  — STP (MBR technology)
    MAT_PLUMB_RWH          : 45000,  // ₹/unit — rainwater harvesting system
    MAT_PLUMB_SOLAR_HWS    : 28000,  // ₹/unit — solar water heater (200LPD)
    MAT_PLUMB_SOFTENER     : 35000,  // ₹/unit — water softener system
    MAT_PLUMB_GAS_PIPE     : 180,    // ₹/m    — PNG gas piping (copper)
    MAT_PLUMB_GAS_METER    : 8000,   // ₹/unit — gas meter point

    // ── CAT_09: Flooring & Tiling ────────────────────────────────────────────
    MAT_FLOOR_CER          : 85,     // ₹/sqft — ceramic tile (installed, 600×600)
    MAT_FLOOR_VIT          : 145,    // ₹/sqft — vitrified tile (polished)
    MAT_FLOOR_VIT_LVT      : 210,    // ₹/sqft — LVT/SPC luxury vinyl tile
    MAT_FLOOR_MARBLE_IND   : 220,    // ₹/sqft — Indian white marble
    MAT_FLOOR_MARBLE_IMP   : 650,    // ₹/sqft — imported marble (Italian)
    MAT_FLOOR_GRANITE      : 240,    // ₹/sqft — Indian granite (polished)
    MAT_FLOOR_KOTA         : 70,     // ₹/sqft — Kota stone
    MAT_FLOOR_KADAPPA       : 58,     // ₹/sqft — Kadappa stone
    MAT_FLOOR_HARDWOOD     : 380,    // ₹/sqft — engineered hardwood
    MAT_FLOOR_LAMINATE     : 180,    // ₹/sqft — laminate flooring
    MAT_FLOOR_EPOXY        : 90,     // ₹/sqft — epoxy screed (industrial)
    MAT_FLOOR_IPS          : 45,     // ₹/sqft — IPS (industrial floor)
    MAT_FLOOR_MORTAR       : 20,     // ₹/sqft — mortar bed
    MAT_FLOOR_SKIRTING     : 60,     // ₹/rft  — tile skirting
    MAT_FLOOR_TRIM         : 45,     // ₹/rft  — aluminium trim strip
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
    MAT_PAINT_EPOXY_WALL   : 650,    // ₹/litre — epoxy wall paint (wet areas)
    MAT_PAINT_DAMP_PROOF   : 350,    // ₹/litre — Dr Fixit Dampguard etc
    MAT_PAINT_TEXTURE      : 150,    // ₹/sqft — texture paint (installed)
    MAT_PAINT_POLISHED      : 280,    // ₹/sqft — venetian plaster (premium)

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
    MAT_WOOD_HARDWARE      : 600,    // ₹/set  — cabinet hardware set
    MAT_WOOD_TV_UNIT       : 35000,  // ₹/unit — TV unit + back panel
    MAT_WOOD_SHOE_RACK     : 8000,   // ₹/unit — shoe rack
    MAT_WOOD_POOJA_MANDIR  : 25000,  // ₹/unit — pooja unit (teak)

    // ── CAT_12: Exterior Finishing & Cladding ───────────────────────────────
    MAT_EXT_PLAST          : 42,     // ₹/sqft — 20mm external cement plaster
    MAT_EXT_PAINT          : 35,     // ₹/sqft — exterior emulsion (2 coats)
    MAT_EXT_TEXTURE        : 95,     // ₹/sqft — texture coat (sand/pebble)
    MAT_EXT_CLADDING_ACP   : 480,    // ₹/sqft — ACP cladding installed
    MAT_EXT_CURTWALL       : 1300,   // ₹/sqft — structural glazing curtain wall
    MAT_EXT_CURTWALL_UHV   : 1850,   // ₹/sqft — unitised high-performance CW (Saint-Gobain Low-E DGU)
    MAT_EXT_STONE_CLADDING : 350,    // ₹/sqft — natural stone cladding
    MAT_EXT_TERRACOTTA     : 280,    // ₹/sqft — terracotta cladding
    MAT_EXT_COMPOSITE      : 380,    // ₹/sqft — composite/GRC panel
    MAT_EXT_BOUNDARY_WALL  : 1500,   // ₹/rmt  — 6ft compound wall
    MAT_EXT_GATE_MAIN      : 65000,  // ₹/unit — motorised sliding main gate
    MAT_EXT_GATE_PEDES     : 18000,  // ₹/unit — pedestrian gate
    MAT_EXT_PAVING         : 75,     // ₹/sqft — interlocking paver (external)
    MAT_EXT_ROAD_BITUMEN   : 180,    // ₹/sqft — internal road (60mm bitumen)
    MAT_EXT_LANDSCAPE      : 45,     // ₹/sqft — basic landscaping (turfing)
    MAT_EXT_LANDSCAPE_HARD : 250,    // ₹/sqft — hardscaping (granite paving)
    MAT_EXT_WATER_FEATURE  : 180000, // ₹/unit — water feature / fountain

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
    MAT_HVAC_CHILLER       : 180000, // ₹/ton  — screw chiller (large commercial)
    MAT_HVAC_DUCT_INSUL    : 280,    // ₹/sqft — insulated ducting
    MAT_HVAC_FRESH_AIR     : 35,     // ₹/sqft — fresh air ventilation
    MAT_FIRE_HYDRANT       : 85000,  // ₹/set  — wet riser hydrant system per floor
    MAT_FIRE_PUMP_SET      : 250000, // ₹/set  — fire pump set (main+jockey+diesel)
    MAT_FIRE_SUPPRESSION   : 220,    // ₹/sqft — FM200 / clean agent system
    MAT_FIRE_EXTINGUISHER  : 2500,   // ₹/unit — ABC CO2 extinguisher
    MAT_FIRE_SPRINKLER     : 4500,   // ₹/head — fire sprinkler head (wet pipe, IS 15105)
    MAT_BMS_SYSTEM         : 180000, // ₹/floor— BMS per floor (commercial)
    MAT_EXHAUST_FAN        : 3500,   // ₹/unit — axial exhaust fan
    MAT_PRESSUR_VESTIBULE  : 45000,  // ₹/floor— pressurization (high-rise)

    // ── CAT_15: Parking & Basement ──────────────────────────────────────────
    MAT_PARK_RCC_EXCAV     : 480,    // ₹/cu.m — basement excavation + strutting + carting (CPWD DSR 2024)
    MAT_PARK_RCC_WALLS     : 7200,   // ₹/cu.m — M30 basement retaining wall
    MAT_PARK_FLOOR_SCREED  : 55,     // ₹/sqft — 75mm floor screed
    MAT_PARK_LINING        : 95,     // ₹/sqft — basement WP + lining
    MAT_PARK_VENTILATION   : 280,    // ₹/sqft — basement ventilation
    MAT_PARK_PUMP_SUMP     : 25000,  // ₹/set  — stormwater / de-watering pump
    MAT_PARK_STRIPING      : 120,    // ₹/bay  — parking bay markings
    MAT_PARK_MECHANICAL    : 1800000,// ₹/unit — 2-level mechanical parker
    MAT_PARK_EV_CHARGING   : 35000,  // ₹/point— EV charging in parking

    // ── CAT_16: Swimming Pool & Recreational ─────────────────────────────────
    MAT_POOL_EXCAV         : 7200,   // ₹/cu.m
    MAT_POOL_RCC           : 8500,   // ₹/cu.m — M35 WS pool concrete
    MAT_POOL_TILE          : 380,    // ₹/sqft — pool tile (vitrified)
    MAT_POOL_MOSAIC        : 550,    // ₹/sqft — mosaic tile
    MAT_POOL_PUMP_FILTER   : 180000, // ₹/set  — filtration + pump system
    MAT_POOL_CHLORINATOR   : 45000,  // ₹/set  — salt chlorination system
    MAT_POOL_LIGHTING      : 8500,   // ₹/unit — underwater LED pool light
    MAT_GYM_EQUIP          : 4500,   // ₹/sqft — gym equipment + flooring
    MAT_CLUB_FINISH        : 2500,   // ₹/sqft — clubhouse premium finishing

    // ── CAT_17: Solar & Green Building ──────────────────────────────────────
    MAT_SOLAR_PANEL_ROO    : 38,     // ₹/Wp   — rooftop solar panel
    MAT_SOLAR_INV_ROO      : 12000,  // ₹/kW   — grid-tied inverter
    MAT_SOLAR_STRUC        : 2000,   // ₹/module— mounting structure
    MAT_SOLAR_WIRING       : 5000,   // ₹/kW   — DC wiring harness
    MAT_GREEN_RAINWATER    : 45000,  // ₹/unit — RWH system
    MAT_GREEN_DUAL_FLUSH   : 12000,  // ₹/unit — dual-flush valve set
    MAT_GREEN_DAYLIGHT     : 35000,  // ₹/unit — daylight harvesting sensor
    MAT_GREEN_IGBC_CONSULT : 350000, // ₹/lump — IGBC certification consulting
    MAT_GREEN_GRIHA        : 280000, // ₹/lump — GRIHA certification

    // ── CAT_18: Preliminaries, Site & Miscellaneous ──────────────────────────
    // CAT_18 is auto-computed as 3.5% of all other categories (miscPct)
    // The following rates are used for high-rise / complex additions
    MAT_MISC_SCAFFOLD      : 18,     // ₹/sqft/month — external scaffolding
    MAT_MISC_TOWER_CRANE   : 180000, // ₹/month — tower crane hire
    MAT_MISC_HOIST         : 45000,  // ₹/month — material hoist
    MAT_MISC_TEMP_ELEC     : 25000,  // ₹/month — temporary electrical
    MAT_MISC_SAFETY        : 12,     // ₹/sqft — safety net + hoarding
    MAT_MISC_QC_TESTING    : 8,      // ₹/sqft — soil test, concrete cube test
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
      MAT_FLOOR_SKIRTING    : 'Marble Skirting (matching floor, 20mm)',
      MAT_CEIL_GYPS         : 'Gypsum Board with Acoustic Insulation',
      MAT_HVAC_VRF          : 'Daikin VRV / Mitsubishi VRF (COP 4.0+)',
      MAT_WOOD_KITCH_PREM   : 'Hettich/Hafele Hardware, HDF Acrylic Shutters',
    },
  },
};

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
  'pune': 'Zone_III', 'kolkata': 'Zone_III', 'ahmedabad': 'Zone_III',
  'lucknow': 'Zone_III', 'kanpur': 'Zone_III', 'kochi': 'Zone_III',
  'bhubaneswar': 'Zone_III', 'agra': 'Zone_III', 'varanasi': 'Zone_III',
  'coimbatore': 'Zone_III', 'allahabad': 'Zone_III', 'prayagraj': 'Zone_III',
  'jaipur': 'Zone_III', 'ajmer': 'Zone_III', 'bhopal': 'Zone_III',
  'ujjain': 'Zone_III', 'jabalpur': 'Zone_III', 'raipur': 'Zone_III',
  'ranchi': 'Zone_III', 'jamshedpur': 'Zone_III', 'vadodara': 'Zone_III',
  'rajkot': 'Zone_III', 'panaji': 'Zone_III', 'goa': 'Zone_III',
  'mangaluru': 'Zone_III', 'mangalore': 'Zone_III', 'surat': 'Zone_III',
  'thiruvananthapuram': 'Zone_III', 'kozhikode': 'Zone_III',
  'aligarh': 'Zone_III', 'mathura': 'Zone_III', 'firozabad': 'Zone_III',
  'gorakhpur': 'Zone_III', 'jhansi': 'Zone_III',
  // Zone II
  'bangalore': 'Zone_II', 'bengaluru': 'Zone_II', 'hyderabad': 'Zone_II',
  'secunderabad': 'Zone_II', 'nagpur': 'Zone_II', 'jodhpur': 'Zone_II',
  'indore': 'Zone_II', 'visakhapatnam': 'Zone_II', 'vijayawada': 'Zone_II',
  'mysuru': 'Zone_II', 'mysore': 'Zone_II', 'hubli': 'Zone_II',
  'belgaum': 'Zone_II', 'belagavi': 'Zone_II', 'dharwad': 'Zone_II',
  'madurai': 'Zone_II', 'trichy': 'Zone_II', 'salem': 'Zone_II',
  'tirunelveli': 'Zone_II', 'vellore': 'Zone_II', 'chennai': 'Zone_II',
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
  // Exact first
  if (loc in REGIONAL_RATE_INDEX && loc !== 'default') {
    return { index: REGIONAL_RATE_INDEX[loc], matchedCity: loc };
  }
  // Partial match — longest key wins for specificity
  let best: { key: string; index: number } | null = null;
  for (const [city, index] of Object.entries(REGIONAL_RATE_INDEX)) {
    if (city === 'default') continue;
    if (loc.includes(city) || city.includes(loc)) {
      if (!best || city.length > best.key.length) best = { key: city, index };
    }
  }
  if (best) return { index: best.index, matchedCity: best.key };
  return { index: REGIONAL_RATE_INDEX.default, matchedCity: null };
}

export function lookupSeismicZone(location: string): SeismicZone | null {
  const loc = location.toLowerCase().trim();
  for (const [city, zone] of Object.entries(SEISMIC_ZONE_LOOKUP)) {
    if (loc.includes(city) || city.includes(loc)) return zone as SeismicZone;
  }
  return null;
}
