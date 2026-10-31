import { useState, useEffect } from 'react';
import { AppShell, Burger, Group, Title, NavLink, ActionIcon, useMantineColorScheme, Text, Box, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { reviewApi } from '../../lib/review.api';
import { 
  IconDashboard, 
  IconBook, 
  IconCards, 
  IconBrain, 
  IconMessageChatbot, 
  IconPencil, 
  IconSettings,
  IconSun,
  IconMoon,
  IconLogout
} from '@tabler/icons-react';

const navData = [
  { label: 'Dashboard', icon: IconDashboard, link: '/dashboard' },
  { label: 'Vocabulary', icon: IconBook, link: '/vocabulary' },
  { label: 'Review', icon: IconCards, link: '/flashcards' },
  { label: 'Quiz', icon: IconBrain, link: '/quiz' },
  { label: 'AI Chat', icon: IconMessageChatbot, link: '/chat' },
  { label: 'Writing', icon: IconPencil, link: '/writing' },
  { label: 'Settings', icon: IconSettings, link: '/settings' },
];

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dueCount, setDueCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const fetchDue = async () => {
      try {
        const res = await reviewApi.getDueOccurrences();
        if (mounted && res?.occurrences) {
          setDueCount(res.occurrences.length);
        }
      } catch {
        // Silently ignore navigation badge fetch errors
      }
    };
    fetchDue();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  const links = navData.map((item) => (
    <NavLink
      key={item.label}
      active={location.pathname === item.link}
      label={item.label}
      leftSection={<item.icon size="1.2rem" stroke={1.5} />}
      rightSection={
        item.link === '/flashcards' && dueCount > 0 ? (
          <Badge size="xs" color="blue" variant="filled">
            {dueCount}
          </Badge>
        ) : null
      }
      onClick={() => {
        navigate(item.link);
        if (opened) toggle();
      }}
      variant="filled"
      style={{ borderRadius: '8px', marginBottom: '4px' }}
    />
  ));

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3} c="blue">LinguaFlow</Title>
          </Group>
          
          <Group gap="xs">
            <ActionIcon
              variant="default"
              onClick={() => toggleColorScheme()}
              size="lg"
              aria-label="Toggle color scheme"
            >
              {colorScheme === 'dark' ? <IconSun stroke={1.5} /> : <IconMoon stroke={1.5} />}
            </ActionIcon>

            <ActionIcon
              variant="subtle"
              color="red"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              size="lg"
              title="Log out"
              aria-label="Log out"
            >
              <IconLogout stroke={1.5} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ display: 'flex', flexDirection: 'column' }}>
        <Box style={{ flex: 1 }}>{links}</Box>
        <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)', paddingTop: '12px' }}>
          <Text size="sm" fw={600} truncate>{user?.displayName || 'User'}</Text>
          <Text size="xs" c="dimmed" truncate>{user?.email}</Text>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
