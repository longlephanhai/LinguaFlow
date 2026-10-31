// Content Script enforcing Architecture §8 Privacy Boundary & Phase 2 Video Features

export interface MediaMetadataPayload {
  provider: 'youtube' | 'netflix' | 'web';
  videoId: string | null;
  timestampSeconds: number | null;
  videoTitle: string | null;
  audioSnippetUrl?: string | null;
}

export interface SubtitleSegment {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  translation: string | null;
}

export interface SubtitleToken {
  text: string;
  isWord: boolean;
}

let triggerBtn: HTMLElement | null = null;
let popupCard: HTMLElement | null = null;

function removeElements() {
  if (triggerBtn) {
    triggerBtn.remove();
    triggerBtn = null;
  }
  if (popupCard) {
    popupCard.remove();
    popupCard = null;
  }
}

/**
 * Extracts immediate sentence context around selected text without reading full DOM.
 * Adheres strictly to ARCHITECTURE.md §8 & PRD FR-EXT-002.
 */
export function extractContextFromText(parentText: string, selectedText: string): string {
  if (!parentText) return selectedText;

  const sentences = parentText.split(/(?<=[.!?])\s+/);
  const matchedSentence = sentences.find((s) => s.includes(selectedText));

  if (matchedSentence && matchedSentence.length <= 400) {
    return matchedSentence.trim();
  }

  const idx = parentText.indexOf(selectedText);
  if (idx !== -1) {
    const start = Math.max(0, idx - 100);
    const end = Math.min(parentText.length, idx + selectedText.length + 100);
    return parentText.substring(start, end).trim();
  }

  return selectedText;
}

function extractContext(selection: Selection, selectedText: string): string {
  const anchorNode = selection.anchorNode;
  if (!anchorNode) return selectedText;

  const parentElement =
    anchorNode.nodeType === Node.TEXT_NODE
      ? anchorNode.parentElement
      : (anchorNode as HTMLElement);

  if (!parentElement) return selectedText;

  const parentText = parentElement.textContent || '';
  return extractContextFromText(parentText, selectedText);
}

/**
 * Tokenizes subtitle sentence into words and whitespace/punctuation tokens.
 */
export function tokenizeSubtitleSentence(sentence: string): SubtitleToken[] {
  if (!sentence) return [];
  const tokens: SubtitleToken[] = [];
  const regex = /([a-zA-Z0-9'’-]+)|([^a-zA-Z0-9'’-]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sentence)) !== null) {
    if (match[1]) {
      tokens.push({ text: match[1], isWord: true });
    } else if (match[2]) {
      tokens.push({ text: match[2], isWord: false });
    }
  }
  return tokens;
}

