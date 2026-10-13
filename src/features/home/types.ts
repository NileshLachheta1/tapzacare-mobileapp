import type { ConfigAction, Doctor, ServiceItem } from '../../config/schema';
import type { DoctorAvailability } from './availability';
export type HomeIntent =
  | ConfigAction
  | { kind: 'service'; service: ServiceItem }
  | { kind: 'doctor'; doctor: Doctor; nextAvailableLabel: string };
export type DoctorDirectory = {
  doctors: Doctor[];
  loading: boolean;
  failed: boolean;
  retry(): void;
  availability?: Record<string, DoctorAvailability>;
};
