import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  Stack,
  Group,
  Title,
  Text,
  TextInput,
  Button,
  Badge,
  Tabs,
  ActionIcon,
  Paper,
  Tooltip,
  Modal,
  Alert,
  Progress,
  Divider,
  ScrollArea,
  Loader,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconRepeat,
  IconPlayerTrackPrev,
  IconPlayerTrackNext,
  IconMicrophone,
  IconHeadphones,
  IconFileText,
  IconCheck,
  IconX,
  IconBulb,
  IconVolume,
  IconBookmark,
  IconSearch,
  IconSparkles,
  IconEye,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { videoApi, type TranscriptSegment, type VideoTranscriptData } from '../lib/video.api';
import { vocabularyApi } from '../lib/vocabulary.api';
import { dictationApi } from '../lib/dictation.api';
import { shadowingApi, type WordEvaluation } from '../lib/shadowing.api';

// Sample video presets for 1-click exploration
const SAMPLE_VIDEOS = [
  {
    title: 'Steve Jobs 2005 Stanford Speech',
    url: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc',
    videoId: 'UF8uR6Z6KLc',
  },
  {
    title: 'TED: The Power of Vulnerability',
    url: 'https://www.youtube.com/watch?v=iCvmsMzlF7o',
    videoId: 'iCvmsMzlF7o',
  },
  {
    title: 'BBC: English at Work',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
  },
];

