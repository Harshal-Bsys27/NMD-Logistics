import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Image, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AssignmentDetailScreen from '../src/screens/AssignmentDetailScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import ProofsScreen from '../src/screens/ProofsScreen';
import AssignmentsScreen from '../src/screens/AssignmentsScreen';
import SettingsScreen from '../src/screens/SettingsScreen';
import { ThemeProvider } from '../src/theme';
import {
  getDriverAvailabilityHistory,
  getDriverDeliveryProofs,
  getDriverFeedback,
  reportDeliveryException,
  setDriverAvailability,
} from '../src/services/driver';
import type {
  DriverAssignment,
  DriverAvailabilityHistory,
  DriverDeliveryProof,
  DriverFeedback,
  DriverProfile,
} from '../src/types';

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const storage: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => storage[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => { storage[key] = value; }),
      removeItem: jest.fn(async (key: string) => { delete storage[key]; }),
    },
  };
});

jest.mock('react-native-signature-canvas', () => 'SignatureScreen');

jest.mock('../src/services/driver', () => ({
  getDriverAvailabilityHistory: jest.fn().mockResolvedValue([]),
  getDriverDeliveryProofs: jest.fn().mockResolvedValue([]),
  getDriverFeedback: jest.fn().mockResolvedValue([]),
  reportDeliveryException: jest.fn().mockResolvedValue({ notificationError: null }),
  setDriverAvailability: jest.fn().mockResolvedValue(undefined),
  updateDriverAvatar: jest.fn(),
}));

jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
  },
}));

const profile: DriverProfile = {
  id: 'driver-1',
  employee_id: 'EMP-01',
  current_status: 'available',
  vehicle_type: 'Van',
  vehicle_number: 'NMD-01',
  total_deliveries_completed: 12,
  full_name: 'NMD Driver',
  email: 'driver@nmd.example',
  phone: '1234567890',
  avatar_url: null,
  rating: 4.5,
};

test('shows driver availability, rating and profile history sections', async () => {
  const history: DriverAvailabilityHistory[] = [{
    id: 'history-1',
    previous_status: 'off_duty',
    new_status: 'available',
    changed_at: '2026-10-31T12:00:00.000Z',
  }];
  const feedback: DriverFeedback[] = [{
    id: 'feedback-1',
    order_id: 'order-1',
    assignment_id: 'assignment-1',
    rating: 5,
    review: 'Great delivery',
    submitted_at: '2026-10-31T12:00:00.000Z',
    order_number: 'NMD-1001',
  }];
  jest.mocked(getDriverAvailabilityHistory).mockResolvedValue(history);
  jest.mocked(getDriverFeedback).mockResolvedValue(feedback);

  const screenRef: { current: ReactTestRenderer.ReactTestRenderer | null } = { current: null };
  await ReactTestRenderer.act(async () => {
    screenRef.current = ReactTestRenderer.create(
      <ProfileScreen
        profile={profile}
        userId="user-1"
        email={profile.email}
        assignments={[]}
        error=""
        onSignOut={jest.fn()}
        onOpenSettings={jest.fn()}
        onProfileUpdated={jest.fn().mockResolvedValue(undefined)}
      />,
    );
  });
  const screen = screenRef.current;
  if (!screen) throw new Error('The profile screen did not render.');
  const visibleText = screen.root.findAllByType(Text).map((node) => node.props.children);
  expect(visibleText).toContain('Availability');
  expect(visibleText).toContain('Availability history');
  expect(visibleText).toContain('Customer feedback');
  expect(visibleText).toContain('★ 5.0 average · 1 ratings');
  expect(visibleText).toContain('Great delivery');
});

