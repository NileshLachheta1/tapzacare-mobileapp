import { addClinicDays, clinicDate, isDateKey } from '../booking/dates';
import type {
  DoseIdentity,
  DoseRecords,
  DoseTiming,
  Medicine,
  Prescription,
} from './contracts';

export const timingLabels: Record<DoseTiming, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  night: 'Night',
};
export const timingIcons: Record<DoseTiming, string> = {
  morning: 'sun',
  afternoon: 'sun',
  night: 'moon',
};
export function prescriptionStart(prescription: Prescription): string {
  return clinicDate(new Date(prescription.issuedAt));
}
export function prescriptionEnd(prescription: Prescription): string {
  return addClinicDays(
    prescriptionStart(prescription),
    Math.max(1, ...prescription.medicines.map(medicine => medicine.days)) - 1,
  );
}
export function isMedicineScheduled(
  prescription: Prescription,
  medicine: Medicine,
  date: string,
): boolean {
  const start = prescriptionStart(prescription);
  return (
    isDateKey(date) &&
    date >= start &&
    date <= addClinicDays(start, medicine.days - 1)
  );
}
export function scheduledDoses(
  prescription: Prescription,
  date: string,
): { medicine: Medicine; timing: DoseTiming }[] {
  return prescription.medicines.flatMap(medicine =>
    isMedicineScheduled(prescription, medicine, date)
      ? medicine.timing.map(timing => ({ medicine, timing }))
      : [],
  );
}
export function doseKey(identity: DoseIdentity): string {
  return JSON.stringify([
    identity.patientId,
    identity.prescriptionId,
    identity.medicineId,
    identity.date,
    identity.timing,
  ]);
}
export function doseProgress(
  prescription: Prescription,
  date: string,
  patientId: string,
  records: DoseRecords,
) {
  const doses = scheduledDoses(prescription, date);
  return {
    total: doses.length,
    taken: doses.filter(
      ({ medicine, timing }) =>
        records[
          doseKey({
            patientId,
            prescriptionId: prescription.id,
            medicineId: medicine.id,
            date,
            timing,
          })
        ],
    ).length,
  };
}
export function scheduleDate(
  prescription: Prescription,
  today: string,
): string {
  return today < prescriptionStart(prescription)
    ? prescriptionStart(prescription)
    : today > prescriptionEnd(prescription)
    ? prescriptionEnd(prescription)
    : today;
}