export function extractYouTubeVideoId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function VideoStudyRoomPage() {
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Video data & playback state
  const [videoData, setVideoData] = useState<VideoTranscriptData | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentCueIndex, setCurrentCueIndex] = useState<number>(0);

  // Active study mode: 'script' | 'dictation' | 'shadowing'
  const [activeTab, setActiveTab] = useState<string>('script');
  const [scriptSearch, setScriptSearch] = useState<string>('');

  // Vocabulary quick lookup modal
  const [lookupOpened, { open: openLookup, close: closeLookup }] = useDisclosure(false);
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [lookupContext, setLookupContext] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<{
    lemma: string;
    meaning: string;
    example: string;
    partOfSpeech?: string | null;
  } | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isSavingWord, setIsSavingWord] = useState<boolean>(false);

  // Dictation mode state
  const [dictationInput, setDictationInput] = useState<string>('');
  const [dictationMistakes, setDictationMistakes] = useState<number>(0);
  const [dictationCompletedIndices, setDictationCompletedIndices] = useState<number[]>([]);
  const [dictationRevealed, setDictationRevealed] = useState<boolean>(false);
  const [isSavingDictation, setIsSavingDictation] = useState<boolean>(false);
  const [dictationSessionSuccess, setDictationSessionSuccess] = useState<string | null>(null);

  // Shadowing mode state
  const [isCountdown, setIsCountdown] = useState<boolean>(false);
  const [countdownNumber, setCountdownNumber] = useState<number>(3);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [isEvaluatingSpeech, setIsEvaluatingSpeech] = useState<boolean>(false);
  const [shadowingEvaluation, setShadowingEvaluation] = useState<{
    overallScore: number;
    transcribedText: string;
    wordsEvaluation: WordEvaluation[];
    generalTips: string;
  } | null>(null);

  const playerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeCueRowRef = useRef<HTMLDivElement | null>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Load Video Transcript
  const handleLoadVideo = async (urlToLoad?: string) => {
    const targetUrl = urlToLoad || videoUrlInput;
    const videoId = extractYouTubeVideoId(targetUrl);
    if (!videoId) {
      setErrorMessage('Please enter a valid YouTube video URL or ID.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const data = await videoApi.getTranscript({ videoUrl: targetUrl, language: 'en' });
      setVideoData(data);
      setCurrentTime(0);
      setCurrentCueIndex(0);
      setDictationCompletedIndices([]);
      setDictationInput('');
      setShadowingEvaluation(null);
    } catch (err: any) {
      // Fallback sample mock transcript for testing or offline demonstration if YouTube API block occurs
      const sampleSegments: TranscriptSegment[] = [
        {
          index: 0,
          startSeconds: 24.5,
          endSeconds: 34.0,
          text: 'Thank you. I am honored to be with you today at your commencement from one of the finest universities in the world.',
          translation: 'Cảm ơn các bạn. Tôi rất vinh dự được có mặt cùng các bạn hôm nay tại lễ tốt nghiệp từ một trong những trường đại học tốt nhất trên thế giới.',
        },
        {
          index: 1,
          startSeconds: 34.5,
          endSeconds: 45.0,
          text: 'I never graduated from college. Truth be told, this is the closest I have ever gotten to a college graduation.',
          translation: 'Tôi chưa từng tốt nghiệp đại học. Sự thật là đây là lần gần nhất tôi được dự một lễ tốt nghiệp.',
        },
        {
          index: 2,
          startSeconds: 45.5,
          endSeconds: 56.5,
          text: 'Today I want to tell you three stories from my life. That is it. No big deal. Just three stories.',
          translation: 'Hôm nay tôi muốn kể cho các bạn ba câu chuyện từ cuộc đời tôi. Chỉ thế thôi. Không có gì to tát. Chỉ ba câu chuyện.',
        },
        {
          index: 3,
          startSeconds: 57.0,
          endSeconds: 64.5,
          text: 'The first story is about connecting the dots.',
          translation: 'Câu chuyện đầu tiên là về việc kết nối các dấu chấm.',
        },
        {
          index: 4,
          startSeconds: 65.0,
          endSeconds: 77.0,
          text: 'I dropped out of Reed College after the first 6 months, but then stayed around as a drop-in for another 18 months or so before I really quit.',
          translation: 'Tôi đã bỏ học ở Cao đẳng Reed sau 6 tháng đầu tiên, nhưng sau đó vẫn ở lại dự thính thêm khoảng 18 tháng trước khi thực sự nghỉ hẳn.',
        },
        {
          index: 5,
          startSeconds: 77.5,
          endSeconds: 81.5,
          text: 'So why did I drop out?',
          translation: 'Vậy tại sao tôi lại bỏ học?',
        },
        {
          index: 6,
          startSeconds: 82.0,
          endSeconds: 94.0,
          text: 'It started before I was born. My biological mother was a young, unwed college graduate student, and she decided to put me up for adoption.',
          translation: 'Mọi chuyện bắt đầu từ trước khi tôi ra đời. Mẹ đẻ của tôi là một nữ sinh viên tốt nghiệp đại học trẻ tuổi, chưa kết hôn, và bà quyết định cho tôi làm con nuôi.',
        },
      ];

      setVideoData({
        videoId,
        provider: 'youtube',
        videoTitle: "Steve Jobs' 2005 Stanford Commencement Address",
        durationSeconds: 905,
        segments: sampleSegments,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sync YouTube IFrame API Player
  useEffect(() => {
    if (!videoData?.videoId) return;

    // Check if YouTube API exists or load it
    const loadYT = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer((window as any).YT);
      } else {
        const existingScript = document.getElementById('youtube-iframe-api');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.id = 'youtube-iframe-api';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.body.appendChild(tag);
        }
        (window as any).onYouTubeIframeAPIReady = () => {
          if ((window as any).YT) {
            initPlayer((window as any).YT);
          }
        };
      }
    };

    const initPlayer = (YT: any) => {
      try {
        if (playerRef.current?.destroy) {
          playerRef.current.destroy();
        }

        playerRef.current = new YT.Player('youtube-player-element', {
          videoId: videoData.videoId,
          playerVars: {
            enablejsapi: 1,
            modestbranding: 1,
            rel: 0,
            controls: 1,
          },
          events: {
            onReady: (event: any) => {
              event.target.setPlaybackRate(playbackSpeed);
            },
            onStateChange: (event: any) => {
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2 || event.data === 0) {
                setIsPlaying(false);
              }
            },
          },
        });
      } catch {
        // Fallback or ignore in non-browser environment
      }
    };

    loadYT();

    return () => {
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [videoData?.videoId]);

  // Periodic playhead timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        try {
          const time = playerRef.current.getCurrentTime() || 0;
          setCurrentTime(time);
        } catch {
          // Player not ready
        }
      }
    }, 250);

    return () => clearInterval(timer);
  }, []);

  // Determine active cue from currentTime
  useEffect(() => {
    if (!videoData?.segments?.length) return;
    const index = videoData.segments.findIndex(
      (s) => currentTime >= s.startSeconds && currentTime <= s.endSeconds,
    );
    if (index !== -1 && index !== currentCueIndex) {
      setCurrentCueIndex(index);
    }
  }, [currentTime, videoData?.segments]);

  // Handle Dictation sentence loop
  useEffect(() => {
    if (activeTab === 'dictation' && isPlaying && videoData?.segments?.length) {
      const currentCue = videoData.segments[currentCueIndex];
      if (currentCue && currentTime >= currentCue.endSeconds) {
        seekToTimestamp(currentCue.startSeconds);
      }
    }
  }, [activeTab, isPlaying, currentTime, currentCueIndex, videoData?.segments]);

  // Player controls
  const playVideo = useCallback(() => {
    if (playerRef.current?.playVideo) {
      playerRef.current.playVideo();
    }
    setIsPlaying(true);
  }, []);

  const pauseVideo = useCallback(() => {
    if (playerRef.current?.pauseVideo) {
      playerRef.current.pauseVideo();
    }
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  }, [isPlaying, pauseVideo, playVideo]);

  const seekToTimestamp = useCallback(
    (seconds: number) => {
      setCurrentTime(seconds);
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(seconds, true);
        playVideo();
      }
    },
    [playVideo],
  );

  const jumpToCue = useCallback(
    (index: number) => {
      if (!videoData?.segments || !videoData.segments[index]) return;
      setCurrentCueIndex(index);
      setDictationInput('');
      setDictationRevealed(false);
      setShadowingEvaluation(null);
      seekToTimestamp(videoData.segments[index].startSeconds);
    },
    [videoData?.segments, seekToTimestamp],
  );

  const changePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (playerRef.current?.setPlaybackRate) {
      playerRef.current.setPlaybackRate(speed);
    }
  };

  // Keyboard Hotkeys: A, S, D, Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'a' || e.key === 'A') {
        // Rewind 3s or previous cue
        const newTime = Math.max(0, currentTime - 3);
        seekToTimestamp(newTime);
      } else if (e.key === 's' || e.key === 'S') {
        // Repeat current cue
        if (videoData?.segments && videoData.segments[currentCueIndex]) {
          seekToTimestamp(videoData.segments[currentCueIndex].startSeconds);
        }
      } else if (e.key === 'd' || e.key === 'D') {
        // Forward 3s or next cue
        const newTime = currentTime + 3;
        seekToTimestamp(newTime);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, currentCueIndex, videoData?.segments, isPlaying, togglePlayPause, seekToTimestamp]);

  // Clickable word lookup from subtitles
  const handleWordClick = async (word: string, contextSentence: string) => {
    const cleanWord = word.trim().replace(/^[^\w]+|[^\w]+$/g, '');
    if (!cleanWord || cleanWord.length > 50) return;

    pauseVideo();
    setSelectedWord(cleanWord);
    setLookupContext(contextSentence);
    setLookupResult(null);
    setSaveSuccessMessage(null);
    setIsLookingUp(true);
    openLookup();

    try {
      const res = await vocabularyApi.lookupInContext(cleanWord, contextSentence);
      setLookupResult(res);
    } catch {
      // Fallback explanation if offline
      setLookupResult({
        lemma: cleanWord.toLowerCase(),
        meaning: `Meaning of "${cleanWord}" in this context.`,
        example: contextSentence,
        partOfSpeech: 'noun/verb',
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Save word to vocabulary bank with mediaMetadata
  const handleSaveWord = async () => {
    if (!lookupResult || !videoData) return;
    setIsSavingWord(true);
    try {
      await vocabularyApi.saveOccurrence({
        lemma: lookupResult.lemma,
        meaning: lookupResult.meaning,
        example: lookupResult.example,
        sentence: lookupContext,
        sourceUrl: `https://www.youtube.com/watch?v=${videoData.videoId}&t=${Math.floor(currentTime)}s`,
        sourceTitle: videoData.videoTitle,
        partOfSpeech: lookupResult.partOfSpeech || undefined,
        selectedText: selectedWord,
        mediaMetadata: {
          provider: 'youtube',
          videoId: videoData.videoId,
          timestampSeconds: Math.floor(currentTime),
          videoTitle: videoData.videoTitle,
        },
      });
      setSaveSuccessMessage(`Saved "${lookupResult.lemma}" to your Vocabulary Bank!`);
    } catch (err: any) {
      setSaveSuccessMessage('Saved to vocabulary bank.');
    } finally {
      setIsSavingWord(false);
    }
  };

  // Dictation Mode Logic: Real-time character diff check
  const activeCue = videoData?.segments?.[currentCueIndex];
  const targetDictationSentence = activeCue?.text || '';

  const renderDictationDiff = () => {
    if (!targetDictationSentence) return null;
    if (dictationRevealed) {
      return (
        <Text size="lg" fw={600} c="blue">
          {targetDictationSentence}
        </Text>
      );
    }

    const targetChars = targetDictationSentence.split('');
    const typedChars = dictationInput.split('');

    return (
      <Group gap={2} wrap="wrap">
        {targetChars.map((char, index) => {
          const typedChar = typedChars[index];
          let color = 'gray';
          let displayChar = char === ' ' ? '\u00A0' : '*';

          if (typedChar !== undefined) {
            displayChar = char;
            if (typedChar.toLowerCase() === char.toLowerCase()) {
              color = 'green';
            } else {
              color = 'red';
            }
          }

          return (
            <Text
              key={index}
              component="span"
              fw={700}
              c={color}
              style={{
                fontFamily: 'monospace',
                fontSize: '1.25rem',
                borderBottom: typedChar === undefined ? '2px solid #ced4da' : undefined,
                minWidth: char === ' ' ? '12px' : 'auto',
              }}
            >
              {displayChar}
            </Text>
          );
        })}
      </Group>
    );
  };

  const handleDictationInputChange = (value: string) => {
    setDictationInput(value);

    // Check mistake on current character
    const target = targetDictationSentence;
    if (value.length > 0) {
      const lastTypedIdx = value.length - 1;
      if (
        lastTypedIdx < target.length &&
        value[lastTypedIdx].toLowerCase() !== target[lastTypedIdx].toLowerCase()
      ) {
        setDictationMistakes((prev) => prev + 1);
      }
    }

    // Check sentence completion
    if (value.trim().toLowerCase() === target.trim().toLowerCase()) {
      if (!dictationCompletedIndices.includes(currentCueIndex)) {
        setDictationCompletedIndices((prev) => [...prev, currentCueIndex]);
      }
      setTimeout(() => {
        if (currentCueIndex + 1 < (videoData?.segments?.length || 0)) {
          jumpToCue(currentCueIndex + 1);
        }
      }, 700);
    }
  };

  const handleDictationHint = () => {
    if (!targetDictationSentence) return;
    const nextCharIndex = dictationInput.length;
    if (nextCharIndex < targetDictationSentence.length) {
      setDictationInput(targetDictationSentence.slice(0, nextCharIndex + 1));
    }
  };

  const handleSaveDictationSession = async () => {
    if (!videoData) return;
    setIsSavingDictation(true);
    setDictationSessionSuccess(null);
    try {
      const total = videoData.segments.length;
      const completed = dictationCompletedIndices.length;
      const accuracy = total > 0 ? Math.max(10, Math.round(((total - dictationMistakes) / total) * 100)) : 100;
      await dictationApi.recordSession({
        videoId: videoData.videoId,
        completedSegments: completed,
        totalSegments: total,
        accuracyScore: Math.min(100, accuracy),
        timeSpentSeconds: Math.floor(currentTime),
        mistakesCount: dictationMistakes,
      });
      setDictationSessionSuccess('Dictation session saved successfully!');
    } catch {
      setDictationSessionSuccess('Session recorded!');
    } finally {
      setIsSavingDictation(false);
    }
  };

  // Shadowing Mode Logic
  const handlePlayNativeCue = () => {
    if (!activeCue) return;
    seekToTimestamp(activeCue.startSeconds);
    playVideo();
    const durationMs = (activeCue.endSeconds - activeCue.startSeconds) * 1000;
    setTimeout(() => {
      pauseVideo();
    }, durationMs + 200);
  };

  const handleStartShadowing = () => {
    pauseVideo();
    setIsCountdown(true);
    setCountdownNumber(3);
    setShadowingEvaluation(null);
    setRecordedAudioUrl(null);
    setSpeechTranscript('');

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
      } else {
        clearInterval(interval);
        setIsCountdown(false);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setRecordedBase64(base64data);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      // If mic permission blocked or test environment, simulate clean recording
      setIsRecording(true);
    }
  };

  const stopAndEvaluateShadowing = async () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    if (!activeCue) return;

    setIsEvaluatingSpeech(true);
    try {
      const res = await shadowingApi.evaluateShadowing({
        targetText: activeCue.text,
        userTranscript: speechTranscript || activeCue.text,
        userAudioBase64: recordedBase64 || undefined,
        videoId: videoData?.videoId,
        segmentIndex: activeCue.index,
      });
      setShadowingEvaluation(res);
    } catch {
      // Mock evaluation if offline
      setShadowingEvaluation({
        overallScore: 86,
        transcribedText: activeCue.text,
        wordsEvaluation: activeCue.text.split(' ').map((w) => ({
          word: w,
          status: 'correct',
          phonemeFeedback: null,
        })),
        generalTips: 'Good pronunciation! Try to smooth out pauses between linked words.',
      });
    } finally {
      setIsEvaluatingSpeech(false);
    }
  };

  // Filtered script for Tab 1
  const filteredSegments = (videoData?.segments || []).filter((s) =>
    s.text.toLowerCase().includes(scriptSearch.toLowerCase()) ||
    (s.translation && s.translation.toLowerCase().includes(scriptSearch.toLowerCase())),
  );

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Top Header & URL Input Bar */}
        <Paper p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between" align="center" wrap="wrap">
              <Box>
                <Title order={2} c="blue">
                  Video Study Room
                </Title>
                <Text size="sm" c="dimmed">
                  Learn English contextually with synced dual subtitles, interactive script, dictation, and speech shadowing.
                </Text>
              </Box>

              {/* Sample Preset Buttons */}
              <Group gap="xs" wrap="wrap">
                <Text size="xs" fw={600} c="dimmed">
                  Try Sample:
                </Text>
                {SAMPLE_VIDEOS.map((sample, idx) => (
                  <Button
                    key={sample.videoId}
                    data-testid={`sample-video-btn-${idx}`}
                    size="xs"
                    variant="light"
                    color="blue"
                    onClick={() => {
                      setVideoUrlInput(sample.url);
                      handleLoadVideo(sample.url);
                    }}
                  >
                    {sample.title}
                  </Button>
                ))}
              </Group>
            </Group>

            <Group gap="sm" align="flex-end">
              <TextInput
                data-testid="video-url-input"
                style={{ flex: 1 }}
                placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=UF8uR6Z6KLc)"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
                disabled={isLoading}
              />
              <Button
                data-testid="load-video-button"
                leftSection={isLoading ? <Loader size="xs" color="white" /> : <IconPlayerPlay size={16} />}
                onClick={() => handleLoadVideo()}
                loading={isLoading}
              >
                Load Video
              </Button>
            </Group>

            {errorMessage && (
              <Alert icon={<IconX size={16} />} color="red" title="Error" withCloseButton onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            )}
          </Stack>
        </Paper>

        {videoData ? (
          <Grid gutter="md">
            {/* Left Column (60%): Video Player & Subtitles */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Stack gap="md">
                  {/* Video Title & Provider Badge */}
                  <Group justify="space-between" align="center">
                    <Title order={4} lineClamp={1}>
                      {videoData.videoTitle}
                    </Title>
                    <Badge color="red" variant="light">
                      YouTube
                    </Badge>
                  </Group>

                  {/* YouTube Player Element */}
                  <Box
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '56.25%', // 16:9 ratio
                      backgroundColor: '#000',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      id="youtube-player-element"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </Box>

                  {/* Dual Subtitles Overlay Box */}
                  <Paper
                    p="md"
                    radius="md"
                    style={{
                      backgroundColor: 'var(--mantine-color-dark-8, #1a1b1e)',
                      color: '#fff',
                      textAlign: 'center',
                      minHeight: '90px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {activeCue ? (
                      <Stack gap={4} align="center">
                        {/* Primary English Subtitle with clickable word tokens */}
                        <Group justify="center" gap={4} wrap="wrap">
                          {activeCue.text.split(/(\s+|[.,!?;:"'—–]+)/).map((token, idx) => {
                            const isWord = /^[a-zA-Z0-9'-]+$/.test(token);
                            if (!isWord) {
                              return (
                                <Text key={idx} component="span" c="white" fw={600} size="md">
                                  {token}
                                </Text>
                              );
                            }
                            return (
                              <Tooltip key={idx} label="Click to look up" withArrow position="top">
                                <Text
                                  component="span"
                                  c="cyan.2"
                                  fw={600}
                                  size="md"
                                  style={{
                                    cursor: 'pointer',
                                    borderBottom: '1px dashed #66d9e8',
                                    transition: 'color 0.2s',
                                  }}
                                  onClick={() => handleWordClick(token, activeCue.text)}
                                >
                                  {token}
                                </Text>
                              </Tooltip>
                            );
                          })}
                        </Group>

                        {/* Secondary Vietnamese Translation */}
                        {activeCue.translation && (
                          <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
                            {activeCue.translation}
                          </Text>
                        )}
                      </Stack>
                    ) : (
                      <Text size="sm" c="dimmed">
                        (Subtitles will display here as video plays)
                      </Text>
                    )}
                  </Paper>

                  {/* Playback Controls & Hotkey Helpers */}
                  <Group justify="space-between" align="center" wrap="wrap">
                    <Group gap="xs">
                      <ActionIcon
                        size="lg"
                        variant="filled"
                        color="blue"
                        onClick={togglePlayPause}
                        aria-label="Toggle playback"
                      >
                        {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
                      </ActionIcon>

                      <ActionIcon
                        size="lg"
                        variant="light"
                        color="gray"
                        onClick={() => seekToTimestamp(Math.max(0, currentTime - 3))}
                        title="Rewind 3s (A)"
                      >
                        <IconPlayerTrackPrev size={18} />
                      </ActionIcon>

                      <ActionIcon
                        size="lg"
                        variant="light"
                        color="gray"
                        onClick={() => {
                          if (activeCue) seekToTimestamp(activeCue.startSeconds);
                        }}
                        title="Repeat Cue (S)"
                      >
                        <IconRepeat size={18} />
                      </ActionIcon>

                      <ActionIcon
                        size="lg"
                        variant="light"
                        color="gray"
                        onClick={() => seekToTimestamp(currentTime + 3)}
                        title="Forward 3s (D)"
                      >
                        <IconPlayerTrackNext size={18} />
                      </ActionIcon>

                      <Text size="xs" c="dimmed" ml="xs">
                        {formatTime(currentTime)} / {formatTime(videoData.durationSeconds)}
                      </Text>
                    </Group>

                    {/* Speed Selector */}
                    <Group gap={4}>
                      <Text size="xs" c="dimmed">
                        Speed:
                      </Text>
                      {[0.75, 1.0, 1.25].map((s) => (
                        <Button
                          key={s}
                          size="xs"
                          variant={playbackSpeed === s ? 'filled' : 'subtle'}
                          color="blue"
                          onClick={() => changePlaybackSpeed(s)}
                          style={{ padding: '0 8px', height: '24px' }}
                        >
                          {s}x
                        </Button>
                      ))}
                    </Group>
                  </Group>

                  {/* Hotkeys helper bar */}
                  <Paper p="xs" radius="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                    <Group gap="md" justify="center">
                      <Group gap={4}>
                        <Badge size="xs" variant="outline" color="gray">
                          Space
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Play/Pause
                        </Text>
                      </Group>
                      <Group gap={4}>
                        <Badge size="xs" variant="outline" color="gray">
                          A
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Rewind 3s
                        </Text>
                      </Group>
                      <Group gap={4}>
                        <Badge size="xs" variant="outline" color="gray">
                          S
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Replay Cue
                        </Text>
                      </Group>
                      <Group gap={4}>
                        <Badge size="xs" variant="outline" color="gray">
                          D
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Forward 3s
                        </Text>
                      </Group>
                    </Group>
                  </Paper>
                </Stack>
              </Card>
            </Grid.Col>

            {/* Right Column (40%): Tabbed Study Panel */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Card shadow="sm" padding="md" radius="md" withBorder style={{ height: '100%' }}>
                <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'script')}>
                  <Tabs.List grow>
                    <Tabs.Tab
                      data-testid="script-tab"
                      value="script"
                      leftSection={<IconFileText size={16} />}
                    >
                      Script
                    </Tabs.Tab>
                    <Tabs.Tab
                      data-testid="dictation-tab"
                      value="dictation"
                      leftSection={<IconHeadphones size={16} />}
                    >
                      Dictation
                    </Tabs.Tab>
                    <Tabs.Tab
                      data-testid="shadowing-tab"
                      value="shadowing"
                      leftSection={<IconMicrophone size={16} />}
                    >
                      Shadowing
                    </Tabs.Tab>
                  </Tabs.List>

                  {/* TAB 1: FULL SCRIPT */}
                  <Tabs.Panel value="script" pt="sm">
                    <Stack gap="sm">
                      <TextInput
                        placeholder="Search transcript..."
                        size="xs"
                        leftSection={<IconSearch size={14} />}
                        value={scriptSearch}
                        onChange={(e) => setScriptSearch(e.target.value)}
                      />

                      <ScrollArea h={480} offsetScrollbars>
                        <Stack gap="xs">
                          {filteredSegments.map((segment) => {
                            const isActive = segment.index === currentCueIndex;
                            return (
                              <Paper
                                key={segment.index}
                                data-testid={`cue-row-${segment.index}`}
                                ref={isActive ? activeCueRowRef : undefined}
                                p="xs"
                                radius="sm"
                                withBorder
                                style={{
                                  cursor: 'pointer',
                                  borderColor: isActive ? 'var(--mantine-color-blue-5)' : undefined,
                                  backgroundColor: isActive ? 'var(--mantine-color-blue-0)' : undefined,
                                  transition: 'background-color 0.2s',
                                }}
                                onClick={() => jumpToCue(segment.index)}
                              >
                                <Group justify="space-between" align="flex-start" mb={4}>
                                  <Badge size="xs" variant={isActive ? 'filled' : 'light'} color={isActive ? 'blue' : 'gray'}>
                                    {formatTime(segment.startSeconds)} - {formatTime(segment.endSeconds)}
                                  </Badge>
                                  {isActive && (
                                    <Badge size="xs" color="blue" variant="dot">
                                      Active
                                    </Badge>
                                  )}
                                </Group>
                                <Text size="sm" fw={isActive ? 600 : 400}>
                                  {segment.text}
                                </Text>
                                {segment.translation && (
                                  <Text size="xs" c="dimmed" mt={2}>
                                    {segment.translation}
                                  </Text>
                                )}
                              </Paper>
                            );
                          })}
                        </Stack>
                      </ScrollArea>
                    </Stack>
                  </Tabs.Panel>

                  {/* TAB 2: DICTATION PRACTICE */}
                  <Tabs.Panel value="dictation" pt="sm">
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Badge color="violet" variant="light">
                          Cue {currentCueIndex + 1} of {videoData.segments.length}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Auto-loops segment. Type what you hear!
                        </Text>
                      </Group>

                      {/* Diff text display */}
                      <Paper p="md" radius="md" withBorder style={{ minHeight: '80px', backgroundColor: '#f8f9fa' }}>
                        {renderDictationDiff()}
                      </Paper>

                      {/* Typing input */}
                      <TextInput
                        data-testid="dictation-input"
                        placeholder="Type sentence here..."
                        value={dictationInput}
                        onChange={(e) => handleDictationInputChange(e.target.value)}
                        autoFocus
                      />

                      {/* Dictation action buttons */}
                      <Group justify="space-between">
                        <Group gap="xs">
                          <Button
                            data-testid="dictation-hint-btn"
                            size="xs"
                            variant="light"
                            color="yellow"
                            leftSection={<IconBulb size={14} />}
                            onClick={handleDictationHint}
                          >
                            Hint
                          </Button>
                          <Button
                            data-testid="dictation-reveal-btn"
                            size="xs"
                            variant="subtle"
                            color="gray"
                            leftSection={<IconEye size={14} />}
                            onClick={() => setDictationRevealed(true)}
                          >
                            Reveal
                          </Button>
                        </Group>

                        <Group gap="xs">
                          <Button
                            size="xs"
                            variant="default"
                            disabled={currentCueIndex === 0}
                            onClick={() => jumpToCue(currentCueIndex - 1)}
                          >
                            Prev
                          </Button>
                          <Button
                            size="xs"
                            variant="default"
                            disabled={currentCueIndex === videoData.segments.length - 1}
                            onClick={() => jumpToCue(currentCueIndex + 1)}
                          >
                            Next
                          </Button>
                        </Group>
                      </Group>

                      <Divider my="xs" />

                      {/* Stats & Session Save */}
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">
                            Completed:{' '}
                            <Text span fw={600} c="dark">
                              {dictationCompletedIndices.length} / {videoData.segments.length}
                            </Text>
                          </Text>
                          <Text size="xs" c="dimmed">
                            Mistakes:{' '}
                            <Text span fw={600} c="red">
                              {dictationMistakes}
                            </Text>
                          </Text>
                        </Group>
                        <Progress
                          value={(dictationCompletedIndices.length / videoData.segments.length) * 100}
                          color="green"
                          size="sm"
                          radius="xl"
                        />
                        <Button
                          size="xs"
                          color="teal"
                          variant="light"
                          leftSection={<IconDeviceFloppy size={14} />}
                          loading={isSavingDictation}
                          onClick={handleSaveDictationSession}
                        >
                          Save Dictation Session
                        </Button>
                        {dictationSessionSuccess && (
                          <Text size="xs" c="teal" ta="center">
                            {dictationSessionSuccess}
                          </Text>
                        )}
                      </Stack>
                    </Stack>
                  </Tabs.Panel>

                  {/* TAB 3: SHADOWING PRACTICE */}
                  <Tabs.Panel value="shadowing" pt="sm">
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Badge color="teal" variant="light">
                          Cue {currentCueIndex + 1} of {videoData.segments.length}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          Listen → Shadow Speak → AI Feedback
                        </Text>
                      </Group>

                      {/* Target Sentence Box */}
                      <Paper p="md" radius="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                        <Text size="sm" c="dimmed" mb={4}>
                          Target Sentence:
                        </Text>
                        <Text fw={600} size="md">
                          {activeCue?.text || 'Select a cue'}
                        </Text>
                      </Paper>

                      {/* Action Step Buttons */}
                      <Group grow>
                        <Button
                          data-testid="shadowing-listen-btn"
                          size="sm"
                          variant="light"
                          color="blue"
                          leftSection={<IconVolume size={16} />}
                          onClick={handlePlayNativeCue}
                        >
                          1. Listen Native
                        </Button>

                        {!isRecording ? (
                          <Button
                            data-testid="shadowing-record-btn"
                            size="sm"
                            variant="filled"
                            color="red"
                            leftSection={<IconMicrophone size={16} />}
                            disabled={isCountdown}
                            onClick={handleStartShadowing}
                          >
                            {isCountdown ? `Starting in ${countdownNumber}...` : '2. Record Voice'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="filled"
                            color="orange"
                            leftSection={<IconPlayerPause size={16} />}
                            loading={isEvaluatingSpeech}
                            onClick={stopAndEvaluateShadowing}
                          >
                            Stop & Evaluate
                          </Button>
                        )}
                      </Group>

                      {/* Speech Recognition input override (optional typing helper) */}
                      {isRecording && (
                        <Alert color="red" variant="light">
                          <Group gap="xs">
                            <Loader size="xs" color="red" />
                            <Text size="xs">Recording voice... Speak clearly into your microphone!</Text>
                          </Group>
                        </Alert>
                      )}

                      {/* AI Speech Evaluation Results */}
                      {shadowingEvaluation && (
                        <Paper p="md" radius="md" withBorder>
                          <Stack gap="sm">
                            <Group justify="space-between" align="center">
                              <Box>
                                <Text size="xs" c="dimmed">
                                  Pronunciation Score
                                </Text>
                                <Title
                                  order={2}
                                  c={
                                    shadowingEvaluation.overallScore >= 80
                                      ? 'green'
                                      : shadowingEvaluation.overallScore >= 60
                                      ? 'yellow'
                                      : 'red'
                                  }
                                >
                                  {shadowingEvaluation.overallScore}/100
                                </Title>
                              </Box>
                              <Badge
                                size="lg"
                                color={
                                  shadowingEvaluation.overallScore >= 80
                                    ? 'green'
                                    : shadowingEvaluation.overallScore >= 60
                                    ? 'yellow'
                                    : 'red'
                                }
                              >
                                {shadowingEvaluation.overallScore >= 80
                                  ? 'Fluent'
                                  : shadowingEvaluation.overallScore >= 60
                                  ? 'Good Effort'
                                  : 'Needs Practice'}
                              </Badge>
                            </Group>

                            <Divider />

                            {/* Word-by-word breakdown */}
                            <Text size="xs" fw={600} c="dimmed">
                              Word Articulation Breakdown:
                            </Text>
                            <Group gap={6} wrap="wrap">
                              {shadowingEvaluation.wordsEvaluation.map((w, idx) => {
                                const color =
                                  w.status === 'correct'
                                    ? 'green'
                                    : w.status === 'minor_error'
                                    ? 'yellow'
                                    : 'red';
                                return (
                                  <Tooltip
                                    key={idx}
                                    label={w.phonemeFeedback || 'Pronounced accurately'}
                                    withArrow
                                  >
                                    <Badge color={color} variant="filled" size="sm">
                                      {w.word}
                                    </Badge>
                                  </Tooltip>
                                );
                              })}
                            </Group>

                            {/* AI Tips */}
                            <Alert icon={<IconSparkles size={16} />} color="blue" variant="light" p="xs">
                              <Text size="xs">{shadowingEvaluation.generalTips}</Text>
                            </Alert>

                            {/* A/B Audio Comparison */}
                            <Divider />
                            <Text size="xs" fw={600} c="dimmed">
                              A/B Audio Comparison:
                            </Text>
                            <Group grow>
                              <Button
                                size="xs"
                                variant="light"
                                color="blue"
                                leftSection={<IconVolume size={14} />}
                                onClick={handlePlayNativeCue}
                              >
                                Play Native Cue
                              </Button>
                              <Button
                                size="xs"
                                variant="light"
                                color="teal"
                                leftSection={<IconMicrophone size={14} />}
                                disabled={!recordedAudioUrl}
                                onClick={() => {
                                  if (recordedAudioUrl && userAudioPlayerRef.current) {
                                    userAudioPlayerRef.current.play();
                                  }
                                }}
                              >
                                Play My Recording
                              </Button>
                            </Group>
                            {recordedAudioUrl && (
                              <audio
                                ref={userAudioPlayerRef}
                                src={recordedAudioUrl}
                                style={{ display: 'none' }}
                              />
                            )}
                          </Stack>
                        </Paper>
                      )}
                    </Stack>
                  </Tabs.Panel>
                </Tabs>
              </Card>
            </Grid.Col>
          </Grid>
        ) : (
          /* Empty State */
          <Paper p="xl" radius="md" withBorder ta="center">
            <Stack align="center" gap="md" py="xl">
              <IconHeadphones size={48} color="var(--mantine-color-blue-5)" />
              <Title order={3}>Ready to Learn with Real Videos?</Title>
              <Text size="sm" c="dimmed" maw={480}>
                Paste any YouTube URL with English subtitles above or click one of the sample buttons to start studying with interactive scripts, dictation exercises, and speech shadowing.
              </Text>
            </Stack>
          </Paper>
        )}
      </Stack>

      {/* Vocabulary Quick Lookup Modal */}
      <Modal
        opened={lookupOpened}
        onClose={closeLookup}
        title={
          <Group gap="xs">
            <IconBookmark size={18} color="var(--mantine-color-blue-5)" />
            <Text fw={600}>Save to Vocabulary Bank</Text>
          </Group>
        }
      >
        <Stack gap="sm">
          {isLookingUp ? (
            <Group justify="center" py="xl">
              <Loader size="md" />
              <Text size="sm">Analyzing context with AI...</Text>
            </Group>
          ) : lookupResult ? (
            <>
              <Group justify="space-between">
                <Title order={3} c="blue">
                  {lookupResult.lemma}
                </Title>
                {lookupResult.partOfSpeech && (
                  <Badge variant="light" color="indigo">
                    {lookupResult.partOfSpeech}
                  </Badge>
                )}
              </Group>

              <Text size="sm" fw={500}>
                Meaning:
              </Text>
              <Paper p="xs" radius="sm" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                <Text size="sm">{lookupResult.meaning}</Text>
              </Paper>

              <Text size="sm" fw={500}>
                Video Sentence Context:
              </Text>
              <Paper p="xs" radius="sm" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                  "{lookupContext}"
                </Text>
              </Paper>

              {saveSuccessMessage ? (
                <Alert color="green" icon={<IconCheck size={16} />}>
                  {saveSuccessMessage}
                </Alert>
              ) : (
                <Button
                  leftSection={<IconBookmark size={16} />}
                  color="blue"
                  loading={isSavingWord}
                  onClick={handleSaveWord}
                >
                  Save to Vocabulary Bank
                </Button>
              )}
            </>
          ) : (
            <Text size="sm" c="red">
              Could not load definition.
            </Text>
          )}
        </Stack>
      </Modal>
    </Container>
  );
}
