// Background service worker — Manifest V3.
// RULES (see PROJECT-RULES.md + ARCHITECTURE.md §4):
// - Owns auth token lifecycle (access + refresh)
// - Stores tokens in chrome.storage.local — NEVER localStorage (not available in service workers)
// - Proxies API calls from content script via chrome.runtime.onMessage
// - Handles token refresh before forwarding requests
//
// IMPORTANT: Do NOT import or call Gemini SDK here — all AI calls go through the backend.

// TODO: Implement message listener, token refresh, API proxy logic

export {};
