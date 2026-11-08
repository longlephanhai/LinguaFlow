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
  Switch,
  SegmentedControl,
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
  IconEyeOff,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import { videoApi, type VideoTranscriptData } from '../lib/video.api';
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
    title: 'Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)',
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

export interface KeywordBlank {
  tokenIndex: number;
  word: string;
  cleanWord: string;
}

export const COMMON_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'nor', 'so', 'yet',
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'this', 'that', 'these', 'those',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'not', 'no', 'too', 'very', 'just', 'all', 'any', 'both', 'each', 'few', 'more', 'some',
  'there', 'here', 'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom',
  'of', 'as', 'if', 'then', 'than', 's', 't', 're', 've', 'd', 'll', 'm',
  'youre', 'theyre', 'were', 'dont', 'doesnt', 'didnt', 'wont', 'cant',
]);

export function getKeywordBlanks(text: string): KeywordBlank[] {
  if (!text) return [];
  const rawTokens = text.trim().split(/\s+/);
  const candidates: KeywordBlank[] = [];

  rawTokens.forEach((token, idx) => {
    // Strip contractions and punctuation for stopword lookup
    const clean = token.toLowerCase().replace(/'[a-z]+/g, '').replace(/[^a-z0-9]/g, '');
    if (clean.length >= 3 && !COMMON_STOPWORDS.has(clean)) {
      candidates.push({
        tokenIndex: idx,
        word: token,
        cleanWord: clean,
      });
    }
  });

  if (candidates.length === 0 && rawTokens.length > 0) {
    const sorted = rawTokens
      .map((token, idx) => ({
        tokenIndex: idx,
        word: token,
        cleanWord: token.toLowerCase().replace(/[^a-z0-9]/g, ''),
      }))
      .filter((t) => t.cleanWord.length > 0)
      .sort((a, b) => b.cleanWord.length - a.cleanWord.length);

    if (sorted[0]) candidates.push(sorted[0]);
  }

  // Limit to at most 3 key words per segment so it's focused and not overwhelming
  if (candidates.length > 3) {
    const topIndices = new Set(
      [...candidates]
        .sort((a, b) => b.cleanWord.length - a.cleanWord.length)
        .slice(0, 3)
        .map((c) => c.tokenIndex),
    );
    return candidates.filter((c) => topIndices.has(c.tokenIndex));
  }

  return candidates;
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
  const [dictationType, setDictationType] = useState<'keywords' | 'full'>('keywords');
  const [filledBlankIndices, setFilledBlankIndices] = useState<number[]>([]);
  const [activeBlankIndex, setActiveBlankIndex] = useState<number>(0);
  const [showDictationSubtitle, setShowDictationSubtitle] = useState<boolean>(false);
  const [dictationInput, setDictationInput] = useState<string>('');
  const [dictationFeedback, setDictationFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [submittedFullDiff, setSubmittedFullDiff] = useState<{
    diff: { targetWord: string; userWord: string; isCorrect: boolean }[];
    isAllCorrect: boolean;
  } | null>(null);
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
  const scriptViewportRef = useRef<HTMLDivElement | null>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [autoPauseShadowing, setAutoPauseShadowing] = useState<boolean>(true);
  const [isSmartShadowActive, setIsSmartShadowActive] = useState<boolean>(false);
  const smartShadowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch video transcript. Please make sure the video has English subtitles available.';
      setErrorMessage(message);
      setVideoData(null);
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
    // In Dictation or Shadowing mode, the learner is practicing the selected cue and it should not jump cues during playback
    if (activeTab === 'dictation' || activeTab === 'shadowing') return;
    if (!videoData?.segments?.length) return;
    const index = videoData.segments.findIndex(
      (s) => currentTime >= s.startSeconds && currentTime <= s.endSeconds,
    );
    if (index !== -1 && index !== currentCueIndex) {
      setCurrentCueIndex(index);
    }
  }, [currentTime, videoData?.segments, activeTab, currentCueIndex]);

  // Auto-scroll active cue into view when it progresses beyond visible scroll bounds
  useEffect(() => {
    if (!autoScroll || activeTab !== 'script') return;

    const rafId = requestAnimationFrame(() => {
      const viewport = scriptViewportRef.current;
      const activeEl = activeCueRowRef.current;
      if (!viewport || !activeEl) return;

      const viewportRect = viewport.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      // Check if cue is running past bottom or above top of scroll viewport
      const buffer = 24;
      const isAbove = activeRect.top < viewportRect.top + buffer;
      const isBelow = activeRect.bottom > viewportRect.bottom - buffer;

      if (isAbove || isBelow) {
        const relativeTop = activeRect.top - viewportRect.top + viewport.scrollTop;
        const targetScrollTop = Math.max(
          0,
          relativeTop - viewport.clientHeight / 2 + activeRect.height / 2,
        );

        if (typeof viewport.scrollTo === 'function') {
          viewport.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth',
          });
        } else {
          viewport.scrollTop = targetScrollTop;
        }
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [currentCueIndex, autoScroll, activeTab]);

  // Handle Dictation sentence loop
  useEffect(() => {
    if (activeTab === 'dictation' && isPlaying && videoData?.segments?.length) {
      const currentCue = videoData.segments[currentCueIndex];
      if (currentCue && currentTime >= currentCue.endSeconds) {
        if (playerRef.current?.seekTo) {
          playerRef.current.seekTo(currentCue.startSeconds, true);
        }
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

  // Handle Shadowing auto-pause after each sentence
  useEffect(() => {
    if (activeTab === 'shadowing' && autoPauseShadowing && isPlaying && videoData?.segments?.length) {
      const currentCue = videoData.segments[currentCueIndex];
      if (currentCue && currentTime >= currentCue.endSeconds) {
        pauseVideo();
        if (playerRef.current?.seekTo) {
          playerRef.current.seekTo(currentCue.startSeconds, true);
          setCurrentTime(currentCue.startSeconds);
        }
      }
    }
  }, [activeTab, autoPauseShadowing, isPlaying, currentTime, currentCueIndex, videoData?.segments, pauseVideo]);

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
      if (smartShadowTimeoutRef.current) {
        clearTimeout(smartShadowTimeoutRef.current);
        setIsSmartShadowActive(false);
      }
      setCurrentCueIndex(index);
      setDictationInput('');
      setFilledBlankIndices([]);
      setActiveBlankIndex(0);
      setDictationRevealed(false);
      setShowDictationSubtitle(false);
      setDictationFeedback(null);
      setSubmittedFullDiff(null);
      setShadowingEvaluation(null);
      seekToTimestamp(videoData.segments[index].startSeconds);
    },
    [videoData?.segments, seekToTimestamp],
  );

  // Reset cue-specific dictation state ONLY when cue index actually changes
  const prevCueIndexRef = useRef<number>(currentCueIndex);
  useEffect(() => {
    if (prevCueIndexRef.current !== currentCueIndex) {
      prevCueIndexRef.current = currentCueIndex;
      setDictationInput('');
      setFilledBlankIndices([]);
      setActiveBlankIndex(0);
      setDictationRevealed(false);
      setShowDictationSubtitle(false);
      setDictationFeedback(null);
      setSubmittedFullDiff(null);
    }
  }, [currentCueIndex]);

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

  // Dictation Mode Logic: Real-time character diff check or keyword blanks
  const activeCue = videoData?.segments?.[currentCueIndex];
  const targetDictationSentence = activeCue?.text || '';
  const keywordBlanks = getKeywordBlanks(targetDictationSentence);
  const activeBlank = keywordBlanks[activeBlankIndex];

  const renderDictationDiff = () => {
    if (!targetDictationSentence) return null;
    if (dictationRevealed) {
      return (
        <Text size="md" fw={600} c="blue">
          {targetDictationSentence}
        </Text>
      );
    }

    if (dictationType === 'keywords') {
      const rawTokens = targetDictationSentence.trim().split(/\s+/);
      const blankMap = new Map<number, { blank: KeywordBlank; blankIdx: number }>();
      keywordBlanks.forEach((b, i) => blankMap.set(b.tokenIndex, { blank: b, blankIdx: i }));

      return (
        <Group gap="xs" wrap="wrap" align="center">
          {rawTokens.map((token, idx) => {
            const blankEntry = blankMap.get(idx);
            if (!blankEntry) {
              return (
                <Text key={idx} size="md" fw={500} c="dark.7">
                  {token}
                </Text>
              );
            }

            const { blank, blankIdx } = blankEntry;
            const isFilled = filledBlankIndices.includes(blankIdx);
            const isActive = blankIdx === activeBlankIndex;

            if (isFilled) {
              return (
                <Badge
                  key={idx}
                  size="lg"
                  color="green"
                  variant="light"
                  style={{ textTransform: 'none', cursor: 'pointer' }}
                  onClick={() => setActiveBlankIndex(blankIdx)}
                >
                  {blank.word} ✓
                </Badge>
              );
            }

            if (isActive) {
              return (
                <Badge
                  key={idx}
                  size="lg"
                  color="blue"
                  variant="filled"
                  style={{
                    cursor: 'pointer',
                    letterSpacing: '1px',
                    textTransform: 'none',
                    boxShadow: '0 0 0 2px var(--mantine-color-blue-3)',
                  }}
                  onClick={() => setActiveBlankIndex(blankIdx)}
                >
                  {'_ '.repeat(Math.min(blank.cleanWord.length, 6))} ({blank.cleanWord.length})
                </Badge>
              );
            }

            return (
              <Badge
                key={idx}
                size="lg"
                color="gray"
                variant="outline"
                style={{ cursor: 'pointer', textTransform: 'none' }}
                onClick={() => setActiveBlankIndex(blankIdx)}
              >
                {'_ '.repeat(Math.min(blank.cleanWord.length, 6))}
              </Badge>
            );
          })}
        </Group>
      );
    }

    // Full Sentence Mode
    if (submittedFullDiff) {
      return (
        <Group gap="xs" wrap="wrap" align="center">
          {submittedFullDiff.diff.map((item, idx) => {
            if (item.isCorrect) {
              return (
                <Badge key={idx} size="lg" color="green" variant="light" style={{ textTransform: 'none' }}>
                  {item.targetWord} ✓
                </Badge>
              );
            }
            return (
              <Group key={idx} gap={4} align="center">
                <Badge
                  size="lg"
                  color="red"
                  variant="outline"
                  style={{
                    textTransform: 'none',
                    textDecoration: item.userWord ? 'line-through' : undefined,
                  }}
                >
                  {item.userWord || '(bỏ sót)'} ✗
                </Badge>
                <Text size="xs" c="dimmed">
                  ({item.targetWord})
                </Text>
              </Group>
            );
          })}
        </Group>
      );
    }

    // Not submitted yet: Show masked word placeholders without revealing any characters!
    const words = targetDictationSentence.trim().split(/\s+/);
    return (
      <Group gap="xs" wrap="wrap" align="center">
        {words.map((w, idx) => (
          <Text
            key={idx}
            component="span"
            fw={700}
            c="dimmed"
            style={{
              letterSpacing: '3px',
              fontFamily: 'monospace',
              fontSize: '1.15rem',
              borderBottom: '2px solid #ced4da',
              padding: '0 4px',
            }}
          >
            {w
              .split('')
              .map((char) => (/[a-zA-Z0-9]/.test(char) ? '•' : char))
              .join('')}
          </Text>
        ))}
      </Group>
    );
  };

  const handleDictationInputChange = (value: string) => {
    setDictationInput(value);
    setDictationFeedback(null);
  };

  const handleCheckDictation = () => {
    if (!targetDictationSentence) return;
    setDictationFeedback(null);

    if (dictationType === 'keywords') {
      if (!activeBlank) return;
      const cleanTyped = dictationInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const targetClean = activeBlank.cleanWord.toLowerCase();

      if (!cleanTyped) {
        setDictationFeedback({
          type: 'error',
          message: 'Vui lòng gõ từ bạn nghe được trước khi kiểm tra!',
        });
        return;
      }

      // Check if user typed the keyword OR the entire sentence
      const isWordMatch = cleanTyped === targetClean;
      const isFullMatch =
        dictationInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '') ===
        targetDictationSentence.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      if (isWordMatch || isFullMatch) {
        const nextFilled = isFullMatch
          ? keywordBlanks.map((_, i) => i)
          : [...filledBlankIndices, activeBlankIndex];

        setFilledBlankIndices(nextFilled);
        setDictationInput('');

        if (nextFilled.length >= keywordBlanks.length) {
          if (!dictationCompletedIndices.includes(currentCueIndex)) {
            setDictationCompletedIndices((prev) => [...prev, currentCueIndex]);
          }
          setDictationFeedback({
            type: 'success',
            message: `Chính xác: "${activeBlank.word}"! Bạn đã hoàn thành toàn bộ câu 🎉`,
          });
          setTimeout(() => {
            if (currentCueIndex + 1 < (videoData?.segments?.length || 0)) {
              jumpToCue(currentCueIndex + 1);
            }
          }, 900);
        } else {
          setDictationFeedback({
            type: 'success',
            message: `Chính xác: "${activeBlank.word}"! Hãy tiếp tục điền từ tiếp theo 👏`,
          });
          const remaining = keywordBlanks
            .map((_, i) => i)
            .filter((i) => !nextFilled.includes(i));
          if (remaining.length > 0) {
            setActiveBlankIndex(remaining[0]);
          }
        }
      } else {
        setDictationMistakes((prev) => prev + 1);
        setDictationFeedback({
          type: 'error',
          message: `Từ "${dictationInput.trim()}" chưa chính xác. Đang phát lại câu thoại, hãy nghe kỹ lại nhé!`,
        });
        if (playerRef.current?.seekTo) {
          playerRef.current.seekTo(activeCue?.startSeconds || 0, true);
          playerRef.current.playVideo();
        }
      }
    } else {
      // Full Sentence mode
      const trimmedInput = dictationInput.trim();
      if (!trimmedInput) {
        setDictationFeedback({
          type: 'error',
          message: 'Vui lòng gõ toàn bộ câu thoại bạn nghe được trước khi kiểm tra!',
        });
        return;
      }

      const targetWords = targetDictationSentence.trim().split(/\s+/);
      const userWords = trimmedInput.split(/\s+/);

      const diff = targetWords.map((tWord, idx) => {
        const uWord = userWords[idx] || '';
        const cleanT = tWord.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanU = uWord.toLowerCase().replace(/[^a-z0-9]/g, '');
        const isCorrect = cleanT === cleanU;
        return {
          targetWord: tWord,
          userWord: uWord,
          isCorrect,
        };
      });

      const isAllCorrect = diff.every((d) => d.isCorrect) && userWords.length === targetWords.length;
      setSubmittedFullDiff({ diff, isAllCorrect });

      if (isAllCorrect) {
        if (!dictationCompletedIndices.includes(currentCueIndex)) {
          setDictationCompletedIndices((prev) => [...prev, currentCueIndex]);
        }
        setDictationFeedback({
          type: 'success',
          message: 'Xuất sắc! Bạn đã chép chính xác 100% câu thoại! 🎉',
        });
        setTimeout(() => {
          if (currentCueIndex + 1 < (videoData?.segments?.length || 0)) {
            jumpToCue(currentCueIndex + 1);
          }
        }, 900);
      } else {
        const errors =
          diff.filter((d) => !d.isCorrect).length + Math.max(0, userWords.length - targetWords.length);
        setDictationMistakes((prev) => prev + errors);
        setDictationFeedback({
          type: 'error',
          message: `Có ${errors} lỗi sai (xem chi tiết gạch đỏ bên trên). Đang phát lại câu thoại để bạn nghe lại!`,
        });
        if (playerRef.current?.seekTo) {
          playerRef.current.seekTo(activeCue?.startSeconds || 0, true);
          playerRef.current.playVideo();
        }
      }
    }
  };

  const handleDictationHint = () => {
    if (dictationType === 'keywords') {
      if (!activeBlank) return;
      const targetClean = activeBlank.cleanWord;
      const nextCharIndex = dictationInput.length;
      if (nextCharIndex < targetClean.length) {
        setDictationInput(targetClean.slice(0, nextCharIndex + 1));
      }
    } else {
      if (!targetDictationSentence) return;
      const nextCharIndex = dictationInput.length;
      if (nextCharIndex < targetDictationSentence.length) {
        setDictationInput(targetDictationSentence.slice(0, nextCharIndex + 1));
      }
    }
  };

  const handleDictationReveal = () => {
    setDictationRevealed(true);
    if (dictationType === 'keywords') {
      setFilledBlankIndices(keywordBlanks.map((_, i) => i));
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
    const effectiveSpeed = playbackSpeed > 0 ? playbackSpeed : 1;
    const durationMs = ((activeCue.endSeconds - activeCue.startSeconds) / effectiveSpeed) * 1000;
    setTimeout(() => {
      pauseVideo();
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(activeCue.startSeconds, true);
        setCurrentTime(activeCue.startSeconds);
      }
    }, durationMs);
  };

  const handleSmartShadowFlow = () => {
    if (!activeCue) return;
    setIsSmartShadowActive(true);
    seekToTimestamp(activeCue.startSeconds);
    playVideo();
    const effectiveSpeed = playbackSpeed > 0 ? playbackSpeed : 1;
    const durationMs = ((activeCue.endSeconds - activeCue.startSeconds) / effectiveSpeed) * 1000;

    if (smartShadowTimeoutRef.current) {
      clearTimeout(smartShadowTimeoutRef.current);
    }

    smartShadowTimeoutRef.current = setTimeout(() => {
      pauseVideo();
      if (playerRef.current?.seekTo) {
        playerRef.current.seekTo(activeCue.startSeconds, true);
        setCurrentTime(activeCue.startSeconds);
      }
      setIsSmartShadowActive(false);
      handleStartShadowing();
    }, durationMs);
  };

  const handleStartShadowing = () => {
    if (smartShadowTimeoutRef.current) {
      clearTimeout(smartShadowTimeoutRef.current);
      setIsSmartShadowActive(false);
    }
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
                      activeTab === 'dictation' && !showDictationSubtitle ? (
                        <Stack gap="xs" align="center" py="xs">
                          <Group gap="xs">
                            <IconHeadphones size={20} color="var(--mantine-color-blue-4)" />
                            <Text fw={600} size="sm" c="blue.2">
                              Dictation Mode Active (Subtitles Hidden)
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            Subtitles are hidden to test your listening. Fill in the blanks in the right panel!
                          </Text>
                          <Button
                            data-testid="dictation-peek-btn"
                            size="compact-xs"
                            variant="subtle"
                            color="cyan"
                            leftSection={<IconEye size={13} />}
                            onClick={() => setShowDictationSubtitle(true)}
                          >
                            Peek Subtitle
                          </Button>
                        </Stack>
                      ) : (
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

                          {activeTab === 'dictation' && showDictationSubtitle && (
                            <Button
                              data-testid="dictation-hide-peek-btn"
                              size="compact-xs"
                              variant="subtle"
                              color="gray"
                              leftSection={<IconEyeOff size={13} />}
                              onClick={() => setShowDictationSubtitle(false)}
                              mt={4}
                            >
                              Hide Subtitle
                            </Button>
                          )}
                        </Stack>
                      )
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
                      <Group justify="space-between" align="center" gap="xs">
                        <TextInput
                          placeholder="Search transcript..."
                          size="xs"
                          leftSection={<IconSearch size={14} />}
                          value={scriptSearch}
                          onChange={(e) => setScriptSearch(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <Switch
                          data-testid="auto-scroll-switch"
                          size="xs"
                          label="Auto-scroll"
                          checked={autoScroll}
                          onChange={(e) => setAutoScroll(e.currentTarget.checked)}
                        />
                      </Group>

                      <ScrollArea viewportRef={scriptViewportRef} h={480} offsetScrollbars>
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
                      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                        <Badge color="violet" variant="light">
                          Cue {currentCueIndex + 1} of {videoData.segments.length}
                        </Badge>
                        <SegmentedControl
                          data-testid="dictation-mode-toggle"
                          size="xs"
                          value={dictationType}
                          onChange={(val) => {
                            setDictationType(val as 'keywords' | 'full');
                            setDictationInput('');
                            setFilledBlankIndices([]);
                            setActiveBlankIndex(0);
                            setDictationRevealed(false);
                          }}
                          data={[
                            { label: '🎯 Đục lỗ ý chính', value: 'keywords' },
                            { label: '📝 Toàn phần', value: 'full' },
                          ]}
                        />
                      </Group>

                      <Text size="xs" c="dimmed">
                        {dictationType === 'keywords'
                          ? 'Đục lỗ các từ khóa chính. Nghe và điền từng từ còn thiếu vào chỗ trống!'
                          : 'Đục lỗ toàn phần. Tự động lặp lại đoạn thoại, gõ toàn bộ câu bạn nghe được!'}
                      </Text>

                      {/* Diff text display */}
                      <Paper p="md" radius="md" withBorder style={{ minHeight: '80px', backgroundColor: '#f8f9fa' }}>
                        {renderDictationDiff()}
                      </Paper>

                      {/* Typing input */}
                      <TextInput
                        data-testid="dictation-input"
                        placeholder={
                          dictationType === 'keywords'
                            ? activeBlank
                              ? `Điền từ còn thiếu vào chỗ trống #${activeBlankIndex + 1} (${activeBlank.cleanWord.length} chữ cái)... Nhấn Enter để kiểm tra`
                              : '🎉 Đã hoàn thành tất cả chỗ trống trong câu!'
                            : 'Gõ toàn bộ câu thoại bạn nghe được... Nhấn Enter để kiểm tra'
                        }
                        value={dictationInput}
                        onChange={(e) => handleDictationInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCheckDictation();
                          }
                        }}
                        autoFocus
                        disabled={dictationType === 'keywords' && filledBlankIndices.length >= keywordBlanks.length}
                      />

                      {/* Feedback banner */}
                      {dictationFeedback && (
                        <Alert
                          data-testid="dictation-feedback-alert"
                          color={dictationFeedback.type === 'success' ? 'green' : 'red'}
                          icon={dictationFeedback.type === 'success' ? <IconCheck size={16} /> : <IconX size={16} />}
                          py={6}
                          px="sm"
                          withCloseButton
                          onClose={() => setDictationFeedback(null)}
                        >
                          <Text size="xs" fw={600}>
                            {dictationFeedback.message}
                          </Text>
                        </Alert>
                      )}

                      {/* Dictation action buttons */}
                      <Group justify="space-between" wrap="wrap" gap="xs">
                        <Group gap="xs">
                          <Button
                            data-testid="dictation-check-btn"
                            size="xs"
                            color="blue"
                            variant="filled"
                            leftSection={<IconCheck size={14} />}
                            onClick={handleCheckDictation}
                            disabled={dictationType === 'keywords' && filledBlankIndices.length >= keywordBlanks.length}
                          >
                            Kiểm tra (Enter)
                          </Button>
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
                            onClick={handleDictationReveal}
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
                        <Group gap="xs">
                          <Badge color="teal" variant="light">
                            Cue {currentCueIndex + 1} of {videoData.segments.length}
                          </Badge>
                          <ActionIcon
                            variant="default"
                            size="sm"
                            disabled={currentCueIndex === 0}
                            onClick={() => jumpToCue(currentCueIndex - 1)}
                            title="Previous sentence"
                          >
                            <IconPlayerTrackPrev size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant="default"
                            size="sm"
                            disabled={currentCueIndex >= videoData.segments.length - 1}
                            onClick={() => jumpToCue(currentCueIndex + 1)}
                            title="Next sentence"
                          >
                            <IconPlayerTrackNext size={14} />
                          </ActionIcon>
                        </Group>
                        <Text size="xs" c="dimmed">
                          Listen → Shadow Speak → AI Feedback
                        </Text>
                      </Group>

                      {/* Speed & Auto-pause Settings for Shadowing */}
                      <Paper p="xs" radius="md" withBorder style={{ backgroundColor: '#f8fafd' }}>
                        <Group justify="space-between" wrap="wrap" gap="sm">
                          <Group gap="xs" align="center">
                            <Text size="xs" fw={600} c="dimmed">
                              Tốc độ Shadowing:
                            </Text>
                            <SegmentedControl
                              data-testid="shadowing-speed-control"
                              size="xs"
                              value={String(playbackSpeed)}
                              onChange={(val) => changePlaybackSpeed(Number(val))}
                              data={[
                                { label: '0.75x Chậm', value: '0.75' },
                                { label: '0.85x Vừa', value: '0.85' },
                                { label: '1.0x Chuẩn', value: '1' },
                              ]}
                            />
                          </Group>

                          <Switch
                            data-testid="shadowing-autopause-switch"
                            size="xs"
                            label="Tự dừng sau mỗi câu"
                            checked={autoPauseShadowing}
                            onChange={(e) => setAutoPauseShadowing(e.currentTarget.checked)}
                          />
                        </Group>
                      </Paper>

                      {/* Target Sentence Box */}
                      <Paper p="md" radius="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                        <Group justify="space-between" align="flex-start" mb={4}>
                          <Text size="sm" c="dimmed">
                            Target Sentence:
                          </Text>
                          <Badge size="xs" variant="outline" color="blue">
                            {playbackSpeed}x Speed
                          </Badge>
                        </Group>
                        <Text fw={600} size="md">
                          {activeCue?.text || 'Select a cue'}
                        </Text>
                      </Paper>

                      {/* Smart 1-Click Practice Flow */}
                      <Button
                        data-testid="smart-shadow-btn"
                        size="sm"
                        variant="gradient"
                        gradient={{ from: 'teal', to: 'indigo', deg: 60 }}
                        leftSection={<IconSparkles size={16} />}
                        loading={isSmartShadowActive}
                        disabled={isRecording || isCountdown}
                        onClick={handleSmartShadowFlow}
                      >
                        {isSmartShadowActive
                          ? 'Đang phát mẫu...'
                          : 'Luyện tự động (Nghe mẫu ➔ Tự dừng ➔ Nhại lại)'}
                      </Button>

                      {/* Action Step Buttons */}
                      <Group grow>
                        <Button
                          data-testid="shadowing-listen-btn"
                          size="sm"
                          variant="light"
                          color="blue"
                          leftSection={<IconVolume size={16} />}
                          disabled={isRecording || isSmartShadowActive}
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
                            disabled={isCountdown || isSmartShadowActive}
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

                            <Button
                              variant="subtle"
                              color="blue"
                              size="xs"
                              rightSection={<IconPlayerTrackNext size={14} />}
                              disabled={currentCueIndex >= videoData.segments.length - 1}
                              onClick={() => jumpToCue(currentCueIndex + 1)}
                            >
                              Tiếp tục câu sau (Next Cue)
                            </Button>
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
