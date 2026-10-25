import { useState, useEffect, useCallback } from 'react';
import {
  Title,
  Group,
  Button,
  TextInput,
  Table,
  Badge,
  ActionIcon,
  Menu,
  Text,
  Card,
  Center,
  Stack,
  Modal,
  Select,
  Textarea,
  Pagination,
  Loader,
  Drawer,
  Alert,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconTrash,
  IconBook2,
  IconExternalLink,
  IconAlertCircle,
  IconEye,
  IconQuote,
} from '@tabler/icons-react';
import {
  vocabularyApi,
  type VocabularyItem,
  type OccurrenceItem,
} from '../lib/vocabulary.api';

export function VocabularyPage() {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add modal state
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
  const [saving, setSaving] = useState(false);
  const [newLemma, setNewLemma] = useState('');
  const [newPartOfSpeech, setNewPartOfSpeech] = useState<string | null>('noun');
  const [newMeaning, setNewMeaning] = useState('');
  const [newSentence, setNewSentence] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  // Occurrences drawer state
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [selectedItem, setSelectedItem] = useState<VocabularyItem | null>(null);
  const [occurrences, setOccurrences] = useState<OccurrenceItem[]>([]);
  const [occurrencesLoading, setOccurrencesLoading] = useState(false);

  // Fetch vocabulary list
  const fetchVocabulary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await vocabularyApi.getVocabularyList({
        page,
        limit: 15,
        search: search.trim() || undefined,
      });
      setItems(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load vocabulary list');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  // Handle Add Word
  const handleSaveWord = async () => {
    if (!newLemma.trim() || !newMeaning.trim() || !newSentence.trim()) {
      return;
    }

    setSaving(true);
    try {
      await vocabularyApi.saveOccurrence({
        lemma: newLemma.trim(),
        partOfSpeech: newPartOfSpeech || undefined,
        meaning: newMeaning.trim(),
        sentence: newSentence.trim(),
        example: newExample.trim() || undefined,
        sourceUrl: newSourceUrl.trim() || 'https://linguaflow.local',
      });
      closeAddModal();
      setNewLemma('');
      setNewMeaning('');
      setNewSentence('');
      setNewExample('');
      setNewSourceUrl('');
      fetchVocabulary();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to save vocabulary item');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Vocabulary Item
  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this word and all its occurrences?')) {
      return;
    }
    try {
      await vocabularyApi.deleteVocabularyItem(id);
      fetchVocabulary();
      if (selectedItem?.id === id) {
        closeDrawer();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to delete word');
    }
  };

  // View word details & occurrences
  const handleViewOccurrences = async (item: VocabularyItem) => {
    setSelectedItem(item);
    openDrawer();
    setOccurrencesLoading(true);
    try {
      const data = await vocabularyApi.getOccurrences(item.id);
      setOccurrences(data.occurrences);
    } catch {
      setOccurrences([]);
    } finally {
      setOccurrencesLoading(false);
    }
  };

  const rows = items.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>
        <Group gap="xs">
          <Text fw={600} size="sm">
            {item.lemma}
          </Text>
          {item.partOfSpeech && (
            <Badge variant="dot" size="xs" color="blue">
              {item.partOfSpeech}
            </Badge>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <Badge color="cyan" variant="light" size="sm">
          {item.meaningsCount} {item.meaningsCount === 1 ? 'meaning' : 'meanings'}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge color="violet" variant="light" size="sm">
          {item.occurrencesCount} {item.occurrencesCount === 1 ? 'sentence' : 'sentences'}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => handleViewOccurrences(item)}
            title="View Context & Sentences"
          >
            <IconEye size="1.1rem" />
          </ActionIcon>
          <Menu shadow="md" width={150} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" aria-label="More options">
                <IconDotsVertical size="1.1rem" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconTrash size="1rem" />}
                color="red"
                onClick={() => handleDeleteItem(item.id)}
              >
                Delete word
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2}>Vocabulary Bank</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Your personal 3-layer contextual vocabulary repository ({total} words saved).
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size="1.2rem" />}
          radius="md"
          onClick={openAddModal}
        >
          Add new word
        </Button>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size="1.1rem" />}
          title="Error"
          color="red"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Card withBorder radius="md" padding="0" shadow="sm">
        <Group
          p="md"
          gap="md"
          align="center"
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        >
          <TextInput
            placeholder="Search words by lemma..."
            leftSection={<IconSearch size="1.1rem" stroke={1.5} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
            style={{ flex: 1 }}
            radius="md"
          />
        </Group>

        {loading ? (
          <Center p="xl" style={{ minHeight: 200 }}>
            <Loader size="md" />
          </Center>
        ) : items.length > 0 ? (
          <>
            <Table.ScrollContainer minWidth={600}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Word (Lemma)</Table.Th>
                    <Table.Th>Meanings</Table.Th>
                    <Table.Th>Occurrences</Table.Th>
                    <Table.Th>Date Added</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {totalPages > 1 && (
              <Group justify="center" p="md">
                <Pagination
                  value={page}
                  onChange={setPage}
                  total={totalPages}
                  radius="md"
                />
              </Group>
            )}
          </>
        ) : (
          <Center p="xl" style={{ flexDirection: 'column' }}>
            <IconBook2 size="3rem" color="var(--mantine-color-gray-4)" stroke={1.5} />
            <Text fw={500} mt="md">
              No vocabulary items found
            </Text>
            <Text c="dimmed" size="sm" mt={4}>
              {search
                ? 'Try a different search keyword.'
                : 'Start building your bank by saving your first word.'}
            </Text>
            {!search && (
              <Button
                variant="light"
                mt="md"
                leftSection={<IconPlus size="1rem" />}
                onClick={openAddModal}
              >
                Add your first word
              </Button>
            )}
          </Center>
        )}
      </Card>

      {/* Add Word Modal */}
      <Modal
        opened={addModalOpened}
        onClose={closeAddModal}
        title={<Text fw={600}>Save New Vocabulary Occurrence</Text>}
        radius="md"
        size="lg"
      >
        <Stack gap="sm">
          <Group grow>
            <TextInput
              label="Word / Lemma"
              placeholder="e.g. scale"
              required
              value={newLemma}
              onChange={(e) => setNewLemma(e.currentTarget.value)}
            />
            <Select
              label="Part of Speech"
              data={['noun', 'verb', 'adjective', 'adverb', 'phrase', 'idiom']}
              value={newPartOfSpeech}
              onChange={setNewPartOfSpeech}
              placeholder="Select category"
            />
          </Group>

          <TextInput
            label="In-Context Meaning"
            placeholder="e.g. to increase in size or amount proportionally"
            required
            value={newMeaning}
            onChange={(e) => setNewMeaning(e.currentTarget.value)}
          />

          <Textarea
            label="Original Context Sentence"
            placeholder="e.g. We need to scale our system infrastructure to handle peak traffic."
            required
            minRows={2}
            value={newSentence}
            onChange={(e) => setNewSentence(e.currentTarget.value)}
          />

          <TextInput
            label="Example Usage (Optional)"
            placeholder="e.g. The startup scales quickly."
            value={newExample}
            onChange={(e) => setNewExample(e.currentTarget.value)}
          />

          <TextInput
            label="Source URL (Optional)"
            placeholder="https://techcrunch.com/article"
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveWord}
              loading={saving}
              disabled={!newLemma.trim() || !newMeaning.trim() || !newSentence.trim()}
            >
              Save to Bank
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Occurrences & Context Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        position="right"
        size="md"
        title={
          <Group gap="xs">
            <Text fw={700} size="lg">
              {selectedItem?.lemma}
            </Text>
            {selectedItem?.partOfSpeech && (
              <Badge variant="light" color="blue">
                {selectedItem.partOfSpeech}
              </Badge>
            )}
          </Group>
        }
      >
        {occurrencesLoading ? (
          <Center p="xl">
            <Loader size="md" />
          </Center>
        ) : occurrences.length > 0 ? (
          <Stack gap="md" mt="xs">
            <Text size="xs" c="dimmed">
              Captured Context & Sentences ({occurrences.length})
            </Text>
            {occurrences.map((occ, idx) => (
              <Card key={occ.id || idx} withBorder radius="md" p="md">
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start">
                    <Badge color="cyan" variant="outline" size="xs">
                      Meaning
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {new Date(occ.capturedAt).toLocaleDateString()}
                    </Text>
                  </Group>
                  <Text fw={600} size="sm">
                    {occ.meaning || occ.definition}
                  </Text>
                  {occ.example && (
                    <Text size="xs" c="dimmed" fs="italic">
                      "{occ.example}"
                    </Text>
                  )}
                  <Divider my={4} />
                  <Group gap="xs" align="flex-start">
                    <IconQuote size="1rem" color="var(--mantine-color-blue-5)" />
                    <Text size="sm" style={{ flex: 1 }}>
                      {occ.sentence}
                    </Text>
                  </Group>
                  {occ.sourceUrl && (
                    <Group justify="flex-end">
                      <Button
                        component="a"
                        href={occ.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="subtle"
                        size="compact-xs"
                        rightSection={<IconExternalLink size="0.8rem" />}
                      >
                        {occ.sourceTitle || 'Source article'}
                      </Button>
                    </Group>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : (
          <Center p="xl">
            <Text c="dimmed" size="sm">
              No occurrences found for this word.
            </Text>
          </Center>
        )}
      </Drawer>
    </Stack>
  );
}
