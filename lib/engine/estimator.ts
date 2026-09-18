// lib/engine/estimator.ts — OUTSYD World-Class Edition
// 18 categories | 200+ line items | Research-validated quantities
// Pure function — zero side effects. Same inputs + dataset = identical output.

import type {
  FullInput, EstimateLineItem, CoefficientDataset,
  ClassificationResult, DerivedDimensions, RoomCounts, FloorTier, QualityTier,
} from './types';

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
  MAT_CEIL_POP           : { name: 'POP False Ceiling (Installed)',         category: 'CAT_05' },
  MAT_CEIL_GYPS          : { name: 'Gypsum Board False Ceiling',            category: 'CAT_05' },
  MAT_CEIL_GRID          : { name: 'Metal Grid Ceiling (Commercial)',       category: 'CAT_05' },
  MAT_CEIL_ACOU          : { name: 'Acoustic Ceiling Tiles',                category: 'CAT_05' },
  MAT_CEIL_WOODEN        : { name: 'Wooden / Bamboo Ceiling',               category: 'CAT_05' },
  MAT_CEIL_STRETCH       : { name: 'Stretch / PVC Ceiling (Premium)',       category: 'CAT_05' },

  // CAT_06 — Doors, Windows & Glazing
  MAT_DOOR_FLUSH         : { name: 'Flush Door (Internal)',                 category: 'CAT_06' },
  MAT_DOOR_PANEL         : { name: 'Panel Door (Main Entrance)',            category: 'CAT_06' },
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
  MAT_ELEC_SOLAR_PANEL   : { name: 'Rooftop Solar Panel (Mono PERC)',      category: 'CAT_07' },
  MAT_ELEC_SOLAR_INV     : { name: 'Grid-Tied String Inverter',            category: 'CAT_07' },
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
};

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
  CAT_01: 'Substructure & Excavation',
  CAT_02: 'RCC Superstructure',
  CAT_03: 'Masonry, Plaster & Internal Finishes',
  CAT_04: 'Waterproofing & Chemical Treatment',
  CAT_05: 'Roofing & False Ceiling',
  CAT_06: 'Doors, Windows & Glazing',
  CAT_07: 'Electrical & Low-Voltage Systems',
  CAT_08: 'Plumbing, Sanitary & STP',
  CAT_09: 'Flooring & Tiling',
  CAT_10: 'Wall Finishing & Painting',
  CAT_11: 'Modular Kitchen, Joinery & Woodwork',
  CAT_12: 'Exterior Finishing & Cladding',
  CAT_13: 'Staircase, Railings & Lifts',
  CAT_14: 'HVAC, Fire Protection & MEP',
  CAT_15: 'Parking & Basement',
  CAT_16: 'Swimming Pool & Recreation',
  CAT_17: 'Solar & Green Building',
  CAT_18: 'Preliminaries, Site & Contingency',
};

// ─── Room counts ─────────────────────────────────────────────────────────────
function deriveRoomCounts(use: string, numFloors: number, unitsPerFloor = 1): RoomCounts {
  const u = use.toLowerCase();
  let doors = 7, windows = 8, bathrooms = 2, kitchens = 1;

  if      (u.includes('studio'))                            { doors = 3;  windows = 4;  bathrooms = 1; kitchens = 1; }
  else if (u.includes('1bhk') || u.includes('1 bhk'))      { doors = 5;  windows = 6;  bathrooms = 1; kitchens = 1; }
  else if (u.includes('2bhk') || u.includes('2 bhk'))      { doors = 7;  windows = 8;  bathrooms = 2; kitchens = 1; }
  else if (u.includes('3bhk') || u.includes('3 bhk'))      { doors = 9;  windows = 10; bathrooms = 3; kitchens = 1; }
  else if (u.includes('4bhk') || u.includes('4 bhk'))      { doors = 11; windows = 12; bathrooms = 4; kitchens = 1; }
  else if (u.includes('5bhk') || u.includes('villa'))      { doors = 14; windows = 16; bathrooms = 5; kitchens = 2; }
  else if (u.includes('duplex') || u.includes('penthouse')) { doors = 12; windows = 14; bathrooms = 4; kitchens = 1; }
  else if (u.includes('office') || u.includes('commercial')){ doors = 4;  windows = 14; bathrooms = 2; kitchens = 0; }
  else if (u.includes('retail') || u.includes('shop'))      { doors = 2;  windows = 5;  bathrooms = 1; kitchens = 0; }
  else if (u.includes('mall'))                              { doors = 8;  windows = 30; bathrooms = 4; kitchens = 0; }
  else if (u.includes('hospital') || u.includes('clinic'))  { doors = 8;  windows = 12; bathrooms = 4; kitchens = 1; }
  else if (u.includes('hotel'))                             { doors = 6;  windows = 10; bathrooms = 3; kitchens = 1; }
  else if (u.includes('school') || u.includes('college'))   { doors = 6;  windows = 18; bathrooms = 4; kitchens = 1; }
  else if (u.includes('warehouse') || u.includes('factory')){ doors = 4;  windows = 6;  bathrooms = 2; kitchens = 0; }
  else if (u.includes('showroom'))                          { doors = 3;  windows = 20; bathrooms = 1; kitchens = 0; }

  const units = unitsPerFloor * numFloors;
  return { doors: doors * units, windows: windows * units, bathrooms: bathrooms * units, kitchens: kitchens * units, units };
}

