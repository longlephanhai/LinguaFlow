import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Group,
  Stack,
  Text,
  Title,
  Paper,
  Button,
  ActionIcon,
  Textarea,
  Badge,
  Loader,
  Alert,
  Tooltip,
  Drawer,
  Modal,
  ScrollArea,
  Pagination,
  ThemeIcon,
  Card,
  SegmentedControl,
  Collapse,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPencil,
  IconHistory,
  IconSparkles,
  IconCheck,
  IconCopy,
  IconTrash,
  IconAlertCircle,
  IconRefresh,
  IconFileText,
  IconBulb,
  IconWriting,
  IconClearAll,
  IconDice,
  IconListDetails,
  IconTarget,
  IconChevronDown,
  IconChevronUp,
  IconPlus,
} from '@tabler/icons-react';
import {
  writingApi,
  type WritingReviewResponse,
  type WritingHistoryItem,
} from '../lib/writing.api';
import {
  WRITING_TOPICS,
  type WritingTopic,
  type WritingLevel,
} from '../data/writing-prompts';

const SAMPLE_TEXTS = [
  'Yesterday I have visited my grandparents in the village. The weather was so nice, so we decided walking along the river. I enjoy to spend time with them because they always tell funny stories.',
  'Technological progress has brought many changes in our daily lives. Nowadays people can easy communicate with anyone worldwide, however some believe that we are losing genuine connections.',
];

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'teal',
  intermediate: 'indigo',
  advanced: 'grape',
};

