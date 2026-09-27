import { AppShell, Burger, Group, Title, NavLink, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  IconDashboard, 
  IconBook, 
  IconCards, 
  IconBrain, 
  IconMessageChatbot, 
  IconPencil, 
  IconSettings,
  IconSun,
  IconMoon
} from '@tabler/icons-react';

const navData = [
  { label: 'Dashboard', icon: IconDashboard, link: '/dashboard' },
  { label: 'Vocabulary', icon: IconBook, link: '/vocabulary' },
  { label: 'Review', icon: IconCards, link: '/review' },
  { label: 'Quiz', icon: IconBrain, link: '/quiz' },
  { label: 'AI Chat', icon: IconMessageChatbot, link: '/chat' },
  { label: 'Writing', icon: IconPencil, link: '/writing' },
  { label: 'Settings', icon: IconSettings, link: '/settings' },
];

export function AppLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const location = useLocation();
  const navigate = useNavigate();

  const links = navData.map((item) => (
    <NavLink
      key={item.label}
      active={location.pathname === item.link}
      label={item.label}
      leftSection={<item.icon size="1.2rem" stroke={1.5} />}
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
          
          <ActionIcon
            variant="default"
            onClick={() => toggleColorScheme()}
            size="lg"
            aria-label="Toggle color scheme"
          >
            {colorScheme === 'dark' ? <IconSun stroke={1.5} /> : <IconMoon stroke={1.5} />}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {links}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
