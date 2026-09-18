// lib/engine/estimator.ts — OUTSYD World-Class Edition
// 18 categories | 200+ line items | Research-validated quantities
// Pure function — zero side effects. Same inputs + dataset = identical output.

import type {
  FullInput, EstimateLineItem, CoefficientDataset,
  ClassificationResult, DerivedDimensions, RoomCounts, FloorTier, QualityTier,
} from './types';
import { DEFAULT_DATASET } from './coefficients';
import { CATEGORY_NAMES } from '../constants';

// ─── Item name map ────────────────────────────────────────────────────────────
const ITEM_NAMES: Record<string, { name: string; category: string }> = {
  // CAT_01 — Substructure & Excavation
  MAT_FOUND_EXCAV        : { name: 'Mechanical Excavation',                   category: 'CAT_01' },
  MAT_FOUND_EXCAV_ROCK   : { name: 'Rock Excavation (Blasting)',              category: 'CAT_01' },
  MAT_FOUND_PCC          : { name: 'PCC Plain Concrete (1:4:8)',              category: 'CAT_01' },
  MAT_FOUND_CONC         : { name: 'RCC Foundation Concrete',                category: 'CAT_01' },
  MAT_FOUND_RAFT         : { name: 'Raft Foundation Concrete (M25)',          category: 'CAT_01' },
  MAT_FOUND_PILE         : { name: 'Bored Pile Concrete (M25)',               category: 'CAT_01' },
  MAT_FOUND_PILE_STEEL   : { name: 'Pile Reinforcement Steel',               category: 'CAT_01' },
  MAT_FOUND_STEEL        : { name: 'Foundation Reinforcement (Fe 500D)',      category: 'CAT_01' },
  MAT_FOUND_DPC          : { name: 'Damp Proof Course (75mm)',               category: 'CAT_01' },
  MAT_FOUND_ANTITERM     : { name: 'Anti-termite Soil Treatment (IS 6313)',  category: 'CAT_01' },
  MAT_FOUND_BACKFILL     : { name: 'Compacted Earth Back-fill',              category: 'CAT_01' },
  MAT_FOUND_FORMWORK     : { name: 'Foundation Shuttering (Plywood)',        category: 'CAT_01' },
  MAT_FOUND_WATERBAR     : { name: 'PVC Waterstop (Foundation Joints)',      category: 'CAT_01' },
  MAT_FOUND_CURING       : { name: 'Curing Compound (Foundation)',           category: 'CAT_01' },

  // CAT_02 — RCC Superstructure
  MAT_RCC_CEMENT         : { name: 'Cement — OPC/PPC (50kg bags)',           category: 'CAT_02' },
  MAT_RCC_STEEL          : { name: 'TMT Steel Bars (Fe 500D)',                category: 'CAT_02' },
  MAT_RCC_STEEL_550D     : { name: 'TMT Steel Bars (Fe 550D — High-Rise)',   category: 'CAT_02' },
  MAT_RCC_SAND           : { name: 'M-Sand / River Sand',                    category: 'CAT_02' },
  MAT_RCC_AGGREGATE_20MM : { name: 'Coarse Aggregate 20mm',                  category: 'CAT_02' },
  MAT_RCC_AGGREGATE_10MM : { name: 'Fine Aggregate 10mm (Slab Top)',         category: 'CAT_02' },
  MAT_RCC_FORMWORK       : { name: 'Column & Beam Shuttering',               category: 'CAT_02' },
  MAT_RCC_SLAB_FORM      : { name: 'Slab Soffit Shuttering',                 category: 'CAT_02' },
  MAT_RCC_BINDING_WIRE   : { name: 'Binding Wire',                           category: 'CAT_02' },
  MAT_RCC_SPACERS        : { name: 'PVC Cover Blocks / Spacers',             category: 'CAT_02' },
  MAT_RCC_ADMIX          : { name: 'Superplasticiser Admixture',             category: 'CAT_02' },
  MAT_RCC_FLYASH         : { name: 'Fly Ash (PPC Blend)',                    category: 'CAT_02' },
  MAT_RCC_HIGH_CONC      : { name: 'M40 High-Strength Concrete (G15+)',      category: 'CAT_02' },
  MAT_RCC_COL_CONC       : { name: 'Column & Core Concrete (M25-M35)',       category: 'CAT_02' },
  MAT_RCC_GROUT          : { name: 'Non-Shrink Grout (Column Bases)',        category: 'CAT_02' },
  MAT_STEEL_STRUCT       : { name: 'Structural Steel Sections',              category: 'CAT_02' },

  // CAT_03 — Masonry & Internal Plaster
  MAT_MASON_BRICK        : { name: 'Clay Bricks (FPS, 9" wall)',             category: 'CAT_03' },
  MAT_MASON_BLOCK        : { name: 'AAC Blocks (600×200×200mm)',             category: 'CAT_03' },
  MAT_MASON_FLY_BRICK    : { name: 'Fly Ash Bricks (7.5 N/mm²)',            category: 'CAT_03' },
  MAT_MASON_HOLLOW_CONC  : { name: 'Hollow Concrete Blocks',                category: 'CAT_03' },
  MAT_MASON_CEMENT       : { name: 'Masonry Mortar Cement',                 category: 'CAT_03' },
  MAT_MASON_SAND         : { name: 'Plastering & Masonry Sand',             category: 'CAT_03' },
  MAT_MASON_LINTEL       : { name: 'Lintel Beam Concrete (M20)',            category: 'CAT_03' },
  MAT_MASON_PARAPET      : { name: 'Parapet Wall (0.9m ht)',                category: 'CAT_03' },
  MAT_PLAST_INT          : { name: 'Internal Plaster (12mm, 1:6)',           category: 'CAT_03' },
  MAT_PLAST_EXT          : { name: 'External Plaster (20mm, 1:4)',           category: 'CAT_03' },
  MAT_PLAST_POP          : { name: 'POP Skim Coat (Finish)',                 category: 'CAT_03' },
  MAT_PLAST_GYPSUM       : { name: 'Gypsum Plaster (IS 2547)',              category: 'CAT_03' },
  MAT_PLAST_CEMENT       : { name: 'Plastering Cement',                     category: 'CAT_03' },

  // CAT_04 — Waterproofing & Chemical
  MAT_WP_IPS             : { name: 'IPS Cement Screed Waterproofing',       category: 'CAT_04' },
  MAT_WP_LIQ_PU          : { name: 'Liquid PU Waterproofing Membrane',      category: 'CAT_04' },
  MAT_WP_LIQ_ACR         : { name: 'Acrylic Cementitious WP Coating',       category: 'CAT_04' },
  MAT_WP_CRYS            : { name: 'Crystalline Waterproofing (IS 6925)',   category: 'CAT_04' },
  MAT_WP_TORCH           : { name: 'Torch-Applied Bitumen Membrane',        category: 'CAT_04' },
  MAT_WP_BATH            : { name: 'Bathroom Cementitious WP',              category: 'CAT_04' },
  MAT_WP_KITCH           : { name: 'Kitchen Waterproof Coating',            category: 'CAT_04' },
  MAT_WP_BASEMENT        : { name: 'Basement Tanking System',               category: 'CAT_04' },
  MAT_WP_EXPANSION       : { name: 'Expansion Joint Sealant (Polysulfide)', category: 'CAT_04' },
  MAT_ANTITERM_CHEMICAL  : { name: 'Anti-Termite Spray Chemical',          category: 'CAT_04' },

  // CAT_05 — Roofing & False Ceiling
  MAT_ROOF_TERRACE       : { name: 'Terrace Finish + Waterproofing',        category: 'CAT_05' },
  MAT_ROOF_SLOPE         : { name: 'Sloped RCC Roof + WP',                  category: 'CAT_05' },
  MAT_ROOF_METAL_DECK    : { name: 'Metal Deck Roofing',                    category: 'CAT_05' },
  MAT_ROOF_GI_SHEET      : { name: 'Galvalume / Profiled Roof Sheeting',    category: 'CAT_05' },
  MAT_CEIL_POP           : { name: 'POP False Ceiling (Installed)',         category: 'CAT_05' },
  MAT_CEIL_GYPS          : { name: 'Gypsum Board False Ceiling',            category: 'CAT_05' },
  MAT_CEIL_GRID          : { name: 'Metal Grid Ceiling (Commercial)',       category: 'CAT_05' },
  MAT_CEIL_ACOU          : { name: 'Acoustic Ceiling Tiles',                category: 'CAT_05' },
  MAT_CEIL_WOODEN        : { name: 'Wooden / Bamboo Ceiling',               category: 'CAT_05' },
  MAT_CEIL_STRETCH       : { name: 'Stretch / PVC Ceiling (Premium)',       category: 'CAT_05' },

  // CAT_06 — Doors, Windows & Glazing
  MAT_DOOR_FLUSH         : { name: 'Flush Door (Internal)',                 category: 'CAT_06' },
  MAT_DOOR_PANEL         : { name: 'Panel Door (Main Entrance)',            category: 'CAT_06' },
  MAT_DOOR_TEAK          : { name: 'Teak Wood Main Entrance Door',          category: 'CAT_06' },
  MAT_DOOR_FRP           : { name: 'FRP Bathroom Door (Water-Resistant)',   category: 'CAT_06' },
  MAT_DOOR_SLIDE         : { name: 'Sliding / Folding Door',               category: 'CAT_06' },
  MAT_DOOR_SECURITY      : { name: 'Steel Security Door',                  category: 'CAT_06' },
  MAT_DOOR_FIRE_RATED    : { name: '2-Hr Fire-Rated Door (IS 3614)',       category: 'CAT_06' },
  MAT_DOOR_FRAME         : { name: 'Door Frame',                            category: 'CAT_06' },
  MAT_DOOR_HARDWARE      : { name: 'Door Hardware Set (Lock + Hinges)',     category: 'CAT_06' },
  MAT_WIN_ALUM           : { name: 'Aluminium Window (Fabricated)',         category: 'CAT_06' },
  MAT_WIN_UPVC           : { name: 'UPVC Sliding Window',                   category: 'CAT_06' },
  MAT_WIN_THERMBREAK     : { name: 'Thermally-Broken Aluminium Window',    category: 'CAT_06' },
  MAT_WIN_GLASS_TOUGHENED: { name: 'Toughened Glass (12mm)',               category: 'CAT_06' },
  MAT_WIN_GLASS_DBLE     : { name: 'Double-Glazed Unit (Low-E)',           category: 'CAT_06' },
  MAT_WIN_HARDWARE       : { name: 'Window Hardware Set',                   category: 'CAT_06' },
  MAT_GRILLE             : { name: 'MS Window Grille (Painted)',            category: 'CAT_06' },
  MAT_VENT               : { name: 'Ventilator (Aluminium Louvre)',         category: 'CAT_06' },

  // CAT_07 — Electrical & Low-Voltage
  MAT_ELEC_POINT         : { name: 'Electrical Point (Complete)',           category: 'CAT_07' },
  MAT_ELEC_WIRE_2_5      : { name: 'FRLS Wire 2.5 sq.mm (Power)',          category: 'CAT_07' },
  MAT_ELEC_WIRE_1_5      : { name: 'FRLS Wire 1.5 sq.mm (Lighting)',       category: 'CAT_07' },
  MAT_ELEC_WIRE_6        : { name: 'FRLS Wire 6 sq.mm (Heavy Loads)',      category: 'CAT_07' },
  MAT_ELEC_CONDUIT_25    : { name: 'PVC Conduit 25mm',                     category: 'CAT_07' },
  MAT_ELEC_DB_MAIN       : { name: 'Main LT Panel / MCCB Board',           category: 'CAT_07' },
  MAT_ELEC_DB_FLOOR      : { name: 'Floor Distribution Board (MCB)',       category: 'CAT_07' },
  MAT_ELEC_MCB           : { name: 'MCB (20A SP)',                          category: 'CAT_07' },
  MAT_ELEC_RCCB          : { name: 'RCCB 30mA (Safety)',                   category: 'CAT_07' },
  MAT_ELEC_SWITCH_MOD    : { name: 'Modular Switch Plate (4-Module)',       category: 'CAT_07' },
  MAT_ELEC_SOCKET_16A    : { name: '16A Power Socket (AC / Geyser)',       category: 'CAT_07' },
  MAT_ELEC_EARTHING      : { name: 'Earthing System (IS 3043)',             category: 'CAT_07' },
  MAT_ELEC_GENSET        : { name: 'Diesel Generator Set (DG)',             category: 'CAT_07' },
  MAT_ELEC_UPS_INVERTER  : { name: 'Online UPS / Inverter',                category: 'CAT_07' },
  MAT_ELEC_CCTV          : { name: 'CCTV Camera (4MP IP)',                  category: 'CAT_07' },
  MAT_ELEC_FIRE_ALARM    : { name: 'Fire Alarm Detector',                  category: 'CAT_07' },
  MAT_ELEC_ACCESS_CTRL   : { name: 'Access Control System',                category: 'CAT_07' },
  MAT_ELEC_INTERCOM      : { name: 'Video Door Phone / Intercom',          category: 'CAT_07' },
  MAT_ELEC_EV_CHARGER    : { name: 'EV Charging Point (32A)',              category: 'CAT_07' },
  MAT_ELEC_BUSDUCT       : { name: 'Bus Duct (Rising Main)',               category: 'CAT_07' },
  MAT_ELEC_CABLE_TRAY    : { name: 'Perforated Cable Tray (150mm)',        category: 'CAT_07' },

  // CAT_08 — Plumbing, Sanitary & STP
  MAT_PLUMB_WC           : { name: 'Water Closet Suite (EWC)',              category: 'CAT_08' },
  MAT_PLUMB_EWC          : { name: 'Wall-Hung WC (Premium)',               category: 'CAT_08' },
  MAT_PLUMB_WASH         : { name: 'Wash Basin',                           category: 'CAT_08' },
  MAT_PLUMB_URINAL       : { name: 'Commercial Urinal (Sensor Flush)',     category: 'CAT_08' },
  MAT_PLUMB_BATH         : { name: 'Shower Cubicle (Glass)',               category: 'CAT_08' },
  MAT_PLUMB_BATHTUB      : { name: 'Free-Standing Bathtub',                category: 'CAT_08' },
  MAT_PLUMB_SINK_SS      : { name: 'Kitchen Sink (SS Double Bowl)',        category: 'CAT_08' },
  MAT_PLUMB_FAUCET_BASIN : { name: 'Basin Mixer Tap',                      category: 'CAT_08' },
  MAT_PLUMB_FAUCET_BATH  : { name: 'Bath / Shower Mixer',                  category: 'CAT_08' },
  MAT_PLUMB_FAUCET_KITCH : { name: 'Kitchen Mixer Tap',                    category: 'CAT_08' },
  MAT_PLUMB_PIPE_CPVC    : { name: 'CPVC Pipe (Hot & Cold Supply)',        category: 'CAT_08' },
  MAT_PLUMB_PIPE_PPR     : { name: 'PPR Pipe (Hot & Cold)',                category: 'CAT_08' },
  MAT_PLUMB_PIPE_PVC     : { name: 'PVC Drainage Pipe (SWR)',              category: 'CAT_08' },
  MAT_PLUMB_PIPE_GI      : { name: 'GI Pipe (Fire Hydrant)',               category: 'CAT_08' },
  MAT_PLUMB_GULLY        : { name: 'Floor Trap / Gully Trap',              category: 'CAT_08' },
  MAT_PLUMB_TANK_OHT     : { name: 'Overhead Water Tank (HDPE)',           category: 'CAT_08' },
  MAT_PLUMB_TANK_SUMP    : { name: 'Underground Sump (RCC)',               category: 'CAT_08' },
  MAT_PLUMB_PUMP_BOOSTER : { name: 'Booster Pump Set',                    category: 'CAT_08' },
  MAT_PLUMB_PUMP_SEWAGE  : { name: 'Sewage Submersible Pump',             category: 'CAT_08' },
  MAT_PLUMB_STP          : { name: 'Sewage Treatment Plant (MBR)',        category: 'CAT_08' },
  MAT_PLUMB_SOLAR_HWS    : { name: 'Solar Water Heater (200 LPD)',        category: 'CAT_08' },
  MAT_PLUMB_GAS_PIPE     : { name: 'PNG Gas Piping (Copper)',              category: 'CAT_08' },

  // CAT_09 — Flooring & Tiling
  MAT_FLOOR_CER          : { name: 'Ceramic Floor Tile (600×600)',         category: 'CAT_09' },
  MAT_FLOOR_VIT          : { name: 'Double-Charge Vitrified Tile',         category: 'CAT_09' },
  MAT_FLOOR_VIT_LVT      : { name: 'Luxury Vinyl Tile (LVT/SPC)',         category: 'CAT_09' },
  MAT_FLOOR_MARBLE_IND   : { name: 'Indian Marble Flooring (Polished)',    category: 'CAT_09' },
  MAT_FLOOR_MARBLE_IMP   : { name: 'Imported Marble (Italian/Spanish)',    category: 'CAT_09' },
  MAT_FLOOR_GRANITE      : { name: 'Granite Flooring (Indian, Polished)',  category: 'CAT_09' },
  MAT_FLOOR_KOTA         : { name: 'Kota Stone Flooring',                  category: 'CAT_09' },
  MAT_FLOOR_HARDWOOD     : { name: 'Engineered Hardwood Flooring',         category: 'CAT_09' },
  MAT_FLOOR_EPOXY        : { name: 'Epoxy Screed Floor (Industrial)',      category: 'CAT_09' },
  MAT_FLOOR_IPS          : { name: 'IPS Floor (Cement Concrete)',           category: 'CAT_09' },
  MAT_FLOOR_MORTAR       : { name: 'Mortar Bed for Tiling',                category: 'CAT_09' },
  MAT_FLOOR_SKIRTING     : { name: 'Floor Skirting',                       category: 'CAT_09' },
  MAT_FLOOR_DADO_BATH    : { name: 'Bathroom Wall Tile (Dado, upto 7ft)',  category: 'CAT_09' },
  MAT_FLOOR_DADO_KITCH   : { name: 'Kitchen Dado Tile (3ft)',              category: 'CAT_09' },

  // CAT_10 — Wall Finishing & Painting
  MAT_PAINT_PUTTY        : { name: 'White Cement Wall Putty',              category: 'CAT_10' },
  MAT_PAINT_PRIMER       : { name: 'Interior PVA Primer',                  category: 'CAT_10' },
  MAT_PAINT_INT_EMU      : { name: 'Interior Emulsion Paint (2 coats)',    category: 'CAT_10' },
  MAT_PAINT_INT_LUSTER   : { name: 'Interior Semi-Gloss / Lustre Paint',  category: 'CAT_10' },
  MAT_PAINT_EXT_EMU      : { name: 'Exterior Emulsion (Weathershield)',    category: 'CAT_10' },
  MAT_PAINT_EXT_ELAST    : { name: 'Exterior Elastomeric Paint',           category: 'CAT_10' },
  MAT_PAINT_DISTEM       : { name: 'Distemper (Economy Finish)',           category: 'CAT_10' },
  MAT_PAINT_TEXTURE      : { name: 'Texture Paint (Interior)',             category: 'CAT_10' },

  // CAT_11 — Modular Kitchen, Joinery & Woodwork
  MAT_WOOD_KITCH         : { name: 'Modular Kitchen (Standard, per Lft)', category: 'CAT_11' },
  MAT_WOOD_KITCH_ECO     : { name: 'Modular Kitchen (Economy, per Lft)',  category: 'CAT_11' },
  MAT_WOOD_KITCH_PREM    : { name: 'Modular Kitchen (Premium HDF/PU)',    category: 'CAT_11' },
  MAT_WOOD_CARPEN        : { name: 'General Carpentry & Joinery',         category: 'CAT_11' },
  MAT_WOOD_WARDROBE      : { name: 'Wardrobe (Full, HDF Laminate)',       category: 'CAT_11' },
  MAT_WOOD_WARDROBE_PREM : { name: 'Walk-in Wardrobe (Premium)',          category: 'CAT_11' },
  MAT_WOOD_LOFT          : { name: 'Loft / Storage Unit (per Rft)',       category: 'CAT_11' },
  MAT_WOOD_STUDY_TABLE   : { name: 'Study Desk & Work Table Unit',        category: 'CAT_11' },
  MAT_WOOD_PANEL         : { name: 'Decorative Wall Panelling',           category: 'CAT_11' },
  MAT_WOOD_POLISH        : { name: 'Melamine / PU Polish',                category: 'CAT_11' },
  MAT_WOOD_TV_UNIT       : { name: 'TV Unit + Back Panel',                category: 'CAT_11' },
  MAT_WOOD_POOJA_MANDIR  : { name: 'Pooja Mandir Unit (Teak)',            category: 'CAT_11' },

  // CAT_12 — Exterior Finishing & Cladding
  MAT_EXT_PLAST          : { name: 'External Cement Plaster (20mm)',       category: 'CAT_12' },
  MAT_EXT_PAINT          : { name: 'Exterior Paint (2 coats)',             category: 'CAT_12' },
  MAT_EXT_TEXTURE        : { name: 'Exterior Texture Coat (Sand/Pebble)', category: 'CAT_12' },
  MAT_EXT_CLADDING_ACP   : { name: 'ACP Cladding (Installed)',            category: 'CAT_12' },
  MAT_EXT_CURTWALL       : { name: 'Structural Glazing Curtain Wall',     category: 'CAT_12' },
  MAT_EXT_CURTWALL_UHV   : { name: 'Unitised High-Performance Curtain Wall', category: 'CAT_12' },
  MAT_EXT_STONE_CLADDING : { name: 'Natural Stone Cladding',              category: 'CAT_12' },
  MAT_EXT_BOUNDARY_WALL  : { name: 'Compound Boundary Wall (6ft)',        category: 'CAT_12' },
  MAT_EXT_GATE_MAIN      : { name: 'Motorised Sliding Main Gate',         category: 'CAT_12' },
  MAT_EXT_GATE_PEDES     : { name: 'Manual Swing Main / Pedestrian Gate', category: 'CAT_12' },
  MAT_EXT_PAVING         : { name: 'Interlocking Paver (External)',       category: 'CAT_12' },
  MAT_EXT_ROAD_BITUMEN   : { name: 'Internal Road (60mm Bitumen)',        category: 'CAT_12' },
  MAT_EXT_LANDSCAPE      : { name: 'Landscaping (Turfing & Planting)',    category: 'CAT_12' },

  // CAT_13 — Staircase, Railings & Lifts
  MAT_STAIR_CONC         : { name: 'Staircase RCC Concrete (M25)',        category: 'CAT_13' },
  MAT_STAIR_STEEL        : { name: 'Staircase Reinforcement (Fe 500D)',   category: 'CAT_13' },
  MAT_STAIR_RAILING_SS   : { name: 'Staircase Railing (SS 304)',          category: 'CAT_13' },
  MAT_STAIR_RAILING_MS   : { name: 'Staircase Railing (MS Painted)',      category: 'CAT_13' },
  MAT_STAIR_RAILING_GLASS: { name: 'Frameless Glass Railing',             category: 'CAT_13' },
  MAT_STAIR_MARBLE       : { name: 'Marble Stair Treads',                 category: 'CAT_13' },
  MAT_STAIR_GRANITE      : { name: 'Granite Stair Treads',                category: 'CAT_13' },
  MAT_LIFT_4P            : { name: 'Passenger Elevator (4-Person)',       category: 'CAT_13' },
  MAT_LIFT_8P            : { name: 'Passenger Elevator (8-Person)',       category: 'CAT_13' },
  MAT_LIFT_13P           : { name: 'Passenger Elevator (13-Person)',      category: 'CAT_13' },
  MAT_LIFT_HYDRO         : { name: 'Hydraulic Lift (Low-Rise)',           category: 'CAT_13' },

  // CAT_14 — HVAC, Fire Protection & MEP
  MAT_HVAC_SPLIT         : { name: 'Split Air Conditioner (per ton)',      category: 'CAT_14' },
  MAT_HVAC_CASSET        : { name: 'Cassette AC (Concealed)',              category: 'CAT_14' },
  MAT_HVAC_VRF           : { name: 'VRF / VRV System (per ton)',           category: 'CAT_14' },
  MAT_HVAC_CENTRAL_AHU   : { name: 'Central AHU with Ducting (per ton)',  category: 'CAT_14' },
  MAT_HVAC_DUCT_INSUL    : { name: 'Insulated Ducting (per sqft)',        category: 'CAT_14' },
  MAT_HVAC_FRESH_AIR     : { name: 'Fresh Air Ventilation Unit',          category: 'CAT_14' },
  MAT_FIRE_HYDRANT       : { name: 'Wet Riser Fire Hydrant (per floor)',  category: 'CAT_14' },
  MAT_FIRE_PUMP_SET      : { name: 'Fire Pump Set (Main+Jockey+Diesel)',  category: 'CAT_14' },
  MAT_FIRE_SPRINKLER     : { name: 'Fire Sprinkler Head (Wet System)',    category: 'CAT_14' },
  MAT_FIRE_EXTINGUISHER  : { name: 'ABC Fire Extinguisher',               category: 'CAT_14' },
  MAT_EXHAUST_FAN        : { name: 'Axial Exhaust Fan',                   category: 'CAT_14' },

  // CAT_15 — Parking & Basement
  MAT_PARK_RCC_EXCAV     : { name: 'Basement Excavation + Strutting',     category: 'CAT_15' },
  MAT_PARK_RCC_WALLS     : { name: 'Basement Retaining Wall (M30)',       category: 'CAT_15' },
  MAT_PARK_FLOOR_SCREED  : { name: 'Basement Floor Screed (75mm)',        category: 'CAT_15' },
  MAT_PARK_LINING        : { name: 'Basement WP Lining + Tanking',       category: 'CAT_15' },
  MAT_PARK_VENTILATION   : { name: 'Basement Ventilation System',         category: 'CAT_15' },
  MAT_PARK_PUMP_SUMP     : { name: 'Storm / De-watering Sump Pump',      category: 'CAT_15' },
  MAT_PARK_STRIPING      : { name: 'Parking Bay Markings & Signage',     category: 'CAT_15' },
  MAT_PARK_EV_CHARGING   : { name: 'EV Charging Point (Parking)',         category: 'CAT_15' },

  // CAT_16 — Swimming Pool & Recreation
  MAT_POOL_EXCAV         : { name: 'Pool Excavation',                     category: 'CAT_16' },
  MAT_POOL_RCC           : { name: 'Pool Structure RCC (M35 WS)',         category: 'CAT_16' },
  MAT_POOL_TILE          : { name: 'Pool Tile (Vitrified Anti-slip)',     category: 'CAT_16' },
  MAT_POOL_PUMP_FILTER   : { name: 'Pool Filtration + Pump System',      category: 'CAT_16' },
  MAT_POOL_CHLORINATOR   : { name: 'Salt Chlorination System',            category: 'CAT_16' },
  MAT_GYM_EQUIP          : { name: 'Gymnasium Equipment + Flooring',     category: 'CAT_16' },
  MAT_CLUB_FINISH        : { name: 'Clubhouse Premium Finishing',         category: 'CAT_16' },

  // CAT_17 — Solar & Green Building
  MAT_SOLAR_PANEL_ROO    : { name: 'Rooftop Solar Panels (per Wp)',       category: 'CAT_17' },
  MAT_SOLAR_INV_ROO      : { name: 'Grid-Tied Inverter (per kW)',         category: 'CAT_17' },
  MAT_GREEN_RAINWATER    : { name: 'Rainwater Harvesting System',         category: 'CAT_17' },
  MAT_GREEN_DUAL_FLUSH   : { name: 'Dual-Flush Valve Set',               category: 'CAT_17' },

  // CAT_18 — Preliminaries & Miscellaneous
  MAT_MISC_TOTAL         : { name: 'Prelim., Site, Contingency (3.5%)',  category: 'CAT_18' },
  MAT_MISC_SCAFFOLD      : { name: 'High-Rise Suspended Scaffold / Cradle',category: 'CAT_18' },
};

