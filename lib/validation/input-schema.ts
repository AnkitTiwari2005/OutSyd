// lib/validation/input-schema.ts
// Shared Zod schemas used by both client (form) and server (API route)

import { z } from 'zod';

export const Tier1Schema = z.object({
  lengthFt      : z.coerce.number({ required_error: 'Length is required' }).positive('Must be greater than 0').max(2000),
  breadthFt     : z.coerce.number({ required_error: 'Breadth is required' }).positive('Must be greater than 0').max(2000),
  heightFt      : z.coerce.number({ required_error: 'Total height is required' }).positive('Must be greater than 0').max(1500),
  plotAreaSqft  : z.coerce.number({ required_error: 'Plot area is required' }).positive('Must be greater than 0'),
  numFloors     : z.coerce.number({ required_error: 'Number of floors is required' }).int().min(1, 'Minimum 1 floor').max(150, 'Maximum 150 floors'),
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

export const Tier2Schema = Tier1Schema.extend({
  structuralSystem: z.enum(['RCC_Frame', 'Load_bearing', 'Steel', 'Shear_Wall', 'Not_sure']).default('Not_sure'),
  foundationType  : z.enum(['Isolated', 'Raft', 'Pile', 'Not_sure']).default('Not_sure'),
  numLifts        : z.coerce.number().int().min(0).max(20).default(0),
  numStaircases   : z.coerce.number().int().min(1).max(20).default(1),
  parkingLevels   : z.coerce.number().int().min(0).max(10).default(0),
  unitsPerFloor   : z.coerce.number().int().min(1).max(100).optional(),
  seismicZone     : z.enum(['Zone_II', 'Zone_III', 'Zone_IV', 'Zone_V', 'Not_sure']).default('Not_sure'),
});

export const Tier3Schema = Tier2Schema.extend({
  soilBearingCapacity  : z.coerce.number().positive().optional(),
  windLoadZone         : z.enum(['Low', 'Moderate', 'High', 'Cyclone_prone', 'Not_sure']).default('Not_sure'),
  serviceFloors        : z.coerce.number().int().min(0).max(10).default(0),
  podiumLevels         : z.coerce.number().int().min(0).max(5).default(0),
  facadeType           : z.enum(['Curtain_Wall', 'ACP_Cladding', 'Conventional', 'Not_sure']).default('Not_sure'),
  fireHvacScope        : z.enum(['Basic', 'Full_Central', 'Not_sure']).default('Not_sure'),
  structuralDrawingUrl : z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const FullInputSchema = Tier3Schema.extend({
  targetTimelineMonths: z.coerce.number().int().positive().optional(),
  greenCertTarget     : z.enum(['None', 'IGBC', 'GRIHA']).optional(),
  localRateOverrides  : z.array(z.object({
    materialItemCode: z.string(),
    rate            : z.number().positive(),
  })).optional(),
});

export type Tier1Input  = z.infer<typeof Tier1Schema>;
export type Tier2Input  = z.infer<typeof Tier2Schema>;
export type Tier3Input  = z.infer<typeof Tier3Schema>;
export type FullInput   = z.infer<typeof FullInputSchema>;

// Step-level schemas for per-step validation in the multi-step form
export const STEP_SCHEMAS = [
  Tier1Schema,
  Tier2Schema,
  Tier3Schema,
  FullInputSchema,
] as const;

// Building use options per typology
export const BUILDING_USE_OPTIONS: Record<string, string[]> = {
  Residential  : ['Studio', '1BHK', '2BHK', '3BHK', '4BHK', 'Duplex', 'Villa', 'Row House'],
  Commercial   : ['Retail Shop', 'Office', 'Mall / Showroom', 'Hotel', 'Service Apartment'],
  Institutional: ['School', 'College', 'Hospital', 'Clinic', 'Hostel', 'Community Hall'],
  Industrial   : ['Warehouse', 'Factory', 'Workshop', 'Cold Storage', 'IT Park'],
};
