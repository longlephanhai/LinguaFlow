import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  TextInput,
  Textarea,
  Badge,
  Loader,
  Drawer,
  ActionIcon,
  Modal,
  Pagination,
  Tooltip,
  Paper,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconArticle,
  IconArrowLeft,
  IconBookmark,
  IconCheck,
  IconTrash,
  IconPlus,
  IconHistory,
  IconSparkles,
  IconExternalLink,
  IconBook,
} from '@tabler/icons-react';
import { readerApi } from '../lib/reader.api';
import type {
  ParsedArticleResponse,
  ArticleListItem,
  DiscoveredVocabItem,
} from '../lib/reader.api';
import { vocabularyApi } from '../lib/vocabulary.api';
import type { LookupResult } from '../lib/vocabulary.api';

const SAMPLE_ARTICLES = [
  {
    title: 'The Evolution of Modern Remote Work',
    sourceUrl: 'https://techinsights.example/remote-work',
    text: `Remote work has transitioned from a temporary measure into a ubiquitous facet of modern industry. Many organizations now leverage asynchronous communication tools to facilitate global collaboration without imposing rigid nine-to-five schedules.

However, maintaining team cohesion and preventing digital burnout remain significant hurdles. Effective managers emphasize clear expectations, psychological safety, and deliberate moments of connection rather than micromanaging activity.

As artificial intelligence automates routine operational workflows, human adaptability and empathetic communication will become increasingly indispensable in distributed companies.`,
  },
  {
    title: 'A Morning at the Corner Cafe',
    sourceUrl: 'https://dailystories.example/corner-cafe',
    text: `Every morning, Lucas walked past the bustling corner bakery and into his favorite neighborhood cafe. The barista immediately greeted him with a warm smile and prepared his customary espresso before he even uttered a word.

Looking around the sunlit room, Lucas noticed various patrons engrossed in paperback novels or typing intently on laptops. It was a tranquil sanctuary where local residents could unwind, contemplate new ideas, and prepare mentally for the hectic workday ahead.

A gentle hum of soft jazz blended harmoniously with the aroma of freshly roasted coffee beans, creating an ambience that felt both invigorating and comforting.`,
  },
];

