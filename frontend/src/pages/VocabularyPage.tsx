import { useState } from 'react';
import { Title, Group, Button, TextInput, Select, Table, Badge, ActionIcon, Menu, Text, Card, Center, Stack } from '@mantine/core';
import { IconSearch, IconFilter, IconPlus, IconDotsVertical, IconEdit, IconTrash, IconBook2 } from '@tabler/icons-react';

// Mock data
const mockVocabulary = [
  { id: 1, word: 'Ephemeral', translation: 'Phù du, chóng tàn', type: 'Adjective', status: 'Learning', lastReviewed: '2 days ago' },
  { id: 2, word: 'Ubiquitous', translation: 'Có mặt ở khắp nơi', type: 'Adjective', status: 'Mastered', lastReviewed: '5 days ago' },
  { id: 3, word: 'Serendipity', translation: 'Sự tình cờ may mắn', type: 'Noun', status: 'New', lastReviewed: 'Never' },
  { id: 4, word: 'Eloquent', translation: 'Có tài hùng biện', type: 'Adjective', status: 'Learning', lastReviewed: '1 day ago' },
  { id: 5, word: 'Resilience', translation: 'Sự kiên cường', type: 'Noun', status: 'Reviewing', lastReviewed: 'Just now' },
];

const statusColors: Record<string, string> = {
  New: 'blue',
  Learning: 'yellow',
  Reviewing: 'orange',
  Mastered: 'green',
};

export function VocabularyPage() {
  const [search, setSearch] = useState('');

  const rows = mockVocabulary.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>
        <Text fw={600} size="sm">{item.word}</Text>
        <Text c="dimmed" size="xs">{item.type}</Text>
      </Table.Td>
      <Table.Td>{item.translation}</Table.Td>
      <Table.Td>
        <Badge color={statusColors[item.status]} variant="light">
          {item.status}
        </Badge>
      </Table.Td>
      <Table.Td c="dimmed">{item.lastReviewed}</Table.Td>
      <Table.Td>
        <Menu shadow="md" width={150} position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" aria-label="More options">
              <IconDotsVertical size="1.1rem" />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size="1rem" />}>Edit word</Menu.Item>
            <Menu.Item leftSection={<IconTrash size="1rem" />} color="red">Delete</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2}>Vocabulary Manager</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Organize and review your saved words.
          </Text>
        </div>
        <Button leftSection={<IconPlus size="1.2rem" />} radius="md">
          Add new word
        </Button>
      </Group>

      <Card withBorder radius="md" padding="0" shadow="sm">
        <Group p="md" gap="md" align="flex-end" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
          <TextInput
            placeholder="Search words..."
            leftSection={<IconSearch size="1.1rem" stroke={1.5} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
            radius="md"
          />
          <Select
            placeholder="Filter by status"
            leftSection={<IconFilter size="1.1rem" stroke={1.5} />}
            data={['All', 'New', 'Learning', 'Reviewing', 'Mastered']}
            defaultValue="All"
            w={{ base: '100%', sm: 200 }}
            radius="md"
          />
        </Group>

        {mockVocabulary.length > 0 ? (
          <Table.ScrollContainer minWidth={600}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Word</Table.Th>
                  <Table.Th>Translation</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Last Reviewed</Table.Th>
                  <Table.Th w={80}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : (
          <Center p="xl" style={{ flexDirection: 'column' }}>
            <IconBook2 size="3rem" color="var(--mantine-color-gray-4)" stroke={1.5} />
            <Text fw={500} mt="md">No words found</Text>
            <Text c="dimmed" size="sm" mt={4}>
              Start building your vocabulary by adding a new word.
            </Text>
            <Button variant="light" mt="md" leftSection={<IconPlus size="1rem" />}>
              Add your first word
            </Button>
          </Center>
        )}
      </Card>
    </Stack>
  );
}
