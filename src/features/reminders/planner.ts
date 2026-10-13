import { addClinicDays, clinicDate } from '../booking/dates';
import {
  doseTimings,
  type Prescription,
  type DoseRecords,
} from '../prescriptions/contracts';
import {
  scheduledDoses,
  doseKey,
  timingLabels,
} from '../prescriptions/schedule';
import { translate } from '../../i18n';
export const reminderHours = {
  morning: '08:00',
  afternoon: '14:00',
  night: '21:00',
};
export function planReminders(
  prescriptions: Prescription[],
  records: DoseRecords,
  patientId: string,
  language: 'en' | 'hi',
  now = Date.now(),
) {
  const planned: {
    id: string;
    timestamp: number;
    title: string;
    body: string;
    prescriptionId: string;
  }[] = [];
  for (let day = 0; day < 7; day++) {
    const date = addClinicDays(clinicDate(now), day);
    for (const rx of prescriptions)
      for (const timing of doseTimings) {
        const timestamp = Date.parse(
          `${date}T${reminderHours[timing]}:00+05:30`,
        );
        if (timestamp <= now) continue;
        const medicines = scheduledDoses(rx, date).filter(
          dose =>
            dose.timing === timing &&
            !records[
              doseKey({
                patientId,
                prescriptionId: rx.id,
                medicineId: dose.medicine.id,
                date,
                timing,
              })
            ],
        );
        if (!medicines.length) continue;
        planned.push({
          id: `medicine-${rx.id}-${date}-${timing}`,
          timestamp,
          title: `${translate('Medicine reminders', language)} · ${translate(
            timingLabels[timing],
            language,
          )}`,
          body: medicines
            .map(({ medicine }) => `${medicine.name} · ${medicine.dose}`)
            .join(', '),
          prescriptionId: rx.id,
        });
      }
  }
  return planned.sort((a, b) => a.timestamp - b.timestamp).slice(0, 48);
}
