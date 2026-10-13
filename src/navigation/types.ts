import type { NavigatorScreenParams } from '@react-navigation/native';
export type RootTabParams = {
  home: undefined;
  bookings: undefined;
  prescriptions: NavigatorScreenParams<PrescriptionStackParams> | undefined;
  profile: undefined;
};
export type PrescriptionStackParams = {
  PrescriptionList: undefined;
  PrescriptionDetail: { prescriptionId: string };
};