// Dev-time invariant: verify every ITEM_NAMES key resolves to a valid rate in DEFAULT_DATASET.rates
if (process.env.NODE_ENV !== 'production') {
  for (const itemCode of Object.keys(ITEM_NAMES)) {
    if (itemCode === 'MAT_MISC_TOTAL') continue;
    if (typeof DEFAULT_DATASET.rates[itemCode] !== 'number') {
      throw new Error(
        `Engine Invariant Violation (C-6): ITEM_NAMES key '${itemCode}' lacks a rate in DEFAULT_DATASET.rates.`,
      );
    }
  }
}


// ─── Room counts & unit density ─────────────────────────────────────────────
function deriveRoomCounts(
  use: string, numFloors: number, unitsPerFloor = 1,
  typology = 'Residential', buaPerFloor = 1000,
): RoomCounts {
  const u = use.toLowerCase();
  let doors = 7, windows = 8, bathrooms = 2, kitchens = 1;

  if      (u.includes('studio'))                            { doors = 3;  windows = 4;  bathrooms = 1; kitchens = 1; }
  else if (u.includes('1bhk') || u.includes('1 bhk'))      { doors = 5;  windows = 6;  bathrooms = 1; kitchens = 1; }
  else if (u.includes('2bhk') || u.includes('2 bhk'))      { doors = 7;  windows = 8;  bathrooms = 2; kitchens = 1; }
  else if (u.includes('3bhk') || u.includes('3 bhk'))      { doors = 9;  windows = 10; bathrooms = 3; kitchens = 1; }
  else if (u.includes('4bhk') || u.includes('4 bhk'))      { doors = 11; windows = 12; bathrooms = 4; kitchens = 1; }
  else if (u.includes('5bhk'))                             { doors = 14; windows = 16; bathrooms = 5; kitchens = 2; }
  else if (u.includes('villa') || u.includes('bungalow') || u.includes('individual')) { doors = 9;  windows = 10; bathrooms = 3; kitchens = 1; }
  else if (u.includes('duplex') || u.includes('penthouse')) { doors = 10; windows = 12; bathrooms = 4; kitchens = 1; }
  else if (u.includes('office') || u.includes('commercial')){ doors = 6;  windows = 16; bathrooms = 3; kitchens = 0; }
  else if (u.includes('retail') || u.includes('shop'))      { doors = 2;  windows = 5;  bathrooms = 1; kitchens = 0; }
  else if (u.includes('mall'))                              { doors = 8;  windows = 30; bathrooms = 4; kitchens = 0; }
  else if (u.includes('hospital') || u.includes('clinic'))  { doors = 12; windows = 16; bathrooms = 6; kitchens = 1; }
  else if (u.includes('hotel'))                             { doors = 10; windows = 12; bathrooms = 8; kitchens = 1; }
  else if (u.includes('school') || u.includes('college'))   { doors = 8;  windows = 20; bathrooms = 6; kitchens = 1; }
  else if (u.includes('warehouse') || u.includes('factory')){ doors = 4;  windows = 6;  bathrooms = 2; kitchens = 0; }
  else if (u.includes('showroom'))                          { doors = 3;  windows = 20; bathrooms = 1; kitchens = 0; }

  const isResidential = typology === 'Residential';
  const isRowHouse    = u.includes('row house');
  const isSingleDwelling = isResidential && (
    u.includes('villa') || u.includes('duplex') || u.includes('bungalow') ||
    isRowHouse || u.includes('penthouse') || u.includes('individual') ||
    (!u.includes('apartment') && !u.includes('flat') && !u.includes('floor') && !u.includes('condo') && numFloors <= 3 && unitsPerFloor <= 1)
  );

  if (isSingleDwelling) {
    return {
      doors: isRowHouse ? 6 : doors,
      windows: isRowHouse ? 6 : windows,
      bathrooms: isRowHouse ? 2 : bathrooms,
      kitchens: 1,
      units: 1,
    };
  }

  const effectiveUnitsPerFloor = unitsPerFloor > 1
    ? unitsPerFloor
    : (isResidential
        ? Math.max(1, Math.min(6, Math.round(buaPerFloor / (u.includes('1bhk') ? 900 : u.includes('2bhk') ? 1600 : 2200))))
        : 1);

  const units = effectiveUnitsPerFloor * numFloors;
  return {
    doors: doors * units,
    windows: windows * units,
    bathrooms: bathrooms * units,
    kitchens: kitchens * units,
    units,
  };
}

