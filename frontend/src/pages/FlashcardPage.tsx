import { useState } from 'react';
import { Title, Group, Button, Text, Card, Center, Stack, Progress, Highlight, Box } from '@mantine/core';
import { IconX, IconCheck, IconEye } from '@tabler/icons-react';

// Mock data for the flashcard session
const mockFlashcards = [
  {
    id: 1,
    word: 'Ephemeral',
    sentence: 'The beauty of a sunset is ephemeral, lasting only a few minutes before fading into the night.',
    translation: 'Phù du, chóng tàn',
    type: 'Adjective',
  },
  {
    id: 2,
    word: 'Ubiquitous',
    sentence: 'Smartphones have become ubiquitous in modern society.',
    translation: 'Có mặt ở khắp nơi',
    type: 'Adjective',
  },
  {
    id: 3,
    word: 'Resilience',
    sentence: 'Her resilience in the face of adversity was truly inspiring to everyone around her.',
    translation: 'Sự kiên cường',
    type: 'Noun',
  },
];

export function FlashcardPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  const totalCards = mockFlashcards.length;
  const currentCard = mockFlashcards[currentIndex];

  const handleShowMeaning = () => {
    setIsFlipped(true);
  };

  const handleNext = (_remembered: boolean) => {
    // In a real app, dispatch an API call here to record the review (e.g. SM-2 algorithm update)
    setIsFlipped(false);
    if (currentIndex + 1 < totalCards) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  if (completed) {
    return (
      <Center style={{ minHeight: '60vh' }}>
        <Stack align="center" gap="md">
          <IconCheck size="4rem" color="var(--mantine-color-green-6)" />
          <Title order={2}>Session Complete!</Title>
          <Text c="dimmed">You have reviewed all due cards for today.</Text>
          <Button variant="light" mt="md" onClick={() => {
            setCurrentIndex(0);
            setCompleted(false);
            setIsFlipped(false);
          }}>
            Review Again
          </Button>
        </Stack>
      </Center>
    );
  }

  const progressValue = ((currentIndex) / totalCards) * 100;

  return (
    <Stack gap="xl" align="center" style={{ width: '100%' }}>
      {/* Header and Progress */}
      <Box w="100%" maw={600}>
        <Group justify="space-between" mb="xs">
          <Title order={3}>Flashcard Review</Title>
          <Text fw={500} size="sm" c="dimmed">
            {currentIndex + 1} / {totalCards} due
          </Text>
        </Group>
        <Progress value={progressValue} size="sm" radius="xl" animated={!isFlipped} />
      </Box>

      {/* Flashcard */}
      <Card
        withBorder
        radius="lg"
        shadow="sm"
        p="xl"
        w="100%"
        maw={600}
        style={{ minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <Stack align="center" gap="lg" style={{ flex: 1, justifyContent: 'center', textAlign: 'center' }}>
          
          <Text size="xl" fw={500} lh={1.6}>
            <Highlight highlight={currentCard.word} highlightStyles={{ backgroundColor: 'var(--mantine-color-blue-light)', color: 'var(--mantine-color-blue-filled)', padding: '0 4px', borderRadius: '4px' }}>
              {currentCard.sentence}
            </Highlight>
          </Text>

          {isFlipped && (
            <Stack gap="xs" mt="xl" align="center">
              <Text size="xs" tt="uppercase" fw={600} c="dimmed" style={{ letterSpacing: '1px' }}>
                {currentCard.type}
              </Text>
              <Title order={1} size="h2" c="blue">{currentCard.word}</Title>
              <Text size="lg" fw={500}>{currentCard.translation}</Text>
            </Stack>
          )}

        </Stack>
      </Card>

      {/* Controls */}
      <Box w="100%" maw={600}>
        {!isFlipped ? (
          <Button 
            fullWidth 
            size="lg" 
            radius="md" 
            variant="light"
            onClick={handleShowMeaning}
            leftSection={<IconEye size="1.2rem" />}
          >
            Show meaning
          </Button>
        ) : (
          <Group grow gap="md">
            <Button
              size="lg"
              radius="md"
              variant="outline"
              color="red"
              onClick={() => handleNext(false)}
              leftSection={<IconX size="1.2rem" />}
            >
              Forgot
            </Button>
            <Button
              size="lg"
              radius="md"
              color="green"
              onClick={() => handleNext(true)}
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
