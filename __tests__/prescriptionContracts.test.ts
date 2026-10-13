import fixtures from '../src/mocks/prescriptions.json';
import { prescriptionsSchema } from '../src/features/prescriptions/contracts';
describe('prescription API contracts', () => {
  it('validates the assignment shape and accepts empty lists and prescriptions without medicines', () => {
    const data = prescriptionsSchema.parse(fixtures);
    expect(data).toHaveLength(2);
    expect(prescriptionsSchema.parse([])).toEqual([]);
    expect(
      prescriptionsSchema.parse([{ ...data[0], medicines: [] }])[0]?.medicines,
    ).toEqual([]);
  });
  it('rejects duplicate identities, unsupported times and invalid courses before rendering', () => {
    const prescription = prescriptionsSchema.parse(fixtures)[0]!;
    const medicine = prescription.medicines[0]!;
    expect(() =>
      prescriptionsSchema.parse([prescription, prescription]),
    ).toThrow();
    expect(() =>
      prescriptionsSchema.parse([
        { ...prescription, medicines: [medicine, medicine] },
      ]),
    ).toThrow();
    expect(() =>
      prescriptionsSchema.parse([
        { ...prescription, medicines: [{ ...medicine, days: 0 }] },
      ]),
    ).toThrow();
    expect(() =>
      prescriptionsSchema.parse([
        {
          ...prescription,
          medicines: [{ ...medicine, timing: ['morning', 'morning'] }],
        },
      ]),
    ).toThrow();
    expect(() =>
      prescriptionsSchema.parse([
        { ...prescription, medicines: [{ ...medicine, timing: ['evening'] }] },
      ]),
    ).toThrow();
  });
});
