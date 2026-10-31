import { useEffect, useState } from 'react';
import {
  Title,
  Grid,
  Card,
  Text,
  Button,
  Group,
  SimpleGrid,
  ThemeIcon,
  Progress,
  Badge,
  Stack,
  Skeleton,
  Alert,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconFlame,
  IconBook,
  IconCards,
  IconBrain,
  IconChevronRight,
  IconAlertCircle,
  IconReload,
  IconCheck,
  IconClock,
  IconAward,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { dashboardApi, type DashboardStats } from '../lib/dashboard.api';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Stack gap="lg" p="xs">
        <Skeleton height={40} width={280} radius="md" />
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Skeleton height={160} radius="md" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Skeleton height={160} radius="md" />
          </Grid.Col>
        </Grid>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          <Skeleton height={100} radius="md" />
          <Skeleton height={100} radius="md" />
          <Skeleton height={100} radius="md" />
        </SimpleGrid>
        <Skeleton height={240} radius="md" />
      </Stack>
    );
  }

  if (error || !stats) {
    return (
      <Stack gap="md" p="md">
        <Alert
          icon={<IconAlertCircle size="1.2rem" />}
          title="Error loading dashboard"
          color="red"
          variant="light"
        >
          {error || 'Unable to retrieve your learning stats.'}
        </Alert>
        <Group>
          <Button
            leftSection={<IconReload size="1rem" />}
            variant="light"
            onClick={fetchStats}
          >
            Retry
          </Button>
        </Group>
      </Stack>
    );
  }

  const reviewProgress = Math.min(
    100,
    Math.round(((stats.todayReviewedCount || 0) / (stats.dailyReviewGoal || 20)) * 100),
  );

  const isNewUser = stats.totalSaved === 0;

  return (
    <Stack gap="xl" pb="xl">
      {/* Greeting Header */}
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>
            Welcome back, {user?.displayName || 'Learner'}! 👋
          </Title>
          <Text c="dimmed" size="sm">
            {stats.dueCount > 0
              ? `You have ${stats.dueCount} cards ready for review today.`
              : 'You are all caught up on your scheduled reviews!'}
          </Text>
        </div>
      </Group>

      {/* Onboarding Banner for zero saved words (EDGE-008) */}
      {isNewUser && (
        <Card
          withBorder
          padding="lg"
          radius="md"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 139, 230, 0.08) 0%, rgba(20, 160, 120, 0.08) 100%)',
            borderColor: 'var(--mantine-color-blue-4)',
          }}
        >
          <Group align="flex-start" justify="space-between">
            <Stack gap="xs" style={{ maxWidth: 640 }}>
              <Group gap="xs">
                <ThemeIcon color="blue" size="md" radius="xl">
                  <IconBook size="1rem" />
                </ThemeIcon>
                <Text fw={700} size="md">
                  Welcome to LinguaFlow! Start your contextual vocabulary journey
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                Use the LinguaFlow Chrome Extension to highlight unfamiliar words on any website to get instant AI contextual definitions, or manually add your first vocabulary item to begin.
              </Text>
            </Stack>
            <Group>
              <Button
                variant="filled"
                color="blue"
                onClick={() => navigate('/vocabulary')}
              >
                Go to Vocabulary
              </Button>
            </Group>
          </Group>
        </Card>
      )}

      {/* Primary Highlights: Review & Streak */}
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group justify="space-between" mb="sm" align="flex-start">
              <div>
                <Group gap="xs" mb={4}>
                  <Text fw={600} size="lg">
                    Daily Review
                  </Text>
                  {stats.dueCount > 0 ? (
                    <Badge color="blue" variant="filled">
                      {stats.dueCount} due
                    </Badge>
                  ) : (
                    <Badge color="green" variant="light" leftSection={<IconCheck size="0.8rem" />}>
                      Done
                    </Badge>
                  )}
                </Group>
                <Text size="sm" c="dimmed">
                  {stats.dueCount > 0
                    ? `Review scheduled items to strengthen your long-term memory.`
                    : `Great job! No pending flashcards due right now.`}
                </Text>
              </div>

              <Button
                onClick={() => navigate('/flashcards')}
                rightSection={<IconChevronRight size="1rem" />}
                color="blue"
                disabled={stats.dueCount === 0 && stats.totalSaved === 0}
              >
                {stats.dueCount > 0 ? 'Start Review' : 'Practice Cards'}
              </Button>
            </Group>

            <Divider my="sm" />

            <div>
              <Group justify="space-between" mb={6}>
                <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                  Daily Goal Progress
                </Text>
                <Text size="xs" fw={700}>
                  {stats.todayReviewedCount} / {stats.dailyReviewGoal} cards ({reviewProgress}%)
                </Text>
              </Group>
              <Progress
                value={reviewProgress}
                size="md"
                radius="xl"
                color={reviewProgress >= 100 ? 'teal' : 'blue'}
                striped={stats.todayReviewedCount > 0 && reviewProgress < 100}
              />
            </div>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group align="flex-start" justify="space-between" mb="xs">
              <ThemeIcon size={48} radius="md" variant="light" color="orange">
                <IconFlame size="2rem" />
              </ThemeIcon>
              <Badge color="orange" variant="light">
                Streak
              </Badge>
            </Group>
            <div>
              <Text fw={800} size="2rem" style={{ lineHeight: 1.2 }}>
                {stats.streakDays} {stats.streakDays === 1 ? 'Day' : 'Days'}
              </Text>
              <Text size="sm" c="dimmed" mt={4}>
                {stats.streakDays > 0
                  ? 'Keep studying daily to maintain your momentum!'
                  : 'Complete a review or save a word today to start your streak!'}
              </Text>
            </div>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Secondary Metrics */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{ cursor: 'pointer', transition: 'transform 150ms ease' }}
          onClick={() => navigate('/vocabulary')}
        >
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Total Words Saved
              </Text>
              <Text fw={700} size="1.8rem" mt={4}>
                {stats.totalSaved.toLocaleString()}
              </Text>
            </div>
            <ThemeIcon size="xl" radius="md" variant="light" color="blue">
              <IconBook size="1.6rem" />
            </ThemeIcon>
          </Group>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                Reviews Completed
              </Text>
              <Text fw={700} size="1.8rem" mt={4}>
                {stats.totalReviewed.toLocaleString()}
              </Text>
            </div>
            <ThemeIcon size="xl" radius="md" variant="light" color="teal">
              <IconCards size="1.6rem" />
            </ThemeIcon>
          </Group>
        </Card>

        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{ cursor: 'pointer', transition: 'transform 150ms ease' }}
          onClick={() => navigate('/quiz')}
        >
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                AI Quiz Sessions
              </Text>
              <Text fw={700} size="1.8rem" mt={4}>
                {stats.recentQuizzes.length > 0 ? `${stats.recentQuizzes.length}+ done` : 'Start test'}
              </Text>
            </div>
            <ThemeIcon size="xl" radius="md" variant="light" color="violet">
              <IconBrain size="1.6rem" />
            </ThemeIcon>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Weekly Progress Bar Summary (FR-DASH-002) */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={600} size="md">
              7-Day Study Activity
            </Text>
            <Text size="xs" c="dimmed">
              Words captured, cards reviewed, and quizzes completed over the past week.
            </Text>
          </div>
          <Group gap="xs">
            <Badge size="sm" variant="dot" color="blue">
              Saved
            </Badge>
            <Badge size="sm" variant="dot" color="teal">
              Reviewed
            </Badge>
            <Badge size="sm" variant="dot" color="violet">
              Quiz
            </Badge>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 7 }} spacing="xs">
          {stats.weeklyProgress.map((day) => {
            const dateObj = new Date(day.date + 'T00:00:00');
            const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const totalActivity = day.savedCount + day.reviewedCount + day.quizCount;

            return (
              <Box
                key={day.date}
                p="xs"
                style={{
                  textAlign: 'center',
                  borderRadius: 8,
                  backgroundColor: totalActivity > 0 ? 'var(--mantine-color-blue-light)' : 'transparent',
                  border: '1px solid var(--mantine-color-default-border)',
                }}
              >
                <Text size="xs" c="dimmed" fw={600}>
                  {dayName}
                </Text>
                <Text size="sm" fw={700} mb="xs">
                  {dayNum}
                </Text>

                <Stack gap={3} align="center">
                  {day.savedCount > 0 && (
                    <Badge size="xs" color="blue" variant="light">
                      +{day.savedCount}w
                    </Badge>
                  )}
                  {day.reviewedCount > 0 && (
                    <Badge size="xs" color="teal" variant="light">
                      {day.reviewedCount}r
                    </Badge>
                  )}
                  {day.quizCount > 0 && (
                    <Badge size="xs" color="violet" variant="light">
                      {day.quizCount}q
                    </Badge>
                  )}
                  {totalActivity === 0 && (
                    <Text size="xs" c="dimmed">
                      -
                    </Text>
                  )}
                </Stack>
              </Box>
            );
          })}
        </SimpleGrid>
      </Card>

      {/* Two Column: Recent Activity & Recent Quizzes */}
      <Grid gutter="lg">
        {/* Recent Activity */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <Text fw={600} size="md">
                Recent Activity
              </Text>
              <ThemeIcon variant="subtle" color="gray">
                <IconClock size="1.2rem" />
              </ThemeIcon>
            </Group>

            {stats.recentActivity.length === 0 ? (
              <Box py="xl" style={{ textAlign: 'center' }}>
                <Text c="dimmed" size="sm" fs="italic">
                  No activity recorded yet. Start by saving or reviewing words!
                </Text>
              </Box>
            ) : (
              <Stack gap="sm">
                {stats.recentActivity.map((act) => {
                  const icon =
                    act.type === 'saved' ? (
                      <ThemeIcon color="blue" variant="light" size="sm" radius="xl">
                        <IconBook size="0.8rem" />
                      </ThemeIcon>
                    ) : act.type === 'reviewed' ? (
                      <ThemeIcon color="teal" variant="light" size="sm" radius="xl">
                        <IconCards size="0.8rem" />
                      </ThemeIcon>
                    ) : (
                      <ThemeIcon color="violet" variant="light" size="sm" radius="xl">
                        <IconBrain size="0.8rem" />
                      </ThemeIcon>
                    );

                  return (
                    <Group
                      key={act.id}
                      justify="space-between"
                      align="flex-start"
                      p="xs"
                      style={{
                        borderRadius: 8,
                        backgroundColor: 'var(--mantine-color-default-hover)',
                      }}
                    >
                      <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                        {icon}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={500} truncate>
                            {act.title}
                          </Text>
                          {act.description && (
                            <Text size="xs" c="dimmed" truncate>
                              {act.description}
                            </Text>
                          )}
                        </div>
                      </Group>
                      <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(act.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </Group>
                  );
                })}
              </Stack>
            )}
          </Card>
        </Grid.Col>

        {/* Recent Quizzes */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <Text fw={600} size="md">
                Recent Quizzes
              </Text>
              <ThemeIcon variant="subtle" color="violet">
                <IconAward size="1.2rem" />
              </ThemeIcon>
            </Group>

            {stats.recentQuizzes.length === 0 ? (
              <Stack align="center" justify="center" py="xl" gap="xs">
                <Text c="dimmed" size="sm" fs="italic">
                  No completed quizzes yet.
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  color="violet"
                  onClick={() => navigate('/quiz')}
                  disabled={stats.totalSaved < 4}
                >
                  {stats.totalSaved < 4 ? 'Save 4+ words to quiz' : 'Take a Quiz'}
                </Button>
              </Stack>
            ) : (
              <Stack gap="sm">
                {stats.recentQuizzes.map((quiz) => {
                  const pct = Math.round((quiz.score / (quiz.total || 1)) * 100);
                  const color = pct >= 80 ? 'green' : pct >= 50 ? 'orange' : 'red';

                  return (
                    <Group
                      key={quiz.quizId}
                      justify="space-between"
                      p="xs"
                      style={{
                        borderRadius: 8,
                        backgroundColor: 'var(--mantine-color-default-hover)',
                      }}
                    >
                      <div>
                        <Text size="sm" fw={600}>
                          Score: {quiz.score}/{quiz.total}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(quiz.completedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </div>
                      <Badge color={color} variant="light">
                        {pct}%
                      </Badge>
                    </Group>
                  );
                })}
                <Button
                  variant="subtle"
                  color="violet"
                  size="xs"
                  fullWidth
                  mt="xs"
                  onClick={() => navigate('/quiz')}
                >
                  Go to Quiz Page →
                </Button>
              </Stack>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
