import React from 'react';
import AlarmClock from 'lucide-react-native/icons/alarm-clock';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import CalendarPlus from 'lucide-react-native/icons/calendar-plus';
import Check from 'lucide-react-native/icons/check';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleHelp from 'lucide-react-native/icons/circle-question-mark';
import FileText from 'lucide-react-native/icons/file-text';
import Heart from 'lucide-react-native/icons/heart';
import HeartHandshake from 'lucide-react-native/icons/heart-handshake';
import HeartPulse from 'lucide-react-native/icons/heart-pulse';
import House from 'lucide-react-native/icons/house';
import MapPin from 'lucide-react-native/icons/map-pin';
import Moon from 'lucide-react-native/icons/moon';
import NotebookTabs from 'lucide-react-native/icons/notebook-tabs';
import Pill from 'lucide-react-native/icons/pill';
import Plus from 'lucide-react-native/icons/plus';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Stethoscope from 'lucide-react-native/icons/stethoscope';
import Sun from 'lucide-react-native/icons/sun';
import Syringe from 'lucide-react-native/icons/syringe';
import TestTubeDiagonal from 'lucide-react-native/icons/test-tube-diagonal';
import UserRound from 'lucide-react-native/icons/user-round';
import Users from 'lucide-react-native/icons/users';
import UsersRound from 'lucide-react-native/icons/users-round';
import WifiOff from 'lucide-react-native/icons/wifi-off';
import X from 'lucide-react-native/icons/x';
import Clock3 from 'lucide-react-native/icons/clock-3';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';

const icons: Record<string, LucideIcon> = {
  'alarm-clock': AlarmClock,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  'calendar-days': CalendarDays,
  'calendar-plus': CalendarPlus,
  check: Check,
  'chevron-right': ChevronRight,
  'file-text': FileText,
  heart: Heart,
  'heart-handshake': HeartHandshake,
  'heart-pulse': HeartPulse,
  house: House,
  'map-pin': MapPin,
  moon: Moon,
  'notebook-tabs': NotebookTabs,
  pill: Pill,
  plus: Plus,
  'refresh-cw': RefreshCw,
  'shield-check': ShieldCheck,
  sparkles: Sparkles,
  stethoscope: Stethoscope,
  sun: Sun,
  syringe: Syringe,
  'test-tube-diagonal': TestTubeDiagonal,
  'user-round': UserRound,
  users: Users,
  'users-round': UsersRound,
  'wifi-off': WifiOff,
  x: X,
  'clock-3': Clock3,
};
export function CareIcon({
  name,
  size,
  colour,
}: {
  name: string;
  size?: number;
  colour?: string;
}) {
  const theme = useTheme();
  const Icon = icons[name] ?? CircleHelp;
  return (
    <Icon
      accessibilityElementsHidden
      importantForAccessibility="no"
      size={size ?? theme.metrics.icon}
      color={colour ?? theme.colours.primary}
      strokeWidth={theme.metrics.stroke}
    />
  );
}
