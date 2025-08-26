import { z } from 'zod'

// ========== CORE INPUT SCHEMAS ==========

export const OperatorInputSchema = z.object({
  name: z.string().min(1, 'Operator name is required'),
  id: z.string().uuid().optional(), // Generated if not provided
})

export const DomainCandidateSchema = z.object({
  operator_id: z.string().uuid(),
  url: z.string().url(),
  domain: z.string().min(1),
  source: z.enum(['google', 'bing', 'manual', 'referral']),
  confidence: z.number().min(0).max(1),
})

// ========== EXTRACTION SCHEMAS ==========

export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  full_address: z.string().optional(),
})

export const ContactSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  form_url: z.string().url().optional(),
})

export const GeocodeSchema = z.object({
  lat: z.number(),
  lng: z.number(),
})

export const PricingSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3), // ISO 4217
  unit: z.enum(['pp', 'pcm', 'pppd', 'hour', 'day', 'week', 'month']),
  vat_included: z.boolean().optional(),
  raw_text: z.string().optional(), // Original pricing text
})

// ========== EXTRACTION RESULT SCHEMAS ==========

export const OperatorExtractionSchema = z.object({
  brand_name: z.string(),
  legal_name: z.string().optional(),
  tagline: z.string().optional(),
  about_text: z.string().optional(),
  hq_address: AddressSchema.optional(),
  phone: z.string().optional(),
  emails: z.array(z.string().email()).default([]),
  social_urls: z.array(z.string().url()).default([]),
  brand_tokens: z.array(z.string()).default([]),
  logo_urls: z.array(z.string().url()).default([]),
  brand_colors: z.array(z.string()).default([]),
  company_ids: z.array(z.string()).default([]),
})

export const OfficeExtractionSchema = z.object({
  name: z.string(),
  building_name: z.string().optional(),
  address: AddressSchema.optional(),
  geocode: GeocodeSchema.optional(),
  neighbourhood: z.string().optional(),
  contact: ContactSchema.optional(),
  opening_hours: z.record(z.string()).optional(), // day -> hours
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string().url()).default([]),
  virtual_tour_urls: z.array(z.string().url()).default([]),
  transport_notes: z.string().optional(),
})

export const ProductExtractionSchema = z.object({
  space_type: z.enum([
    'hot_desk', 'dedicated_desk', 'private_office', 'meeting_room', 
    'event_space', 'virtual_office', 'coworking_membership', 'day_pass'
  ]),
  name: z.string().optional(),
  description: z.string().optional(),
  capacity_min: z.number().int().positive().optional(),
  capacity_max: z.number().int().positive().optional(),
  availability_notes: z.string().optional(),
  min_term: z.string().optional(),
  term_options: z.array(z.string()).default([]),
  pricing: z.array(PricingSchema).optional(),
  inclusions: z.array(z.string()).default([]),
  add_ons: z.array(z.string()).default([]),
  booking_link: z.string().url().optional(),
})

export const MeetingRoomExtractionSchema = z.object({
  name: z.string(),
  capacity: z.number().int().positive().optional(),
  layouts: z.array(z.string()).default([]),
  rates: z.record(z.array(PricingSchema)).optional(), // duration -> pricing[]
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string().url()).default([]),
  booking_link: z.string().url().optional(),
})

// ========== PAGE CLASSIFICATION SCHEMA ==========

export const PageTypeSchema = z.enum([
  'locations_index',  // Main locations page
  'city_index',      // City-specific locations
  'location_detail', // Individual location page
  'product_pricing', // Pricing/plans page
  'meeting_rooms',   // Meeting room listings
  'about',          // About/company page
  'contact',        // Contact page
  'generic',        // Other pages
  'unknown'         // Unclassified
])

// ========== AGENT JOB SCHEMAS ==========

export const DomainDiscoveryJobSchema = z.object({
  operator_name: z.string().min(1),
  operator_id: z.string().uuid(),
})

export const DomainVerificationJobSchema = z.object({
  operator_id: z.string().uuid(),
  domain: z.string().min(1),
  brand_tokens: z.array(z.string()).default([]),
})

export const PageScrapingJobSchema = z.object({
  page_url: z.string().url(),
  page_type: PageTypeSchema,
  operator_id: z.string().uuid(),
  retry_count: z.number().int().min(0).default(0),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
})

export const ExtractionJobSchema = z.object({
  page_content: z.string(),
  page_type: PageTypeSchema,
  page_url: z.string().url(),
  operator_id: z.string().uuid(),
})

export const OfficeResolutionJobSchema = z.object({
  extractions: z.array(z.any()), // Array of different extraction types
  operator_id: z.string().uuid(),
  page_url: z.string().url(),
})

// ========== SYSTEM SCHEMAS ==========

export const CrawlStatsSchema = z.object({
  pages_discovered: z.number().int().min(0).default(0),
  pages_crawled: z.number().int().min(0).default(0),
  pages_failed: z.number().int().min(0).default(0),
  extractions_created: z.number().int().min(0).default(0),
  offices_detected: z.number().int().min(0).default(0),
  errors: z.array(z.string()).default([]),
})

export const SystemMetricSchema = z.object({
  metric_name: z.string(),
  value: z.number(),
  tags: z.record(z.string()).optional(),
})

// ========== NORMALIZED AMENITIES ==========

export const AmenitySchema = z.enum([
  '24_7_access', 'dog_friendly', 'showers', 'phone_booths', 'bike_storage',
  'printing', 'mail_handling', 'event_space', 'parking', 'reception',
  'wheelchair_access', 'kitchen', 'coffee', 'wifi', 'air_conditioning',
  'heating', 'natural_light', 'outdoor_space', 'lockers', 'security',
  'cleaning', 'meeting_rooms', 'quiet_zone', 'community_events', 'gym'
])

// ========== TYPE EXPORTS ==========

export type OperatorInput = z.infer<typeof OperatorInputSchema>
export type DomainCandidate = z.infer<typeof DomainCandidateSchema>
export type OperatorExtraction = z.infer<typeof OperatorExtractionSchema>
export type OfficeExtraction = z.infer<typeof OfficeExtractionSchema>
export type ProductExtraction = z.infer<typeof ProductExtractionSchema>
export type MeetingRoomExtraction = z.infer<typeof MeetingRoomExtractionSchema>
export type PageType = z.infer<typeof PageTypeSchema>
export type CrawlStats = z.infer<typeof CrawlStatsSchema>
export type SystemMetric = z.infer<typeof SystemMetricSchema>
export type Amenity = z.infer<typeof AmenitySchema>