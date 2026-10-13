import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import everyday from '../src/mocks/everyday.json';
import { parseConfig, type SectionOf } from '../src/config/schema';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { ServiceGrid } from '../src/features/home/sections';

const config = parseConfig(everyday);
const section = config.sections.find(
  (item): item is SectionOf<'service_grid'> => item.type === 'service_grid',
);
if (!section) {
  throw new Error('Fixture must include a service grid');
}
describe('config-driven service grid', () => {
  it('renders the supplied title, services and rupee prices, then sends the correct action', () => {
    const onAction = jest.fn();
    render(
      <ThemeProvider config={config}>
        <ServiceGrid section={section} onAction={onAction} />
      </ThemeProvider>,
    );
    expect(screen.getByText('Care, close to home')).toBeTruthy();
    expect(screen.getByText('Health check')).toBeTruthy();
    expect(screen.getByText('₹999')).toBeTruthy();
    expect(screen.getByText('₹399')).toBeTruthy();
    fireEvent.press(screen.getByTestId('service-checkup'));
    expect(onAction).toHaveBeenCalledWith({
      kind: 'service',
      service: section.items[0],
    });
  });
  it('shows an empty state for an empty section, with no stale service cards', () => {
    render(
      <ThemeProvider config={config}>
        <ServiceGrid section={{ ...section, items: [] }} onAction={jest.fn()} />
      </ThemeProvider>,
    );
    expect(screen.getByText('More care is on its way')).toBeTruthy();
    expect(screen.queryByTestId('service-checkup')).toBeNull();
  });
});
