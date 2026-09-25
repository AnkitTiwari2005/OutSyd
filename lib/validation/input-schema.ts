// lib/validation/input-schema.ts
// Shared Zod schemas used by both client (form) and server (API route)

import { z } from 'zod';

export const Tier1BaseSchema = z.object({
  lengthFt      : z.coerce.number({ required_error: 'Length is required' }).finite().positive('Must be greater than 0').max(2000),
  breadthFt     : z.coerce.number({ required_error: 'Breadth is required' }).finite().positive('Must be greater than 0').max(2000),
  heightFt      : z.coerce.number({ required_error: 'Total height is required' }).finite().positive('Must be greater than 0').max(1500),
  plotAreaSqft  : z.coerce.number({ required_error: 'Plot area is required' }).finite().positive('Must be greater than 0').max(10_000_000, 'Plot area exceeds maximum 10,000,000 sqft'),
  numFloors     : z.coerce.number({ required_error: 'Number of floors is required' }).finite().int().min(1, 'Minimum 1 floor').max(150, 'Maximum 150 floors'),
  typology      : z.enum(['Residential', 'Commercial', 'Institutional', 'Industrial'], {
    required_error: 'Building typology is required',
  }),
  buildingUse   : z.string({ required_error: 'Building use is required' }).min(1, 'Required').max(100),
  soilType      : z.enum(['Normal', 'Rocky', 'Filled-up', 'Waterlogged-prone'], {
    required_error: 'Soil type is required',
  }),
  locationRegion: z.string({ required_error: 'Location is required' }).min(1, 'Location is required').max(255),
  qualityTier   : z.enum(['Economy', 'Standard', 'Premium'], {
    required_error: 'Quality tier is required',
  }),
});

// Helper for optional numeric inputs that may be received as empty string, null, or NaN from form elements
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const num = Number(val);
    if (Number.isNaN(num)) return undefined;
    return num;
  }, schema.optional());

