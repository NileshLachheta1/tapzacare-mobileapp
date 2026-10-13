import { z } from 'zod';

export const doseTimings = ['morning', 'afternoon', 'night'] as const;
export const doseTimingSchema = z.enum(doseTimings);
export type DoseTiming = z.infer<typeof doseTimingSchema>;
const text = z.string().trim().min(1);
export const medicineSchema = z.object({
  id: text,
  name: text,
  dose: text,
  days: z.number().int().positive(),
  timing: z
    .array(doseTimingSchema)
    .min(1)
    .refine(
      items => new Set(items).size === items.length,
      'Duplicate medicine timing',
    ),
});
export type Medicine = z.infer<typeof medicineSchema>;
export const prescriptionSchema = z.object({
  id: text,
  issuedAt: z.union([z.iso.datetime({ offset: true }), z.iso.date()]),
  doctorName: text,
  clinicName: text,
  medicines: z
    .array(medicineSchema)
    .refine(
      items => new Set(items.map(item => item.id)).size === items.length,
      'Duplicate medicine ID',
    ),
});
export type Prescription = z.infer<typeof prescriptionSchema>;
export const prescriptionsSchema = z
  .array(prescriptionSchema)
  .refine(
    items => new Set(items.map(item => item.id)).size === items.length,
    'Duplicate prescription ID',
  );
export type DoseIdentity = {
  patientId: string;
  prescriptionId: string;
  medicineId: string;
  date: string;
  timing: DoseTiming;
};
export type DoseRecord = DoseIdentity & { takenAt: string };
export type DoseRecords = Record<string, DoseRecord>;
