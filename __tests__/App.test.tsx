import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('starts on the everyday home, switches config, and keeps the last good home after failure', async () => {
  render(<App />);
  await screen.findByText('A little care.\nA healthier day.');
  fireEvent.press(screen.getByLabelText('Switch to Diwali home'));
  await screen.findByText('A brighter Diwali.\nA healthier you.');
  fireEvent.press(screen.getByLabelText('Profile'));
  fireEvent(
    screen.getByLabelText('Fail configuration fetch'),
    'valueChange',
    true,
  );
  await screen.findByText('Home source: last good cache');
  fireEvent.press(screen.getByLabelText('Home'));
  expect(screen.getByText('A brighter Diwali.\nA healthier you.')).toBeTruthy();
  expect(
    screen.getByText('Showing your saved home. We couldn’t refresh it.'),
  ).toBeTruthy();
});