// ─── Derived dimensions ──────────────────────────────────────────────────────
function deriveDimensions(bi: FullInput): DerivedDimensions {
  const buaPerFloor    = bi.lengthFt * bi.breadthFt;
  const totalBuaSqft   = buaPerFloor * bi.numFloors;
  const totalBuaSqm    = totalBuaSqft / 10.764;
  const u              = bi.buildingUse.toLowerCase();
  const isRowHouse     = u.includes('row house');
  const perimeterFt    = 2 * (bi.lengthFt + bi.breadthFt);
  const facadeAreaSqft = (isRowHouse ? 2 * bi.breadthFt : perimeterFt) * (bi.heightFt / bi.numFloors) * bi.numFloors;
  const wallAreaSqft   = isRowHouse ? (perimeterFt * (bi.heightFt / bi.numFloors) * bi.numFloors) * 0.60 : facadeAreaSqft * 0.72;
  const terraceArea    = buaPerFloor;

  const floorTier: FloorTier =
    bi.numFloors <= 3  ? 'G1_G3'   :
    bi.numFloors <= 7  ? 'G4_G7'   :
    bi.numFloors <= 15 ? 'G8_G15'  : 'G16_PLUS';

  const roomCounts = deriveRoomCounts(bi.buildingUse, bi.numFloors, bi.unitsPerFloor ?? 1, bi.typology, buaPerFloor);

  return { buaPerFloor, totalBuaSqft, totalBuaSqm, perimeterFt, facadeAreaSqft, wallAreaSqft, terraceArea, floorTier, roomCounts };
}

