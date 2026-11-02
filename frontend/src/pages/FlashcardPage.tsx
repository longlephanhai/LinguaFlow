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
  Highlight,
  Box,
  Badge,
  Loader,
  Alert,
  Anchor,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconX,
  IconCheck,
  IconEye,
  IconExternalLink,
  IconRefresh,
  IconPlayerPause,
  IconPlayerPlay,
  IconVideo,
} from '@tabler/icons-react';
import { reviewApi, type DueOccurrence } from '../lib/review.api';

function formatClipTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '0:00';
  const totalSec = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function FlashcardPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<DueOccurrence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showClip, setShowClip] = useState(false);
  const [clipReplayKey, setClipReplayKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [lastReviewFeedback, setLastReviewFeedback] = useState<string | null>(null);

  const fetchDueCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reviewApi.getDueOccurrences();
      setCards(response.occurrences || []);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowClip(false);
      setSessionCompleted(false);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load due cards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDueCards();
  }, [fetchDueCards]);

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;

  const handleShowMeaning = () => {
    setIsFlipped(true);
  };

  const handleNext = async (remembered: boolean) => {
    if (!currentCard || submitting) return;

    setSubmitting(true);
    setLastReviewFeedback(null);

    try {
      const result = await reviewApi.recordResult(currentCard.id, remembered);
      setReviewedCount((prev) => prev + 1);
      setLastReviewFeedback(
        remembered
          ? `Great! Next review in ${result.intervalDays} day${result.intervalDays > 1 ? 's' : ''}`
          : 'Card reset to review tomorrow'
      );

      setIsFlipped(false);
      setShowClip(false);
      if (currentIndex + 1 < totalCards) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to record review result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async () => {
    if (!currentCard || submitting) return;

    setSubmitting(true);
    try {
      await reviewApi.suspendCard(currentCard.id, true);
      setIsFlipped(false);
      setShowClip(false);
      if (currentIndex + 1 < totalCards) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    } catch (err: any) {
      setError('Failed to suspend card');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Center style={{ minHeight: '60vh' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" type="dots" />
          <Text c="dimmed">Loading your due flashcards...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center style={{ minHeight: '60vh' }}>
        <Stack align="center" gap="md" maw={500}>
          <Alert color="red" title="Error" w="100%">
            {error}
          </Alert>
          <Button variant="light" leftSection={<IconRefresh size="1rem" />} onClick={fetchDueCards}>
            Try Again
          </Button>
        </Stack>
      </Center>
    );
  }

  if (cards.length === 0 || sessionCompleted) {
    return (
      <Center style={{ minHeight: '60vh' }}>
        <Card withBorder radius="lg" shadow="sm" p="xl" maw={520} w="100%" style={{ textAlign: 'center' }}>
          <Stack align="center" gap="md">
            <Center
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: 'var(--mantine-color-green-light)',
              }}
            >
              <IconCheck size="2.5rem" color="var(--mantine-color-green-filled)" />
            </Center>
            <Title order={2}>
              {sessionCompleted ? 'Session Complete!' : 'All Caught Up!'}
            </Title>
            <Text c="dimmed" size="sm">
              {sessionCompleted
                ? `You reviewed ${reviewedCount} card${reviewedCount > 1 ? 's' : ''} in this session. Spaced repetition schedule has been updated.`
                : 'You have no flashcards due for review right now. Add new vocabulary while reading or explore your saved list.'}
            </Text>

            <Group gap="md" mt="md">
              <Button variant="default" onClick={() => navigate('/vocabulary')}>
                Go to Vocabulary
              </Button>
              <Button
                variant="light"
                leftSection={<IconRefresh size="1rem" />}
                onClick={() => {
                  setReviewedCount(0);
                  fetchDueCards();
                }}
              >
                Check Again
              </Button>
            </Group>
          </Stack>
        </Card>
      </Center>
    );
  }

  const progressValue = ((currentIndex) / totalCards) * 100;
  const highlightWord = currentCard.selectedText || currentCard.lemma;

  return (
    <Stack gap="xl" align="center" style={{ width: '100%' }}>
      {/* Header and Progress */}
      <Box w="100%" maw={640}>
        <Group justify="space-between" mb="xs">
          <div>
            <Title order={3}>Flashcard Review</Title>
            <Text size="xs" c="dimmed">
              Simplified SM-2 Spaced Repetition
            </Text>
          </div>
          <Badge variant="light" size="lg" color="blue">
            {currentIndex + 1} / {totalCards} due
          </Badge>
        </Group>
        <Progress value={progressValue} size="sm" radius="xl" animated={submitting} />
        {lastReviewFeedback && (
          <Text size="xs" c="green" ta="center" mt="xs" fw={500}>
            {lastReviewFeedback}
          </Text>
        )}
      </Box>

      {/* Flashcard */}
      <Card
        withBorder
        radius="lg"
        shadow="md"
        p="xl"
        w="100%"
        maw={640}
        style={{
          minHeight: 340,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        {/* Top bar of card */}
        <Group justify="space-between" mb="md">
          <Group gap="xs">
            {currentCard.partOfSpeech && (
              <Badge variant="outline" size="sm" color="gray">
                {currentCard.partOfSpeech}
              </Badge>
            )}
            {currentCard.review && (
              <Badge variant="dot" size="sm" color="cyan">
                Streak: {currentCard.review.repetitions} | {currentCard.review.intervalDays}d interval
              </Badge>
            )}
          </Group>

          <Tooltip label="Suspend this card (pause reviews)">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={handleSuspend}
              disabled={submitting}
            >
              <IconPlayerPause size="1rem" />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Card Body */}
        <Stack align="center" gap="lg" style={{ flex: 1, justifyContent: 'center', textAlign: 'center' }}>
          {/* Card Front: Sentence with highlighted word */}
          <Highlight
            size="xl"
            fw={500}
            lh={1.6}
            highlight={highlightWord}
            highlightStyles={{
              backgroundColor: 'var(--mantine-color-blue-light)',
              color: 'var(--mantine-color-blue-filled)',
              padding: '2px 6px',
              borderRadius: '6px',
              fontWeight: 700,
            }}
          >
            {currentCard.sentence}
          </Highlight>

          {/* Card Back: Revealed meaning & example */}
          {isFlipped && (
            <Stack gap="sm" mt="md" align="center" w="100%">
              <Title order={2} c="blue">
                {currentCard.lemma}
              </Title>
              <Text size="lg" fw={600} c="dark.7">
                {currentCard.meaning || currentCard.definition}
              </Text>
              {currentCard.example && (
                <Box
                  p="xs"
                  style={{
                    backgroundColor: 'var(--mantine-color-gray-0)',
                    borderRadius: '8px',
                    width: '100%',
                  }}
                >
                  <Text size="sm" fs="italic" c="dimmed">
                    "{currentCard.example}"
                  </Text>
                </Box>
              )}

              {/* FR-CARD-001: Video Context Clip Playback on Card Back */}
              {currentCard.mediaMetadata?.provider === 'youtube' && currentCard.mediaMetadata?.videoId && (
                <Box
                  mt="xs"
                  p="sm"
                  style={{
                    backgroundColor: 'var(--mantine-color-indigo-0)',
                    border: '1px solid var(--mantine-color-indigo-2)',
                    borderRadius: '10px',
                    width: '100%',
                  }}
                >
                  <Group justify="space-between" mb={showClip ? 'xs' : 0}>
                    <Group gap="xs">
                      <IconVideo size="1rem" color="var(--mantine-color-indigo-6)" />
                      <Text size="xs" fw={600} c="indigo.9" lineClamp={1}>
                        {currentCard.mediaMetadata.videoTitle || 'Video Context'}
                      </Text>
                      {currentCard.mediaMetadata.timestampSeconds !== null && (
                        <Badge size="xs" variant="light" color="indigo">
                          {formatClipTime(currentCard.mediaMetadata.timestampSeconds)}
                        </Badge>
                      )}
                    </Group>

                    {!showClip ? (
                      <Button
                        size="xs"
                        variant="filled"
                        color="indigo"
                        radius="md"
                        leftSection={<IconPlayerPlay size="0.85rem" />}
                        onClick={() => {
                          setShowClip(true);
                          setClipReplayKey((prev) => prev + 1);
                        }}
                      >
                        Play Context Clip
                      </Button>
                    ) : (
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          color="indigo"
                          radius="md"
                          leftSection={<IconRefresh size="0.85rem" />}
                          onClick={() => setClipReplayKey((prev) => prev + 1)}
                        >
                          Replay Clip
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          color="gray"
                          radius="md"
                          onClick={() => setShowClip(false)}
                        >
                          Close Clip
                        </Button>
                      </Group>
                    )}
                  </Group>

                  {showClip && (
                    <Box
                      style={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '56.25%',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#000',
                      }}
                    >
                      <iframe
                        key={`${currentCard.id}-${clipReplayKey}`}
                        data-testid="context-clip-iframe"
                        title="Context Video Clip"
                        src={`https://www.youtube-nocookie.com/embed/${currentCard.mediaMetadata.videoId}?start=${Math.max(0, Math.floor((currentCard.mediaMetadata.timestampSeconds ?? 0) - 2))}&end=${Math.ceil((currentCard.mediaMetadata.timestampSeconds ?? 0) + 3)}&autoplay=1&rel=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 0,
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Stack>
          )}
        </Stack>

        {/* Card Footer: Source URL */}
        {currentCard.sourceUrl && (
          <Group justify="center" mt="md" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
            <Anchor
              href={currentCard.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              c="dimmed"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>{currentCard.sourceTitle || new URL(currentCard.sourceUrl).hostname}</span>
              <IconExternalLink size="0.8rem" />
            </Anchor>
          </Group>
        )}
      </Card>

      {/* Controls */}
      <Box w="100%" maw={640}>
        {!isFlipped ? (
          <Button
            fullWidth
            size="lg"
            radius="md"
            variant="light"
            onClick={handleShowMeaning}
            leftSection={<IconEye size="1.2rem" />}
          >
            Show meaning & answer
          </Button>
        ) : (
          <Group grow gap="md">
            <Button
              size="lg"
              radius="md"
              variant="outline"
              color="red"
              onClick={() => handleNext(false)}
              loading={submitting}
              leftSection={<IconX size="1.2rem" />}
            >
              Forgot
            </Button>
            <Button
              size="lg"
              radius="md"
              color="green"
              onClick={() => handleNext(true)}
              loading={submitting}
              leftSection={<IconCheck size="1.2rem" />}
            >
              Remembered
            </Button>
          </Group>
        )}
      </Box>
    </Stack>
  );
}