test.each([
  ['Available', 'available'],
  ['On break', 'on_break'],
  ['Off duty', 'off_duty'],
] as const)('keeps the profile open when setting availability to %s', async (label, status) => {
  const onSignOut = jest.fn();
  const screenRef: { current: ReactTestRenderer.ReactTestRenderer | null } = { current: null };
  await ReactTestRenderer.act(async () => {
    screenRef.current = ReactTestRenderer.create(
      <ProfileScreen
        profile={profile}
        userId="user-1"
        email={profile.email}
        assignments={[]}
        error=""
        onSignOut={onSignOut}
        onOpenSettings={jest.fn()}
        onProfileUpdated={jest.fn().mockResolvedValue(undefined)}
      />,
    );
  });
  const screen = screenRef.current;
  if (!screen) throw new Error('The profile screen did not render.');

  await ReactTestRenderer.act(async () => {
    screen.root.findByProps({ accessibilityLabel: `Set availability to ${label}` }).props.onPress();
  });

  expect(setDriverAvailability).toHaveBeenCalledWith(status);
  expect(screen.root.findByProps({ accessibilityLabel: `Set availability to ${label}` })).toBeTruthy();
  expect(onSignOut).not.toHaveBeenCalled();
});

test('shows the saved profile photo in deliveries and opens a full-size profile preview', async () => {
  const photoProfile = { ...profile, avatar_url: 'https://example.test/avatar.jpg' };
  const deliveryScreenRef: { current: ReactTestRenderer.ReactTestRenderer | null } = { current: null };
  await ReactTestRenderer.act(() => {
    deliveryScreenRef.current = ReactTestRenderer.create(
      <AssignmentsScreen
        profile={photoProfile}
        assignments={[]}
        tab="deliveries"
        refreshing={false}
        error=""
        realtimeStatus="live"
        onRefresh={jest.fn()}
        onOpenAssignment={jest.fn()}
      />,
    );
  });
  const deliveryScreen = deliveryScreenRef.current;
  if (!deliveryScreen) throw new Error('The deliveries screen did not render.');
  expect(deliveryScreen.root.findByProps({ accessibilityLabel: 'Driver profile photo' }).props.source)
    .toEqual({ uri: photoProfile.avatar_url });

  const profileScreenRef: { current: ReactTestRenderer.ReactTestRenderer | null } = { current: null };
  await ReactTestRenderer.act(async () => {
    profileScreenRef.current = ReactTestRenderer.create(
      <ProfileScreen
        profile={photoProfile}
        userId="user-1"
        email={photoProfile.email}
        assignments={[]}
        error=""
        onSignOut={jest.fn()}
        onOpenSettings={jest.fn()}
        onProfileUpdated={jest.fn().mockResolvedValue(undefined)}
      />,
    );
  });
  const profileScreen = profileScreenRef.current;
  if (!profileScreen) throw new Error('The profile screen did not render.');
  expect(profileScreen.root.findByProps({ accessibilityLabel: 'Profile photo' }).props.source)
    .toEqual({ uri: photoProfile.avatar_url });
  expect(profileScreen.root.findByProps({ accessibilityLabel: 'Profile photo' }).props.style)
    .toEqual(expect.objectContaining({ width: 112, height: 112 }));

  await ReactTestRenderer.act(async () => {
    profileScreen.root.findByProps({ accessibilityLabel: 'View profile photo' }).props.onPress();
  });

  expect(profileScreen.root.findByProps({ accessibilityLabel: 'Full-size profile photo' }))
    .toBeTruthy();
  expect(profileScreen.root.findAllByType(Image).some((image) => (
    image.props.accessibilityLabel === 'Full-size profile photo'
    && image.props.source.uri === photoProfile.avatar_url
  ))).toBe(true);
});