export function ReaderPage() {
  // Input state
  const [titleInput, setTitleInput] = useState('');
  const [sourceUrlInput, setSourceUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Active reading state
  const [activeArticle, setActiveArticle] = useState<ParsedArticleResponse | null>(null);
  const [fontSize, setFontSize] = useState<number>(18);

  // In-context lookup popover/modal state
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  const [lookupSentence, setLookupSentence] = useState<string>('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupData, setLookupData] = useState<LookupResult | null>(null);
  const [isSavingWord, setIsSavingWord] = useState(false);
  const [savedWordsMap, setSavedWordsMap] = useState<Record<string, boolean>>({});

  // History drawer state
  const [historyOpened, setHistoryOpened] = useState(false);
  const [articlesList, setArticlesList] = useState<ArticleListItem[]>([]);
  const [articlesPage, setArticlesPage] = useState(1);
  const [articlesTotalPages, setArticlesTotalPages] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Batch save state
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  // Fetch articles history
  const loadHistory = async (page = 1) => {
    setIsLoadingHistory(true);
    try {
      const res = await readerApi.getArticles(page, 8);
      setArticlesList(res.items);
      setArticlesPage(res.page);
      setArticlesTotalPages(res.totalPages);
    } catch {
      // Ignored in history fetch
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (historyOpened) {
      loadHistory(articlesPage);
    }
  }, [historyOpened, articlesPage]);

  // Handle parsing new text
  const handleParse = async () => {
    if (!textInput.trim() || textInput.trim().length < 20) {
      setParseError('Vui lòng nhập văn bản tiếng Anh có độ dài ít nhất 20 ký tự.');
      return;
    }
    setParseError(null);
    setIsParsing(true);

    try {
      const res = await readerApi.parseArticle({
        title: titleInput.trim() || undefined,
        text: textInput.trim(),
        sourceUrl: sourceUrlInput.trim() || undefined,
      });

      setActiveArticle(res);
      // Initialize saved status map
      const initialSaved: Record<string, boolean> = {};
      res.discoveredVocabulary.forEach((v) => {
        if (v.isSaved) initialSaved[v.lemma.toLowerCase()] = true;
      });
      setSavedWordsMap(initialSaved);
    } catch (err: any) {
      setParseError(err.response?.data?.message || 'Không thể xử lý bài đọc. Vui lòng thử lại.');
    } finally {
      setIsParsing(false);
    }
  };

  // Open saved article from history
  const handleOpenSavedArticle = async (id: string) => {
    try {
      const res = await readerApi.getArticleById(id);
      setActiveArticle({
        articleId: res.id,
        title: res.title,
        sourceUrl: res.sourceUrl,
        totalWordCount: res.totalWordCount,
        paragraphs: res.paragraphs,
        discoveredVocabulary: res.discoveredVocabulary,
        createdAt: res.createdAt,
      });
      const initialSaved: Record<string, boolean> = {};
      res.discoveredVocabulary.forEach((v) => {
        if (v.isSaved) initialSaved[v.lemma.toLowerCase()] = true;
      });
      setSavedWordsMap(initialSaved);
      setHistoryOpened(false);
    } catch {
      alert('Không thể mở bài đọc này.');
    }
  };

  // Delete article from history
  const handleDeleteArticle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa bài đọc này khỏi lịch sử?')) return;
    try {
      await readerApi.deleteArticle(id);
      loadHistory(articlesPage);
      if (activeArticle?.articleId === id) {
        setActiveArticle(null);
      }
    } catch {
      alert('Không thể xóa bài đọc.');
    }
  };

  // Click on a word in the text to lookup
  const handleWordClick = async (word: string, parentSentence: string) => {
    const cleanWord = word.replace(/^[^\w]+|[^\w]+$/g, '').trim();
    if (!cleanWord || cleanWord.length <= 1) return;

    setLookupWord(cleanWord);
    setLookupSentence(parentSentence);
    setLookupLoading(true);
    setLookupData(null);

    try {
      const res = await vocabularyApi.lookupInContext(cleanWord, parentSentence);
      setLookupData(res);
    } catch {
      setLookupData({
        lemma: cleanWord.toLowerCase(),
        meaning: 'Không thể tải giải nghĩa theo ngữ cảnh lúc này.',
        example: parentSentence,
        partOfSpeech: 'word',
        cached: false,
      });
    } finally {
      setLookupLoading(false);
    }
  };

  // Save single word to bank
  const handleSaveWord = async () => {
    if (!lookupData || !lookupWord) return;
    setIsSavingWord(true);
    try {
      await vocabularyApi.saveOccurrence({
        lemma: lookupData.lemma,
        meaning: lookupData.meaning,
        sentence: lookupSentence,
        partOfSpeech: lookupData.partOfSpeech || undefined,
        sourceTitle: activeArticle?.title || 'Article Reader',
        sourceUrl: activeArticle?.sourceUrl || '',
      });
      setSavedWordsMap((prev) => ({
        ...prev,
        [lookupData.lemma.toLowerCase()]: true,
      }));
      setLookupWord(null);
    } catch {
      alert('Không thể lưu từ vựng vào ngân hàng.');
    } finally {
      setIsSavingWord(false);
    }
  };

  // Batch save all discovered vocabulary
  const handleBatchSave = async () => {
    if (!activeArticle) return;
    const unsaved = activeArticle.discoveredVocabulary.filter(
      (v) => !savedWordsMap[v.lemma.toLowerCase()],
    );
    if (unsaved.length === 0) return;

    setIsBatchSaving(true);
    try {
      await readerApi.batchSave({
        articleId: activeArticle.articleId,
        items: unsaved.map((v) => ({
          lemma: v.lemma,
          meaning: v.definition,
          contextSentence: v.contextSentence,
          partOfSpeech: v.partOfSpeech,
        })),
      });

      const updated = { ...savedWordsMap };
      unsaved.forEach((v) => {
        updated[v.lemma.toLowerCase()] = true;
      });
      setSavedWordsMap(updated);
    } catch {
      alert('Lưu từ vựng hàng loạt thất bại.');
    } finally {
      setIsBatchSaving(false);
    }
  };

  // Load sample article
  const handleLoadSample = (sample: typeof SAMPLE_ARTICLES[0]) => {
    setTitleInput(sample.title);
    setSourceUrlInput(sample.sourceUrl);
    setTextInput(sample.text);
    setParseError(null);
  };

  // Check if a word matches a discovered lemma
  const isDiscoveredWord = (word: string): DiscoveredVocabItem | undefined => {
    if (!activeArticle) return undefined;
    const clean = word.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
    return activeArticle.discoveredVocabulary.find(
      (v) => v.lemma.toLowerCase() === clean,
    );
  };

  return (
    <Container size="lg" py="xl">
      {/* Header bar */}
      <Group justify="space-between" mb="lg">
        <Group>
          <IconBook size={28} color="#228be6" />
          <div>
            <Title order={2}>Article & Story Reader</Title>
            <Text c="dimmed" size="sm">
              Đọc báo và truyện tiếng Anh thực tế — click tra nghĩa và gom từ vựng theo ngữ cảnh bài đọc
            </Text>
          </div>
        </Group>

        <Group>
          {activeArticle && (
            <Button
              variant="default"
              leftSection={<IconPlus size={16} />}
              onClick={() => setActiveArticle(null)}
            >
              Nhập bài mới
            </Button>
          )}
          <Button
            variant="light"
            leftSection={<IconHistory size={16} />}
            onClick={() => setHistoryOpened(true)}
          >
            Bài đã lưu
          </Button>
        </Group>
      </Group>

      {/* VIEW 1: Input / Parse Screen */}
      {!activeArticle ? (
        <Stack gap="lg">
          <Card withBorder padding="lg" radius="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600} size="md">
                  Nhập bài đọc hoặc dán văn bản tiếng Anh
                </Text>
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    Bài mẫu:
                  </Text>
                  {SAMPLE_ARTICLES.map((sample, idx) => (
                    <Button
                      key={sample.title}
                      size="xs"
                      variant="subtle"
                      onClick={() => handleLoadSample(sample)}
                    >
                      {idx === 0 ? 'Công nghệ & Remote Work' : 'Truyện đời thường Cafe'}
                    </Button>
                  ))}
                </Group>
              </Group>

              <TextInput
                label="Tiêu đề bài viết (tùy chọn)"
                placeholder="VD: The Evolution of Modern Remote Work"
                value={titleInput}
                onChange={(e) => setTitleInput(e.currentTarget.value)}
              />

              <TextInput
                label="Link nguồn (tùy chọn)"
                placeholder="VD: https://medium.com/@author/article-name"
                value={sourceUrlInput}
                onChange={(e) => setSourceUrlInput(e.currentTarget.value)}
              />

              <Textarea
                label="Nội dung bài viết (tiếng Anh)"
                placeholder="Dán nội dung bài báo, truyện ngắn, hoặc đoạn trích bạn muốn đọc..."
                minRows={8}
                maxRows={16}
                autosize
                value={textInput}
                onChange={(e) => setTextInput(e.currentTarget.value)}
                error={parseError}
              />

              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  {textInput.trim().split(/\s+/).filter(Boolean).length} từ ({textInput.length} ký tự)
                </Text>

                <Button
                  size="md"
                  leftSection={isParsing ? <Loader size={16} color="white" /> : <IconArticle size={18} />}
                  disabled={isParsing || textInput.trim().length < 20}
                  onClick={handleParse}
                >
                  {isParsing ? 'Đang phân tích bài đọc...' : 'Bắt đầu đọc & Khám phá từ vựng'}
                </Button>
              </Group>
            </Stack>
          </Card>
        </Stack>
      ) : (
        /* VIEW 2: Reading Mode */
        <Group align="flex-start" gap="xl" wrap="nowrap">
          {/* Main Reading Canvas */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Card withBorder padding="xl" radius="md">
              {/* Reader Controls Toolbar */}
              <Group justify="space-between" pb="md" mb="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => setActiveArticle(null)}
                >
                  Quay lại
                </Button>

                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    Cỡ chữ:
                  </Text>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                  >
                    A-
                  </Button>
                  <Text size="xs" fw={600}>
                    {fontSize}px
                  </Text>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => setFontSize((s) => Math.min(26, s + 2))}
                  >
                    A+
                  </Button>
                </Group>
              </Group>

              {/* Title & Metadata */}
              <Stack gap="xs" mb="xl">
                <Title order={1} style={{ fontSize: fontSize + 8, lineHeight: 1.3 }}>
                  {activeArticle.title}
                </Title>
                <Group gap="sm">
                  <Badge variant="light" color="blue">
                    {activeArticle.totalWordCount} từ
                  </Badge>
                  {activeArticle.sourceUrl && (
                    <Group gap={4}>
                      <IconExternalLink size={14} color="#868e96" />
                      <Text
                        size="xs"
                        c="dimmed"
                        component="a"
                        href={activeArticle.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: 'underline' }}
                      >
                        Nguồn bài viết
                      </Text>
                    </Group>
                  )}
                </Group>
              </Stack>

              {/* Body Text with interactive click-to-lookup word tokens */}
              <Box
                style={{
                  lineHeight: 1.85,
                  fontSize: `${fontSize}px`,
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                {activeArticle.paragraphs.map((para, pIdx) => (
                  <Box key={`para-${pIdx}`} mb="xl">
                    {para.sentences.map((sentence, sIdx) => (
                      <span key={`sent-${pIdx}-${sIdx}`} style={{ marginRight: '6px' }}>
                        {sentence.tokens.map((token, tIdx) => {
                          const isWord = /^[a-zA-Z0-9'-]+$/.test(token);
                          if (!isWord) {
                            return <span key={`tok-${tIdx}`}>{token} </span>;
                          }

                          const discovered = isDiscoveredWord(token);
                          const isSaved = discovered && savedWordsMap[discovered.lemma.toLowerCase()];

                          return (
                            <Tooltip
                              key={`tok-${tIdx}`}
                              label={
                                discovered
                                  ? `${discovered.lemma} (${discovered.partOfSpeech}): ${discovered.definition}`
                                  : `Click tra "${token}"`
                              }
                              openDelay={400}
                              withArrow
                            >
                              <span
                                onClick={() => handleWordClick(token, sentence.text)}
                                style={{
                                  cursor: 'pointer',
                                  padding: '1px 3px',
                                  borderRadius: '4px',
                                  backgroundColor: isSaved
                                    ? 'rgba(40, 167, 69, 0.15)'
                                    : discovered
                                    ? 'rgba(34, 139, 230, 0.18)'
                                    : 'transparent',
                                  borderBottom: discovered
                                    ? isSaved
                                      ? '2px solid #28a745'
                                      : '2px solid #228be6'
                                    : '1px dashed transparent',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(34, 139, 230, 0.25)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = isSaved
                                    ? 'rgba(40, 167, 69, 0.15)'
                                    : discovered
                                    ? 'rgba(34, 139, 230, 0.18)'
                                    : 'transparent';
                                }}
                              >
                                {token}
                              </span>
                            </Tooltip>
                          );
                        })}
                      </span>
                    ))}
                  </Box>
                ))}
              </Box>
            </Card>
          </Box>

          {/* Right Sidebar: Discovered Vocabulary */}
          <Box style={{ width: 340, flexShrink: 0 }}>
            <Card withBorder padding="md" radius="md">
              <Group justify="space-between" mb="sm">
                <Group gap="xs">
                  <IconSparkles size={18} color="#fab005" />
                  <Text fw={600} size="sm">
                    Từ vựng nổi bật ({activeArticle.discoveredVocabulary.length})
                  </Text>
                </Group>

                <Button
                  size="xs"
                  variant="light"
                  color="green"
                  disabled={
                    isBatchSaving ||
                    activeArticle.discoveredVocabulary.every(
                      (v) => savedWordsMap[v.lemma.toLowerCase()],
                    )
                  }
                  loading={isBatchSaving}
                  onClick={handleBatchSave}
                >
                  Lưu tất cả
                </Button>
              </Group>

              <Divider mb="sm" />

              <Stack gap="sm">
                {activeArticle.discoveredVocabulary.map((v) => {
                  const isSaved = !!savedWordsMap[v.lemma.toLowerCase()];
                  return (
                    <Paper
                      key={v.lemma}
                      p="xs"
                      withBorder
                      radius="sm"
                      style={{
                        backgroundColor: isSaved
                          ? 'rgba(40, 167, 69, 0.05)'
                          : 'transparent',
                        borderColor: isSaved ? '#28a745' : undefined,
                      }}
                    >
                      <Group justify="space-between" align="flex-start" mb={4}>
                        <Group gap={6}>
                          <Text fw={700} size="sm" c="blue">
                            {v.lemma}
                          </Text>
                          <Badge size="xs" variant="outline">
                            {v.partOfSpeech}
                          </Badge>
                        </Group>

                        {isSaved ? (
                          <Badge size="xs" color="green" leftSection={<IconCheck size={10} />}>
                            Đã lưu
                          </Badge>
                        ) : (
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="blue"
                            title="Lưu từ này"
                            onClick={() => {
                              handleWordClick(v.lemma, v.contextSentence);
                            }}
                          >
                            <IconBookmark size={14} />
                          </ActionIcon>
                        )}
                      </Group>

                      <Text size="xs" fw={500} c="dark" mb={4}>
                        {v.definition}
                      </Text>

                      <Text size="xs" c="dimmed" lineClamp={2} fs="italic">
                        "{v.contextSentence}"
                      </Text>
                    </Paper>
                  );
                })}
              </Stack>
            </Card>
          </Box>
        </Group>
      )}

      {/* In-Context Word Lookup Modal */}
      <Modal
        opened={!!lookupWord}
        onClose={() => setLookupWord(null)}
        title={
          <Group gap="xs">
            <Title order={4}>Giải nghĩa theo ngữ cảnh</Title>
            {lookupData?.partOfSpeech && (
              <Badge size="sm" variant="light">
                {lookupData.partOfSpeech}
              </Badge>
            )}
          </Group>
        }
        centered
        radius="md"
      >
        {lookupLoading ? (
          <Group justify="center" py="xl">
            <Loader size="md" />
            <Text size="sm" c="dimmed">
              Đang phân tích nghĩa của "{lookupWord}"...
            </Text>
          </Group>
        ) : lookupData ? (
          <Stack gap="md">
            <div>
              <Text size="xs" c="dimmed">
                Từ gốc (Lemma):
              </Text>
              <Title order={3} c="blue">
                {lookupData.lemma}
              </Title>
            </div>

            <div>
              <Text size="xs" c="dimmed">
                Ý nghĩa trong câu này:
              </Text>
              <Text fw={600} size="md">
                {lookupData.meaning}
              </Text>
            </div>

            <div>
              <Text size="xs" c="dimmed">
                Câu ngữ cảnh gốc:
              </Text>
              <Paper p="xs" withBorder bg="var(--mantine-color-gray-0)" radius="sm">
                <Text size="sm" fs="italic">
                  "{lookupSentence}"
                </Text>
              </Paper>
            </div>

            {lookupData.example && (
              <div>
                <Text size="xs" c="dimmed">
                  Ví dụ thêm:
                </Text>
                <Text size="sm">{lookupData.example}</Text>
              </div>
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setLookupWord(null)}>
                Đóng
              </Button>
              <Button
                color="green"
                leftSection={
                  savedWordsMap[lookupData.lemma.toLowerCase()] ? (
                    <IconCheck size={16} />
                  ) : (
                    <IconBookmark size={16} />
                  )
                }
                loading={isSavingWord}
                disabled={savedWordsMap[lookupData.lemma.toLowerCase()]}
                onClick={handleSaveWord}
              >
                {savedWordsMap[lookupData.lemma.toLowerCase()]
                  ? 'Đã có trong sổ từ'
                  : 'Lưu vào sổ từ vựng'}
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>

      {/* History Drawer */}
      <Drawer
        opened={historyOpened}
        onClose={() => setHistoryOpened(false)}
        title={<Title order={4}>Bài đọc đã lưu</Title>}
        position="right"
        size="md"
      >
        {isLoadingHistory ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : articlesList.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="xl">
            Chưa có bài đọc nào được lưu.
          </Text>
        ) : (
          <Stack gap="sm">
            {articlesList.map((art) => (
              <Card
                key={art.id}
                withBorder
                padding="sm"
                radius="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => handleOpenSavedArticle(art.id)}
              >
                <Group justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Text fw={600} size="sm" lineClamp={1}>
                      {art.title}
                    </Text>
                    <Group gap="xs" mt={4}>
                      <Badge size="xs" variant="outline">
                        {art.totalWordCount} từ
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {new Date(art.createdAt).toLocaleDateString()}
                      </Text>
                    </Group>
                  </Box>

                  <ActionIcon
                    color="red"
                    variant="subtle"
                    size="sm"
                    onClick={(e) => handleDeleteArticle(art.id, e)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}

            {articlesTotalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination
                  value={articlesPage}
                  onChange={setArticlesPage}
                  total={articlesTotalPages}
                  size="sm"
                />
              </Group>
            )}
          </Stack>
        )}
      </Drawer>
    </Container>
  );
}
export default ReaderPage;