if (typeof document !== 'undefined') {
  document.addEventListener('mouseup', (e: MouseEvent) => {
    // If clicking inside our popup or video subtitle overlay, ignore
    if (popupCard && popupCard.contains(e.target as Node)) {
      return;
    }

    const subContainer = document.getElementById('linguaflow-yt-subtitles');
    if (subContainer && subContainer.contains(e.target as Node)) {
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    // FR-EXT-001 AC-2: Selection must be non-empty, non-whitespace, and <= 200 chars
    if (!selection || !selectedText || selectedText.length > 200) {
      removeElements();
      return;
    }

    // Check if selection collapsed
    if (selection.isCollapsed) {
      removeElements();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Create floating trigger icon
    removeElements();

    triggerBtn = document.createElement('div');
    triggerBtn.id = 'linguaflow-trigger-btn';
    triggerBtn.innerText = 'LF';
    triggerBtn.title = 'Explain & Save with LinguaFlow';

    const top = rect.bottom + window.scrollY + 6;
    const left = Math.min(window.innerWidth - 40, rect.left + window.scrollX);

    triggerBtn.style.top = `${top}px`;
    triggerBtn.style.left = `${left}px`;

    triggerBtn.addEventListener('mousedown', (evt) => {
      evt.preventDefault();
      evt.stopPropagation();

      const sentence = extractContext(selection, selectedText);
      const sourceUrl = window.location.href;
      const sourceTitle = document.title || null;

      showExplanationPopup(rect, selectedText, sentence, sourceUrl, sourceTitle);
    });

    document.body.appendChild(triggerBtn);
  });

  // Click outside closes the popup
  document.addEventListener('mousedown', (e: MouseEvent) => {
    if (popupCard && !popupCard.contains(e.target as Node) && e.target !== triggerBtn) {
      removeElements();
    }
  });
}

export function showExplanationPopup(
  rect: DOMRect,
  selectedText: string,
  sentence: string,
  sourceUrl: string,
  sourceTitle: string | null,
  mediaMetadata?: MediaMetadataPayload | null,
) {
  if (triggerBtn) {
    triggerBtn.remove();
    triggerBtn = null;
  }

  popupCard = document.createElement('div');
  popupCard.id = 'linguaflow-popup-card';

  const top = rect.bottom + window.scrollY + 8;
  const left = Math.max(10, Math.min(window.innerWidth - 320, rect.left + window.scrollX - 20));

  popupCard.style.top = `${top}px`;
  popupCard.style.left = `${left}px`;

  popupCard.replaceChildren();
  const loadingBox = document.createElement('div');
  loadingBox.className = 'lf-loading-box';
  const spinner = document.createElement('div');
  spinner.className = 'lf-blue-spinner';
  const loadingText = document.createElement('span');
  loadingText.textContent = 'Explaining with LinguaFlow AI...';
  loadingBox.appendChild(spinner);
  loadingBox.appendChild(loadingText);
  popupCard.appendChild(loadingBox);

  document.body.appendChild(popupCard);

  // Request lookup from background worker
  chrome.runtime.sendMessage(
    {
      action: 'LOOKUP_WORD',
      payload: {
        selectedText,
        contextText: sentence,
        sourceUrl,
      },
    },
    (res) => {
      if (!popupCard) return;

      popupCard.replaceChildren();

      if (!res || !res.success) {
        const errorMsg =
          res?.error === 'UNAUTHORIZED'
            ? 'Please open the extension icon to log in first.'
            : res?.error || 'AI Lookup failed. Please try again.';

        const header = document.createElement('div');
        header.className = 'lf-header';
        const title = document.createElement('span');
        title.className = 'lf-lemma-title';
        title.textContent = selectedText;
        const closeBtn = document.createElement('button');
        closeBtn.className = 'lf-close-btn';
        closeBtn.id = 'lf-close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', removeElements);
        header.appendChild(title);
        header.appendChild(closeBtn);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'lf-error';
        errorDiv.textContent = errorMsg;

        popupCard.appendChild(header);
        popupCard.appendChild(errorDiv);
        return;
      }

      const { lemma, meaning, example, partOfSpeech } = res.data;

      // Header
      const header = document.createElement('div');
      header.className = 'lf-header';
      const title = document.createElement('span');
      title.className = 'lf-lemma-title';
      title.textContent = lemma;
      header.appendChild(title);

      if (partOfSpeech) {
        const posBadge = document.createElement('span');
        posBadge.className = 'lf-pos-badge';
        posBadge.textContent = partOfSpeech;
        header.appendChild(posBadge);
      }

      const closeBtn = document.createElement('button');
      closeBtn.className = 'lf-close-btn';
      closeBtn.id = 'lf-close';
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', removeElements);
      header.appendChild(closeBtn);

      // Body
      const body = document.createElement('div');
      body.className = 'lf-body';
      const meaningDiv = document.createElement('div');
      meaningDiv.className = 'lf-meaning';
      meaningDiv.textContent = meaning;
      body.appendChild(meaningDiv);

      if (example) {
        const exampleDiv = document.createElement('div');
        exampleDiv.className = 'lf-example';
        exampleDiv.textContent = `"${example}"`;
        body.appendChild(exampleDiv);
      }

      // Footer
      const footer = document.createElement('div');
      footer.className = 'lf-footer';
      const saveBtn = document.createElement('button');
      saveBtn.id = 'lf-save-btn';
      saveBtn.className = 'lf-save-btn';
      saveBtn.textContent = 'Save to LinguaFlow';

      saveBtn.addEventListener('click', () => {
        saveBtn.disabled = true;
        saveBtn.replaceChildren();
        const spin = document.createElement('span');
        spin.className = 'lf-spinner';
        saveBtn.appendChild(spin);
        saveBtn.appendChild(document.createTextNode(' Saving...'));

        chrome.runtime.sendMessage(
          {
            action: 'SAVE_OCCURRENCE',
            payload: {
              lemma,
              meaning,
              example,
              partOfSpeech,
              sentence,
              sourceUrl,
              sourceTitle,
              selectedText,
              mediaMetadata: mediaMetadata || null,
            },
          },
          (saveRes) => {
            if (saveRes && saveRes.success) {
              saveBtn.replaceChildren();
              saveBtn.textContent = 'Saved ✓';
              saveBtn.style.backgroundColor = '#10b981';
              setTimeout(() => {
                removeElements();
              }, 2000);
            } else {
              saveBtn.disabled = false;
              saveBtn.replaceChildren();
              saveBtn.textContent = 'Save Failed. Retry?';
              saveBtn.style.backgroundColor = '#ef4444';
            }
          },
        );
      });

      footer.appendChild(saveBtn);

      popupCard.appendChild(header);
      popupCard.appendChild(body);
      popupCard.appendChild(footer);
    },
  );
}

/* ========================================================
   Phase 2: YouTube Subtitle Overlay & Video Interaction
   ======================================================== */

let ytCurrentVideoId: string | null = null;
let ytSegments: SubtitleSegment[] = [];
let ytActiveSegment: SubtitleSegment | null = null;
let ytSubtitlesContainer: HTMLElement | null = null;

export function isYouTubeWatchPage(href?: string): boolean {
  if (href) {
    try {
      const url = new URL(href);
      return url.hostname.includes('youtube.com') && url.pathname.startsWith('/watch');
    } catch {
      return false;
    }
  }
  if (typeof window === 'undefined' || !window.location) return false;
  return (
    window.location.hostname.includes('youtube.com') &&
    window.location.pathname.startsWith('/watch')
  );
}

export function getYouTubeVideoId(href?: string): string | null {
  if (href) {
    if (!isYouTubeWatchPage(href)) return null;
    try {
      const url = new URL(href);
      return url.searchParams.get('v');
    } catch {
      return null;
    }
  }
  if (!isYouTubeWatchPage()) return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('v');
}

function getYouTubeVideoElement(): HTMLVideoElement | null {
  return document.querySelector('video.html5-main-video') || document.querySelector('video');
}

function ensureSubtitleContainer(): HTMLElement | null {
  let container = document.getElementById('linguaflow-yt-subtitles');
  if (container) return container;

  const player =
    document.getElementById('movie_player') ||
    document.querySelector('.html5-video-player') ||
    document.body;

  container = document.createElement('div');
  container.id = 'linguaflow-yt-subtitles';

  const primaryLine = document.createElement('div');
  primaryLine.className = 'lf-yt-sub-line lf-primary';
  container.appendChild(primaryLine);

  const secondaryLine = document.createElement('div');
  secondaryLine.className = 'lf-yt-sub-line lf-secondary';
  secondaryLine.style.display = 'none';
  container.appendChild(secondaryLine);

  const hotkeysHint = document.createElement('div');
  hotkeysHint.className = 'lf-yt-hotkeys-hint';
  hotkeysHint.innerHTML = `
    <span><span class="lf-yt-hotkey">[A]</span> -3s</span>
    <span><span class="lf-yt-hotkey">[S]</span> Repeat</span>
    <span><span class="lf-yt-hotkey">[D]</span> +3s</span>
    <span><span class="lf-yt-hotkey">[Space]</span> Pause</span>
  `;
  container.appendChild(hotkeysHint);

  player.appendChild(container);
  ytSubtitlesContainer = container;
  return container;
}

export function renderSubtitleText(text: string, translation: string | null = null) {
  const container = ensureSubtitleContainer();
  if (!container) return;

  const primaryLine = container.querySelector('.lf-yt-sub-line.lf-primary') as HTMLElement;
  const secondaryLine = container.querySelector('.lf-yt-sub-line.lf-secondary') as HTMLElement;

  if (!text || !text.trim()) {
    container.style.display = 'none';
    if (primaryLine) primaryLine.replaceChildren();
    if (secondaryLine) {
      secondaryLine.replaceChildren();
      secondaryLine.style.display = 'none';
    }
    return;
  }

  container.style.display = 'flex';
  primaryLine.replaceChildren();

  const tokens = tokenizeSubtitleSentence(text);
  const video = getYouTubeVideoElement();

  tokens.forEach((token) => {
    if (token.isWord) {
      const span = document.createElement('span');
      span.className = 'lf-yt-word';
      span.textContent = token.text;

      span.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (video) {
          video.pause();
        }

        const rect = span.getBoundingClientRect();
        const videoId = getYouTubeVideoId();
        const videoTitle = document.title.replace(' - YouTube', '').trim();
        const timestampSeconds = video ? Math.floor(video.currentTime) : null;

        showExplanationPopup(
          rect,
          token.text,
          text,
          window.location.href,
          videoTitle,
          {
            provider: 'youtube',
            videoId,
            timestampSeconds,
            videoTitle,
          },
        );
      });

      primaryLine.appendChild(span);
    } else {
      primaryLine.appendChild(document.createTextNode(token.text));
    }
  });

  if (secondaryLine) {
    if (translation) {
      secondaryLine.textContent = translation;
      secondaryLine.style.display = 'block';
    } else {
      secondaryLine.replaceChildren();
      secondaryLine.style.display = 'none';
    }
  }
}

