import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Group,
  Text,
  Title,
  Badge,
  Button,
  Paper,
  HoverCard,
  Divider,
} from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';

export const LandingPage = () => {
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <Box
        component="header"
        py="md"
        px={{ base: 'md', sm: 'xl' }}
        style={{ borderBottom: '1px solid #E5E5E5', backgroundColor: '#FAFAFA' }}
      >
        <Container size="lg" p={0}>
          <Group justify="space-between" align="center">
            <Text
              component={Link}
              to="/"
              fw={700}
              fz="xl"
              variant="gradient"
              gradient={{ from: '#4338CA', to: '#DB2777', deg: 135 }}
              style={{ textDecoration: 'none', fontFamily: "'Space Grotesk', sans-serif" }}
            >
              LinguaFlow
            </Text>

            <Group gap="sm">
              <Button component={Link} to="/login" variant="subtle" color="gray">
                Log In
              </Button>
              <Button component={Link} to="/signup" color="indigo" radius="md">
                Sign Up
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        component="main"
        py={{ base: 48, sm: 80 }}
        px="md"
        style={{ flex: 1, display: 'flex', alignItems: 'center' }}
      >
        <Container
          size="md"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
        >
          <Badge
            variant="light"
            size="md"
            radius="xl"
            tt="uppercase"
            fw={600}
            mb="lg"
            styles={{
              root: {
                letterSpacing: '0.05em',
                backgroundColor: 'rgba(219, 39, 119, 0.1)',
                color: '#DB2777',
              },
            }}
          >
            Powered by Gemini AI
          </Badge>

          <Title
            order={1}
            fz={{ base: 36, sm: 54 }}
            fw={700}
            lh={1.15}
            lts="-0.02em"
            mb="lg"
          >
            Master English vocabulary <br />
            <Text
              component="span"
              inherit
              variant="gradient"
              gradient={{ from: '#4338CA', to: '#DB2777', deg: 135 }}
            >
              in its natural habitat.
            </Text>
          </Title>

          <Text c="dimmed" fz={{ base: 'md', sm: 'xl' }} maw={600} lh={1.6} mb="xl">
            Don't just memorize word lists. Capture words in context from any webpage,
            get AI-powered explanations, and retain them forever with spaced repetition.
          </Text>

          <Group gap="md" mb={60} justify="center">
            <Button component={Link} to="/signup" size="lg" radius="md" color="indigo">
              Start for free
            </Button>
            <Button
              component="a"
              href="#extension"
              variant="default"
              size="lg"
              radius="md"
              color="gray"
            >
              Install Extension
            </Button>
          </Group>

          {/* Interactive Demo */}
          <Paper
            withBorder
            shadow="xl"
            radius="lg"
            p={{ base: 'lg', sm: 'xl' }}
            maw={700}
            w="100%"
            bg="white"
            ta="left"
            style={{ overflow: 'hidden' }}
          >
            <Group gap="xs" mb="md" c="pink.6">
              <IconSparkles size={20} color="#DB2777" />
              <Text fw={600} fz="lg" c="dark.8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Interactive Demo
              </Text>
            </Group>

            <Text
              fz={{ base: 'md', sm: 'lg' }}
              c="gray.7"
              lh={1.8}
              style={{ fontFamily: 'Georgia, Cambria, serif' }}
            >
              &ldquo;The architecture was highly{' '}
              <HoverCard width={280} shadow="lg" withArrow position="top" radius="md" openDelay={100} closeDelay={150}>
                <HoverCard.Target>
                  <Text
                    component="span"
                    fw={500}
                    c="#4338CA"
                    style={{
                      backgroundColor: 'rgba(67, 56, 202, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'inline',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(67, 56, 202, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(67, 56, 202, 0.1)';
                    }}
                  >
                    idiosyncratic
                  </Text>
                </HoverCard.Target>
                <HoverCard.Dropdown p="sm">
                  <Text fw={600} fz="sm" c="dark.8" mb={4} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    idiosyncratic
                  </Text>
                  <Text fz="xs" c="dimmed" lh={1.4} mb="xs">
                    Peculiar or individual; a feature that is unique to a specific person or thing.
                  </Text>
                  <Divider my="xs" />
                  <Group gap={4} c="#DB2777">
                    <IconSparkles size={14} />
                    <Text fz="xs" fw={500}>
                      AI Explanation
                    </Text>
                  </Group>
                </HoverCard.Dropdown>
              </HoverCard>
              {', reflecting the eccentric tastes of its creator rather than the prevailing styles of the era.\u201d'}
            </Text>

            <Text fz="sm" c="dimmed" mt="md">
              Hover over the highlighted word to see how LinguaFlow explains it in context.
            </Text>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};
