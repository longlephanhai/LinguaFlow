import { useState, useEffect, useRef, useCallback } from 'react';
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
  ScrollArea,
  Avatar,
  Divider,
} from '@mantine/core';
import {
  IconSend,
  IconPlus,
  IconTrash,
  IconMessageChatbot,
  IconUser,
  IconSparkles,
  IconRefresh,
  IconAlertCircle,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from '@tabler/icons-react';
import {
  chatApi,
  type ChatMessage,
  type ChatSessionListItem,
} from '../lib/chat.api';

export function ChatPage() {
  const [sessions, setSessions] = useState<ChatSessionListItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestedWords, setSuggestedWords] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  const fetchSuggestedWords = useCallback(async () => {
    try {
      const res = await chatApi.getSuggestedWords();
      setSuggestedWords(res.words || []);
    } catch {
      // Non-blocking error for suggested chips
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const res = await chatApi.getSessions(1, 30);
      setSessions(res.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load chat history');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  // Initial load: sessions and suggested words
  useEffect(() => {
    fetchSessions();
    fetchSuggestedWords();
  }, [fetchSessions, fetchSuggestedWords]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom(true);
  }, [messages, scrollToBottom]);

  const handleSelectSession = async (sessionId: string) => {
    if (activeSessionId === sessionId) return;
    try {
      setLoadingChat(true);
      setError(null);
      const res = await chatApi.getSession(sessionId);
      setActiveSessionId(res.id);
      setMessages(res.messages || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load conversation');
    } finally {
      setLoadingChat(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    textareaRef.current?.focus();
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await chatApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        handleStartNewChat();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to delete conversation');
    }
  };

  const handleInsertWord = (word: string) => {
    const el = textareaRef.current;
    if (!el) {
      setInputMessage((prev) => (prev ? `${prev} ${word}` : word));
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentText = inputMessage;

    const before = currentText.substring(0, start);
    const after = currentText.substring(end);
    const needsSpaceBefore = before.length > 0 && !before.endsWith(' ');
    const needsSpaceAfter = after.length > 0 && !after.startsWith(' ');

    const inserted = `${needsSpaceBefore ? ' ' : ''}${word}${needsSpaceAfter ? ' ' : ' '}`;
    const newText = before + inserted + after;
    setInputMessage(newText);

    setTimeout(() => {
      el.focus();
      const newPos = start + inserted.length;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleSend = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || sending) return;

    setError(null);
    setInputMessage('');

    // Optimistic user message
    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await chatApi.sendMessage({
        sessionId: activeSessionId || undefined,
        message: trimmed,
      });

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (!activeSessionId) {
        setActiveSessionId(res.sessionId);
      }

      // Refresh chips and sessions list
      fetchSuggestedWords();
      fetchSessions();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box style={{ height: 'calc(100vh - 100px)', display: 'flex', gap: '16px' }}>
      {/* Sidebar: Conversation Sessions */}
      <Paper
        withBorder
        p="sm"
        style={{
          width: sidebarCollapsed ? '60px' : '280px',
          minWidth: sidebarCollapsed ? '60px' : '280px',
          transition: 'width 0.2s ease, min-width 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
        }}
      >
        <Group justify={sidebarCollapsed ? 'center' : 'space-between'} mb="sm">
          {!sidebarCollapsed && (
            <Title order={5} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconMessageChatbot size={20} color="var(--mantine-color-blue-filled)" />
              Conversations
            </Title>
          )}
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => setSidebarCollapsed((v) => !v)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <IconLayoutSidebarLeftExpand size={18} /> : <IconLayoutSidebarLeftCollapse size={18} />}
          </ActionIcon>
        </Group>

        <Button
          leftSection={sidebarCollapsed ? undefined : <IconPlus size={16} />}
          variant="light"
          color="blue"
          fullWidth
          mb="sm"
          onClick={handleStartNewChat}
          title="New conversation"
        >
          {sidebarCollapsed ? <IconPlus size={18} /> : 'New Chat'}
        </Button>

        <ScrollArea style={{ flex: 1 }}>
          {loadingSessions ? (
            <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
              <Loader size="sm" />
            </Box>
          ) : sessions.length === 0 ? (
            !sidebarCollapsed && (
              <Text size="xs" c="dimmed" ta="center" py="lg">
                No past chats yet. Send a message to start!
              </Text>
            )
          ) : (
            <Stack gap={4}>
              {sessions.map((s) => {
                const isActive = s.id === activeSessionId;
                return (
                  <Paper
                    key={s.id}
                    p="xs"
                    withBorder={isActive}
                    onClick={() => handleSelectSession(s.id)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      backgroundColor: isActive
                        ? 'var(--mantine-color-blue-light)'
                        : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {sidebarCollapsed ? (
                      <Tooltip label={s.title} position="right">
                        <Box style={{ display: 'flex', justifyContent: 'center' }}>
                          <IconMessageChatbot size={18} opacity={isActive ? 1 : 0.6} />
                        </Box>
                      </Tooltip>
                    ) : (
                      <Group justify="space-between" wrap="nowrap">
                        <Box style={{ flex: 1, overflow: 'hidden' }}>
                          <Text size="sm" fw={isActive ? 600 : 500} truncate>
                            {s.title}
                          </Text>
                          <Group gap="xs">
                            <Badge size="xs" variant="outline" color="gray">
                              {s.messageCount} msg
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {new Date(s.updatedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Text>
                          </Group>
                        </Box>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={(e) => handleDeleteSession(e, s.id)}
                          title="Delete conversation"
                          aria-label="Delete conversation"
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    )}
                  </Paper>
                );
              })}
            </Stack>
          )}
        </ScrollArea>
      </Paper>

      {/* Main Chat Area */}
      <Paper
        withBorder
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* Chat Header */}
        <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
          <Group justify="space-between">
            <Group gap="xs">
              <Avatar color="blue" radius="xl">
                <IconSparkles size={20} />
              </Avatar>
              <Box>
                <Title order={4}>LinguaFlow AI Tutor</Title>
                <Text size="xs" c="dimmed">
                  Conversational practice with gentle grammar feedback & vocabulary reinforcement
                </Text>
              </Box>
            </Group>
            {activeSessionId && (
              <Button
                variant="subtle"
                size="xs"
                color="gray"
                leftSection={<IconPlus size={14} />}
                onClick={handleStartNewChat}
              >
                Start New Session
              </Button>
            )}
          </Group>
        </Box>

        {/* Error Alert if any */}
        {error && (
          <Box px="md" pt="sm">
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              withCloseButton
              onClose={() => setError(null)}
              radius="md"
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* Message Stream */}
        <ScrollArea style={{ flex: 1 }} p="md">
          {loadingChat ? (
            <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
              <Loader size="md" />
            </Box>
          ) : messages.length === 0 ? (
            <Box py={60} style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
              <Avatar
                size={56}
                radius="xl"
                color="blue"
                variant="light"
                mx="auto"
                mb="md"
              >
                <IconMessageChatbot size={32} />
              </Avatar>
              <Title order={4} mb="xs">
                Welcome to AI Conversation Practice
              </Title>
              <Text size="sm" c="dimmed" mb="lg">
                Chat in English freely. I will converse with you naturally, point out quick tips or corrections when needed, and help you use your saved vocabulary words!
              </Text>
              <Stack gap="xs" align="center">
                <Text size="xs" fw={600} c="dimmed">
                  TRY STARTING WITH:
                </Text>
                <Button
                  variant="default"
                  size="xs"
                  radius="xl"
                  onClick={() => setInputMessage('How can I sound more natural when introducing myself in professional meetings?')}
                >
                  "How can I sound more natural in meetings?"
                </Button>
                <Button
                  variant="default"
                  size="xs"
                  radius="xl"
                  onClick={() => setInputMessage('Can we have a casual conversation about weekend hobbies?')}
                >
                  "Let's chat about weekend hobbies."
                </Button>
              </Stack>
            </Box>
          ) : (
            <Stack gap="md">
              {messages.map((m, idx) => {
                const isUser = m.role === 'user';
                return (
                  <Box
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Group
                      align="flex-start"
                      gap="xs"
                      style={{
                        maxWidth: '80%',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                      }}
                    >
                      <Avatar
                        size={32}
                        radius="xl"
                        color={isUser ? 'blue' : 'teal'}
                        variant={isUser ? 'filled' : 'light'}
                      >
                        {isUser ? <IconUser size={18} /> : <IconSparkles size={18} />}
                      </Avatar>

                      <Paper
                        p="sm"
                        radius="md"
                        withBorder={!isUser}
                        style={{
                          backgroundColor: isUser
                            ? 'var(--mantine-color-blue-filled)'
                            : 'var(--mantine-color-default)',
                          color: isUser ? '#ffffff' : 'inherit',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.5,
                          fontSize: '14px',
                        }}
                      >
                        {m.content}
                      </Paper>
                    </Group>
                  </Box>
                );
              })}

              {sending && (
                <Box style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Group align="center" gap="xs">
                    <Avatar size={32} radius="xl" color="teal" variant="light">
                      <IconSparkles size={18} />
                    </Avatar>
                    <Paper p="sm" radius="md" withBorder>
                      <Group gap="xs">
                        <Loader size="xs" color="teal" />
                        <Text size="xs" c="dimmed">
                          AI Tutor is typing...
                        </Text>
                      </Group>
                    </Paper>
                  </Group>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Stack>
          )}
        </ScrollArea>

        <Divider />

        {/* Suggested Vocabulary Chips & Input Area */}
        <Box p="md">
          {suggestedWords.length > 0 && (
            <Group gap="xs" mb="xs" align="center">
              <Text size="xs" fw={600} c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IconSparkles size={14} color="var(--mantine-color-blue-filled)" />
                SAVED WORDS:
              </Text>
              {suggestedWords.map((word) => (
                <Badge
                  key={word}
                  variant="light"
                  color="blue"
                  size="md"
                  style={{ cursor: 'pointer', textTransform: 'none' }}
                  onClick={() => handleInsertWord(word)}
                  title="Click to insert into message"
                >
                  +{word}
                </Badge>
              ))}
              <Tooltip label="Refresh suggested words">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={fetchSuggestedWords}
                  aria-label="Refresh suggested words"
                >
                  <IconRefresh size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}

          <Group align="flex-end" gap="xs">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message in English... (Enter to send, Shift+Enter for new line)"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              minRows={1}
              maxRows={4}
              autosize
              style={{ flex: 1 }}
              disabled={sending}
              aria-label="Chat input"
            />
            <Button
              onClick={handleSend}
              loading={sending}
              disabled={!inputMessage.trim()}
              color="blue"
              aria-label="Send message"
            >
              <IconSend size={18} />
            </Button>
          </Group>
        </Box>
      </Paper>
    </Box>
  );
}
