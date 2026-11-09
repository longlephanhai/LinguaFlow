import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Button,
  Group,
  Stack,
  Badge,
  Card,
  SimpleGrid,
  TextInput,
  ThemeIcon,
  ActionIcon,
  ScrollArea,
  Modal,
  Drawer,
  Progress,
  Loader,
  Alert,
  Tooltip,
  Divider,
  SegmentedControl,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconSend,
  IconVolume,
  IconVolumeOff,
  IconCheck,
  IconHistory,
  IconSparkles,
  IconBulb,
  IconPlayerStop,
  IconCoffee,
  IconPlane,
  IconMessageCircle2,
  IconBriefcase,
  IconPlus,
  IconTrash,
  IconLanguage,
} from '@tabler/icons-react';
import { voiceApi } from '../lib/voice.api';
import type {
  ScenarioTargetWord,
  DialogueTurn,
  VoiceSessionHistoryItem,
  EndVoiceSessionResponse,
} from '../lib/voice.api';

interface ScenarioOption {
  preset: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: string | number; stroke?: number }>;
  color: string;
  defaultTopic: string;
}

const SCENARIOS: ScenarioOption[] = [
  {
    preset: 'coffee_shop',
    title: 'Quán Cà Phê (Coffee Shop)',
    subtitle: 'Gọi đồ uống, chọn size, tùy chỉnh sữa hạt, tráng miệng & thanh toán.',
    icon: IconCoffee,
    color: 'orange',
    defaultTopic: 'Ordering drinks and pastries at a local specialty cafe',
  },
  {
    preset: 'hotel_travel',
    title: 'Khách Sạn & Du Lịch (Hotel & Travel)',
    subtitle: 'Check-in phòng, hỏi về tiện ích, gửi hành lý và xin chỉ dẫn đường đi.',
    icon: IconPlane,
    color: 'blue',
    defaultTopic: 'Checking in at a hotel and asking about amenities and local transit',
  },
  {
    preset: 'casual_chat',
    title: 'Trò Chuyện Bạn Bè (Casual Catch-up)',
    subtitle: 'Hỏi thăm ngày làm việc, chia sẻ kế hoạch cuối tuần, phim ảnh và sở thích.',
    icon: IconMessageCircle2,
    color: 'teal',
    defaultTopic: 'Catching up with an old friend over weekend plans and recent hobbies',
  },
  {
    preset: 'job_interview',
    title: 'Phỏng Vấn Xin Việc (Casual Interview)',
    subtitle: 'Giới thiệu bản thân, chia sẻ kinh nghiệm xử lý vấn đề và mục tiêu nghề nghiệp.',
    icon: IconBriefcase,
    color: 'indigo',
    defaultTopic: 'A friendly introductory job interview discussing background and past projects',
  },
];

