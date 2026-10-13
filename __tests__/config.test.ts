import everyday from '../src/mocks/everyday.json';
import diwali from '../src/mocks/diwali.json';
import { parseConfig } from '../src/config/schema';
import { contrastRatio, createTheme } from '../src/theme/tokens';
import { gradientStops } from '../src/components/ui/SectionSurface';

describe('configuration contract', () => {
  it('validates both fixtures, all six renderers and distinct section order/content', () => {
    const normal = parseConfig(everyday);
    const festival = parseConfig(diwali);
    expect(new Set(normal.sections.map(section => section.type)).size).toBe(6);
    expect(festival.sections.map(section => section.type)).not.toEqual(
      normal.sections.map(section => section.type),
    );
    expect(festival.theme.primary).not.toBe(normal.theme.primary);
    expect(festival.sections[0]?.items).not.toEqual(normal.sections[0]?.items);
    expect(
      festival.sections.find(section => section.type === 'service_grid')?.items,
    ).not.toEqual(
      normal.sections.find(section => section.type === 'service_grid')?.items,
    );
  });
  it('skips an unknown section without rejecting the rest of the config', () => {
    const config = parseConfig({
      ...everyday,
      sections: [
        ...everyday.sections,
        {
          id: 'future',
          type: 'future_widget',
          background: { kind: 'color', value: '#FFFFFF' },
          items: [],
        },
      ],
    });
    expect(config.sections).toHaveLength(6);
  });
  it('ignores the payload shape of an unknown future section', () => {
    const config = parseConfig({
      ...everyday,
      sections: [
        ...everyday.sections,
        { id: 'new-kind', type: 'future_shader', payload: { newFields: true } },
      ],
    });
    expect(config.sections).toHaveLength(6);
  });
  it('rejects invalid required colours, duplicate IDs and invalid known items', () => {
    expect(() =>
      parseConfig({
        ...everyday,
        theme: { ...everyday.theme, primary: 'bad-colour' },
      }),
    ).toThrow();
    expect(() =>
      parseConfig({
        ...everyday,
        sections: [everyday.sections[0], everyday.sections[0]],
      }),
    ).toThrow();
    const sections = everyday.sections.map(section =>
      section.type === 'service_grid'
        ? {
            ...section,
            items: [{ id: 'bad', name: 'Bad price', priceInr: -1 }],
          }
        : section,
    );
    expect(() => parseConfig({ ...everyday, sections })).toThrow();
  });
  it('requires a reachable home and skips no valid empty section list', () => {
    expect(() =>
      parseConfig({
        ...everyday,
        tabs: everyday.tabs.filter(tab => tab.screen !== 'home'),
      }),
    ).toThrow();
    expect(parseConfig({ ...everyday, sections: [] }).sections).toEqual([]);
  });
  it.each([everyday, diwali])('keeps key text/surface pairs readable', raw => {
    const theme = createTheme(parseConfig(raw));
    expect(
      contrastRatio(theme.colours.primary, theme.colours.onPrimary),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(theme.colours.textPrimary, theme.colours.background),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(theme.colours.textSecondary, theme.colours.surface),
    ).toBeGreaterThanOrEqual(4.5);
  });
  it('derives spacing and type sizes from the optional config tokens', () => {
    const baseline = createTheme(parseConfig(everyday));
    const scaled = createTheme(
      parseConfig({
        ...everyday,
        designTokens: { spacingScale: 1.2, fontScale: 1.2 },
      }),
    );
    expect(scaled.spacing.lg).toBe(baseline.spacing.lg * 1.2);
    expect(scaled.type.body).toBe(baseline.type.body * 1.2);
  });
  it('uses a safe fallback for malformed gradient encodings', () => {
    expect(gradientStops('["#E3F0E8","#EDF1EB"]')).toEqual([
      '#E3F0E8',
      '#EDF1EB',
    ]);
    expect(gradientStops('not-json')).toBeNull();
    expect(gradientStops('["unsafe", "blue"]')).toBeNull();
  });
});