// ─── Line item builder ────────────────────────────────────────────────────────
function round2(n: number) { return Math.round(n * 100) / 100; }

function li(
  code: string, quantity: number, unit: string,
  ds: CoefficientDataset, quality: QualityTier, ri: number,
  isApprox = false, note?: string, displayName?: string,
): EstimateLineItem {
  // Primary structural commodities and already tier-specific items don't compound with qMult
  const isFixedSpecification =
    code.startsWith('MAT_FOUND_') || code.startsWith('MAT_RCC_') || code.startsWith('MAT_STEEL_') ||
    code.startsWith('MAT_MASON_') || code.startsWith('MAT_PLAST_') || code === 'MAT_EXT_PLAST' ||
    code.startsWith('MAT_PARK_') || code.startsWith('MAT_HVAC_') || code.startsWith('MAT_LIFT_') ||
    code.startsWith('MAT_EXT_CURTWALL_') || code.startsWith('MAT_FLOOR_MARBLE_') || code.startsWith('MAT_FLOOR_GRANITE') ||
    code.startsWith('MAT_WOOD_WARDROBE_') || code.startsWith('MAT_WOOD_KITCH_') ||
    code === 'MAT_DOOR_TEAK' || code === 'MAT_DOOR_PANEL';

  const qMult = isFixedSpecification
    ? 1.0 // commodity primary materials (TMT steel, OPC cement, AAC blocks, sand, excavation) have national market price
    : ds.qualityMultipliers[quality];

  // Verified rate corrections
  let baseRate = ds.rates[code] ?? 0;
  if (code === 'MAT_PARK_RCC_EXCAV') {
    baseRate = 480; // ₹480/cu.m for deep basement excavation with shoring & carting (CPWD DSR 2024)
  } else if (code === 'MAT_EXT_CURTWALL_UHV') {
    baseRate = 1850; // realistic unitised high-performance curtain wall base rate
  }

  const unitRate = round2(baseRate * qMult * ri);
  const qty      = round2(Math.max(0, quantity));

  // C-6: Runtime guard — refuse to return an estimate line item containing quantity > 0 && unitRate === 0
  if (qty > 0 && unitRate === 0) {
    throw new Error(
      `Engine Invariant Violation (C-6): Line item '${code}' has quantity ${qty} but resolved to ₹0 unitRate.`,
    );
  }

  const meta     = ITEM_NAMES[code] ?? { name: code, category: 'CAT_18' };
  const grade    = ds.grades[quality]?.[code] ?? ds.grades.Standard?.[code] ?? 'Standard';

  return {
    materialItemCode : code,
    name             : displayName ?? meta.name,
    categoryCode     : meta.category,
    quantity         : qty,
    unit,
    recommendedGrade : grade,
    unitRate,
    lineCost         : round2(qty * unitRate),
    isApproximate    : isApprox || !ds.rates[code],
    approximateNote  : !ds.rates[code] ? 'Rate not configured' : note,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
export function runEstimationEngine(
  bi: FullInput, cls: ClassificationResult, ds: CoefficientDataset, ri = 1.0,
): EstimateLineItem[] {
  const dim    = deriveDimensions(bi);
  const qt     = bi.qualityTier;
  const sys    = bi.structuralSystem ?? 'Not_sure';
  const seismic= bi.seismicZone     ?? 'Not_sure';
  const u      = bi.buildingUse.toLowerCase();

  const structM  = ds.structMultipliers[sys];
  const seismicM = ds.seismicMultipliers[seismic];

  const { floorTier, roomCounts: rc, totalBuaSqft,
          wallAreaSqft, facadeAreaSqft, terraceArea, perimeterFt, buaPerFloor } = dim;
  const footprintSqm = buaPerFloor / 10.764;
  const numFloors = bi.numFloors;

  const isIndustrial   = bi.typology === 'Industrial';
  const isCommercial   = bi.typology === 'Commercial';
  const isInstitutional= bi.typology === 'Institutional';
  const isResidential  = bi.typology === 'Residential';
  const isRowHouse     = u.includes('row house');
  const isSingleDwelling = isResidential && (
    u.includes('villa') || u.includes('duplex') || u.includes('bungalow') ||
    isRowHouse || u.includes('penthouse') ||
    (!u.includes('apartment') && !u.includes('flat') && !u.includes('floor') && !u.includes('condo') && numFloors <= 3 && (bi.unitsPerFloor ?? 1) <= 1)
  );

  const items: EstimateLineItem[] = [];

  const addItem = (
    code: string, qty: number, unit: string,
    isApprox = false, note?: string, displayName?: string,
  ) => {
    items.push(li(code, qty, unit, ds, qt, ri, isApprox, note, displayName));
  };

  // ── CAT_01: Substructure & Excavation ─────────────────────────────────────
  const fndType = bi.foundationType ?? 'Not_sure';
  const isRaft  = fndType === 'Raft' || bi.soilType === 'Waterlogged-prone';
  const isPile  = fndType === 'Pile';
  const isRocky = bi.soilType === 'Rocky';

  // Substructure concrete volume proportional to footprint area and building height
  const baseConcPerFootprint = isIndustrial ? 0.14 : isRaft ? 0.45 : isPile ? 0.50 : 0.11;
  const fndLoadScale = isIndustrial ? 1.0
                     : isPile ? Math.min(3.2, 1 + (numFloors - 1) * 0.10)
                     : isRaft ? Math.min(2.8, 1 + (numFloors - 1) * 0.08)
                     : Math.min(2.2, 1 + (numFloors - 1) * 0.07);

  const fndConcVol = footprintSqm * baseConcPerFootprint * fndLoadScale;
  const fndSteelKg = fndConcVol * (isPile ? 90 : isRaft ? 95 : 75);

  const excavDepthMult = isIndustrial ? 0.9 : (numFloors > 6 || isRaft || isPile) ? 1.3 : 1.0;
  const excavVol = footprintSqm * 1.3 * excavDepthMult;

  if (isRocky) {
    addItem('MAT_FOUND_EXCAV_ROCK', excavVol * 0.4, 'cu.m', true, 'Rock blasting');
    addItem('MAT_FOUND_EXCAV',      excavVol * 0.6, 'cu.m');
  } else {
    addItem('MAT_FOUND_EXCAV',      excavVol,       'cu.m');
  }

  const pccAreaFrac = isIndustrial ? 0.35 : (isRaft || isPile) ? 1.0 : 0.40;
  addItem('MAT_FOUND_PCC', 0.08 * footprintSqm * pccAreaFrac, 'cu.m');

  if (isPile) {
    addItem('MAT_FOUND_PILE',       fndConcVol, 'cu.m');
    addItem('MAT_FOUND_PILE_STEEL', fndSteelKg, 'kg');
  } else if (isRaft) {
    addItem('MAT_FOUND_RAFT',       fndConcVol, 'cu.m');
    addItem('MAT_FOUND_STEEL',      fndSteelKg, 'kg');
  } else {
    addItem('MAT_FOUND_CONC',       fndConcVol, 'cu.m');
    addItem('MAT_FOUND_STEEL',      fndSteelKg, 'kg');
  }

  addItem('MAT_FOUND_DPC',      footprintSqm,       'sq.m');
  addItem('MAT_FOUND_ANTITERM', buaPerFloor,        'sqft');
  addItem('MAT_FOUND_BACKFILL', excavVol * 0.60,    'cu.m');
  addItem('MAT_FOUND_FORMWORK', fndConcVol * 2.8,   'sq.m');

  // ── CAT_02: Superstructure ───────────────────────────────────────────────
  const isPEB = sys === 'Steel';
  // Wind lateral load factor per IS 875 (Part 3)
  const wind = bi.windLoadZone ?? 'Not_sure';
  const windMult = wind === 'Cyclone_prone' ? 1.08 : wind === 'High' ? 1.04 : 1.0;

  if (isPEB) {
    // PEB structural steel: ~4.6 - 6.0 kg/sqft for complete portal frames, crane girders, purlins, bracings
    const pebSteelKgPerSqft = (isIndustrial ? (numFloors > 1 ? 5.2 : 4.6) : 6.0) * windMult;
    addItem('MAT_STEEL_STRUCT', totalBuaSqft * pebSteelKgPerSqft, 'kg', true, 'Structural PEB Steel', 'Structural PEB Steel (Portals, Purlins, Sag Rods)');
    if (numFloors > 1) {
      const mezzSqft = buaPerFloor * (numFloors - 1);
      addItem('MAT_RCC_CEMENT', mezzSqft * 0.35, 'bags (50kg)');
      addItem('MAT_RCC_STEEL',  mezzSqft * 3.6 * windMult,  'kg');
    }
  } else {
    const cRate = ds.floorCementCoeff[floorTier];
    const sRate = ds.floorSteelCoeff[floorTier];
    const isHighRise = numFloors >= 8;
    const indLiveLoadMult = (isIndustrial && sys === 'RCC_Frame') ? 1.20 : 1.0;
    const sWindMult = isHighRise ? windMult : 1.0;

    const cQty    = Math.round(cRate * totalBuaSqft * structM.cm * indLiveLoadMult * 100) / 100;
    const sQty    = Math.round(sRate * totalBuaSqft * structM.sm * seismicM * indLiveLoadMult * sWindMult * 100) / 100;
    const sandQty = Math.round(cQty * 1.42 * 100) / 100;
    const aggQty  = Math.round(cQty * 2.85 * 100) / 100;

    addItem('MAT_RCC_CEMENT',         cQty,                     'bags (50kg)');
    addItem(isHighRise ? 'MAT_RCC_STEEL_550D' : 'MAT_RCC_STEEL', sQty, 'kg');
    addItem('MAT_RCC_SAND',           sandQty,                  'cu.ft');
    addItem('MAT_RCC_AGGREGATE_20MM', aggQty,                   'cu.ft');
    addItem('MAT_RCC_FORMWORK',       totalBuaSqft * 0.095,     'sq.m');
    addItem('MAT_RCC_SLAB_FORM',      totalBuaSqft * 0.085,     'sq.m');
    addItem('MAT_RCC_BINDING_WIRE',   (sQty / 1000) * 11,       'kg');
    addItem('MAT_RCC_ADMIX',          cQty * 0.014,             'litres');
    addItem('MAT_RCC_SPACERS',        totalBuaSqft * 0.8,       'units');
    if (isHighRise) {
      // High-strength column and shear wall core concrete (M35-M40 per IS 456 / IS 13920)
      const colVolPerSqm = numFloors > 15 ? 0.09 : 0.06;
      const colConcCode = numFloors > 15 ? 'MAT_RCC_HIGH_CONC' : 'MAT_RCC_COL_CONC';
      addItem(colConcCode, (totalBuaSqft / 10.764) * colVolPerSqm, 'cu.m', true, 'High-strength column/core concrete');
    }
  }

  // ── CAT_03: Masonry & Internal Plaster ────────────────────────────────────
  const effectiveWallArea = isPEB && isIndustrial ? wallAreaSqft * 0.35 : wallAreaSqft;
  const useAAC = qt !== 'Economy';
  const brickCode = useAAC ? 'MAT_MASON_BLOCK' : 'MAT_MASON_BRICK';
  const brickUnit = useAAC ? 'count (AAC)' : 'count (bricks)';
  const brickCoeff = useAAC ? 2.1 : 9.5;
  const brickQty = Math.round(brickCoeff * effectiveWallArea * structM.mm * 100) / 100;
  // CPWD DSR: 1.8-2.2 bags cement per 1,000 bricks (1:6 mortar); 2.0-2.2 bags adhesive per 1,000 AAC blocks
  const mortarBags = Math.round((brickQty / 1000) * (useAAC ? 2.2 : 2.0) * 100) / 100;

  addItem(brickCode,          brickQty,               brickUnit);
  addItem('MAT_MASON_CEMENT', mortarBags,             'bags');
  addItem('MAT_MASON_SAND',   mortarBags * 8.0,       'cu.ft');
  if (!isPEB) {
    addItem('MAT_MASON_PARAPET', perimeterFt / 3.28,  'rmt');
  }

  const intWall = effectiveWallArea * 1.5;
  if (qt === 'Premium') {
    addItem('MAT_PLAST_GYPSUM', intWall, 'sqft');
  } else {
    addItem('MAT_PLAST_INT', intWall, 'sqft');
    if (!isIndustrial) {
      addItem('MAT_PLAST_POP', intWall * 0.5, 'sqft');
    }
  }

  // ── CAT_04: Waterproofing & Chemical Treatment ────────────────────────────
  const wpCode = qt === 'Economy' ? 'MAT_WP_IPS' : qt === 'Premium' ? 'MAT_WP_CRYS' : 'MAT_WP_LIQ_PU';
  addItem(wpCode, terraceArea * 1.05, 'sqft');
  if (rc.bathrooms > 0) addItem('MAT_WP_BATH', rc.bathrooms * 55, 'sqft');
  if (rc.kitchens > 0)  addItem('MAT_WP_KITCH', rc.kitchens * 35,  'sqft');
  if (!isPEB) {
    addItem('MAT_WP_EXPANSION', perimeterFt / 3.28, 'rmt', true, 'Expansion joints');
  }
  addItem('MAT_ANTITERM_CHEMICAL', (buaPerFloor / 100) * 1.2, 'litres');
  if (bi.soilType === 'Waterlogged-prone' || bi.foundationType === 'Raft') {
    addItem('MAT_WP_BASEMENT', buaPerFloor * 1.1, 'sqft', true, 'Basement tanking');
  }

  // ── CAT_05: Roofing & False Ceiling ───────────────────────────────────────
  if (isPEB || isIndustrial) {
    addItem('MAT_ROOF_GI_SHEET', terraceArea * 1.05, 'sqft', false, 'Roof sheeting', 'Galvalume Trapezoidal Roof Sheeting (0.50mm)');
  } else {
    addItem('MAT_ROOF_TERRACE',  terraceArea * 1.05, 'sqft');
  }

  if (!isIndustrial) {
    const ceilArea = isCommercial || isInstitutional ? totalBuaSqft * 0.75 : totalBuaSqft * 0.60;
    const ceilCode = qt === 'Economy' ? 'MAT_CEIL_POP'
      : qt === 'Premium' ? (isCommercial ? 'MAT_CEIL_ACOU' : 'MAT_CEIL_GYPS')
      : 'MAT_CEIL_POP';
    if (qt !== 'Economy' || isCommercial || isInstitutional) {
      addItem(ceilCode, ceilArea, 'sqft');
    }
  }

  // ── CAT_06: Doors, Windows & Glazing ──────────────────────────────────────
  const winCode = qt === 'Economy' ? 'MAT_WIN_ALUM' : qt === 'Premium' ? 'MAT_WIN_THERMBREAK' : 'MAT_WIN_UPVC';
  const winSqft = Math.min(facadeAreaSqft * 0.35, rc.windows * (isInstitutional ? 22 : 15));

  const mainDoorCount = Math.max(1, rc.units);
  const bathDoorCount = rc.bathrooms;
  const internalDoorCount = Math.max(0, rc.doors - mainDoorCount - bathDoorCount);

  // Main entrance door
  const mainDoorCode = qt === 'Premium' ? 'MAT_DOOR_TEAK' : 'MAT_DOOR_PANEL';
  addItem(mainDoorCode, mainDoorCount, 'units', false, 'Main entrance door');

  // Bathroom doors (water-resistant FRP per CPWD DSR 9.120)
  if (bathDoorCount > 0) {
    addItem('MAT_DOOR_FRP', bathDoorCount, 'units', false, 'Water-resistant FRP bathroom door');
  }

  // Internal room doors
  if (internalDoorCount > 0) {
    addItem('MAT_DOOR_FLUSH', internalDoorCount, 'units', false, 'Flush door (internal rooms)');
  }

  addItem('MAT_DOOR_FRAME', rc.doors, 'units');
  addItem('MAT_DOOR_HARDWARE', rc.doors, 'sets');
  addItem(winCode, winSqft, 'sqft');
  addItem('MAT_WIN_HARDWARE', rc.windows, 'sets');
  if (qt === 'Economy' && !isIndustrial) addItem('MAT_GRILLE', winSqft, 'sqft');
  if (numFloors >= 4 || isInstitutional) {
    const fireExits = Math.max(1, Math.ceil(numFloors / 6));
    addItem('MAT_DOOR_FIRE_RATED', fireExits * 2, 'units', false, 'Fire exit doors');
  }

  // ── CAT_07: Electrical & Low-Voltage Systems ──────────────────────────────
  const ptFactor = isIndustrial ? 1.2 : isCommercial ? 1.4 : isInstitutional ? 1.3 : 1.0;
  const elecPoints = Math.round((totalBuaSqft / 85) * ptFactor);

  addItem('MAT_ELEC_POINT', elecPoints, 'points');
  addItem('MAT_ELEC_DB_FLOOR', Math.ceil(numFloors), 'units');
  addItem('MAT_ELEC_DB_MAIN', 1, 'units');
  addItem('MAT_ELEC_MCB', elecPoints * 0.4, 'units');
  addItem('MAT_ELEC_RCCB', Math.ceil(elecPoints / 12), 'units');
  addItem('MAT_ELEC_SWITCH_MOD', elecPoints * 0.5, 'plates');
  addItem('MAT_ELEC_SOCKET_16A', rc.bathrooms + rc.kitchens * 2 + (isInstitutional ? 8 : 0), 'units');
  addItem('MAT_ELEC_EARTHING', 2, 'sets');
  addItem('MAT_ELEC_WIRE_2_5', totalBuaSqft * 0.08 * 3.28, 'metres');
  addItem('MAT_ELEC_WIRE_1_5', totalBuaSqft * 0.06 * 3.28, 'metres');
  addItem('MAT_ELEC_CONDUIT_25', totalBuaSqft * 0.05 * 3.28, 'metres');

  const cctvCams = Math.ceil(totalBuaSqft / 2500) + (!isResidential ? 3 : 0);
  addItem('MAT_ELEC_CCTV', cctvCams, 'cameras');

  if ((isResidential && numFloors >= 4) || (!isResidential && numFloors >= 2)) {
    const detectors = Math.ceil(totalBuaSqft / 800);
    addItem('MAT_ELEC_FIRE_ALARM', detectors, 'detectors');
  }

  // DG Set — common backup for multi-storey, non-residential, or healthcare/hospitals
  const isHealthcare = u.includes('hospital') || u.includes('clinic') || u.includes('medical') || u.includes('pharma');
  if (numFloors >= 4 || isHealthcare || (!isResidential && totalBuaSqft > 12000)) {
    const kvaPer1000 = isResidential ? (qt === 'Premium' ? 2.5 : 1.8)
                   : isCommercial ? (qt === 'Premium' ? 3.5 : 2.5)
                   : isInstitutional ? 2.2 : 2.5;
    const minKva = isResidential ? 15 : isHealthcare ? 30 : 25;
    const rawKva = Math.ceil(totalBuaSqft / 1000) * kvaPer1000;
    const dgKva = Math.max(minKva, Math.ceil(rawKva / 5) * 5);
    addItem('MAT_ELEC_GENSET', dgKva, 'kVA', true, `DG set (${dgKva} kVA)`);
  }

  if (isResidential) {
    addItem('MAT_ELEC_INTERCOM', Math.max(1, rc.units), 'units');
  }

  if (numFloors >= 8) {
    addItem('MAT_ELEC_BUSDUCT', bi.heightFt * 0.3048, 'metres', true, 'Rising main');
  }

  // ── CAT_08: Plumbing, Sanitary & STP ──────────────────────────────────────
  const wcCode = qt === 'Premium' ? 'MAT_PLUMB_EWC' : 'MAT_PLUMB_WC';
  const pipeCode = qt === 'Economy' ? 'MAT_PLUMB_PIPE_CPVC' : 'MAT_PLUMB_PIPE_PPR';
  const occupants = Math.max(6,
    isCommercial ? Math.round(totalBuaSqft / 110) :
    isInstitutional ? Math.round(totalBuaSqft / 160) :
    rc.units * 4
  );

  addItem(wcCode, rc.bathrooms, 'units');
  addItem('MAT_PLUMB_WASH', rc.bathrooms * (isInstitutional ? 2 : 1), 'units');
  if (isInstitutional) {
    addItem('MAT_PLUMB_URINAL', Math.max(2, Math.floor(rc.bathrooms * 0.8)), 'units');
  }
  if (qt !== 'Economy' && isResidential) {
    addItem('MAT_PLUMB_BATH', rc.bathrooms, 'units');
  }
  if (rc.kitchens > 0) {
    addItem('MAT_PLUMB_SINK_SS', rc.kitchens, 'units');
    addItem('MAT_PLUMB_FAUCET_KITCH', rc.kitchens, 'units');
  }
  addItem('MAT_PLUMB_FAUCET_BASIN', rc.bathrooms * (isInstitutional ? 2 : 1), 'units');
  addItem('MAT_PLUMB_FAUCET_BATH', rc.bathrooms, 'units');
  addItem(pipeCode, (rc.bathrooms + rc.kitchens) * 14, 'metres');
  addItem('MAT_PLUMB_PIPE_PVC', (rc.bathrooms + rc.kitchens) * 11, 'metres');
  addItem('MAT_PLUMB_GULLY', rc.bathrooms + rc.kitchens, 'units');
  addItem('MAT_PLUMB_TANK_OHT', Math.max(1500, occupants * 120), 'litres');
  addItem('MAT_PLUMB_TANK_SUMP', Math.max(4000, occupants * 450), 'litres', true, 'Underground sump');
  addItem('MAT_PLUMB_PUMP_BOOSTER', 1, 'set');

  if (occupants > 80 || (!isResidential && numFloors >= 4 && totalBuaSqft > 30000)) {
    const stpKld = Math.ceil((occupants * 90) / 1000);
    addItem('MAT_PLUMB_STP', stpKld, 'KLD', true, 'MBR STP');
  }

  // ── CAT_09: Flooring & Tiling ─────────────────────────────────────────────
  if (isIndustrial) {
    // Heavy-duty VDF / Tremix RCC floor slab (150mm thick M25 + hardener)
    addItem('MAT_FLOOR_IPS', totalBuaSqft, 'sqft', true, 'Floor slab', 'Heavy-duty Trimix / VDF Concrete Floor');
    if (qt === 'Premium' || u.includes('pharma') || u.includes('clean') || u.includes('cold')) {
      addItem('MAT_FLOOR_EPOXY', totalBuaSqft * 0.70, 'sqft', true, 'Epoxy floor coating', 'Epoxy Floor Coating (Industrial Screed)');
    }
  } else {
    const mainFloorCode =
      qt === 'Economy' ? (isCommercial ? 'MAT_FLOOR_VIT' : 'MAT_FLOOR_CER') :
      qt === 'Premium' ? (isCommercial ? 'MAT_FLOOR_GRANITE' : 'MAT_FLOOR_MARBLE_IND') :
      'MAT_FLOOR_VIT';
    const wastage = 1.05;

    addItem(mainFloorCode, totalBuaSqft * wastage, 'sqft');
    addItem('MAT_FLOOR_MORTAR', totalBuaSqft * 0.90, 'sqft');
    addItem('MAT_FLOOR_SKIRTING', perimeterFt * numFloors * 0.70, 'rft');
    if (rc.bathrooms > 0) addItem('MAT_FLOOR_DADO_BATH', rc.bathrooms * 60, 'sqft');
    if (rc.kitchens > 0) addItem('MAT_FLOOR_DADO_KITCH', rc.kitchens * 25, 'sqft');
    if (isInstitutional) {
      addItem('MAT_FLOOR_KOTA', totalBuaSqft * 0.25, 'sqft', false, 'Heavy-duty Kota Stone in corridors & stair landings');
    }
  }

  // Industrial manufacturing / Pharma cleanroom additions
  if (isIndustrial) {
    if (u.includes('auto') || u.includes('manufacturing') || u.includes('factory')) {
      addItem('MAT_FOUND_CONC', (totalBuaSqft / 10.764) * 0.04, 'cu.m', true, 'Heavy equipment machinery foundations', 'Heavy Equipment Machinery Foundation Concrete');
      addItem('MAT_STEEL_STRUCT', totalBuaSqft * 1.8, 'kg', true, 'EOT crane runway beams & brackets', 'EOT Crane Runway Beams & Brackets (Structural Steel)');
    }
    if (u.includes('pharma') || u.includes('electronics') || u.includes('assembly') || u.includes('clean')) {
      addItem('MAT_CEIL_GRID', totalBuaSqft * 0.50, 'sqft', true, 'Cleanroom modular walk-on ceiling grid');
      addItem('MAT_FLOOR_EPOXY', totalBuaSqft * 0.50, 'sqft', true, 'Anti-static ESD Epoxy flooring', 'Anti-static ESD Epoxy Flooring');
    }
    // Loading bay / apron RCC slab for warehouses and agro facilities
    if (u.includes('warehouse') || u.includes('storage') || u.includes('agro') || u.includes('logistics')) {
      addItem('MAT_FLOOR_IPS', buaPerFloor * 0.15, 'sqft', true, 'Dock apron', 'External Loading Bay & Dock Apron Concrete');
    }
  }

  // ── CAT_10: Wall Finishing & Painting ─────────────────────────────────────
  const intWallArea = effectiveWallArea * 0.75;
  const paintCode = qt === 'Economy' ? 'MAT_PAINT_DISTEM' : 'MAT_PAINT_INT_EMU';
  const litresInt = qt === 'Economy' ? Math.round((intWallArea / 100) * 16) : Math.round((intWallArea / 130) * 2);

  addItem(paintCode, litresInt, qt === 'Economy' ? 'kg' : 'litres');
  addItem('MAT_PAINT_PRIMER', (intWallArea / 100) * 3.0, 'litres');
  addItem('MAT_PAINT_PUTTY', (intWallArea / 100) * 16, 'kg');

  // ── CAT_11: Modular Kitchen, Joinery & Woodwork ───────────────────────────
  if (isResidential) {
    if (rc.kitchens > 0) {
      const kitchLft = rc.kitchens * 16;
      const kitchCode = qt === 'Economy' ? 'MAT_WOOD_KITCH_ECO' : qt === 'Premium' ? 'MAT_WOOD_KITCH_PREM' : 'MAT_WOOD_KITCH';
      addItem(kitchCode, kitchLft, 'linear ft');
    }
    const bedrooms = isSingleDwelling ? (rc.bathrooms > 1 ? rc.bathrooms - 1 : 1) : Math.max(1, Math.floor(rc.bathrooms * 0.8));
    if (qt !== 'Economy') {
      const wardrobeCode = qt === 'Premium' ? 'MAT_WOOD_WARDROBE_PREM' : 'MAT_WOOD_WARDROBE';
      addItem(wardrobeCode, bedrooms, 'units');
      addItem('MAT_WOOD_LOFT', rc.kitchens * 6 + bedrooms * 3, 'rft');
      addItem('MAT_WOOD_TV_UNIT', rc.units, 'units', true, 'TV unit');
    }
    if (qt === 'Premium') {
      addItem('MAT_WOOD_POOJA_MANDIR', 1, 'unit', true, 'Pooja mandir unit');
    }
    const carpFactor = qt === 'Economy' ? 0.02 : qt === 'Premium' ? 0.04 : 0.025;
    addItem('MAT_WOOD_CARPEN', Math.round(totalBuaSqft * carpFactor), 'sqft');
  } else if (isCommercial || isInstitutional) {
    const carpFactor = qt === 'Premium' ? 0.02 : 0.01;
    addItem('MAT_WOOD_CARPEN', Math.round(totalBuaSqft * carpFactor), 'sqft');
  }

  // ── CAT_12: Exterior Finishing & Cladding ─────────────────────────────────
  const facade = bi.facadeType ?? 'Conventional';
  if (facade === 'Curtain_Wall') {
    const cwCode = qt === 'Premium' ? 'MAT_EXT_CURTWALL_UHV' : 'MAT_EXT_CURTWALL';
    // Glazing covers 65% of facade, rest is non-glazed spandrel (35%)
    addItem(cwCode, facadeAreaSqft * 0.65, 'sqft');
    addItem('MAT_EXT_PLAST', facadeAreaSqft * 0.35, 'sqft');
    addItem('MAT_EXT_PAINT', facadeAreaSqft * 0.35, 'sqft');
  } else if (facade === 'ACP_Cladding') {
    addItem('MAT_EXT_CLADDING_ACP', facadeAreaSqft * 0.45, 'sqft');
    addItem('MAT_EXT_PLAST', facadeAreaSqft * 0.55, 'sqft');
    addItem('MAT_EXT_PAINT', facadeAreaSqft * 0.55, 'sqft');
  } else if (!isPEB || !isIndustrial) {
    addItem('MAT_EXT_PLAST', facadeAreaSqft, 'sqft');
    addItem('MAT_EXT_PAINT', facadeAreaSqft, 'sqft');
    if (qt === 'Premium') {
      addItem('MAT_EXT_STONE_CLADDING', facadeAreaSqft * 0.10, 'sqft', true, 'Stone cladding');
    }
  } else {
    // PEB Industrial shed wall cladding for upper 65% (lower 35% is masonry dado)
    addItem('MAT_ROOF_GI_SHEET', facadeAreaSqft * 0.65, 'sqft', false, 'Wall cladding sheeting', 'Color-coated Wall Cladding Sheeting (0.50mm)');
    addItem('MAT_EXT_PLAST', facadeAreaSqft * 0.35, 'sqft');
    addItem('MAT_EXT_PAINT', facadeAreaSqft * 0.35, 'sqft');
  }

  const plotSide = bi.plotAreaSqft > 0 ? Math.sqrt(bi.plotAreaSqft) : 0;
  if (plotSide > 25 && (isSingleDwelling || totalBuaSqft < 10000)) {
    const boundaryRmt = (plotSide * 4) / 3.28;
    addItem('MAT_EXT_BOUNDARY_WALL', boundaryRmt, 'rmt', true, 'Compound wall');
    const gateCode = qt === 'Economy' ? 'MAT_EXT_GATE_PEDES' : 'MAT_EXT_GATE_MAIN';
    addItem(gateCode, 1, 'unit', true, qt === 'Economy' ? 'Manual swing main gate' : 'Motorised sliding main gate');
    addItem('MAT_EXT_PAVING', Math.min(plotSide * 8, 800), 'sqft', true, 'Paving');
  }

  // ── CAT_13: Staircase, Railings & Lifts ───────────────────────────────────
  const numStairs = bi.numStaircases ?? 1;
  const stairFloors = numFloors + (bi.parkingLevels ?? 0);
  if (!isPEB || numFloors > 1) {
    addItem('MAT_STAIR_CONC', 1.4 * numStairs * stairFloors, 'cu.m');
    addItem('MAT_STAIR_STEEL', 80 * numStairs * stairFloors, 'kg');
    addItem('MAT_STAIR_RAILING_SS', 18 * numStairs * stairFloors, 'rft');
    if (stairFloors > 1) {
      const treadCode = qt === 'Premium' ? 'MAT_STAIR_MARBLE' : 'MAT_STAIR_GRANITE';
      addItem(treadCode, 60 * numStairs * (stairFloors - 1), 'sqft', false, 'Stair treads & risers');
    }
  }

  const numLifts = bi.numLifts ?? 0;
  if (numLifts > 0) {
    const liftCode = numFloors <= 4 ? 'MAT_LIFT_HYDRO' : numFloors <= 12 ? 'MAT_LIFT_4P' : numFloors <= 20 ? 'MAT_LIFT_8P' : 'MAT_LIFT_13P';
    addItem(liftCode, numLifts, 'units', true, 'Passenger lift');
  } else if (numFloors >= 4 && isResidential) {
    const autoLifts = Math.max(1, Math.floor(numFloors / 6));
    addItem(numFloors <= 12 ? 'MAT_LIFT_4P' : numFloors <= 20 ? 'MAT_LIFT_8P' : 'MAT_LIFT_13P', autoLifts, 'units', true, 'Passenger lift');
  } else if (numFloors >= 3 && (isCommercial || isInstitutional)) {
    const autoLifts = Math.max(1, Math.floor(numFloors / 5));
    addItem(numFloors <= 10 ? 'MAT_LIFT_4P' : numFloors <= 18 ? 'MAT_LIFT_8P' : 'MAT_LIFT_13P', autoLifts, 'units', true, 'Passenger lift');
  }

  // ── CAT_14: HVAC, Fire Protection & MEP ───────────────────────────────────
  const hvacScope = bi.fireHvacScope ?? 'Not_sure';
  if (hvacScope === 'Full_Central' || u.includes('hotel') || u.includes('pharma') || u.includes('cold storage')) {
    const tons = Math.ceil(totalBuaSqft / (u.includes('cold') || u.includes('pharma') ? 300 : 400));
    const hvacCode = isCommercial ? 'MAT_HVAC_VRF' : 'MAT_HVAC_CENTRAL_AHU';
    addItem(hvacCode, tons, 'tons', true, 'Central / VRF HVAC');
    addItem('MAT_HVAC_DUCT_INSUL', totalBuaSqft * 0.22, 'sqft', true, 'Insulated ducting');
  } else if (hvacScope === 'Basic' && !isIndustrial) {
    if (isResidential && !isSingleDwelling) {
      const tons = Math.ceil(totalBuaSqft / 650);
      addItem('MAT_HVAC_SPLIT', tons, 'tons', true, 'Split AC');
    }
  }

  const needsFirePumps = (isResidential && numFloors >= 4) ||
    ((isCommercial || isInstitutional) && (numFloors >= 3 || totalBuaSqft > 12000)) ||
    (isIndustrial && totalBuaSqft > 20000);

  if (needsFirePumps) {
    addItem('MAT_FIRE_HYDRANT', numFloors, 'sets', false, 'Wet riser hydrants');
    addItem('MAT_FIRE_PUMP_SET', 1, 'set', false, 'Fire pump set');
  }
  const extCount = Math.max(numFloors * 2, Math.ceil(totalBuaSqft / 2000));
  addItem('MAT_FIRE_EXTINGUISHER', extCount, 'units');

  // High-rise fire sprinklers (mandatory for all buildings >= 8 floors or >24m per NBC Part 4)
  if ((!isResidential && numFloors >= 4 && !isIndustrial) || numFloors >= 8 || qt === 'Premium') {
    addItem('MAT_FIRE_SPRINKLER', Math.ceil(totalBuaSqft / 140), 'heads', true, 'Sprinkler heads — NBC Part 4');
  }

  // Student hostel dormitory cupboards & beds (Institutional hostels)
  if (isInstitutional && u.includes('hostel')) {
    const studentBeds = Math.round(totalBuaSqft / 200);
    addItem('MAT_WOOD_LOFT', studentBeds * 8, 'rft', false, 'Dormitory student wardrobes & overhead bunks');
    addItem('MAT_WOOD_STUDY_TABLE', Math.round(studentBeds * 0.8), 'units', false, 'Hostel study tables & chairs');
  }

  const exhaustUnits = rc.bathrooms + rc.kitchens + (!isResidential ? Math.ceil(totalBuaSqft / 3000) : 0);
  addItem('MAT_EXHAUST_FAN', exhaustUnits, 'units');

  // ── CAT_15: Parking & Basement ────────────────────────────────────────────
  const parkLevels = bi.parkingLevels ?? 0;
  if (parkLevels > 0) {
    const basementSqft = buaPerFloor * parkLevels;
    const basementSqm  = basementSqft / 10.764;
    addItem('MAT_PARK_RCC_EXCAV', basementSqm * 3.5, 'cu.m', true, 'Basement excavation');
    addItem('MAT_PARK_RCC_WALLS', perimeterFt * 3.5 * parkLevels * 0.08, 'cu.m');
    addItem('MAT_PARK_FLOOR_SCREED', basementSqft, 'sqft');
    addItem('MAT_PARK_LINING', basementSqft * 1.1, 'sqft');
    addItem('MAT_PARK_VENTILATION', basementSqft * 0.15, 'sqft', true, 'Basement ventilation');
    addItem('MAT_PARK_PUMP_SUMP', 1, 'set');
    const bayCount = Math.floor(basementSqft / 180);
    addItem('MAT_PARK_STRIPING', bayCount, 'bays');
  }

  // ── CAT_16: Swimming Pool & Recreational (N-5) ───────────────────────────
  const isRecreational = u.includes('clubhouse') || u.includes('community hall') || u.includes('resort');
  if (isRecreational) {
    addItem('MAT_CLUB_FINISH', totalBuaSqft * 0.35, 'sqft', true, 'Clubhouse / recreation facility finishing');
    addItem('MAT_GYM_EQUIP', Math.min(2500, totalBuaSqft * 0.15), 'sqft', true, 'Fitness & gym equipment');
    if (totalBuaSqft >= 8000 || qt === 'Premium') {
      addItem('MAT_POOL_EXCAV', 140, 'cu.m', true, 'Swimming pool excavation');
      addItem('MAT_POOL_RCC', 70, 'cu.m', true, 'M35 waterproof concrete pool shell');
      addItem('MAT_POOL_TILE', 1100, 'sqft', true, 'Vitrified anti-slip pool tile');
      addItem('MAT_POOL_PUMP_FILTER', 1, 'set', false, 'Filtration & recirculation pump system');
      addItem('MAT_POOL_CHLORINATOR', 1, 'set', false, 'Salt chlorination water treatment');
    }
  }

  // ── CAT_17: Solar & Green Building ────────────────────────────────────────
  const greenCert = bi.greenCertTarget && bi.greenCertTarget !== 'None';
  const shouldAddSolar = greenCert || qt === 'Premium' || (totalBuaSqft > 25000 && !isIndustrial);
  if (shouldAddSolar && buaPerFloor >= 200) {
    const rawKw = Math.floor(buaPerFloor / 400);
    const solarKw = Math.min(Math.max(1, rawKw), 30);
    if (solarKw > 0) {
      addItem('MAT_SOLAR_PANEL_ROO', solarKw * 1000, 'Wp', true, 'Rooftop solar');
      addItem('MAT_SOLAR_INV_ROO', solarKw, 'kW');
    }
  }

  // Rainwater harvesting
  const plotSqft = bi.plotAreaSqft ?? 0;
  if (greenCert || plotSqft >= 1500 || totalBuaSqft >= 5000) {
    const rwhUnits = Math.max(1, Math.round(totalBuaSqft / 25000));
    addItem('MAT_GREEN_RAINWATER', rwhUnits, 'units', true, 'Rainwater harvesting pit & filtration');
  }
  if (greenCert || qt === 'Premium') {
    addItem('MAT_GREEN_DUAL_FLUSH', rc.bathrooms, 'units', true, 'Water-saving dual-flush valves');
  }

  // U-16: Strictly filter out any zero or negative quantity items
  return items.filter(item => item.quantity > 0);
}

export { deriveDimensions, deriveRoomCounts, ITEM_NAMES, CATEGORY_NAMES };
