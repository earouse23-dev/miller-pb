import type { Player, Team, TeamWithPlayers } from './types';

// ---------------------------------------------------------------------------
// classnames helper
// ---------------------------------------------------------------------------
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// localStorage identity + active tournament
// ---------------------------------------------------------------------------
const IDENTITY_KEY = 'mp_user_identity';
const ACTIVE_KEY = 'mp_active_tournament_id';

/** Stable per-device identity. Created lazily on first use. */
export function getUserIdentity(): string {
  let id = localStorage.getItem(IDENTITY_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(IDENTITY_KEY, id);
  }
  return id;
}

export function getActiveTournamentId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveTournament(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function clearActiveTournament(): void {
  localStorage.removeItem(ACTIVE_KEY);
}

// ---------------------------------------------------------------------------
// Invite codes
// ---------------------------------------------------------------------------
// Unambiguous alphabet (no 0/O, 1/I) for codes that get read aloud.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInviteCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Team labels
// ---------------------------------------------------------------------------
export function playerName(players: Map<string, Player>, id: string | null): string {
  if (!id) return 'TBD';
  return players.get(id)?.name ?? 'Unknown';
}

export function teamLabel(team: TeamWithPlayers | undefined | null): string {
  if (!team) return 'TBD';
  const p1 = team.player1?.name ?? 'Unknown';
  if (!team.player2_id) return p1;
  const p2 = team.player2?.name ?? 'Unknown';
  return `${p1} & ${p2}`;
}

export function resolveTeam(
  team: Team,
  players: Map<string, Player>,
): TeamWithPlayers {
  return {
    ...team,
    player1: players.get(team.player1_id) ?? null,
    player2: team.player2_id ? (players.get(team.player2_id) ?? null) : null,
  };
}

// ---------------------------------------------------------------------------
// misc
// ---------------------------------------------------------------------------
export function isDoubles(matchType: string): boolean {
  return matchType === 'doubles_fixed' || matchType === 'doubles_random';
}

/** Format a label for a court badge. */
export function courtLabel(court: number | null): string {
  return court ? `COURT ${court}` : 'COURT';
}