export function renderSubtitleCue(segment: SubtitleSegment | null) {
  if (!segment) {
    renderSubtitleText('');
  } else {
    renderSubtitleText(segment.text, segment.translation);
  }
}

let captionObserver: MutationObserver | null = null;
let lastObservedCaptionText: string = '';

function setupNativeCaptionObserver() {
  if (captionObserver) {
    captionObserver.disconnect();
  }

  const player =
    document.getElementById('movie_player') ||
    document.querySelector('.html5-video-player') ||
    document.body;

  captionObserver = new MutationObserver(() => {
    // If backend segments are actively controlling cues, let them drive
    if (ytSegments.length > 0 && ytActiveSegment) return;

    const segments = document.querySelectorAll('.ytp-caption-segment');
    if (segments.length > 0) {
      const fullText = Array.from(segments)
        .map((s) => s.textContent || '')
        .join(' ')
        .trim();

      if (fullText && fullText !== lastObservedCaptionText) {
        lastObservedCaptionText = fullText;
        renderSubtitleText(fullText);
      }
    } else if (lastObservedCaptionText) {
      lastObservedCaptionText = '';
      renderSubtitleText('');
    }
  });

  captionObserver.observe(player, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

function checkYouTubeSubtitlesButton() {
  if (!isYouTubeWatchPage()) return;

  const ccBtn = document.querySelector<HTMLButtonElement>('.ytp-subtitles-button');
  if (!ccBtn) return;

  const isPressed = ccBtn.getAttribute('aria-pressed') === 'true';
  const banner = document.getElementById('lf-yt-cc-prompt');

  if (!isPressed) {
    if (!banner) {
      const prompt = document.createElement('div');
      prompt.id = 'lf-yt-cc-prompt';
      prompt.innerHTML = `
        <span class="lf-yt-cc-icon">💬</span>
        <span>LinguaFlow: Bật CC để hiện phụ đề tra từ</span>
        <button class="lf-yt-cc-btn">Bật phụ đề</button>
      `;
      prompt.querySelector('.lf-yt-cc-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        ccBtn.click();
        prompt.remove();
      });

      const player =
        document.getElementById('movie_player') ||
        document.querySelector('.html5-video-player') ||
        document.body;
      player.appendChild(prompt);
    }
  } else {
    if (banner) {
      banner.remove();
    }
  }
}

function tryExtractBrowserCaptionTracks() {
  try {
    for (const script of Array.from(document.scripts)) {
      const content = script.textContent || '';
      if (content.includes('captionTracks')) {
        const match = content.match(/"captionTracks":\s*(\[.+?\])/);
        if (match) {
          const tracks = JSON.parse(match[1]);
          if (Array.isArray(tracks) && tracks.length > 0) {
            const track =
              tracks.find((t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en')) ||
              tracks[0];
            if (track && track.baseUrl) {
              const url = track.baseUrl.includes('fmt=json3')
                ? track.baseUrl
                : `${track.baseUrl}&fmt=json3`;
              fetch(url)
                .then((r) => r.json())
                .then((json3) => {
                  if (json3.events && Array.isArray(json3.events)) {
                    let segIndex = 0;
                    const segments: SubtitleSegment[] = [];
                    for (const ev of json3.events) {
                      if (!ev.segs || !Array.isArray(ev.segs)) continue;
                      const text = ev.segs
                        .map((s: any) => s.utf8 || '')
                        .join('')
                        .replace(/\n+/g, ' ')
                        .trim();
                      if (!text || text === '\n') continue;
                      const startSeconds = Number((ev.tStartMs / 1000).toFixed(2));
                      const dur = (ev.dDurationMs || 0) / 1000;
                      const endSeconds = Number((startSeconds + dur).toFixed(2));
                      segments.push({
                        index: segIndex++,
                        startSeconds,
                        endSeconds,
                        text,
                        translation: null,
                      });
                    }
                    if (segments.length > 0) {
                      ytSegments = segments;
                    }
                  }
                })
                .catch(() => {});
              return;
            }
          }
        }
      }
    }
  } catch {
    // Ignore extraction failure and rely on native caption observer
  }
}

function fetchTranscriptForCurrentVideo() {
  const videoId = getYouTubeVideoId();
  if (!videoId || videoId === ytCurrentVideoId) return;

  ytCurrentVideoId = videoId;
  ytSegments = [];
  ytActiveSegment = null;

  tryExtractBrowserCaptionTracks();

  chrome.runtime.sendMessage(
    {
      action: 'FETCH_VIDEO_TRANSCRIPT',
      payload: {
        videoUrl: window.location.href,
        language: 'en',
      },
    },
    (res) => {
      if (res && res.success && Array.isArray(res.data?.segments) && res.data.segments.length > 0) {
        ytSegments = res.data.segments;
      }
    },
  );
}

function setupYouTubeVideoListeners() {
  const video = getYouTubeVideoElement();
  if (!video) return;

  video.removeEventListener('timeupdate', onTimeUpdate);
  video.addEventListener('timeupdate', onTimeUpdate);

  setupNativeCaptionObserver();
  checkYouTubeSubtitlesButton();
}

function onTimeUpdate() {
  const video = getYouTubeVideoElement();
  if (!video || ytSegments.length === 0) return;

  const currentTime = video.currentTime;
  const currentSegment = ytSegments.find(
    (s) => s.startSeconds <= currentTime && currentTime <= s.endSeconds,
  );

  if (currentSegment !== ytActiveSegment) {
    ytActiveSegment = currentSegment || null;
    renderSubtitleCue(ytActiveSegment);
  }
}

// Hotkey shortcuts (FR-VIDEO-002)
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return;
    }

    if (!isYouTubeWatchPage()) return;
    const video = getYouTubeVideoElement();
    if (!video) return;

    const key = e.key.toLowerCase();

    if (key === 'a') {
      // Rewind 3 seconds
      e.preventDefault();
      video.currentTime = Math.max(0, video.currentTime - 3);
    } else if (key === 'd') {
      // Forward 3 seconds
      e.preventDefault();
      video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 3);
    } else if (key === 's') {
      // Replay current sentence / cue
      e.preventDefault();
      if (ytActiveSegment) {
        video.currentTime = ytActiveSegment.startSeconds;
      } else {
        video.currentTime = Math.max(0, video.currentTime - 3);
      }
      if (video.paused) {
        video.play().catch(() => {});
      }
    } else if (e.key === ' ' && target === document.body) {
      // Space play/pause toggle when not focused on an interactive element
      e.preventDefault();
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  });
}

// Periodic check for YouTube SPA navigation & CC state
if (typeof window !== 'undefined') {
  window.addEventListener('yt-navigate-finish', () => {
    fetchTranscriptForCurrentVideo();
    setupYouTubeVideoListeners();
  });

  setInterval(() => {
    if (isYouTubeWatchPage()) {
      const videoId = getYouTubeVideoId();
      if (videoId && videoId !== ytCurrentVideoId) {
        fetchTranscriptForCurrentVideo();
        setupYouTubeVideoListeners();
      } else {
        checkYouTubeSubtitlesButton();
        if (!captionObserver) {
          setupNativeCaptionObserver();
        }
      }
    }
  }, 1000);
}
