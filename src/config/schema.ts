import { z } from 'zod';

export const variantSchema = z.enum(['everyday', 'diwali']);
export type ConfigVariant = z.infer<typeof variantSchema>;
export const screenSchema = z.enum([
  'home',
  'bookings',
  'prescriptions',
  'profile',
]);
export type ScreenName = z.infer<typeof screenSchema>;
const colour = z.string().regex(/^#[\da-f]{6}$/i, 'Use a six-digit hex colour');
const id = z.string().min(1);
const imageUrl = z
  .string()
  .refine(
    value => /^(https?:\/\/|asset:\/\/)/.test(value),
    'Use an http(s) URL or bundled asset:// reference',
  );

export const themeSchema = z.object({
  primary: colour,
  secondary: colour,
  background: colour,
  surface: colour,
  textPrimary: colour,
  textSecondary: colour,
  accent: colour,
  festival: z
    .object({ name: id, greeting: id, bannerImageUrl: imageUrl })
    .optional(),
  surfaceAlt: colour.optional(),
  border: colour.optional(),
  warmSurface: colour.optional(),
  warmText: colour.optional(),
});

const actionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('scroll'),
    sectionType: z.enum(['service_grid', 'doctor_carousel']),
  }),
  z.object({ kind: z.literal('tab'), screen: screenSchema }),
]);
export type ConfigAction = z.infer<typeof actionSchema>;

export const backgroundSchema = z.object({
  kind: z.enum(['color', 'gradient', 'image']),
  value: z.string().min(1),
});
const sectionEnvelope = z.object({
  id,
  type: id,
  background: backgroundSchema,
  title: z.string().optional(),
  items: z.array(z.unknown()),
});
const heroItem = z.object({
  id,
  greeting: id,
  headline: id,
  description: id,
  location: id,
  imageUrl,
  buttonLabel: id,
  action: actionSchema,
});
const actionItem = z.object({ id, label: id, icon: id, action: actionSchema });
const serviceItem = z.object({
  id,
  name: id,
  description: id,
  priceInr: z.number().nonnegative(),
  imageUrl,
  doctorId: id,
  badge: z.string().optional(),
});
const doctorItem = z.object({ id, doctorId: id, nextAvailableLabel: id });
const offerItem = z.object({ id, message: id, icon: id });

const sectionSchemas = {
  hero_banner: sectionEnvelope.extend({
    type: z.literal('hero_banner'),
    items: z.array(heroItem).max(1),
  }),
  category_chips: sectionEnvelope.extend({
    type: z.literal('category_chips'),
    items: z.array(actionItem),
  }),
  quick_actions: sectionEnvelope.extend({
    type: z.literal('quick_actions'),
    items: z.array(actionItem),
  }),
  service_grid: sectionEnvelope.extend({
    type: z.literal('service_grid'),
    columns: z.union([z.literal(2), z.literal(3)]).default(2),
    items: z.array(serviceItem),
  }),
  doctor_carousel: sectionEnvelope.extend({
    type: z.literal('doctor_carousel'),
    items: z.array(doctorItem),
  }),
  offer_strip: sectionEnvelope.extend({
    type: z.literal('offer_strip'),
    items: z.array(offerItem),
  }),
};

export type SectionType = keyof typeof sectionSchemas;
export type HomeSection = {
  [K in SectionType]: z.infer<(typeof sectionSchemas)[K]>;
}[SectionType];
export type SectionOf<T extends SectionType> = Extract<
  HomeSection,
  { type: T }
>;
export type ServiceItem = z.infer<typeof serviceItem>;
export type Background = z.infer<typeof backgroundSchema>;

const envelopeSchema = z
  .object({
    version: z.number().int().positive(),
    theme: themeSchema,
    tabs: z
      .array(z.object({ id, label: id, icon: id, screen: screenSchema }))
      .min(1),
    // Validate known payloads below; future section types may have new fields.
    sections: z.array(z.object({ id, type: id }).passthrough()),
    designTokens: z
      .object({
        spacingScale: z.number().min(0.8).max(1.5).optional(),
        fontScale: z.number().min(1).max(1.3).optional(),
        radiusScale: z.number().min(0.5).max(1.5).optional(),
      })
      .optional(),
  })
  .superRefine((config, ctx) => {
    for (const [name, values] of [
      ['section', config.sections.map(section => section.id)],
      ['tab', config.tabs.map(tab => tab.id)],
      ['screen', config.tabs.map(tab => tab.screen)],
    ] as const) {
      if (new Set(values).size !== values.length) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate ${name} identifiers`,
        });
      }
    }
    if (!config.tabs.some(tab => tab.screen === 'home')) {
      ctx.addIssue({ code: 'custom', message: 'A home tab is required' });
    }
  });

export type LayoutConfig = Omit<z.infer<typeof envelopeSchema>, 'sections'> & {
  sections: HomeSection[];
};

export function parseConfig(input: unknown): LayoutConfig {
  const config = envelopeSchema.parse(input);
  const sections: HomeSection[] = [];
  for (const section of config.sections) {
    // Unknown types are a forward-compatible extension, not a failed config.
    if (Object.prototype.hasOwnProperty.call(sectionSchemas, section.type)) {
      const schema = sectionSchemas[section.type as SectionType];
      sections.push(schema.parse(section));
    }
  }
  return { ...config, sections };
}

export const doctorSchema = z.object({
  id,
  name: id,
  specialty: id,
  photoUrl: imageUrl,
  feeInr: z.number().nonnegative(),
  languages: z.array(id),
});
export type Doctor = z.infer<typeof doctorSchema>;
