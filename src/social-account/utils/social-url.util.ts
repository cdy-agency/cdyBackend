const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com']);
const TIKTOK_HOSTS = new Set(['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com']);

function parseUrl(raw: string): URL | null {
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

function firstPathSegment(pathname: string): string | null {
  const segment = pathname
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)[0];
  return segment || null;
}

/** Reserved Instagram path prefixes that are not profile usernames. */
const INSTAGRAM_RESERVED = new Set([
  'p',
  'reel',
  'reels',
  'stories',
  'explore',
  'accounts',
  'direct',
  'tv',
  'about',
  'developer',
  'legal',
]);

/** Reserved TikTok path prefixes that are not profile usernames. */
const TIKTOK_RESERVED = new Set([
  'foryou',
  'following',
  'live',
  'shop',
  'explore',
  'search',
  'tag',
  'music',
  'place',
  'embed',
]);

export function isInstagramProfileUrl(raw: string): boolean {
  const url = parseUrl(raw);
  if (!url || !INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) return false;
  const username = extractInstagramUsername(raw);
  return Boolean(username);
}

export function isTikTokProfileUrl(raw: string): boolean {
  const url = parseUrl(raw);
  if (!url || !TIKTOK_HOSTS.has(url.hostname.toLowerCase())) return false;
  const username = extractTikTokUsername(raw);
  return Boolean(username);
}

export function extractInstagramUsername(raw: string): string | null {
  const url = parseUrl(raw);
  if (!url || !INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segment = firstPathSegment(url.pathname);
  if (!segment) return null;

  const username = segment.replace(/^@/, '').toLowerCase();
  if (!username || INSTAGRAM_RESERVED.has(username)) return null;
  if (!/^[a-z0-9._]{1,30}$/i.test(username)) return null;

  return username;
}

export function extractTikTokUsername(raw: string): string | null {
  const url = parseUrl(raw);
  if (!url || !TIKTOK_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segment = firstPathSegment(url.pathname);
  if (!segment) return null;

  const username = segment.replace(/^@/, '').toLowerCase();
  if (!username || TIKTOK_RESERVED.has(username)) return null;
  if (!/^[a-z0-9._]{2,24}$/i.test(username)) return null;

  return username;
}

export function normalizeInstagramProfileUrl(raw: string): string {
  const username = extractInstagramUsername(raw);
  if (!username) return raw.trim();
  return `https://www.instagram.com/${username}/`;
}

export function normalizeTikTokProfileUrl(raw: string): string {
  const username = extractTikTokUsername(raw);
  if (!username) return raw.trim();
  return `https://www.tiktok.com/@${username}`;
}

/**
 * Format a raw follower integer for denormalized display fields (e.g. "32k").
 */
export function formatFollowerCount(
  count: number | null | undefined,
): string | null {
  if (count == null || Number.isNaN(count)) return null;
  if (count < 0) return null;

  if (count >= 1_000_000) {
    const value = count / 1_000_000;
    return `${Number.isInteger(value) ? value : value.toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (count >= 1_000) {
    const value = count / 1_000;
    return `${Number.isInteger(value) ? value : value.toFixed(1).replace(/\.0$/, '')}k`;
  }

  return String(count);
}