export function WritingPage() {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentReview, setCurrentReview] = useState<WritingReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Guided Topics State
  const [selectedLevel, setSelectedLevel] = useState<WritingLevel>('beginner');
  const [activeTopic, setActiveTopic] = useState<WritingTopic | null>(WRITING_TOPICS[0]);
  const [questionsOpened, { toggle: toggleQuestions }] = useDisclosure(true);
  const [topicsModalOpened, { open: openTopicsModal, close: closeTopicsModal }] = useDisclosure(false);

  // Vocabulary Challenge State (from user bank)
  const [suggestedWords, setSuggestedWords] = useState<string[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);

  // History Drawer State
  const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);
  const [historyItems, setHistoryItems] = useState<WritingHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const isTooShort = charCount > 0 && charCount < 20;
  const isTooLong = charCount > 5000;
  const canSubmit = charCount >= 20 && charCount <= 5000 && !submitting;

  // Fetch suggested words from user vocabulary bank
  const fetchSuggestedWords = useCallback(async () => {
    try {
      setLoadingWords(true);
      const res = await writingApi.getSuggestedWords();
      setSuggestedWords(res.words || []);
    } catch {
      setSuggestedWords([]);
    } finally {
      setLoadingWords(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestedWords();
  }, [fetchSuggestedWords]);

  const loadHistory = useCallback(async (page = 1) => {
    try {
      setLoadingHistory(true);
      const res = await writingApi.getHistory(page, 8);
      setHistoryItems(res.items || []);
      setHistoryTotal(res.total || 0);
      setHistoryPage(res.page || 1);
    } catch {
      // History fetch failure handled silently or logged
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (historyOpened) {
      loadHistory(historyPage);
    }
  }, [historyOpened, historyPage, loadHistory]);

  // Shuffle to another random topic matching the current level filter
  const handleRandomTopic = () => {
    const candidates =
      selectedLevel === 'all'
        ? WRITING_TOPICS
        : WRITING_TOPICS.filter((t) => t.level === selectedLevel);
    if (candidates.length === 0) return;

    const remaining = candidates.filter((t) => t.id !== activeTopic?.id);
    const pool = remaining.length > 0 ? remaining : candidates;
    const randomChoice = pool[Math.floor(Math.random() * pool.length)];
    setActiveTopic(randomChoice);
  };

  const handleSelectLevel = (value: string) => {
    const level = value as WritingLevel;
    setSelectedLevel(level);
    if (level === 'all') {
      setActiveTopic(WRITING_TOPICS[0]);
    } else {
      const match = WRITING_TOPICS.find((t) => t.level === level);
      if (match) setActiveTopic(match);
    }
  };

  const handleInsertSentenceStarter = () => {
    if (!activeTopic) return;
    const starter = activeTopic.sentenceStarter;
    if (!text.trim()) {
      setText(starter + ' ');
    } else {
      setText((prev) => prev.trim() + ' ' + starter + ' ');
    }
    textareaRef.current?.focus();
  };

  const handleInsertWord = (word: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const needsSpaceBefore = before.length > 0 && !before.endsWith(' ');
      const needsSpaceAfter = after.length > 0 && !after.startsWith(' ');

      const inserted = `${needsSpaceBefore ? ' ' : ''}${word}${needsSpaceAfter ? ' ' : ' '}`;
      const newText = before + inserted + after;
      setText(newText);

      setTimeout(() => {
        textarea.focus();
        const cursorPosition = start + inserted.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    } else {
      setText((prev) => (prev ? `${prev} ${word}` : word));
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const review = await writingApi.submitReview({ text });
      setCurrentReview(review);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to review writing. Please check your connection and try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectHistoryItem = async (id: string) => {
    setError(null);
    try {
      const review = await writingApi.getReviewById(id);
      setCurrentReview(review);
      setText(review.originalText);
      closeHistory();
    } catch {
      setError('Failed to load review details from history.');
    }
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await writingApi.deleteReview(id);
      setHistoryItems((prev) => prev.filter((item) => item._id !== id));
      setHistoryTotal((prev) => Math.max(0, prev - 1));
      if (currentReview?._id === id) {
        setCurrentReview(null);
      }
    } catch {
      setError('Failed to delete history item.');
    }
  };

  const handleLoadSample = () => {
    const randomSample = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
    setText(randomSample);
    setCurrentReview(null);
    setError(null);
  };

  const handleClear = () => {
    setText('');
    setCurrentReview(null);
    setError(null);
  };

  const handleCopyFeedback = () => {
    if (!currentReview) return;
    const suggestionsText = currentReview.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');
    const fullText = `Feedback:\n${currentReview.feedback}\n\nSuggestions:\n${suggestionsText}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTopics =
    selectedLevel === 'all'
      ? WRITING_TOPICS
      : WRITING_TOPICS.filter((t) => t.level === selectedLevel);

  return (
    <Box p={{ base: 'md', sm: 'xl' }} style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="lg">
        <Stack gap={4}>
          <Group gap="xs">
            <ThemeIcon size="lg" radius="md" color="indigo" variant="light">
              <IconPencil size={20} />
            </ThemeIcon>
            <Title order={2} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Writing Review & Guided Practice
            </Title>
          </Group>
          <Text size="sm" c="dimmed">
            Choose a guided topic by proficiency level or write freely. Receive immediate AI grammar, vocabulary, and styling feedback.
          </Text>
        </Stack>

        <Group gap="xs">
          <Button
            variant="default"
            size="sm"
            leftSection={<IconHistory size={16} />}
            onClick={() => {
              openHistory();
              loadHistory(1);
            }}
          >
            History
          </Button>
        </Group>
      </Group>

      {/* Error Alert */}
      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Review Failed"
          color="red"
          variant="light"
          mb="md"
          withCloseButton
          onClose={() => setError(null)}
        >
          <Group justify="space-between" align="center">
            <Text size="sm">{error}</Text>
            <Button size="xs" color="red" variant="subtle" onClick={handleSubmit} leftSection={<IconRefresh size={14} />}>
              Retry
            </Button>
          </Group>
        </Alert>
      )}

      {/* Main Content Layout */}
      <Stack gap="lg">
        {/* Guided Topics & Prompt Selector */}
        <Paper withBorder p="md" radius="md" shadow="xs">
          <Stack gap="sm">
            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="xs">
                <Text fw={600} size="sm">
                  Difficulty Level:
                </Text>
                <SegmentedControl
                  size="xs"
                  value={selectedLevel}
                  onChange={handleSelectLevel}
                  data={[
                    { label: 'Beginner (A1-A2)', value: 'beginner' },
                    { label: 'Intermediate (B1-B2)', value: 'intermediate' },
                    { label: 'Advanced (C1)', value: 'advanced' },
                    { label: 'All Topics', value: 'all' },
                  ]}
                />
              </Group>

              <Group gap="xs">
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<IconDice size={14} />}
                  onClick={handleRandomTopic}
                >
                  Surprise Me
                </Button>
                <Button
                  variant="light"
                  color="indigo"
                  size="xs"
                  leftSection={<IconListDetails size={14} />}
                  onClick={openTopicsModal}
                >
                  Browse All Topics
                </Button>
              </Group>
            </Group>

            {/* Active Topic Banner */}
            {activeTopic && (
              <Card
                withBorder
                radius="sm"
                p="sm"
                style={{
                  backgroundColor: 'var(--mantine-color-default-hover)',
                  borderLeft: `4px solid var(--mantine-color-${LEVEL_COLORS[activeTopic.level] || 'indigo'}-6)`,
                }}
              >
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={2}>
                      <Group gap="xs">
                        <Text fw={600} size="sm">
                          📌 {activeTopic.title}
                        </Text>
                        <Badge
                          size="xs"
                          variant="filled"
                          color={LEVEL_COLORS[activeTopic.level] || 'indigo'}
                        >
                          {activeTopic.level.toUpperCase()}
                        </Badge>
                        <Badge size="xs" variant="outline" color="gray">
                          {activeTopic.category}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {activeTopic.description}
                      </Text>
                    </Stack>

                    <Button
                      variant="subtle"
                      size="compact-xs"
                      onClick={toggleQuestions}
                      rightSection={questionsOpened ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
                    >
                      {questionsOpened ? 'Hide Guiding Questions' : 'Show Guiding Questions'}
                    </Button>
                  </Group>

                  {/* Guiding Questions */}
                  <Collapse in={questionsOpened}>
                    <Paper withBorder p="xs" radius="sm" bg="var(--mantine-color-body)">
                      <Text size="xs" fw={600} c="dimmed" mb={4}>
                        💡 Guiding Questions to organize your thoughts:
                      </Text>
                      <Stack gap={2}>
                        {activeTopic.guidingQuestions.map((q, idx) => (
                          <Text key={idx} size="xs" c="dimmed">
                            • {q}
                          </Text>
                        ))}
                      </Stack>
                    </Paper>
                  </Collapse>

                  {/* Sentence Starter */}
                  <Group justify="space-between" align="center" pt={2}>
                    <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }} lineClamp={1}>
                      Sentence Starter: "{activeTopic.sentenceStarter}"
                    </Text>
                    <Button
                      variant="light"
                      color="indigo"
                      size="compact-xs"
                      leftSection={<IconPlus size={12} />}
                      onClick={handleInsertSentenceStarter}
                    >
                      Insert Starter
                    </Button>
                  </Group>
                </Stack>
              </Card>
            )}
          </Stack>
        </Paper>

        {/* Vocabulary Bank Target Challenge */}
        {suggestedWords.length > 0 && (
          <Paper withBorder p="sm" radius="md" shadow="xs" style={{ borderLeft: '4px solid var(--mantine-color-teal-6)' }}>
            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="xs">
                <ThemeIcon size="sm" color="teal" variant="light" radius="xl">
                  <IconTarget size={14} />
                </ThemeIcon>
                <Text size="xs" fw={600}>
                  Vocabulary Challenge (From your saved word bank):
                </Text>
                <Text size="xs" c="dimmed">
                  Try weaving these words into your writing:
                </Text>
              </Group>

              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={fetchSuggestedWords}
                loading={loadingWords}
                title="Refresh suggested words"
              >
                <IconRefresh size={14} />
              </ActionIcon>
            </Group>

            <Group gap="xs" mt="xs">
              {suggestedWords.map((word) => (
                <Tooltip key={word} label={`Click to insert "${word}" at cursor position`}>
                  <Badge
                    size="sm"
                    variant="light"
                    color="teal"
                    style={{ cursor: 'pointer', transition: 'transform 0.1s ease' }}
                    onClick={() => handleInsertWord(word)}
                  >
                    + {word}
                  </Badge>
                </Tooltip>
              ))}
            </Group>
          </Paper>
        )}

        {/* Draft Editor Card */}
        <Paper withBorder p="md" radius="md" shadow="xs">
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <Text fw={600} size="sm">
                  Your Draft
                </Text>
                <Badge variant="dot" color={canSubmit ? 'teal' : isTooShort || isTooLong ? 'red' : 'gray'}>
                  {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} / 5000 chars
                </Badge>
              </Group>

              <Group gap="xs">
                <Button variant="subtle" size="xs" onClick={handleLoadSample} leftSection={<IconWriting size={14} />}>
                  Sample Text
                </Button>
                {text.length > 0 && (
                  <Button variant="subtle" color="gray" size="xs" onClick={handleClear} leftSection={<IconClearAll size={14} />}>
                    Clear
                  </Button>
                )}
              </Group>
            </Group>

            <Textarea
              ref={textareaRef}
              placeholder="Write your response here (minimum 20 characters)... Tap 'Insert Starter' or click a vocabulary chip above to help you begin!"
              value={text}
              onChange={(e) => setText(e.currentTarget.value)}
              minRows={6}
              maxRows={14}
              autosize
              error={
                isTooShort
                  ? `Please enter at least 20 characters (${20 - charCount} more needed).`
                  : isTooLong
                  ? `Text exceeds the maximum limit of 5000 characters by ${charCount - 5000}.`
                  : null
              }
            />

            <Group justify="space-between" align="center" mt="xs">
              <Text size="xs" c="dimmed">
                Minimum 20 characters required. Our AI evaluates grammar, phrasing naturalness, and vocabulary usage.
              </Text>
              <Button
                color="indigo"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!canSubmit}
                leftSection={<IconSparkles size={16} />}
              >
                Review Writing
              </Button>
            </Group>
          </Stack>
        </Paper>

        {/* AI Results Section */}
        {submitting && (
          <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
            <Stack align="center" gap="sm">
              <Loader color="indigo" type="dots" size="md" />
              <Text size="sm" fw={500}>
                Analyzing grammar, phrasing, and sentence flow...
              </Text>
              <Text size="xs" c="dimmed">
                Our AI tutor is preparing detailed constructive feedback.
              </Text>
            </Stack>
          </Paper>
        )}

        {currentReview && !submitting && (
          <Stack gap="md" data-testid="review-result-panel">
            {/* Overall Feedback Card */}
            <Card withBorder radius="md" p="md" shadow="xs">
              <Group justify="space-between" align="center" mb="xs">
                <Group gap="xs">
                  <ThemeIcon color="teal" variant="light" size="md" radius="sm">
                    <IconBulb size={18} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">
                    Overall Evaluation
                  </Text>
                  {currentReview.aiModel && (
                    <Badge variant="outline" size="xs" color="gray">
                      {currentReview.aiModel}
                    </Badge>
                  )}
                </Group>

                <Tooltip label={copied ? 'Copied!' : 'Copy Feedback & Suggestions'}>
                  <ActionIcon
                    variant="subtle"
                    color={copied ? 'teal' : 'gray'}
                    onClick={handleCopyFeedback}
                    size="sm"
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Text size="sm" lh={1.6} style={{ whiteSpace: 'pre-wrap' }}>
                {currentReview.feedback}
              </Text>
            </Card>

            {/* Suggestions Card */}
            <Card withBorder radius="md" p="md" shadow="xs">
              <Group gap="xs" mb="sm">
                <ThemeIcon color="indigo" variant="light" size="md" radius="sm">
                  <IconFileText size={18} />
                </ThemeIcon>
                <Text fw={600} size="sm">
                  Actionable Suggestions & Corrections
                </Text>
                <Badge color="indigo" variant="light" size="xs">
                  {currentReview.suggestions.length}
                </Badge>
              </Group>

              <Stack gap="xs">
                {currentReview.suggestions.map((suggestion, index) => (
                  <Paper
                    key={index}
                    withBorder
                    p="sm"
                    radius="sm"
                    style={{
                      borderLeft: '4px solid var(--mantine-color-indigo-6)',
                    }}
                  >
                    <Group align="flex-start" gap="xs">
                      <Text size="xs" fw={700} c="indigo">
                        {index + 1}.
                      </Text>
                      <Text size="sm" style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                        {suggestion}
                      </Text>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>

      {/* Browse Topics Modal */}
      <Modal
        opened={topicsModalOpened}
        onClose={closeTopicsModal}
        title={
          <Group gap="xs">
            <IconListDetails size={18} />
            <Text fw={600}>Curated Writing Prompts</Text>
          </Group>
        }
        size="lg"
      >
        <ScrollArea h={450}>
          <Stack gap="sm">
            {filteredTopics.map((topic) => (
              <Paper
                key={topic.id}
                withBorder
                p="sm"
                radius="md"
                style={{
                  cursor: 'pointer',
                  borderLeft: `4px solid var(--mantine-color-${LEVEL_COLORS[topic.level] || 'indigo'}-6)`,
                }}
                onClick={() => {
                  setActiveTopic(topic);
                  closeTopicsModal();
                }}
              >
                <Group justify="space-between" mb={4}>
                  <Text fw={600} size="sm">
                    {topic.title}
                  </Text>
                  <Group gap={4}>
                    <Badge size="xs" color={LEVEL_COLORS[topic.level] || 'indigo'}>
                      {topic.level}
                    </Badge>
                    <Badge size="xs" variant="outline" color="gray">
                      {topic.category}
                    </Badge>
                  </Group>
                </Group>
                <Text size="xs" c="dimmed" mb={4}>
                  {topic.description}
                </Text>
                <Text size="xs" c="indigo" style={{ fontStyle: 'italic' }}>
                  Starter: "{topic.sentenceStarter}"
                </Text>
              </Paper>
            ))}
          </Stack>
        </ScrollArea>
      </Modal>

      {/* History Drawer */}
      <Drawer
        opened={historyOpened}
        onClose={closeHistory}
        title={
          <Group gap="xs">
            <IconHistory size={18} />
            <Text fw={600}>Writing History</Text>
            <Badge size="xs" variant="light" color="gray">
              {historyTotal}
            </Badge>
          </Group>
        }
        position="right"
        size="md"
      >
        <ScrollArea h="calc(100vh - 120px)">
          {loadingHistory ? (
            <Stack align="center" justify="center" p="xl">
              <Loader size="sm" />
              <Text size="xs" c="dimmed">
                Loading history...
              </Text>
            </Stack>
          ) : historyItems.length === 0 ? (
            <Stack align="center" justify="center" p="xl" gap="xs">
              <IconFileText size={32} color="var(--mantine-color-dimmed)" />
              <Text size="sm" c="dimmed">
                No past writing reviews yet.
              </Text>
            </Stack>
          ) : (
            <Stack gap="sm" p="xs">
              {historyItems.map((item) => (
                <Paper
                  key={item._id}
                  withBorder
                  p="sm"
                  radius="md"
                  style={{ cursor: 'pointer', transition: 'border-color 0.15s ease' }}
                  onClick={() => handleSelectHistoryItem(item._id)}
                >
                  <Group justify="space-between" align="flex-start" wrap="nowrap" mb={6}>
                    <Text size="xs" c="dimmed">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Tooltip label="Delete Review">
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={(e) => handleDeleteHistoryItem(e, item._id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>

                  <Text size="sm" lineClamp={2} mb="xs">
                    "{item.originalText}"
                  </Text>

                  <Group gap="xs">
                    <Badge size="xs" variant="light" color="gray">
                      {item.wordCount} words
                    </Badge>
                    <Badge size="xs" variant="light" color="indigo">
                      {item.suggestionsCount} {item.suggestionsCount === 1 ? 'suggestion' : 'suggestions'}
                    </Badge>
                  </Group>
                </Paper>
              ))}

              {historyTotal > 8 && (
                <Group justify="center" mt="md">
                  <Pagination
                    size="xs"
                    total={Math.ceil(historyTotal / 8)}
                    value={historyPage}
                    onChange={setHistoryPage}
                  />
                </Group>
              )}
            </Stack>
          )}
        </ScrollArea>
      </Drawer>
    </Box>
  );
}