// Helper for optional URL inputs that may lack protocol or have leading/trailing whitespace
const optionalUrl = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return undefined;
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }
  return val;
}, z.string().url('Must be a valid URL (e.g. https://drive.google.com/...)').regex(/^https?:\/\//i, 'Only HTTP/HTTPS URLs are allowed').optional());


export const Tier2BaseSchema = Tier1BaseSchema.extend({
  structuralSystem: z.enum(['RCC_Frame', 'Load_bearing', 'Steel', 'Shear_Wall', 'Not_sure']).default('Not_sure'),
  foundationType  : z.enum(['Isolated', 'Raft', 'Pile', 'Not_sure']).default('Not_sure'),
  numLifts        : z.coerce.number().finite().int().min(0).max(20).default(0),
  numStaircases   : z.coerce.number().finite().int().min(1).max(20).default(1),
  parkingLevels   : z.coerce.number().finite().int().min(0).max(10).default(0),
  unitsPerFloor   : optionalNumber(z.number().finite().int().min(1).max(100)),
  seismicZone     : z.enum(['Zone_II', 'Zone_III', 'Zone_IV', 'Zone_V', 'Not_sure']).default('Not_sure'),
});

export const Tier3BaseSchema = Tier2BaseSchema.extend({
  soilBearingCapacity  : optionalNumber(z.number().finite().positive().max(1000, 'Safe bearing capacity cannot exceed 1000 kN/m²')),
  windLoadZone         : z.enum(['Low', 'Moderate', 'High', 'Cyclone_prone', 'Not_sure']).default('Not_sure'),
  serviceFloors        : z.coerce.number().finite().int().min(0).max(10).default(0),
  podiumLevels         : z.coerce.number().finite().int().min(0).max(5).default(0),
  facadeType           : z.enum(['Curtain_Wall', 'ACP_Cladding', 'Conventional', 'Not_sure']).default('Not_sure'),
  fireHvacScope        : z.enum(['Basic', 'Full_Central', 'Not_sure']).default('Not_sure'),
  structuralDrawingUrl : optionalUrl,
});

export const FullInputBaseSchema = Tier3BaseSchema.extend({
  targetTimelineMonths: optionalNumber(z.number().finite().int().positive()),
  greenCertTarget     : z.enum(['None', 'IGBC', 'GRIHA']).optional(),
  localRateOverrides  : z.array(z.object({
    materialItemCode: z.string(),
    rate            : z.number().finite().positive(),
  })).max(50, 'Cannot exceed 50 local rate overrides').optional(),
});

// Cross-field validation: building footprint vs plot area & ground coverage ratio and floor height
const validateBuildingConstraints = (
  data: {
    lengthFt?: number;
    breadthFt?: number;
    plotAreaSqft?: number;
    heightFt?: number;
    numFloors?: number;
    typology?: string;
    buildingUse?: string;
  },
  ctx: z.RefinementCtx
) => {
  if (data.lengthFt && data.breadthFt && data.plotAreaSqft) {
    const footprint = data.lengthFt * data.breadthFt;
    if (footprint > data.plotAreaSqft) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Building footprint (${footprint.toLocaleString('en-IN')} sqft) cannot exceed total plot area (${data.plotAreaSqft.toLocaleString('en-IN')} sqft). Please increase plot area or reduce building dimensions.`,
        path: ['plotAreaSqft'],
      });
    } else if (footprint / data.plotAreaSqft > 0.85) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Ground coverage ratio (${((footprint / data.plotAreaSqft) * 100).toFixed(0)}%) exceeds standard 85% maximum plot coverage norm (NBC 2016). Minimum plot area for this footprint is ${Math.ceil(footprint / 0.85).toLocaleString('en-IN')} sqft.`,
        path: ['plotAreaSqft'],
      });
    }
  }

  // H-5: Floor-to-floor height validation (8–20 ft for typical buildings, up to 40 ft for industrial sheds/warehouses)
  if (data.heightFt && data.numFloors && data.numFloors > 0) {
    const floorToFloor = data.heightFt / data.numFloors;
    const maxHeight = data.typology === 'Industrial' ? 40 : 20;
    if (floorToFloor < 8 || floorToFloor > maxHeight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Average floor-to-floor height (${floorToFloor.toFixed(1)} ft) must be between 8 ft and ${maxHeight} ft (NBC 2016 norms).`,
        path: ['heightFt'],
      });
    }
  }

  // Cross-field validation: buildingUse must be valid for typology
  if (data.typology && data.buildingUse) {
    const validUses = BUILDING_USE_OPTIONS[data.typology];
    if (validUses && !validUses.includes(data.buildingUse)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid building use "${data.buildingUse}" for typology "${data.typology}". Allowed uses: ${validUses.join(', ')}`,
        path: ['buildingUse'],
      });
    }
  }
};

export const Tier1Schema = Tier1BaseSchema.superRefine(validateBuildingConstraints);
export const Tier2Schema = Tier2BaseSchema.superRefine(validateBuildingConstraints);
export const Tier3Schema = Tier3BaseSchema.superRefine(validateBuildingConstraints);
export const FullInputSchema = FullInputBaseSchema.superRefine(validateBuildingConstraints);

export type Tier1Input  = z.infer<typeof Tier1Schema>;
export type Tier2Input  = z.infer<typeof Tier2Schema>;
export type Tier3Input  = z.infer<typeof Tier3Schema>;
export type FullInput   = z.infer<typeof FullInputSchema>;
export type Typology    = z.infer<typeof Tier1BaseSchema>['typology'];

// Step-level schemas for per-step validation in the multi-step form
export const STEP_SCHEMAS = [
  Tier1Schema,
  Tier2Schema,
  Tier3Schema,
  FullInputSchema,
] as const;

// Building use options per typology
export const BUILDING_USE_OPTIONS: Record<string, string[]> = {
  Residential  : ['Studio', '1BHK', '2BHK', '3BHK', '4BHK', 'Duplex', 'Villa', 'Row House', 'Independent House', 'Independent House / Villa'],
  Commercial   : ['Retail Shop', 'Office', 'Mall / Showroom', 'Hotel', 'Service Apartment'],
  Institutional: ['School', 'College', 'Hospital', 'Clinic', 'Hostel', 'Community Hall'],
  Industrial   : ['Warehouse', 'Factory', 'Workshop', 'Cold Storage', 'IT Park'],
};
