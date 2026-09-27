import { Title, Grid, Card, Text, Button, Group, SimpleGrid, ThemeIcon, Progress } from '@mantine/core';
import { IconFlame, IconBook, IconCards, IconChevronRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div>
      <Title order={2} mb="xl">Welcome back, Learner!</Title>

      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <div>
                <Text fw={500} size="lg">Daily Review</Text>
                <Text size="sm" c="dimmed">
                  You have 15 cards due for review today.
                </Text>
              </div>
              <Button onClick={() => navigate('/review')} rightSection={<IconChevronRight size="1rem" />}>
                Start Review
              </Button>
            </Group>
            
            <Text size="sm" mb={5}>
              Daily Goal Progress
            </Text>
            <Progress value={45} size="lg" radius="xl" />
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group>
              <ThemeIcon size="xl" radius="md" variant="light" color="orange">
                <IconFlame size="1.8rem" />
              </ThemeIcon>
              <div>
                <Text fw={700} size="xl">12 Days</Text>
                <Text size="sm" c="dimmed">Current Streak</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Title order={3} mb="md">Your Progress</Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group>
            <ThemeIcon size="xl" radius="md" variant="light" color="blue">
              <IconBook size="1.8rem" />
            </ThemeIcon>
            <div>
              <Text fw={700} size="xl">248</Text>
              <Text size="sm" c="dimmed">Total Words Saved</Text>
            </div>
          </Group>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group>
            <ThemeIcon size="xl" radius="md" variant="light" color="green">
              <IconCards size="1.8rem" />
            </ThemeIcon>
            <div>
              <Text fw={700} size="xl">1,024</Text>
              <Text size="sm" c="dimmed">Total Reviews Completed</Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>
      
      {/* Recent Activity could go here */}
      <Title order={3} mb="md" mt="xl">Recent Activity</Title>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text c="dimmed" fs="italic">No recent activity yet. Save some words to get started!</Text>
      </Card>
    </div>
  );
}