test('opens app settings from profile and saves a dark theme preference', async () => {
  const onOpenSettings = jest.fn();
  const settingsProfileRef: { current: ReactTestRenderer.ReactTestRenderer | null } = { current: null };
  await ReactTestRenderer.act(async () => {
    settingsProfileRef.current = ReactTestRenderer.create(
      <ProfileScreen
        profile={profile}
        userId="user-1"
        email={profile.email}
        assignments={[]}
        error=""
        onSignOut={jest.fn()}
        onOpenSettings={onOpenSettings}
        onProfileUpdated={jest.fn().mockResolvedValue(undefined)}
      />,
    );
  });
  const settingsProfile = settingsProfileRef.current;
  if (!settingsProfile) throw new Error('The profile screen did not render.');
  await ReactTestRenderer.act(async () => {
    settingsProfile.root.findByProps({ accessibilityLabel: 'Open settings' }).props.onPress();
  });
  expect(onOpenSettings).toHaveBeenCalledTimes(1);

  const settingsScreenRef: { current: ReactTestRenderer.ReactTestRenderer | null } = { current: null };
  await ReactTestRenderer.act(async () => {
    settingsScreenRef.current = ReactTestRenderer.create(
      <ThemeProvider>
        <SettingsScreen />
      </ThemeProvider>,
    );
  });
  const settingsScreen = settingsScreenRef.current;
  if (!settingsScreen) throw new Error('The settings screen did not render.');
  await ReactTestRenderer.act(async () => {
    settingsScreen.root.findByProps({ accessibilityLabel: 'Dark' }).props.onPress();
  });
  expect(settingsScreen.root.findByProps({ accessibilityLabel: 'Dark' }).props.accessibilityState.checked).toBe(true);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('@nmd-driver/theme-mode', 'dark');
  expect(settingsScreen.root.findByType(View).props.style)
    .toEqual(expect.objectContaining({ backgroundColor: '#0B1220' }));
});

test('does not expose manual feedback-link generation to drivers', async () => {
  const assignment: DriverAssignment = {
    id: 'assignment-1',
    order_id: 'order-1',
    personnel_id: 'driver-1',
    status: 'completed',
    assigned_at: '2026-10-31T12:00:00.000Z',
    accepted_at: '2026-10-31T12:01:00.000Z',
    started_at: '2026-10-31T12:02:00.000Z',
    estimated_duration_minutes: null,
    notes: null,
    order: {
      id: 'order-1',
      order_number: 'NMD-1001',
      client_name: 'NMD Customer',
      client_phone: '1234567890',
      pickup_location: 'Warehouse',
      delivery_location: 'Customer address',
      package_description: null,
      package_weight: 2.5,
      special_instructions: null,
    },
  };
  const screenRef: { current: ReactTestRenderer.ReactTestRenderer | null } = { current: null };
  await ReactTestRenderer.act(() => {
    screenRef.current = ReactTestRenderer.create(
      <AssignmentDetailScreen
        assignment={assignment}
        onBack={jest.fn()}
        onUpdated={jest.fn().mockResolvedValue(undefined)}
        error=""
        onClearError={jest.fn()}
      />,
    );
  });
  const screen = screenRef.current;
  if (!screen) throw new Error('The assignment detail screen did not render.');
  const visibleText = screen.root.findAllByType(Text).map((node) => node.props.children);
  expect(visibleText).toContain('Delivery completed');
  expect(visibleText).toContain('2.5 kg');
  expect(visibleText).not.toContain('Generate feedback link');
  expect(visibleText).not.toContain('Share feedback link');
});

test('requires a signature or the documented no-signature exception', async () => {
  const assignment: DriverAssignment = {
    id: 'assignment-2',
    order_id: 'order-2',
    personnel_id: 'driver-1',
    status: 'in_progress',
    assigned_at: '2026-10-31T12:00:00.000Z',
    accepted_at: '2026-10-31T12:01:00.000Z',
    started_at: '2026-10-31T12:02:00.000Z',
    estimated_duration_minutes: null,
    notes: null,
    order: {
      id: 'order-2',
      order_number: 'NMD-1002',
      client_name: 'NMD Customer',
      client_phone: '1234567890',
      pickup_location: 'Warehouse',
      delivery_location: 'Customer address',
      package_description: null,
      package_weight: null,
      special_instructions: null,
    },
  };
  const screenRef: { current: ReactTestRenderer.ReactTestRenderer | null } = { current: null };
  await ReactTestRenderer.act(() => {
    screenRef.current = ReactTestRenderer.create(
      <AssignmentDetailScreen
        assignment={assignment}
        onBack={jest.fn()}
        onUpdated={jest.fn().mockResolvedValue(undefined)}
        error=""
        onClearError={jest.fn()}
      />,
    );
  });
  const screen = screenRef.current;
  if (!screen) throw new Error('The assignment detail screen did not render.');

  await ReactTestRenderer.act(() => {
    screen.root.findByProps({ accessibilityLabel: 'Complete delivery' }).props.onPress();
  });
  let visibleText = screen.root.findAllByType(Text).map((node) => node.props.children);
  expect(visibleText).toContain('Recipient signature *');

  await ReactTestRenderer.act(() => {
    screen.root.findByProps({ accessibilityRole: 'checkbox' }).props.onPress();
  });
  visibleText = screen.root.findAllByType(Text).map((node) => node.props.children);
  expect(visibleText).toContain('Reason for no signature *');
  expect(visibleText).toContain('Take proof photo (required)');
});