// ─── Derived dimensions ──────────────────────────────────────────────────────
function deriveDimensions(bi: FullInput): DerivedDimensions {
  const buaPerFloor    = bi.lengthFt * bi.breadthFt;
  const totalBuaSqft   = buaPerFloor * bi.numFloors;
  const totalBuaSqm    = totalBuaSqft / 10.764;
  const perimeterFt    = 2 * (bi.lengthFt + bi.breadthFt);
  const facadeAreaSqft = perimeterFt * (bi.heightFt / bi.numFloors) * bi.numFloors;
  const wallAreaSqft   = facadeAreaSqft * 0.72;   // 72% of facade is solid wall
  const terraceArea    = buaPerFloor;

  const floorTier: FloorTier =
    bi.numFloors <= 3  ? 'G1_G3'   :
    bi.numFloors <= 7  ? 'G4_G7'   :
    bi.numFloors <= 15 ? 'G8_G15'  : 'G16_PLUS';

  const roomCounts = deriveRoomCounts(bi.buildingUse, bi.numFloors, bi.unitsPerFloor ?? 1);

  return { buaPerFloor, totalBuaSqft, totalBuaSqm, perimeterFt, facadeAreaSqft, wallAreaSqft, terraceArea, floorTier, roomCounts };
}

// ─── Line item builder ────────────────────────────────────────────────────────
function li(
  code: string, quantity: number, unit: string,
  ds: CoefficientDataset, quality: QualityTier, ri: number,
  isApprox = false, note?: string,
): EstimateLineItem {
  const qMult    = ds.qualityMultipliers[quality];
  const baseRate = ds.rates[code] ?? 0;
  const unitRate = round2(baseRate * qMult * ri);
  const qty      = round2(Math.max(0, quantity));
  const meta     = ITEM_NAMES[code] ?? { name: code, category: 'CAT_18' };
  const grade    = ds.grades[quality]?.[code] ?? ds.grades.Standard?.[code] ?? 'Standard';
  return {
    materialItemCode : code,
    name             : meta.name,
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

function round2(n: number) { return Math.round(n * 100) / 100; }

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

  const structM  = ds.structMultipliers[sys];
  const seismicM = ds.seismicMultipliers[seismic];
  const qMult    = ds.qualityMultipliers[qt];

  const { floorTier, roomCounts: rc, totalBuaSqft, totalBuaSqm,
          wallAreaSqft, facadeAreaSqft, terraceArea, perimeterFt, buaPerFloor } = dim;
  const numFloors = bi.numFloors;

  const items: EstimateLineItem[] = [];

  // ── CAT_01: Substructure & Excavation ─────────────────────────────────────
  const soilC = {
    'Normal'           : { conc: 0.38, steel: 21, excav: 0.55 },
    'Rocky'            : { conc: 0.28, steel: 17, excav: 0.35 },
    'Filled-up'        : { conc: 0.48, steel: 25, excav: 0.60 },
    'Waterlogged-prone': { conc: 0.62, steel: 31, excav: 0.70 },
  }[bi.soilType] ?? { conc: 0.38, steel: 21, excav: 0.55 };

  const fndType = bi.foundationType ?? 'Not_sure';
  const isRaft  = fndType === 'Raft' || bi.soilType === 'Waterlogged-prone';
  const isPile  = fndType === 'Pile';
  const isRocky = bi.soilType === 'Rocky';

  // Excavation
  if (isRocky) {
    items.push(li('MAT_FOUND_EXCAV_ROCK', soilC.excav * totalBuaSqm, 'cu.m', ds, qt, ri, true, 'Rock blasting — confirm with geotechnical report'));
  } else {
    items.push(li('MAT_FOUND_EXCAV', soilC.excav * totalBuaSqm, 'cu.m', ds, qt, ri));
  }

  // Foundation type
  items.push(li('MAT_FOUND_PCC', 0.08 * totalBuaSqm, 'cu.m', ds, qt, ri));
  if (isPile) {
    items.push(li('MAT_FOUND_PILE',       soilC.conc  * totalBuaSqm,        'cu.m', ds, qt, ri));
    items.push(li('MAT_FOUND_PILE_STEEL', soilC.steel * 1.35 * totalBuaSqm, 'kg',   ds, qt, ri));
  } else if (isRaft) {
    items.push(li('MAT_FOUND_RAFT',   soilC.conc  * totalBuaSqm,       'cu.m', ds, qt, ri));
    items.push(li('MAT_FOUND_STEEL',  soilC.steel * totalBuaSqm,        'kg',   ds, qt, ri));
  } else {
    items.push(li('MAT_FOUND_CONC',  soilC.conc  * totalBuaSqm,        'cu.m', ds, qt, ri));
    items.push(li('MAT_FOUND_STEEL', soilC.steel * totalBuaSqm,         'kg',   ds, qt, ri));
  }

  items.push(li('MAT_FOUND_DPC',      buaPerFloor / 10.764,            'sq.m', ds, qt, ri));
  items.push(li('MAT_FOUND_ANTITERM', buaPerFloor,                     'sqft', ds, qt, ri));
  items.push(li('MAT_FOUND_BACKFILL', 0.42 * totalBuaSqm,             'cu.m', ds, qt, ri));
  items.push(li('MAT_FOUND_FORMWORK', soilC.conc  * totalBuaSqm * 4,  'sq.m', ds, qt, ri));

  // ── CAT_02: RCC Superstructure ─────────────────────────────────────────────
  const cRate  = ds.floorCementCoeff[floorTier];
  const sRate  = ds.floorSteelCoeff[floorTier];
  const isHighRise = numFloors > 15;

  const cQty   = round2(cRate * totalBuaSqft * structM.cm);
  const sQty   = round2(sRate * totalBuaSqft * structM.sm * seismicM);
  const sandQty= round2(cQty * 1.42);
  const aggQty = round2(cQty * 2.85);

  items.push(li('MAT_RCC_CEMENT',       cQty,                          'bags (50kg)', ds, qt, ri));
  items.push(li(isHighRise ? 'MAT_RCC_STEEL_550D' : 'MAT_RCC_STEEL',
                sQty,                                                    'kg',         ds, qt, ri));
  items.push(li('MAT_RCC_SAND',         sandQty,                        'cu.ft',      ds, qt, ri));
  items.push(li('MAT_RCC_AGGREGATE_20MM', aggQty,                       'cu.ft',      ds, qt, ri));
  items.push(li('MAT_RCC_FORMWORK',     totalBuaSqft * 0.095,           'sq.m',       ds, qt, ri));
  items.push(li('MAT_RCC_SLAB_FORM',   totalBuaSqft * 0.085,           'sq.m',       ds, qt, ri));
  items.push(li('MAT_RCC_BINDING_WIRE', (sQty / 1000) * 11,            'kg',         ds, qt, ri));
  items.push(li('MAT_RCC_ADMIX',        cQty * 0.014,                  'litres',     ds, qt, ri));
  items.push(li('MAT_RCC_SPACERS',      totalBuaSqft * 0.8,            'units',      ds, qt, ri));
  if (sys === 'Steel') {
    items.push(li('MAT_STEEL_STRUCT', totalBuaSqft * 12, 'kg', ds, qt, ri, true, 'Structural steel — varies with span and loading'));
  }
  if (isHighRise) {
    items.push(li('MAT_RCC_HIGH_CONC', totalBuaSqft / 10.764 * 0.25, 'cu.m', ds, qt, ri));
  }

  // ── CAT_03: Masonry, Plaster & Internal Finishes ──────────────────────────
  const useAAC    = qt !== 'Economy';
  const brickCode = useAAC ? 'MAT_MASON_BLOCK' : 'MAT_MASON_BRICK';
  const brickUnit = useAAC ? 'count (AAC)' : 'count (bricks)';
  const brickCoeff= useAAC ? 2.1 : 9.5;
  const brickQty  = round2(brickCoeff * wallAreaSqft * structM.mm);
  const mortarBags= round2((brickQty / 1000) * (useAAC ? 22 : 38));

  items.push(li(brickCode,          brickQty,                          brickUnit,    ds, qt, ri));
  items.push(li('MAT_MASON_CEMENT', mortarBags,                        'bags',       ds, qt, ri));
  items.push(li('MAT_MASON_SAND',   mortarBags * 0.6,                 'cu.ft',      ds, qt, ri));
  items.push(li('MAT_MASON_PARAPET', perimeterFt / 3.28,              'rmt',        ds, qt, ri));

  // Internal plaster
  const intWall = wallAreaSqft * 1.6; // both sides of walls
  if (qt === 'Premium') {
    items.push(li('MAT_PLAST_GYPSUM', intWall, 'sqft', ds, qt, ri));
  } else {
    items.push(li('MAT_PLAST_INT', intWall, 'sqft', ds, qt, ri));
    items.push(li('MAT_PLAST_POP', intWall * 0.5, 'sqft', ds, qt, ri));
  }
  items.push(li('MAT_PLAST_CEMENT', intWall / 100 * 3.8, 'bags', ds, qt, ri));

  // ── CAT_04: Waterproofing & Chemical ──────────────────────────────────────
  const wpCode = qt === 'Economy' ? 'MAT_WP_IPS' : qt === 'Premium' ? 'MAT_WP_CRYS' : 'MAT_WP_LIQ_PU';
  items.push(li(wpCode,              terraceArea * 1.08,                'sqft', ds, qt, ri));
  items.push(li('MAT_WP_BATH',       rc.bathrooms * 80,                'sqft', ds, qt, ri));
  items.push(li('MAT_WP_KITCH',      rc.kitchens  * 55,                'sqft', ds, qt, ri));
  items.push(li('MAT_WP_EXPANSION',  perimeterFt / 3.28,               'rmt',  ds, qt, ri, true, 'Expansion joints per perimeter'));
  items.push(li('MAT_ANTITERM_CHEMICAL', buaPerFloor / 100 * 1.5,     'litres', ds, qt, ri));
  if (bi.soilType === 'Waterlogged-prone' || bi.foundationType === 'Raft') {
    items.push(li('MAT_WP_BASEMENT', buaPerFloor * 1.2, 'sqft', ds, qt, ri, true, 'Basement tanking required — waterlogged/raft foundation'));
  }

  // ── CAT_05: Roofing & False Ceiling ───────────────────────────────────────
  items.push(li('MAT_ROOF_TERRACE', terraceArea * 1.08, 'sqft', ds, qt, ri));

  // False ceiling
  const ceilArea = bi.typology === 'Commercial' || bi.typology === 'Institutional'
    ? totalBuaSqft : totalBuaSqft * 0.80;
  const ceilCode = qt === 'Economy' ? 'MAT_CEIL_POP'
    : qt === 'Premium' ? (bi.typology === 'Commercial' ? 'MAT_CEIL_ACOU' : 'MAT_CEIL_GYPS')
    : 'MAT_CEIL_POP';
  if (qt !== 'Economy' || bi.typology === 'Commercial') {
    items.push(li(ceilCode, ceilArea, 'sqft', ds, qt, ri));
  }
  if (bi.typology === 'Commercial' && qt === 'Premium') {
    items.push(li('MAT_CEIL_WOODEN', ceilArea * 0.20, 'sqft', ds, qt, ri, true, 'Feature wooden ceiling in lobby/lounge'));
  }

  // ── CAT_06: Doors, Windows & Glazing ──────────────────────────────────────
  const winCode  = qt === 'Economy' ? 'MAT_WIN_ALUM' : qt === 'Premium' ? 'MAT_WIN_THERMBREAK' : 'MAT_WIN_UPVC';
  const doorCode = qt === 'Economy' ? 'MAT_DOOR_FLUSH' : qt === 'Premium' ? 'MAT_DOOR_PANEL' : 'MAT_DOOR_FLUSH';
  const winSqft  = rc.windows * 16;

  items.push(li(doorCode,            rc.doors,                         'units', ds, qt, ri));
  items.push(li('MAT_DOOR_FRAME',    rc.doors,                         'units', ds, qt, ri));
  items.push(li('MAT_DOOR_HARDWARE', rc.doors,                         'sets',  ds, qt, ri));
  items.push(li(winCode,             winSqft,                          'sqft',  ds, qt, ri));
  items.push(li('MAT_WIN_HARDWARE',  rc.windows,                       'sets',  ds, qt, ri));
  if (qt === 'Economy') items.push(li('MAT_GRILLE', winSqft, 'sqft', ds, qt, ri));
  if (qt === 'Premium') items.push(li('MAT_WIN_GLASS_DBLE', winSqft * 0.60, 'sqft', ds, qt, ri));

  // Fire exits (required by NBC 2016 for 4+ floors)
  if (numFloors >= 4) {
    const fireExits = Math.max(1, Math.ceil(numFloors / 8));
    items.push(li('MAT_DOOR_FIRE_RATED', fireExits * 2, 'units', ds, qt, ri, false, 'NBC 2016 compliance — fire exit doors'));
  }

  // ── CAT_07: Electrical & Low-Voltage ──────────────────────────────────────
  const ptFactor  = bi.typology === 'Industrial' ? 2.2 : bi.typology === 'Commercial' ? 1.8 : 1.0;
  const elecPoints= round2((totalBuaSqft / 80) * ptFactor);

  items.push(li('MAT_ELEC_POINT',     elecPoints,                       'points', ds, qt, ri));
  items.push(li('MAT_ELEC_DB_FLOOR',  Math.ceil(numFloors),             'units',  ds, qt, ri));
  items.push(li('MAT_ELEC_DB_MAIN',   1,                                'units',  ds, qt, ri));
  items.push(li('MAT_ELEC_MCB',       elecPoints * 0.6,                 'units',  ds, qt, ri));
  items.push(li('MAT_ELEC_RCCB',      Math.ceil(elecPoints / 10),       'units',  ds, qt, ri));
  items.push(li('MAT_ELEC_SWITCH_MOD',elecPoints * 0.8,                 'plates', ds, qt, ri));
  items.push(li('MAT_ELEC_SOCKET_16A',rc.bathrooms + rc.kitchens * 2,  'units',  ds, qt, ri));
  items.push(li('MAT_ELEC_EARTHING',  2,                                'sets',   ds, qt, ri));
  items.push(li('MAT_ELEC_WIRE_2_5',  totalBuaSqft * 0.22 * 3.28,      'metres', ds, qt, ri));
  items.push(li('MAT_ELEC_WIRE_1_5',  totalBuaSqft * 0.18 * 3.28,      'metres', ds, qt, ri));
  items.push(li('MAT_ELEC_CONDUIT_25',totalBuaSqft * 0.15 * 3.28,      'metres', ds, qt, ri));

  // CCTV — all typologies
  const cctvCams = Math.ceil(totalBuaSqft / 1000) + (bi.typology !== 'Residential' ? 4 : 0);
  items.push(li('MAT_ELEC_CCTV', cctvCams, 'cameras', ds, qt, ri, false, 'IP cameras — zones per IS 16616'));

  // Fire alarm — mandatory NBC 2016 for G+3 and above
  if (numFloors >= 3 || bi.typology !== 'Residential') {
    const detectors = Math.ceil(totalBuaSqft / 600);
    items.push(li('MAT_ELEC_FIRE_ALARM', detectors, 'detectors', ds, qt, ri));
  }

  // DG set — residential 4+ floors or commercial
  if (numFloors >= 4 || bi.typology !== 'Residential') {
    const dgKva = Math.ceil(totalBuaSqft / 1000) * 15;
    items.push(li('MAT_ELEC_GENSET', dgKva, 'kVA', ds, qt, ri, true, 'DG set — size per load calculation'));
  }

  // Video door phone
  items.push(li('MAT_ELEC_INTERCOM', Math.max(1, rc.units), 'units', ds, qt, ri));

  // High-rise: rising main bus duct
  if (numFloors >= 8) {
    items.push(li('MAT_ELEC_BUSDUCT', bi.heightFt * 0.3048, 'metres', ds, qt, ri, true, 'Rising main for high-rise power distribution'));
    items.push(li('MAT_ELEC_CABLE_TRAY', bi.heightFt * 0.3048 * 2, 'metres', ds, qt, ri));
  }

  // Solar — Premium or if BUA > 5000 sqft
  if (qt === 'Premium' || totalBuaSqft > 5000) {
    const solarKw  = Math.min(Math.floor(buaPerFloor / 200), 50); // up to 50kW
    const solarWp  = solarKw * 1000;
    items.push(li('MAT_ELEC_SOLAR_PANEL', solarWp, 'Wp', ds, qt, ri, true, 'Rooftop solar — size per NBC 2016 energy norm'));
    items.push(li('MAT_ELEC_SOLAR_INV',  solarKw,  'kW', ds, qt, ri));
  }

  // ── CAT_08: Plumbing, Sanitary & STP ──────────────────────────────────────
  const wcCode   = qt === 'Premium' ? 'MAT_PLUMB_EWC' : 'MAT_PLUMB_WC';
  const pipeCode = qt === 'Economy' ? 'MAT_PLUMB_PIPE_CPVC' : 'MAT_PLUMB_PIPE_PPR';
  const occupants= rc.units * 3.5;

  items.push(li(wcCode,               rc.bathrooms,                'units',   ds, qt, ri));
  items.push(li('MAT_PLUMB_WASH',     rc.bathrooms,                'units',   ds, qt, ri));
  if (qt !== 'Economy') {
    items.push(li('MAT_PLUMB_BATH',   rc.bathrooms,                'units',   ds, qt, ri));
  }
  if (qt === 'Premium') {
    items.push(li('MAT_PLUMB_BATHTUB', Math.ceil(rc.units * 0.5), 'units', ds, qt, ri, true, 'Master bath — indicative count'));
  }
  items.push(li('MAT_PLUMB_SINK_SS',  rc.kitchens,                 'units',   ds, qt, ri));
  items.push(li('MAT_PLUMB_FAUCET_BASIN', rc.bathrooms,           'units',   ds, qt, ri));
  items.push(li('MAT_PLUMB_FAUCET_BATH',  rc.bathrooms,           'units',   ds, qt, ri));
  items.push(li('MAT_PLUMB_FAUCET_KITCH', rc.kitchens,            'units',   ds, qt, ri));
  items.push(li(pipeCode,             (rc.bathrooms + rc.kitchens) * 18, 'metres', ds, qt, ri));
  items.push(li('MAT_PLUMB_PIPE_PVC', (rc.bathrooms + rc.kitchens) * 14, 'metres', ds, qt, ri));
  items.push(li('MAT_PLUMB_GULLY',    rc.bathrooms + rc.kitchens,  'units',   ds, qt, ri));
  items.push(li('MAT_PLUMB_TANK_OHT', occupants * 165,             'litres',  ds, qt, ri));
  items.push(li('MAT_PLUMB_TANK_SUMP',occupants * 900,             'litres',  ds, qt, ri, true, 'Sizing depends on municipal supply hours'));
  items.push(li('MAT_PLUMB_PUMP_BOOSTER', 1,                       'set',     ds, qt, ri));

  // STP — required for > 50 occupants (municipal norms)
  if (occupants > 50 || (bi.typology !== 'Residential' && numFloors >= 3)) {
    const stpKld = Math.ceil(occupants * 90 / 1000); // 90 lpcd
    items.push(li('MAT_PLUMB_STP', stpKld, 'KLD', ds, qt, ri, true, 'MBR STP — RERA/municipal compliance'));
    items.push(li('MAT_PLUMB_PUMP_SEWAGE', 1, 'set', ds, qt, ri));
  }

  // Solar water heater — Standard and Premium
  if (qt !== 'Economy' && bi.typology === 'Residential') {
    const hwsUnits = Math.ceil(rc.units * 0.5);
    items.push(li('MAT_PLUMB_SOLAR_HWS', hwsUnits, 'units', ds, qt, ri, true, '200 LPD per unit — BNBC 2016 green norm'));
  }

  // PNG gas — metro cities
  if (qt === 'Standard' || qt === 'Premium') {
    items.push(li('MAT_PLUMB_GAS_PIPE', rc.kitchens * 12, 'metres', ds, qt, ri, true, 'PNG gas — if available in city'));
  }

  // ── CAT_09: Flooring & Tiling ──────────────────────────────────────────────
  const mainFloorCode =
    qt === 'Economy'  ? 'MAT_FLOOR_CER' :
    qt === 'Premium'  ? (bi.typology === 'Commercial' ? 'MAT_FLOOR_GRANITE' : 'MAT_FLOOR_MARBLE_IND') :
    'MAT_FLOOR_VIT';
  const wastage = qt === 'Economy' ? 1.10 : qt === 'Premium' ? 1.06 : 1.08;

  items.push(li(mainFloorCode,         totalBuaSqft * wastage,          'sqft', ds, qt, ri));
  items.push(li('MAT_FLOOR_MORTAR',    totalBuaSqft * 0.95,             'sqft', ds, qt, ri));
  items.push(li('MAT_FLOOR_SKIRTING',  perimeterFt * numFloors * 0.85,  'rft',  ds, qt, ri));
  items.push(li('MAT_FLOOR_DADO_BATH', rc.bathrooms * 80,               'sqft', ds, qt, ri));
  items.push(li('MAT_FLOOR_DADO_KITCH',rc.kitchens  * 30,               'sqft', ds, qt, ri));

  // Industrial/commercial — epoxy floors
  if (bi.typology === 'Industrial') {
    items.push(li('MAT_FLOOR_EPOXY', totalBuaSqft * 0.70, 'sqft', ds, qt, ri, true, 'Epoxy screed — industrial floor finish'));
  }

  // Premium: imported marble for lobbies/common areas
  if (qt === 'Premium' && bi.typology !== 'Industrial') {
    items.push(li('MAT_FLOOR_MARBLE_IMP', totalBuaSqft * 0.08, 'sqft', ds, qt, ri, true, 'Premium imported marble — lobby/foyer areas'));
  }

  // ── CAT_10: Wall Finishing & Painting ──────────────────────────────────────
  const intWallArea = wallAreaSqft * 0.80;
  const extWallArea = facadeAreaSqft;
  const paintCode   = qt === 'Economy' ? 'MAT_PAINT_DISTEM' : 'MAT_PAINT_INT_EMU';
  const litresInt   = qt === 'Economy'
    ? round2(intWallArea / 100 * 22)
    : round2((intWallArea / 120) * 2);
  const extLitres   = round2((extWallArea / 95) * 2);

  items.push(li(paintCode,           litresInt,                         qt === 'Economy' ? 'kg' : 'litres', ds, qt, ri));
  items.push(li('MAT_PAINT_PRIMER',  intWallArea / 100 * 3.8,          'litres', ds, qt, ri));
  items.push(li('MAT_PAINT_PUTTY',   intWallArea / 100 * 22,           'kg',     ds, qt, ri));
  items.push(li('MAT_PAINT_EXT_EMU', extLitres,                        'litres', ds, qt, ri));
  if (qt === 'Premium') {
    items.push(li('MAT_PAINT_INT_LUSTER', intWallArea * 0.30 / 120 * 2, 'litres', ds, qt, ri, true, 'Feature walls — semi-gloss'));
    items.push(li('MAT_PAINT_EXT_ELAST', extLitres * 0.40, 'litres', ds, qt, ri, true, 'Elastomeric coat over textured areas'));
  }

  // ── CAT_11: Modular Kitchen, Joinery & Woodwork ───────────────────────────
  const kitchLft  = rc.kitchens * Math.sqrt(80) * 2.6;
  const kitchCode = qt === 'Economy' ? 'MAT_WOOD_KITCH_ECO' : qt === 'Premium' ? 'MAT_WOOD_KITCH_PREM' : 'MAT_WOOD_KITCH';
  items.push(li(kitchCode,           round2(kitchLft),                  'linear ft', ds, qt, ri));

  const carpFactor = qt === 'Economy' ? 0.15 : qt === 'Premium' ? 0.30 : 0.20;
  items.push(li('MAT_WOOD_CARPEN',   round2(totalBuaSqft * carpFactor), 'sqft',      ds, qt, ri));
  items.push(li('MAT_WOOD_POLISH',   round2(totalBuaSqft * carpFactor * 0.8), 'sqft', ds, qt, ri));

  if (qt !== 'Economy') {
    const bedrooms = Math.max(1, Math.floor(rc.bathrooms * 1.2));
    const wardrobeCode = qt === 'Premium' ? 'MAT_WOOD_WARDROBE_PREM' : 'MAT_WOOD_WARDROBE';
    items.push(li(wardrobeCode,      bedrooms,                          'units',  ds, qt, ri));
    items.push(li('MAT_WOOD_LOFT',   rc.kitchens * 8 + bedrooms * 4,  'rft',    ds, qt, ri));
    items.push(li('MAT_WOOD_TV_UNIT', rc.units,                        'units',  ds, qt, ri, true, 'One per flat/unit'));
  }
  if (qt === 'Premium') {
    items.push(li('MAT_WOOD_PANEL',  round2(totalBuaSqft * 0.12),      'sqft',   ds, qt, ri));
    items.push(li('MAT_WOOD_POOJA_MANDIR', rc.units,                   'units',  ds, qt, ri, true, 'For residential — pooja unit per flat'));
  }

  // ── CAT_12: Exterior Finishing & Cladding ─────────────────────────────────
  const facade = bi.facadeType ?? 'Conventional';
  items.push(li('MAT_PLAST_EXT', facadeAreaSqft, 'sqft', ds, qt, ri));

  if (facade === 'Curtain_Wall') {
    const cwCode = qt === 'Premium' ? 'MAT_EXT_CURTWALL_UHV' : 'MAT_EXT_CURTWALL';
    items.push(li(cwCode,            facadeAreaSqft * 0.85,             'sqft', ds, qt, ri));
  } else if (facade === 'ACP_Cladding') {
    items.push(li('MAT_EXT_CLADDING_ACP', facadeAreaSqft * 0.60,       'sqft', ds, qt, ri));
    items.push(li('MAT_EXT_PAINT',        facadeAreaSqft * 0.40,       'sqft', ds, qt, ri));
  } else {
    const extCode = qt === 'Premium' ? 'MAT_EXT_TEXTURE' : 'MAT_EXT_PAINT';
    items.push(li(extCode,           facadeAreaSqft,                    'sqft', ds, qt, ri));
    if (qt === 'Premium') {
      items.push(li('MAT_EXT_STONE_CLADDING', facadeAreaSqft * 0.15, 'sqft', ds, qt, ri, true, 'Feature stone cladding — podium + lobby'));
    }
  }

  // Boundary wall & external works (if plot area given)
  const plotSide = bi.plotAreaSqft > 0 ? Math.sqrt(bi.plotAreaSqft) : 0;
  if (plotSide > 30) {
    const boundaryRmt = (plotSide * 4) / 3.28;
    items.push(li('MAT_EXT_BOUNDARY_WALL', boundaryRmt, 'rmt',  ds, qt, ri, true, 'Perimeter compound wall — site-specific'));
    items.push(li('MAT_EXT_GATE_MAIN',     1,            'unit', ds, qt, ri, true, 'One main motorised gate'));
    const drivewaySqft = Math.min(plotSide * 15, 2000);
    items.push(li('MAT_EXT_PAVING',        drivewaySqft, 'sqft', ds, qt, ri, true, 'Driveway / approach road paving'));
    if (qt !== 'Economy') {
      const landscapeSqft = Math.max(0, bi.plotAreaSqft - totalBuaSqft - drivewaySqft);
      if (landscapeSqft > 200) {
        items.push(li('MAT_EXT_LANDSCAPE', landscapeSqft * 0.6, 'sqft', ds, qt, ri, true, 'Soft landscaping — turfing & planting'));
      }
    }
  }

  // ── CAT_13: Staircase, Railings & Lifts ───────────────────────────────────
  const numStairs  = bi.numStaircases ?? 1;
  const stairFloors= numFloors + (bi.parkingLevels ?? 0);
  const stairConc  : Record<string,number> = { Economy: 1.2, Standard: 1.6, Premium: 2.1 };
  const stairSteel : Record<string,number> = { Economy: 65,  Standard: 88,  Premium: 115 };

  items.push(li('MAT_STAIR_CONC',  round2(stairConc[qt]  * numStairs * stairFloors), 'cu.m', ds, qt, ri));
  items.push(li('MAT_STAIR_STEEL', round2(stairSteel[qt] * numStairs * stairFloors), 'kg',   ds, qt, ri));

  const railCode = qt === 'Economy' ? 'MAT_STAIR_RAILING_MS' : qt === 'Premium' ? 'MAT_STAIR_RAILING_GLASS' : 'MAT_STAIR_RAILING_SS';
  const railRft  : Record<string,number> = { Economy: 18, Standard: 22, Premium: 30 };
  items.push(li(railCode, round2(railRft[qt] * numStairs * stairFloors), 'rft', ds, qt, ri));

  // Stair treads
  const treadCode = qt === 'Economy' ? '' : qt === 'Premium' ? 'MAT_STAIR_GRANITE' : 'MAT_STAIR_GRANITE';
  if (treadCode) {
    items.push(li(treadCode, round2(numStairs * stairFloors * 12 * 3.5), 'sqft', ds, qt, ri));
  }

  // Lifts — required by NBC 2016 for G+3 (residential), G+1 (commercial/accessible)
  const numLifts = bi.numLifts ?? 0;
  if (numLifts > 0) {
    const liftCode = numFloors <= 5 ? 'MAT_LIFT_HYDRO' : numFloors <= 12 ? 'MAT_LIFT_4P' :
                     bi.typology === 'Commercial' ? 'MAT_LIFT_13P' : 'MAT_LIFT_8P';
    items.push(li(liftCode, numLifts, 'units', ds, qt, ri, true, 'Lift supply + installation — IS 14665'));
  } else if (numFloors >= 4 && bi.typology === 'Residential') {
    // Auto-suggest 1 lift
    items.push(li('MAT_LIFT_4P', 1, 'units', ds, qt, ri, true, 'NBC 2016 recommended — 1 lift for G+3 and above'));
  } else if (numFloors >= 2 && bi.typology !== 'Residential') {
    items.push(li('MAT_LIFT_4P', Math.max(1, numLifts || 1), 'units', ds, qt, ri, true, 'Lift — commercial accessibility norm'));
  }

  // ── CAT_14: HVAC, Fire Protection & MEP ───────────────────────────────────
  const hvacScope = bi.fireHvacScope ?? 'Not_sure';
  const bldgUse   = bi.buildingUse.toLowerCase();

  // HVAC
  if (hvacScope === 'Full_Central' || bi.typology === 'Commercial') {
    const tons = Math.ceil(totalBuaSqft / 400); // ~400 sqft per ton
    const hvacCode = bi.typology === 'Commercial' && cls.tier >= 2 ? 'MAT_HVAC_VRF' : 'MAT_HVAC_CENTRAL_AHU';
    items.push(li(hvacCode, tons, 'tons', ds, qt, ri, true, 'HVAC — full load calculation per ASHRAE 62.1'));
    items.push(li('MAT_HVAC_DUCT_INSUL', totalBuaSqft * 0.30, 'sqft', ds, qt, ri, true, 'Insulated ducting'));
    items.push(li('MAT_HVAC_FRESH_AIR',  totalBuaSqft * 0.20, 'sqft', ds, qt, ri, true, 'Fresh air ventilation (IS 3103)'));
  } else if (hvacScope === 'Basic' || qt !== 'Economy') {
    const tons = Math.ceil(totalBuaSqft / 550);
    const splitCode = qt === 'Premium' ? 'MAT_HVAC_CASSET' : 'MAT_HVAC_SPLIT';
    items.push(li(splitCode, tons, 'tons', ds, qt, ri, true, 'Split AC — indicative tonnage; final per room sizing'));
  }

  // Fire protection (NBC 2016 — mandatory G+3+)
  if (numFloors >= 3 || bi.typology !== 'Residential') {
    items.push(li('MAT_FIRE_HYDRANT',     numFloors,                 'sets',  ds, qt, ri, false, 'Wet riser — NBC Part 4 compliance'));
    items.push(li('MAT_FIRE_PUMP_SET',    1,                         'set',   ds, qt, ri, false, 'Main + jockey + diesel pump set'));
    items.push(li('MAT_FIRE_EXTINGUISHER',Math.ceil(totalBuaSqft / 200), 'units', ds, qt, ri));
  }

  // Fire sprinklers — commercial/institutional or Premium residential G+7+
  if (bi.typology !== 'Residential' || (numFloors >= 7 && qt === 'Premium')) {
    items.push(li('MAT_FIRE_SPRINKLER', Math.ceil(totalBuaSqft / 120), 'heads', ds, qt, ri, true, 'Wet pipe system — IS 15105'));
  }

  // Exhaust
  const exhaustUnits = rc.bathrooms + rc.kitchens + (bi.typology !== 'Residential' ? Math.ceil(totalBuaSqft / 2000) : 0);
  items.push(li('MAT_EXHAUST_FAN', exhaustUnits, 'units', ds, qt, ri));

  // ── CAT_15: Parking & Basement ────────────────────────────────────────────
  const parkLevels = bi.parkingLevels ?? 0;
  if (parkLevels > 0) {
    const basementSqft = buaPerFloor * parkLevels;
    const basementSqm  = basementSqft / 10.764;
    items.push(li('MAT_PARK_RCC_EXCAV',   basementSqm * 3.5,             'cu.m', ds, qt, ri, true, 'Basement excavation depth ~3.5m per level'));
    items.push(li('MAT_PARK_RCC_WALLS',   perimeterFt * 3.5 * parkLevels * 0.093, 'cu.m', ds, qt, ri));
    items.push(li('MAT_PARK_FLOOR_SCREED',basementSqft,                  'sqft', ds, qt, ri));
    items.push(li('MAT_PARK_LINING',      basementSqft * 1.3,            'sqft', ds, qt, ri, false, 'Basement WP — type depends on water table'));
    items.push(li('MAT_PARK_VENTILATION', basementSqft * 0.25,           'sqft', ds, qt, ri, true, 'Mechanical ventilation — NBC fire requirement'));
    items.push(li('MAT_PARK_PUMP_SUMP',   1,                             'set',  ds, qt, ri));
    const bayCount = Math.floor(basementSqft / 150);
    items.push(li('MAT_PARK_STRIPING',    bayCount,                      'bays', ds, qt, ri));
    if (qt !== 'Economy') {
      items.push(li('MAT_PARK_EV_CHARGING', Math.max(1, Math.floor(bayCount * 0.20)), 'points', ds, qt, ri, true, 'EV ready — 20% bays per RERA guidelines'));
    }
  }

  // ── CAT_16: Pool & Recreation (Premium only or explicit) ──────────────────
  if (qt === 'Premium' && bi.typology === 'Residential' && buaPerFloor > 4000) {
    const poolArea = Math.min(1200, buaPerFloor * 0.06);
    const poolVol  = poolArea * 1.5 / 10.764;
    items.push(li('MAT_POOL_EXCAV',      poolVol * 1.5,       'cu.m', ds, qt, ri, true, 'Swimming pool — site-specific design required'));
    items.push(li('MAT_POOL_RCC',        poolVol,             'cu.m', ds, qt, ri, true, 'M35 waterproof concrete'));
    items.push(li('MAT_POOL_TILE',       poolArea * 1.4,      'sqft', ds, qt, ri));
    items.push(li('MAT_POOL_PUMP_FILTER',1,                   'set',  ds, qt, ri));
    items.push(li('MAT_POOL_CHLORINATOR',1,                   'set',  ds, qt, ri));
    items.push(li('MAT_GYM_EQUIP',       Math.min(1500, buaPerFloor * 0.03), 'sqft', ds, qt, ri, true, 'Gymnasium — area per TOI'));
  }

  // ── CAT_17: Solar & Green Building ────────────────────────────────────────
  if (qt === 'Premium' || totalBuaSqft > 8000) {
    const rwh = bi.plotAreaSqft > 2000 ? 1 : 0;
    if (rwh) items.push(li('MAT_GREEN_RAINWATER', 1, 'system', ds, qt, ri, true, 'RWH — IS 15797 compliance'));
    if (qt === 'Premium') {
      items.push(li('MAT_GREEN_DUAL_FLUSH', rc.bathrooms, 'sets', ds, qt, ri));
    }
  }

  return items;
}

export { deriveDimensions, deriveRoomCounts, ITEM_NAMES, CATEGORY_NAMES };
