import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Title,
  Group,
  Button,
  Text,
  Card,
  Center,
  Stack,
  Progress,
  Box,
  Badge,
  Loader,
  Alert,
  SegmentedControl,
  Slider,
  Modal,
  Table,
  Pagination,
  ThemeIcon,
  Paper,
} from '@mantine/core';
import {
  IconBrain,
  IconCheck,
  IconX,
  IconSparkles,
  IconHistory,
  IconArrowRight,
  IconRotateClockwise,
  IconAlertCircle,
  IconBulb,
  IconTrophy,
  IconBook,
} from '@tabler/icons-react';
import {
  quizApi,
  type QuizQuestionItem,
  type AnswerQuizResponse,
  type QuizHistoryItem,
} from '../lib/quiz.api';
import { useAuth } from '../lib/auth';

type QuizState = 'config' | 'playing' | 'completed';

export function QuizPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Configuration state
  const [scope, setScope] = useState<'all' | 'recent'>('all');
  const [questionCount, setQuestionCount] = useState<number>(user?.settings?.quizDefaultCount || 10);
  const [quizState, setQuizState] = useState<QuizState>('config');

  // Active quiz state
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<AnswerQuizResponse | null>(null);
  const [currentScore, setCurrentScore] = useState(0);

  // Loading & error state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History modal state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<QuizHistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Start a new quiz
  const handleStartQuiz = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await quizApi.generate({ scope, count: questionCount });
      setQuizId(data.quizId);
      setQuestions(data.questions || []);
      setCurrentIndex(0);
      setSelectedOption(null);
      setEvaluation(null);
      setCurrentScore(0);
      setQuizState('playing');
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to generate quiz. Make sure you have at least 4 saved words.';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  // Submit answer for current question
  const handleSelectOption = async (optionIndex: number) => {
    if (selectedOption !== null || evaluating || !quizId) return;

    setSelectedOption(optionIndex);
    setEvaluating(true);
    try {
      const res = await quizApi.answer(quizId, {
        questionIndex: currentIndex,
        selectedIndex: optionIndex,
      });
      setEvaluation(res);
      if (res.correct) {
        setCurrentScore((prev) => prev + 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit answer');
    } finally {
      setEvaluating(false);
    }
  };

  // Next question or complete
  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setEvaluation(null);
    } else {
      setQuizState('completed');
    }
  };

  // Fetch history
  const fetchHistory = useCallback(async (page: number) => {
    setHistoryLoading(true);
    try {
      const res = await quizApi.getHistory(page, 10);
      setHistoryItems(res.items || []);
      setHistoryPage(res.page);
      setHistoryTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load quiz history', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (historyOpen) {
      fetchHistory(historyPage);
    }
  }, [historyOpen, historyPage, fetchHistory]);

  const currentQ = questions[currentIndex];
  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const finalPercentage = questions.length > 0 ? Math.round((currentScore / questions.length) * 100) : 0;

  return (
    <Box maw={800} mx="auto" py="md">
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <Group>
          <ThemeIcon size={40} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconBrain size={24} />
          </ThemeIcon>
          <div>
            <Title order={2}>AI Vocabulary Quiz</Title>
            <Text c="dimmed" size="sm">
              Practice and test your retention with context-aware AI questions
            </Text>
          </div>
        </Group>

        <Button
          variant="light"
          leftSection={<IconHistory size={18} />}
          onClick={() => setHistoryOpen(true)}
        >
          History
        </Button>
      </Group>

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Notice"
          color="red"
          variant="light"
          mb="md"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* VIEW 1: CONFIGURATION */}
      {quizState === 'config' && (
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Stack gap="lg">
            <div>
              <Text fw={600} mb="xs">
                Vocabulary Scope
              </Text>
              <SegmentedControl
                value={scope}
                onChange={(val) => setScope(val as 'all' | 'recent')}
                fullWidth
                data={[
                  { label: 'All Saved Words', value: 'all' },
                  { label: 'Recent Saves (Last 7 Days)', value: 'recent' },
                ]}
              />
            </div>

            <div>
              <Group justify="space-between" mb="xs">
                <Text fw={600}>Number of Questions</Text>
                <Badge variant="light" color="blue" size="lg">
                  {questionCount} Questions
                </Badge>
              </Group>
              <Slider
                value={questionCount}
                onChange={setQuestionCount}
                min={4}
                max={20}
                step={1}
                marks={[
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                  { value: 15, label: '15' },
                  { value: 20, label: '20' },
                ]}
                mb="md"
              />
            </div>

            <Box p="md" style={{ background: 'var(--mantine-color-default-hover)', borderRadius: '8px' }}>
              <Group gap="xs">
                <IconSparkles size={18} color="var(--mantine-color-blue-filled)" />
                <Text size="sm" fw={500}>
                  Smart Question Generation
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt={4}>
                Gemini dynamically crafts 4-option multiple-choice questions grounded in the exact
                sentences you captured from articles and web pages.
              </Text>
            </Box>

            <Button
              size="lg"
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              leftSection={<IconSparkles size={20} />}
              loading={generating}
              onClick={handleStartQuiz}
            >
              Start AI Quiz
            </Button>
          </Stack>
        </Card>
      )}

      {/* VIEW 2: ACTIVE QUIZ */}
      {quizState === 'playing' && currentQ && (
        <Stack gap="md">
          {/* Progress bar and score */}
          <Card padding="sm" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600}>
                Question {currentIndex + 1} of {questions.length}
              </Text>
              <Badge color="blue" variant="light" size="lg">
                Score: {currentScore} / {currentIndex + (selectedOption !== null ? 1 : 0)}
              </Badge>
            </Group>
            <Progress value={progressPercent} animated={evaluating} size="md" radius="xl" />
          </Card>

          {/* Question Card */}
          <Card shadow="md" padding="xl" radius="md" withBorder>
            <Stack gap="lg">
              <Text size="lg" fw={600}>
                {currentQ.questionText}
              </Text>

              {/* 4 Options */}
              <Stack gap="sm">
                {currentQ.options.map((optText, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  const isAnswered = evaluation !== null;
                  const isCorrect = isAnswered && evaluation.correctIndex === optIdx;
                  const isWrongSelected = isAnswered && isSelected && !evaluation.correct;

                  let borderStyle = '1px solid var(--mantine-color-default-border)';
                  let bgStyle = 'transparent';

                  if (isAnswered) {
                    if (isCorrect) {
                      borderStyle = '2px solid var(--mantine-color-green-filled)';
                      bgStyle = 'var(--mantine-color-green-light)';
                    } else if (isWrongSelected) {
                      borderStyle = '2px solid var(--mantine-color-red-filled)';
                      bgStyle = 'var(--mantine-color-red-light)';
                    } else {
                      bgStyle = 'var(--mantine-color-default-hover)';
                    }
                  } else if (isSelected) {
                    borderStyle = '2px solid var(--mantine-color-blue-filled)';
                  }

                  const optionLabels = ['A', 'B', 'C', 'D'];

                  return (
                    <Paper
                      key={optIdx}
                      p="md"
                      radius="md"
                      onClick={() => handleSelectOption(optIdx)}
                      style={{
                        cursor: isAnswered ? 'default' : 'pointer',
                        border: borderStyle,
                        backgroundColor: bgStyle,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Group justify="space-between">
                        <Group gap="md">
                          <ThemeIcon
                            size={32}
                            radius="xl"
                            variant={isSelected || isCorrect ? 'filled' : 'light'}
                            color={isCorrect ? 'green' : isWrongSelected ? 'red' : 'blue'}
                          >
                            <Text size="sm" fw={700}>
                              {optionLabels[optIdx]}
                            </Text>
                          </ThemeIcon>
                          <Text size="md" fw={500}>
                            {optText}
                          </Text>
                        </Group>

                        {isAnswered && (
                          <div>
                            {isCorrect && <IconCheck size={20} color="var(--mantine-color-green-filled)" />}
                            {isWrongSelected && <IconX size={20} color="var(--mantine-color-red-filled)" />}
                          </div>
                        )}
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>

              {/* Evaluation Rationale Alert */}
              {evaluation && (
                <Alert
                  icon={<IconBulb size={18} />}
                  title={evaluation.correct ? 'Correct!' : 'Incorrect'}
                  color={evaluation.correct ? 'green' : 'red'}
                  variant="light"
                  radius="md"
                >
                  <Text size="sm">{evaluation.explanation}</Text>
                </Alert>
              )}

              {/* Next Button */}
              {evaluation && (
                <Group justify="flex-end">
                  <Button
                    size="md"
                    onClick={handleNextQuestion}
                    rightSection={<IconArrowRight size={18} />}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                  >
                    {currentIndex + 1 < questions.length ? 'Next Question' : 'Complete Quiz'}
                  </Button>
                </Group>
              )}
            </Stack>
          </Card>
        </Stack>
      )}

      {/* VIEW 3: COMPLETED RESULTS */}
      {quizState === 'completed' && (
        <Card shadow="md" padding="xl" radius="md" withBorder>
          <Center py="xl">
            <Stack align="center" gap="md">
              <ThemeIcon size={80} radius="xl" variant="light" color={finalPercentage >= 70 ? 'green' : 'orange'}>
                <IconTrophy size={48} />
              </ThemeIcon>

              <Title order={2}>Quiz Completed!</Title>
              <Text c="dimmed" size="md">
                {finalPercentage >= 80
                  ? 'Outstanding retention! You really know your vocabulary in context.'
                  : finalPercentage >= 50
                  ? 'Good effort! Review the words again in Flashcards to solidify recall.'
                  : 'Keep going! Regular practice will strengthen your memory.'}
              </Text>

              <Badge size="xl" variant="filled" color={finalPercentage >= 70 ? 'green' : 'orange'} py="lg" px="xl">
                Score: {currentScore} / {questions.length} ({finalPercentage}%)
              </Badge>

              <Group mt="lg">
                <Button
                  leftSection={<IconRotateClockwise size={18} />}
                  onClick={() => setQuizState('config')}
                  variant="filled"
                >
                  Take Another Quiz
                </Button>
                <Button
                  leftSection={<IconBook size={18} />}
                  variant="light"
                  onClick={() => navigate('/vocabulary')}
                >
                  Vocabulary Bank
                </Button>
                <Button
                  leftSection={<IconHistory size={18} />}
                  variant="subtle"
                  onClick={() => setHistoryOpen(true)}
                >
                  View History
                </Button>
              </Group>
            </Stack>
          </Center>
        </Card>
      )}

      {/* History Modal */}
      <Modal
        opened={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={
          <Group gap="xs">
            <IconHistory size={20} />
            <Text fw={600}>Quiz History</Text>
          </Group>
        }
        size="lg"
      >
        {historyLoading ? (
          <Center py="xl">
            <Loader size="md" />
          </Center>
        ) : historyItems.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">No completed quizzes yet. Take your first quiz!</Text>
          </Center>
        ) : (
          <Stack gap="md">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Scope</Table.Th>
                  <Table.Th>Score</Table.Th>
                  <Table.Th>Accuracy</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {historyItems.map((item) => {
                  const pct = Math.round((item.score / (item.total || 1)) * 100);
                  const dateStr = item.completedAt
                    ? new Date(item.completedAt).toLocaleDateString()
                    : '-';
                  return (
                    <Table.Tr key={item.quizId}>
                      <Table.Td>{dateStr}</Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="outline">
                          {item.scope}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {item.score} / {item.total}
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" color={pct >= 70 ? 'green' : 'orange'}>
                          {pct}%
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>

            {historyTotalPages > 1 && (
              <Center>
                <Pagination
                  value={historyPage}
                  onChange={(p) => setHistoryPage(p)}
                  total={historyTotalPages}
                />
              </Center>
            )}
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
