/**
 * Snapshot of a social profile.
 * Phase 1 populates username + followers only.
 * Optional fields are reserved for future metrics without changing the provider contract.
 */
export interface SocialProfileSnapshot {
  username: string;
  followers: number | null;
  following?: number | null;
  engagementRate?: number | null;
  averageLikes?: number | null;
  averageComments?: number | null;
  posts?: number | null;
  profileImage?: string | null;
  verified?: boolean | null;
}

export interface SocialProvider {
  /**
   * Resolve follower metrics for a public profile URL.
   * Must not throw for recoverable fetch failures — return followers: null instead.
   */
  getFollowers(profileUrl: string): Promise<Pick<SocialProfileSnapshot, 'username' | 'followers'>>;
}