export function ConversationPage() {
  // Session State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentScenario, setCurrentScenario] = useState<string>('');
  const [targetVocabulary, setTargetVocabulary] = useState<ScenarioTargetWord[]>([]);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [dialogue, setDialogue] = useState<DialogueTurn[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  // Setup / Preset Config
  const [selectedPreset, setSelectedPreset] = useState<string>('coffee_shop');
  const [proficiencyLevel, setProficiencyLevel] = useState<'a1_a2' | 'b1_b2' | 'c1'>('a1_a2');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [targetCount, setTargetCount] = useState<number>(5);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [revealedTranslations, setRevealedTranslations] = useState<Record<number, boolean>>({});

  // Voice & Audio
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Modals & Drawers
  const [summaryOpened, { open: openSummary, close: closeSummary }] = useDisclosure(false);
  const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);
  const [sessionSummary, setSessionSummary] = useState<EndVoiceSessionResponse | null>(null);

  // History List
  const [historyList, setHistoryList] = useState<VoiceSessionHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Auto-scroll chat
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (activeSessionId) {
      interval = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSessionId]);

  // Speech Recognition initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setUserInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Scroll to bottom when dialogue updates
  useEffect(() => {
    if (chatScrollRef.current && typeof chatScrollRef.current.scrollTo === 'function') {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [dialogue, isAiResponding]);

  // Speak AI text
  const speakText = (text: string) => {
    if (!audioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore audio synthesis errors
    }
  };

  // Toggle Microphone
  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Start Session
  const handleStartSession = async (presetOverride?: string) => {
    const preset = presetOverride || selectedPreset;
    setIsStarting(true);
    try {
      const selectedOption = SCENARIOS.find((s) => s.preset === preset);
      const topic = preset === 'custom' ? customTopic : selectedOption?.defaultTopic;

      const data = await voiceApi.startSession({
        scenarioPreset: preset,
        topic,
        targetWordsCount: targetCount,
        proficiencyLevel,
      });

      setActiveSessionId(data.sessionId);
      setCurrentScenario(data.scenario);
      setTargetVocabulary(data.targetVocabulary);
      setUsedWords(new Set());
      setSessionDuration(0);
      setQuickReplies(data.quickReplies || []);
      setRevealedTranslations({});

      const initialTurn: DialogueTurn = {
        role: 'assistant',
        text: data.initialGreeting,
        timestamp: new Date().toISOString(),
        vietnameseTranslation: data.initialGreetingTranslation || null,
        quickReplies: data.quickReplies || [],
      };
      setDialogue([initialTurn]);

      speakText(data.initialGreeting);
    } catch (err) {
      console.error('Failed to start scenario session', err);
    } finally {
      setIsStarting(false);
    }
  };

  // Send Turn
  const handleSendTurn = async () => {
    if (!activeSessionId || !userInput.trim() || isAiResponding) return;

    const textToSend = userInput.trim();
    setUserInput('');

    // Optimistically append user message
    const optimisticTurn: DialogueTurn = {
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };
    setDialogue((prev) => [...prev, optimisticTurn]);
    setIsAiResponding(true);

    try {
      const response = await voiceApi.sendTurn({
        sessionId: activeSessionId,
        userTranscript: textToSend,
      });

      // Update used target words
      if (response.detectedTargetWords && response.detectedTargetWords.length > 0) {
        setUsedWords((prev) => {
          const next = new Set(prev);
          response.detectedTargetWords.forEach((w) => next.add(w.toLowerCase()));
          return next;
        });
      }

      // Update user turn with detected words and feedback
      setDialogue((prev) => {
        const updated = [...prev];
        const lastUserIdx = updated.map((m) => m.role).lastIndexOf('user');
        if (lastUserIdx !== -1) {
          updated[lastUserIdx] = {
            ...updated[lastUserIdx],
            detectedTargetWords: response.detectedTargetWords,
            phrasingFeedback: response.phrasingFeedback,
          };
        }
        // Append assistant response
        updated.push({
          role: 'assistant',
          text: response.assistantText,
          timestamp: new Date().toISOString(),
          vietnameseTranslation: response.vietnameseTranslation || null,
          quickReplies: response.quickReplies || [],
        });
        return updated;
      });

      setQuickReplies(response.quickReplies || []);
      speakText(response.assistantText);
    } catch (err) {
      console.error('Failed to send turn', err);
      setDialogue((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "I didn't quite catch that. Could you say it again?",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsAiResponding(false);
    }
  };

  // End Session
  const handleEndSession = async () => {
    if (!activeSessionId) return;
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      const summary = await voiceApi.endSession({ sessionId: activeSessionId });
      setSessionSummary(summary);
      openSummary();
      setActiveSessionId(null);
    } catch (err) {
      console.error('Failed to end session', err);
      setActiveSessionId(null);
    }
  };

  // Fetch Past Sessions
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await voiceApi.getSessions(1, 20);
      setHistoryList(data.items || []);
    } catch (err) {
      console.error('Failed to load sessions history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistoryDrawer = () => {
    fetchHistory();
    openHistory();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activationPercent =
    targetVocabulary.length > 0
      ? Math.round((usedWords.size / targetVocabulary.length) * 100)
      : 0;

  return (
    <Container size="xl" py="lg">
      {/* ======================================================== */}
      {/* 1. SETUP / SCENARIO SELECTOR VIEW                        */}
      {/* ======================================================== */}
      {!activeSessionId && (
        <Stack gap="xl">
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap="xs" mb={4}>
                <Badge color="teal" variant="light" size="sm">
                  Phase 3 • Everyday Immersion
                </Badge>
                <Badge color="blue" variant="dot" size="sm">
                  SRS Vocabulary Activation
                </Badge>
              </Group>
              <Title order={2}>Luyện Hội Thoại Tình Huống Đời Thực</Title>
              <Text c="dimmed" size="sm" mt={4}>
                Trò chuyện phản xạ tự nhiên với trợ lý AI bản ngữ. AI chủ động điều hướng để gợi mở các từ vựng đến hạn ôn tập của bạn mà không áp lực điểm số thi cử.
              </Text>
            </div>
            <Button
              variant="default"
              leftSection={<IconHistory size={16} />}
              onClick={openHistoryDrawer}
            >
              Lịch sử hội thoại
            </Button>
          </Group>

          <Paper withBorder p="lg" radius="md">
            <Stack gap="md">
              {/* Proficiency Level Selector */}
              <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-gray-0)">
                <Group justify="space-between" mb="xs">
                  <div>
                    <Text fw={600} size="sm">
                      Chọn trình độ đàm thoại của bạn
                    </Text>
                    <Text size="xs" c="dimmed">
                      AI sẽ tự động điều chỉnh độ dài câu, từ vựng và câu hỏi để bạn phản xạ tự nhiên nhất
                    </Text>
                  </div>
                  <Badge
                    size="sm"
                    color={proficiencyLevel === 'a1_a2' ? 'green' : proficiencyLevel === 'b1_b2' ? 'blue' : 'indigo'}
                    variant="filled"
                  >
                    {proficiencyLevel === 'a1_a2'
                      ? 'Level A1 - A2 (Cơ bản)'
                      : proficiencyLevel === 'b1_b2'
                        ? 'Level B1 - B2 (Trung cấp)'
                        : 'Level C1 (Nâng cao)'}
                  </Badge>
                </Group>
                <SegmentedControl
                  value={proficiencyLevel}
                  onChange={(val) => setProficiencyLevel(val as any)}
                  fullWidth
                  data={[
                    {
                      value: 'a1_a2',
                      label: '🟢 A1 - A2: Câu ngắn, hỏi 1 câu, có gợi ý câu mẫu',
                    },
                    {
                      value: 'b1_b2',
                      label: '🟡 B1 - B2: Hội thoại tự nhiên, phrasal verbs',
                    },
                    {
                      value: 'c1',
                      label: '🟣 C1: Phản xạ sâu, ngữ cảnh phong phú',
                    },
                  ]}
                />
              </Paper>

              <Group justify="space-between">
                <div>
                  <Text fw={600} size="md">
                    Chọn tình huống giao tiếp
                  </Text>
                  <Text size="xs" c="dimmed">
                    Mỗi tình huống được thiết kế theo các bối cảnh sinh hoạt và công việc thực tế
                  </Text>
                </div>
                <Group gap="xs">
                  <Text size="xs" fw={500} c="dimmed">
                    Số từ SRS đưa vào:
                  </Text>
                  {[3, 5, 8].map((count) => (
                    <Button
                      key={count}
                      size="xs"
                      variant={targetCount === count ? 'filled' : 'subtle'}
                      color="teal"
                      onClick={() => setTargetCount(count)}
                    >
                      {count} từ
                    </Button>
                  ))}
                </Group>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {SCENARIOS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedPreset === item.preset;
                  return (
                    <Card
                      key={item.preset}
                      withBorder
                      p="md"
                      radius="md"
                      style={{
                        cursor: 'pointer',
                        borderColor: isSelected ? 'var(--mantine-color-teal-6)' : undefined,
                        backgroundColor: isSelected ? 'var(--mantine-color-teal-light)' : undefined,
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => setSelectedPreset(item.preset)}
                    >
                      <Group align="flex-start" wrap="nowrap">
                        <ThemeIcon color={item.color} size="xl" radius="md" variant="light">
                          <Icon size={24} stroke={1.5} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                          <Group justify="space-between">
                            <Text fw={600} size="sm">
                              {item.title}
                            </Text>
                            {isSelected && (
                              <Badge size="xs" color="teal" variant="filled">
                                Đang chọn
                              </Badge>
                            )}
                          </Group>
                          <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
                            {item.subtitle}
                          </Text>
                        </div>
                      </Group>
                    </Card>
                  );
                })}
              </SimpleGrid>

              {/* Custom Topic Input */}
              <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-gray-0)">
                <Group align="flex-end">
                  <TextInput
                    label="Hoặc tùy biến chủ đề của bạn"
                    placeholder="VD: Returning a product at an electronics store..."
                    value={customTopic}
                    onChange={(e) => {
                      setCustomTopic(e.currentTarget.value);
                      setSelectedPreset('custom');
                    }}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                  <Button
                    color="teal"
                    loading={isStarting}
                    leftSection={<IconSparkles size={16} />}
                    onClick={() => handleStartSession()}
                  >
                    Bắt đầu luyện tập
                  </Button>
                </Group>
              </Paper>
            </Stack>
          </Paper>

          {/* Value Proposition Highlights */}
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            <Paper withBorder p="md" radius="md">
              <ThemeIcon color="green" variant="light" size="lg" radius="md" mb="xs">
                <IconCheck size={20} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Không áp lực chấm điểm
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Không có thang điểm IELTS/TOEIC khắt khe. AI tập trung vào việc khích lệ bạn tự tin diễn đạt trôi chảy ý nghĩ.
              </Text>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <ThemeIcon color="teal" variant="light" size="lg" radius="md" mb="xs">
                <IconBulb size={20} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Kích hoạt từ vựng SRS
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Biến từ vựng thụ động đã lưu thành từ vựng chủ động bằng cách ứng dụng ngay vào ngữ cảnh giao tiếp đời thực.
              </Text>
            </Paper>

            <Paper withBorder p="md" radius="md">
              <ThemeIcon color="blue" variant="light" size="lg" radius="md" mb="xs">
                <IconMicrophone size={20} />
              </ThemeIcon>
              <Text fw={600} size="sm">
                Hỗ trợ Voice & Text song song
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Nói trực tiếp bằng giọng nói qua micro hoặc gõ bàn phím nếu đang ở nơi đông người mà không bị gián đoạn.
              </Text>
            </Paper>
          </SimpleGrid>
        </Stack>
      )}

      {/* ======================================================== */}
      {/* 2. ACTIVE CONVERSATION ROOM                              */}
      {/* ======================================================== */}
      {activeSessionId && (
        <Stack gap="md">
          {/* Top Session Bar */}
          <Paper withBorder p="sm" radius="md">
            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon color="teal" variant="light" radius="xl">
                  <IconMessageCircle2 size={18} />
                </ThemeIcon>
                <div>
                  <Text fw={600} size="sm">
                    {currentScenario}
                  </Text>
                  <Group gap="xs">
                    <Badge size="xs" color="gray" variant="light">
                      Thời lượng: {formatTimer(sessionDuration)}
                    </Badge>
                    <Badge
                      size="xs"
                      color={proficiencyLevel === 'a1_a2' ? 'green' : proficiencyLevel === 'b1_b2' ? 'blue' : 'indigo'}
                      variant="light"
                    >
                      {proficiencyLevel === 'a1_a2'
                        ? 'Level A1 - A2'
                        : proficiencyLevel === 'b1_b2'
                          ? 'Level B1 - B2'
                          : 'Level C1'}
                    </Badge>
                    <Badge size="xs" color="teal" variant="light">
                      Kích hoạt từ vựng: {usedWords.size}/{targetVocabulary.length} ({activationPercent}%)
                    </Badge>
                  </Group>
                </div>
              </Group>

              <Group gap="xs">
                <Tooltip label={audioEnabled ? 'Tắt đọc phát âm AI' : 'Bật đọc phát âm AI'}>
                  <ActionIcon
                    variant={audioEnabled ? 'light' : 'subtle'}
                    color={audioEnabled ? 'teal' : 'gray'}
                    onClick={() => setAudioEnabled(!audioEnabled)}
                  >
                    {audioEnabled ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
                  </ActionIcon>
                </Tooltip>

                <Button
                  color="red"
                  variant="light"
                  size="xs"
                  leftSection={<IconPlayerStop size={14} />}
                  onClick={handleEndSession}
                >
                  Kết thúc & Nhận góp ý
                </Button>
              </Group>
            </Group>
          </Paper>

          {/* Main Stage Grid: Left = Chat Stream, Right = Vocabulary Tracker */}
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            {/* Dialogue View (2 cols on desktop) */}
            <Paper
              withBorder
              p="md"
              radius="md"
              style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', height: '620px' }}
            >
              {/* Chat Scroll Area */}
              <ScrollArea style={{ flex: 1 }} viewportRef={chatScrollRef} pr="xs">
                <Stack gap="md">
                  {dialogue.map((turn, idx) => {
                    const isUser = turn.role === 'user';
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isUser ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Group gap="xs" mb={2}>
                          <Text size="xs" fw={600} c={isUser ? 'teal' : 'dimmed'}>
                            {isUser ? 'Bạn' : 'AI Partner'}
                          </Text>
                          {!isUser && (
                            <Group gap={4}>
                              <Tooltip label="Nghe phát âm">
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  color="gray"
                                  onClick={() => speakText(turn.text)}
                                >
                                  <IconVolume size={14} />
                                </ActionIcon>
                              </Tooltip>
                              {turn.vietnameseTranslation && (
                                <Tooltip label={revealedTranslations[idx] ? 'Ẩn bản dịch' : 'Dịch câu này sang tiếng Việt'}>
                                  <ActionIcon
                                    size="xs"
                                    variant={revealedTranslations[idx] ? 'filled' : 'subtle'}
                                    color={revealedTranslations[idx] ? 'teal' : 'gray'}
                                    onClick={() =>
                                      setRevealedTranslations((prev) => ({
                                        ...prev,
                                        [idx]: !prev[idx],
                                      }))
                                    }
                                  >
                                    <IconLanguage size={14} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </Group>
                          )}
                        </Group>

                        <Paper
                          p="sm"
                          radius="md"
                          style={{
                            maxWidth: '85%',
                            backgroundColor: isUser
                              ? 'var(--mantine-color-teal-6)'
                              : 'var(--mantine-color-gray-1)',
                            color: isUser ? '#fff' : 'inherit',
                            borderBottomRightRadius: isUser ? 2 : undefined,
                            borderBottomLeftRadius: !isUser ? 2 : undefined,
                          }}
                        >
                          <Text size="sm">{turn.text}</Text>
                        </Paper>

                        {/* Assistant Translation Box */}
                        {!isUser && turn.vietnameseTranslation && revealedTranslations[idx] && (
                          <Paper
                            p="xs"
                            mt={4}
                            radius="sm"
                            style={{
                              backgroundColor: 'var(--mantine-color-teal-0)',
                              maxWidth: '85%',
                              borderLeft: '3px solid var(--mantine-color-teal-6)',
                            }}
                          >
                            <Text size="xs" c="teal.9" fs="italic">
                              🇻🇳 {turn.vietnameseTranslation}
                            </Text>
                          </Paper>
                        )}

                        {/* User Detected Words Pills */}
                        {isUser && turn.detectedTargetWords && turn.detectedTargetWords.length > 0 && (
                          <Group gap={4} mt={4}>
                            {turn.detectedTargetWords.map((word) => (
                              <Badge key={word} size="xs" color="green" variant="filled">
                                ✓ Đã dùng: {word}
                              </Badge>
                            ))}
                          </Group>
                        )}

                        {/* Phrasing Feedback Recommendation */}
                        {isUser && turn.phrasingFeedback && (
                          <Alert
                            icon={<IconBulb size={14} />}
                            color="blue"
                            variant="light"
                            py="xs"
                            px="sm"
                            mt={4}
                            radius="sm"
                            style={{ maxWidth: '85%' }}
                          >
                            <Text size="xs" fw={500}>
                              {turn.phrasingFeedback}
                            </Text>
                          </Alert>
                        )}
                      </div>
                    );
                  })}

                  {/* AI Responding Indicator */}
                  {isAiResponding && (
                    <Group gap="xs" align="center">
                      <Loader size="xs" color="teal" />
                      <Text size="xs" c="dimmed">
                        AI đang phản hồi và lắng nghe...
                      </Text>
                    </Group>
                  )}
                </Stack>
              </ScrollArea>

              <Divider my="sm" />

              {/* Input Area */}
              <Stack gap="xs">
                {/* Quick Response Starters (Scaffolding for A1-A2) */}
                {quickReplies.length > 0 && (
                  <Paper p="xs" radius="sm" bg="var(--mantine-color-gray-0)" withBorder>
                    <Group gap="xs" align="center" wrap="wrap">
                      <Text size="xs" fw={600} c="teal.8">
                        💡 Gợi ý câu trả lời mẫu:
                      </Text>
                      {quickReplies.map((reply, i) => (
                        <Button
                          key={i}
                          size="compact-xs"
                          variant="light"
                          color="teal"
                          radius="xl"
                          onClick={() => setUserInput(reply)}
                        >
                          {reply}
                        </Button>
                      ))}
                    </Group>
                  </Paper>
                )}

                {isListening && (
                  <Group justify="center" gap="xs">
                    <Loader size="xs" color="red" />
                    <Text size="xs" c="red" fw={500}>
                      Đang thu âm... Nói tự nhiên vào microphone
                    </Text>
                  </Group>
                )}

                <Group gap="xs">
                  {speechSupported && (
                    <Tooltip label={isListening ? 'Dừng thu âm' : 'Nói qua Microphone (Web Speech)'}>
                      <ActionIcon
                        size="lg"
                        radius="md"
                        variant={isListening ? 'filled' : 'light'}
                        color={isListening ? 'red' : 'teal'}
                        onClick={toggleListening}
                        aria-label="Toggle voice recording"
                      >
                        {isListening ? (
                          <IconMicrophoneOff size={20} />
                        ) : (
                          <IconMicrophone size={20} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}

                  <TextInput
                    placeholder="Nói hoặc gõ câu trả lời của bạn..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendTurn();
                      }
                    }}
                    style={{ flex: 1 }}
                    disabled={isAiResponding}
                  />

                  <Button
                    color="teal"
                    onClick={handleSendTurn}
                    disabled={!userInput.trim() || isAiResponding}
                    leftSection={<IconSend size={16} />}
                  >
                    Gửi
                  </Button>
                </Group>
              </Stack>
            </Paper>

            {/* Target Vocabulary Tracker (Right sidebar) */}
            <Paper withBorder p="md" radius="md" style={{ height: '620px', display: 'flex', flexDirection: 'column' }}>
              <Group justify="space-between" mb="xs">
                <div>
                  <Text fw={600} size="sm">
                    Từ Vựng Mục Tiêu
                  </Text>
                  <Text size="xs" c="dimmed">
                    Lồng ghép vào câu nói của bạn
                  </Text>
                </div>
                <Badge color={activationPercent === 100 ? 'green' : 'teal'} variant="light">
                  {usedWords.size} / {targetVocabulary.length}
                </Badge>
              </Group>

              <Progress value={activationPercent} color="teal" size="sm" radius="xl" mb="md" />

              <ScrollArea style={{ flex: 1 }}>
                <Stack gap="xs">
                  {targetVocabulary.map((item) => {
                    const isActivated = usedWords.has(item.lemma.toLowerCase());
                    return (
                      <Paper
                        key={item.id}
                        withBorder
                        p="xs"
                        radius="md"
                        style={{
                          borderColor: isActivated ? 'var(--mantine-color-green-5)' : undefined,
                          backgroundColor: isActivated ? 'var(--mantine-color-green-0)' : undefined,
                        }}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <div>
                            <Group gap={6}>
                              <Text fw={600} size="sm" c={isActivated ? 'green.8' : undefined}>
                                {item.lemma}
                              </Text>
                              {isActivated ? (
                                <Badge size="xs" color="green" variant="filled">
                                  ✓ Đã dùng
                                </Badge>
                              ) : (
                                <Badge size="xs" color="gray" variant="light">
                                  Chờ dùng
                                </Badge>
                              )}
                            </Group>
                            <Text size="xs" c="dimmed" mt={2}>
                              {item.meaning}
                            </Text>
                          </div>
                          {!isActivated && (
                            <Tooltip label="Chèn từ này vào ô nhập">
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="teal"
                                onClick={() => setUserInput((prev) => (prev ? `${prev} ${item.lemma}` : item.lemma))}
                              >
                                <IconPlus size={14} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
              </ScrollArea>
            </Paper>
          </SimpleGrid>
        </Stack>
      )}

      {/* ======================================================== */}
      {/* 3. SESSION SUMMARY & NATURAL PHRASING MODAL              */}
      {/* ======================================================== */}
      <Modal
        opened={summaryOpened}
        onClose={closeSummary}
        title={<Text fw={600}>Tổng Kết Buổi Hội Thoại</Text>}
        size="lg"
        radius="md"
      >
        {sessionSummary && (
          <Stack gap="md">
            {/* Fluency Score Ring & Overview */}
            <Paper withBorder p="md" radius="md" bg="var(--mantine-color-teal-0)">
              <Group justify="space-between">
                <div>
                  <Badge color="teal" variant="filled" size="sm" mb={4}>
                    Điểm trôi chảy & phản xạ
                  </Badge>
                  <Title order={2} c="teal.8">
                    {sessionSummary.spokenMetrics.conversationFluencyScore} / 100
                  </Title>
                  <Text size="xs" c="dimmed">
                    Đánh giá trên độ tự tin, tính mạch lạc và khả năng duy trì dòng hội thoại
                  </Text>
                </div>
                <ThemeIcon color="teal" size={54} radius="xl" variant="light">
                  <IconSparkles size={32} />
                </ThemeIcon>
              </Group>
            </Paper>

            {/* Metrics Grid */}
            <SimpleGrid cols={3} spacing="xs">
              <Paper withBorder p="xs" radius="md" ta="center">
                <Text size="xs" c="dimmed">
                  Thời gian
                </Text>
                <Text fw={700} size="md">
                  {formatTimer(sessionSummary.durationSeconds)}
                </Text>
              </Paper>

              <Paper withBorder p="xs" radius="md" ta="center">
                <Text size="xs" c="dimmed">
                  Số từ đã nói
                </Text>
                <Text fw={700} size="md">
                  {sessionSummary.spokenMetrics.totalWordsSpoken} từ
                </Text>
              </Paper>

              <Paper withBorder p="xs" radius="md" ta="center">
                <Text size="xs" c="dimmed">
                  Tỷ lệ dùng từ SRS
                </Text>
                <Text fw={700} size="md" c="teal.7">
                  {sessionSummary.spokenMetrics.activationRate}%
                </Text>
              </Paper>
            </SimpleGrid>

            {/* AI Narrative Summary */}
            <div>
              <Text fw={600} size="sm" mb={2}>
                Đánh giá tổng quan:
              </Text>
              <Text size="sm" c="dimmed">
                {sessionSummary.dialogueSummary}
              </Text>
            </div>

            {/* Natural Phrasing Tips */}
            {sessionSummary.naturalPhrasingTips && sessionSummary.naturalPhrasingTips.length > 0 && (
              <div>
                <Text fw={600} size="sm" mb={6}>
                  Gợi ý cách diễn đạt tự nhiên hơn (Native Phrasing):
                </Text>
                <Stack gap="xs">
                  {sessionSummary.naturalPhrasingTips.map((tip, idx) => (
                    <Alert key={idx} icon={<IconBulb size={16} />} color="blue" variant="light" py="xs">
                      <Text size="xs">{tip}</Text>
                    </Alert>
                  ))}
                </Stack>
              </div>
            )}

            {/* Mastered Vocabulary */}
            {sessionSummary.vocabularyMastered && sessionSummary.vocabularyMastered.length > 0 && (
              <div>
                <Text fw={600} size="sm" mb={4}>
                  Từ vựng đã kích hoạt thành công:
                </Text>
                <Group gap={6}>
                  {sessionSummary.vocabularyMastered.map((w) => (
                    <Badge key={w} color="green" variant="filled">
                      ✓ {w}
                    </Badge>
                  ))}
                </Group>
              </div>
            )}

            <Button color="teal" fullWidth mt="sm" onClick={closeSummary}>
              Luyện tập tình huống khác
            </Button>
          </Stack>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* 4. HISTORY DRAWER                                        */}
      {/* ======================================================== */}
      <Drawer
        opened={historyOpened}
        onClose={closeHistory}
        title={<Text fw={600}>Lịch Sử Hội Thoại</Text>}
        position="right"
        size="md"
      >
        <Stack gap="sm">
          {loadingHistory && (
            <Group justify="center" py="xl">
              <Loader size="sm" color="teal" />
            </Group>
          )}

          {!loadingHistory && historyList.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              Chưa có phiên hội thoại nào được ghi lại.
            </Text>
          )}

          {!loadingHistory &&
            historyList.map((item) => (
              <Paper key={item.id} withBorder p="sm" radius="md">
                <Group justify="space-between" mb={4}>
                  <Text fw={600} size="sm" lineClamp={1}>
                    {item.topic}
                  </Text>
                  <Badge size="xs" color="teal">
                    {item.spokenMetrics?.conversationFluencyScore || 0} pts
                  </Badge>
                </Group>

                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    {new Date(item.createdAt).toLocaleDateString()} • {formatTimer(item.durationSeconds)} • {item.turnsCount} lượt đối đáp
                  </Text>
                  <ActionIcon
                    size="xs"
                    color="red"
                    variant="subtle"
                    onClick={async () => {
                      await voiceApi.deleteSession(item.id);
                      setHistoryList((prev) => prev.filter((s) => s.id !== item.id));
                    }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>

                {item.dialogueSummary && (
                  <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
                    {item.dialogueSummary}
                  </Text>
                )}
              </Paper>
            ))}
        </Stack>
      </Drawer>
    </Container>
  );
}
export default ConversationPage;
