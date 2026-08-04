import {
  extractInstagramUsername,
  extractTikTokUsername,
  formatFollowerCount,
  isInstagramProfileUrl,
  isTikTokProfileUrl,
} from './social-url.util';

describe('social-url.util', () => {
  it('extracts Instagram usernames from profile URLs', () => {
    expect(extractInstagramUsername('https://www.instagram.com/chris_d/')).toBe(
      'chris_d',
    );
    expect(extractInstagramUsername('instagram.com/@chris_d')).toBe('chris_d');
    expect(extractInstagramUsername('https://instagram.com/p/ABC123/')).toBeNull();
  });

  it('extracts TikTok usernames from profile URLs', () => {
    expect(extractTikTokUsername('https://www.tiktok.com/@chris_d')).toBe(
      'chris_d',
    );
    expect(extractTikTokUsername('https://tiktok.com/@chris.d')).toBe('chris.d');
    expect(extractTikTokUsername('https://www.tiktok.com/foryou')).toBeNull();
  });

  it('validates profile URLs', () => {
    expect(isInstagramProfileUrl('https://instagram.com/chris_d')).toBe(true);
    expect(isTikTokProfileUrl('https://tiktok.com/@chris_d')).toBe(true);
    expect(isInstagramProfileUrl('https://tiktok.com/@chris_d')).toBe(false);
  });

  it('formats follower counts for display', () => {
    expect(formatFollowerCount(850)).toBe('850');
    expect(formatFollowerCount(32000)).toBe('32k');
    expect(formatFollowerCount(1_500_000)).toBe('1.5M');
    expect(formatFollowerCount(null)).toBeNull();
  });
});
