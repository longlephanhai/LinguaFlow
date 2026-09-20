// Content script — runs in the context of web pages.
// RULES (see PROJECT-RULES.md + ARCHITECTURE.md §8):
// - Only trigger on explicit user selection (mouseup/selectionchange with non-empty text)
// - NEVER on page load, scroll, or timer
// - NEVER read document.body.innerText or full DOM
// - Context = selected text + immediate parent element text only
// - Tokens are requested from background service worker via chrome.runtime.sendMessage

// TODO: Implement selection listener and inline popup UI

export {};