test('records a delivery issue without opening the completion proof form', async () => {
  const assignment: DriverAssignment = {
    id: 'assignment-issue',
    order_id: 'order-issue',
    personnel_id: 'driver-1',
    status: 'in_progress',
    assigned_at: '2026-11-06T12:00:00.000Z',
    accepted_at: '2026-11-06T12:01:00.000Z',
    started_at: '2026-11-06T12:02:00.000Z',
    estimated_duration_minutes: null,
    notes: null,
    order: {
      id: 'order-issue',
      order_number: 'NMD-1003',
      client_name: 'NMD Customer',
      client_phone: '1234567890',
      pickup_location: 'Warehouse',
      delivery_location: 'Customer address',
      package_description: null,
      package_weight: null,
      special_instructions: null,
    },
  };
  const onUpdated = jest.fn().mockResolvedValue(undefined);
  const screenRef: { current: ReactTestRenderer.ReactTestRenderer | null } = { current: null };
  await ReactTestRenderer.act(() => {
    screenRef.current = ReactTestRenderer.create(
      <AssignmentDetailScreen
        assignment={assignment}
        onBack={jest.fn()}
        onUpdated={onUpdated}
        error=""
        onClearError={jest.fn()}
      />,
    );
  });
  const screen = screenRef.current;
  if (!screen) throw new Error('The assignment detail screen did not render.');

  await ReactTestRenderer.act(() => {
    screen.root.findByProps({ accessibilityLabel: 'Report delivery issue' }).props.onPress();
  });
  expect(screen.root.findByProps({ accessibilityLabel: 'Customer unavailable' })).toBeTruthy();
  expect(screen.root.findAllByType(Text).map((node) => node.props.children)).not.toContain('Recipient signature *');

  await ReactTestRenderer.act(async () => {
    screen.root.findByProps({ accessibilityLabel: 'Submit delivery issue' }).props.onPress();
  });

  expect(reportDeliveryException).toHaveBeenCalledWith({
    assignment,
    reason: 'customer_unavailable',
    notes: '',
    photo: null,
  });
  expect(onUpdated).toHaveBeenCalled();
});

test('shows completed proof details and the associated delivery photo', async () => {
  const proof: DriverDeliveryProof = {
    id: 'proof-1',
    assignment_id: 'assignment-1',
    order_id: 'order-1',
    recipient_name: 'Jordan Customer',
    notes: 'Left with reception',
    photo_url: 'https://example.test/proof.jpg',
    signature_url: null,
    signature_exception_reason: null,
    delivered_at: '2026-10-31T12:00:00.000Z',
    order_number: 'NMD-1001',
    client_name: 'NMD Customer',
  };
  jest.mocked(getDriverDeliveryProofs).mockResolvedValue([proof]);

  const screenRef: { current: ReactTestRenderer.ReactTestRenderer | null } = { current: null };
  await ReactTestRenderer.act(async () => {
    screenRef.current = ReactTestRenderer.create(<ProofsScreen driverId="driver-1" />);
  });
  const screen = screenRef.current;
  if (!screen) throw new Error('The proofs screen did not render.');
  const visibleText = screen.root.findAllByType(Text).map((node) => node.props.children);
  expect(visibleText).toContain('Proof of delivery');
  expect(visibleText).toContain('Jordan Customer');
  expect(visibleText).toContain('Left with reception');
  expect(visibleText).toContain('DELIVERED');
  expect(screen.root.findByProps({ accessibilityLabel: 'Proof photo for NMD-1001' })).toBeTruthy();
});
