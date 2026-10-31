import { useState, useEffect } from 'react';
import {
  Title,
  Text,
  Stack,
  Card,
  Group,
  TextInput,
  NumberInput,
  Select,
  Button,
  Avatar,
  Alert,
  Divider,
  Badge,
  Grid,
  Slider,
  ThemeIcon,
  Box,
} from '@mantine/core';
import {
  IconUser,
  IconSettings,
  IconCheck,
  IconAlertCircle,
  IconClock,
  IconLogout,
  IconShieldCheck,
  IconBrain,
  IconCards,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { settingsApi } from '../lib/settings.api';

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho Chi Minh (GMT+7)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (GMT+9)' },
  { value: 'America/New_York', label: 'America/New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  // Profile Form State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Settings Form State
  const [dailyReviewGoal, setDailyReviewGoal] = useState<number>(user?.settings?.dailyReviewGoal || 20);
  const [quizDefaultCount, setQuizDefaultCount] = useState<number>(user?.settings?.quizDefaultCount || 10);
  const [timezone, setTimezone] = useState<string>(
    user?.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Populate state when user updates from context
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.avatarUrl || '');
      if (user.settings) {
        setDailyReviewGoal(user.settings.dailyReviewGoal || 20);
        setQuizDefaultCount(user.settings.quizDefaultCount || 10);
        setTimezone(user.settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
      }
    }
  }, [user?.id]);

  // Ensure current timezone is always in dropdown list
  const timezoneOptions = [...COMMON_TIMEZONES];
  if (timezone && !timezoneOptions.some((tz) => tz.value === timezone)) {
    timezoneOptions.unshift({ value: timezone, label: `${timezone} (Custom / Detected)` });
  }

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setProfileError('Display name cannot be empty');
      setProfileSaving(false);
      return;
    }

    try {
      const res = await settingsApi.updateProfile({
        displayName: trimmedName,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      updateUser({
        displayName: res.displayName,
        avatarUrl: res.avatarUrl,
      });
      setProfileSuccess('Profile updated successfully');
    } catch (err: any) {
      setProfileError(
        err?.response?.data?.error?.message || err?.message || 'Failed to update profile'
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Study Settings Update
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccess(null);
    setSettingsError(null);

    try {
      const res = await settingsApi.updateSettings({
        dailyReviewGoal,
        quizDefaultCount,
        timezone,
      });

      updateUser({
        settings: res.settings,
      });
      setSettingsSuccess('Study preferences saved successfully');
    } catch (err: any) {
      setSettingsError(
        err?.response?.data?.error?.message || err?.message || 'Failed to save preferences'
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  // Detect local timezone
  const handleDetectTimezone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
      }
    } catch {
      // Fallback
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Stack gap="xl" style={{ maxWidth: 960, margin: '0 auto', paddingBottom: '40px' }}>
      <div>
        <Title order={2} style={{ fontFamily: 'var(--font-heading)' }}>
          Settings & Profile
        </Title>
        <Text c="dimmed" size="sm">
          Manage your personal profile, study schedule goals, and learning preferences.
        </Text>
      </div>

      <Grid gutter="xl">
        {/* Left Column: Profile Card */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" padding="lg" h="100%">
            <form onSubmit={handleSaveProfile}>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color="blue" radius="md" size="md">
                      <IconUser size="1.2rem" />
                    </ThemeIcon>
                    <Text fw={600} size="md">
                      User Profile
                    </Text>
                  </Group>
                  <Badge variant="dot" color="blue">
                    Personal
                  </Badge>
                </Group>

                <Divider />

                {/* Avatar Preview */}
                <Group align="center" gap="md">
                  <Avatar
                    src={avatarUrl.trim() || undefined}
                    alt={displayName || 'User Avatar'}
                    size={64}
                    radius="xl"
                    color="blue"
                  >
                    {getInitials(displayName || user?.email)}
                  </Avatar>
                  <div>
                    <Text size="sm" fw={600}>
                      {displayName || 'Learner'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {user?.email}
                    </Text>
                  </div>
                </Group>

                {profileSuccess && (
                  <Alert
                    icon={<IconCheck size="1rem" />}
                    color="teal"
                    variant="light"
                    radius="sm"
                    onClose={() => setProfileSuccess(null)}
                    withCloseButton
                  >
                    {profileSuccess}
                  </Alert>
                )}

                {profileError && (
                  <Alert
                    icon={<IconAlertCircle size="1rem" />}
                    color="red"
                    variant="light"
                    radius="sm"
                    onClose={() => setProfileError(null)}
                    withCloseButton
                  >
                    {profileError}
                  </Alert>
                )}

                <TextInput
                  label="Display Name"
                  placeholder="Your full name or handle"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.currentTarget.value)}
                  maxLength={50}
                  description="Visible on your dashboard greeting and study sessions."
                />

                <TextInput
                  label="Email Address"
                  value={user?.email || ''}
                  disabled
                  description="Primary login credential (managed by account registration)."
                />

                <TextInput
                  label="Avatar Image URL"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.currentTarget.value)}
                  description="Direct link to a public image (HTTPS recommended)."
                />

                <Group justify="flex-end" mt="xs">
                  <Button
                    type="submit"
                    variant="filled"
                    color="blue"
                    loading={profileSaving}
                  >
                    Save Profile
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Grid.Col>

        {/* Right Column: Learning Preferences */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" padding="lg" h="100%">
            <form onSubmit={handleSaveSettings}>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <ThemeIcon variant="light" color="teal" radius="md" size="md">
                      <IconSettings size="1.2rem" />
                    </ThemeIcon>
                    <Text fw={600} size="md">
                      Study Goals & SRS Preferences
                    </Text>
                  </Group>
                  <Badge variant="dot" color="teal">
                    Learning Loop
                  </Badge>
                </Group>

                <Divider />

                {settingsSuccess && (
                  <Alert
                    icon={<IconCheck size="1rem" />}
                    color="teal"
                    variant="light"
                    radius="sm"
                    onClose={() => setSettingsSuccess(null)}
                    withCloseButton
                  >
                    {settingsSuccess}
                  </Alert>
                )}

                {settingsError && (
                  <Alert
                    icon={<IconAlertCircle size="1rem" />}
                    color="red"
                    variant="light"
                    radius="sm"
                    onClose={() => setSettingsError(null)}
                    withCloseButton
                  >
                    {settingsError}
                  </Alert>
                )}

                {/* Daily Review Goal */}
                <Box>
                  <Group justify="space-between" mb={4}>
                    <Group gap="xs">
                      <IconCards size="1rem" color="var(--mantine-color-blue-6)" />
                      <Text size="sm" fw={500}>
                        Daily Review Goal
                      </Text>
                    </Group>
                    <Badge variant="light" color="blue">
                      {dailyReviewGoal} cards / day
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed" mb="xs">
                    Drives the daily progress bar on your dashboard.
                  </Text>
                  <Slider
                    value={dailyReviewGoal}
                    onChange={setDailyReviewGoal}
                    min={5}
                    max={100}
                    step={5}
                    marks={[
                      { value: 10, label: '10' },
                      { value: 20, label: '20' },
                      { value: 50, label: '50' },
                      { value: 100, label: '100' },
                    ]}
                    mb="lg"
                  />
                  <NumberInput
                    value={dailyReviewGoal}
                    onChange={(val) => setDailyReviewGoal(typeof val === 'number' ? val : 20)}
                    min={1}
                    max={100}
                    label="Custom Daily Card Goal"
                    size="xs"
                  />
                </Box>

                {/* Default Quiz Count */}
                <Box>
                  <Group justify="space-between" mb={4}>
                    <Group gap="xs">
                      <IconBrain size="1rem" color="var(--mantine-color-violet-6)" />
                      <Text size="sm" fw={500}>
                        Default Quiz Questions
                      </Text>
                    </Group>
                    <Badge variant="light" color="violet">
                      {quizDefaultCount} Questions
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed" mb="xs">
                    Initial number of questions when launching a new AI Quiz session.
                  </Text>
                  <Select
                    data={[
                      { value: '5', label: '5 Questions (Quick Check)' },
                      { value: '10', label: '10 Questions (Standard)' },
                      { value: '15', label: '15 Questions (Thorough)' },
                      { value: '20', label: '20 Questions (Deep Review)' },
                    ]}
                    value={String(quizDefaultCount)}
                    onChange={(val) => setQuizDefaultCount(Number(val) || 10)}
                  />
                </Box>

                {/* Timezone */}
                <Box>
                  <Group justify="space-between" mb={4}>
                    <Group gap="xs">
                      <IconClock size="1rem" color="var(--mantine-color-orange-6)" />
                      <Text size="sm" fw={500}>
                        Study Timezone
                      </Text>
                    </Group>
                    <Button
                      variant="subtle"
                      size="compact-xs"
                      onClick={handleDetectTimezone}
                    >
                      Detect Local
                    </Button>
                  </Group>
                  <Text size="xs" c="dimmed" mb="xs">
                    Used to calculate exact midnight boundaries for SM-2 spaced repetition cards.
                  </Text>
                  <Select
                    data={timezoneOptions}
                    value={timezone}
                    onChange={(val) => setTimezone(val || 'UTC')}
                    searchable
                  />
                </Box>

                <Group justify="flex-end" mt="xs">
                  <Button
                    type="submit"
                    variant="filled"
                    color="teal"
                    loading={settingsSaving}
                  >
                    Save Preferences
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Grid.Col>

        {/* Bottom Card: Account & Privacy Boundary Overview */}
        <Grid.Col span={12}>
          <Card withBorder radius="md" padding="lg">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Stack gap="xs" style={{ maxWidth: 600 }}>
                <Group gap="xs">
                  <ThemeIcon variant="light" color="green" radius="md">
                    <IconShieldCheck size="1.2rem" />
                  </ThemeIcon>
                  <Text fw={600} size="md">
                    Account Status & Architecture Privacy Boundary
                  </Text>
                </Group>
                <Text size="sm" c="dimmed">
                  LinguaFlow operates strictly on explicit user selection and minimal context sentence extraction.
                  Full-page DOM scanning is architecturally blocked in Manifest V3.
                </Text>
                <Group gap="xs">
                  <Badge variant="outline" color="blue">
                    Shared Session (Web ↔ Extension)
                  </Badge>
                  <Badge variant="outline" color="teal">
                    SM-2 SRS Active
                  </Badge>
                  <Badge variant="outline" color="gray">
                    Role: {user?.role || 'Learner'}
                  </Badge>
                </Group>
              </Stack>

              <Group gap="sm" mt={{ base: 'md', sm: 0 }}>
                <Button
                  variant="outline"
                  color="red"
                  leftSection={<IconLogout size="1rem" />}
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                >
                  Log Out
                </Button>
              </Group>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
export default SettingsPage;
