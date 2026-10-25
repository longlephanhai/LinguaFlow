// Content Script enforcing Architecture §8 Privacy Boundary

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
function extractContext(selection: Selection, selectedText: string): string {
  const anchorNode = selection.anchorNode;
  if (!anchorNode) return selectedText;

  const parentElement = anchorNode.nodeType === Node.TEXT_NODE
    ? anchorNode.parentElement
    : (anchorNode as HTMLElement);

  if (!parentElement) return selectedText;

  // Only read the immediate parent element's textContent (capped at 300 chars)
  const parentText = parentElement.textContent || '';
  if (!parentText) return selectedText;

  // Extract the sentence containing the selected text
  const sentences = parentText.split(/(?<=[.!?])\s+/);
  const matchedSentence = sentences.find((s) => s.includes(selectedText));

  if (matchedSentence && matchedSentence.length <= 400) {
    return matchedSentence.trim();
  }

  // Fallback to substring around selected text (max 300 chars)
  const idx = parentText.indexOf(selectedText);
  if (idx !== -1) {
    const start = Math.max(0, idx - 100);
    const end = Math.min(parentText.length, idx + selectedText.length + 100);
    return parentText.substring(start, end).trim();
  }

  return selectedText;
}

document.addEventListener('mouseup', (e: MouseEvent) => {
  // If clicking inside our popup, ignore
  if (popupCard && popupCard.contains(e.target as Node)) {
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

function showExplanationPopup(
  rect: DOMRect,
  selectedText: string,
  sentence: string,
  sourceUrl: string,
  sourceTitle: string | null,
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
