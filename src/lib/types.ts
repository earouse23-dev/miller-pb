// Domain + database types for Miller Pickleball.

export type TournamentFormat = 'round_robin' | 'bracket' | 'both';
export type MatchType = 'singles' | 'doubles_fixed' | 'doubles_random';
export type TournamentStatus = 'active' | 'completed';
export type MatchStatus = 'pending' | 'completed';

// How many points a single game is played to.
export type ScoreTarget = 11 | 15 | 21;
// How many games decide a match. `single` = one game; best-of needs a majority.
export type GameFormat = 'single' | 'best_of_3' | 'best_of_5';
// One game's points: `a` for team1, `b` for team2.
export type GameScore = { a: number; b: number };

// NOTE: these are `type` aliases (not interfaces) on purpose — object-literal
// types carry an implicit index signature, which the Supabase `GenericTable`
// constraint (Row extends Record<string, unknown>) requires. Interfaces don't.
export type Player = {
  id: string;
  name: string;
  created_at: string;
};

export type Tournament = {
  id: string;
  invite_code: string;
  host_identity: string;
  format: TournamentFormat;
  match_type: MatchType;
  status: TournamentStatus;
  created_at: string;
  completed_at: string | null;
  stats_saved: boolean;
  /** Points a game is played to. Null on legacy rows (treat as 11). */
  score_target: number | null;
  /** Game format for the round-robin phase. Null when not applicable/legacy. */
  rr_format: GameFormat | null;
  /** Game format for the bracket phase. Null when not applicable/legacy. */
  bracket_format: GameFormat | null;
};

export type Team = {
  id: string;
  tournament_id: string;
  player1_id: string;
  player2_id: string | null;
};

export type Match = {
  id: string;
  tournament_id: string;
  round_number: number;
  court_number: number | null;
  team1_id: string | null;
  team2_id: string | null;
  /** Total points across all games (sum of game `a` / `b`). Drives PF/diff. */
  team1_score: number | null;
  team2_score: number | null;
  /** Games won by each team. Decides the match winner (majority). 1/0 for a
   *  single-game match. Null/0 on legacy rows — fall back to points. */
  team1_games: number | null;
  team2_games: number | null;
  /** Per-game scores, for re-display/editing. Null on legacy rows. */
  games: GameScore[] | null;
  is_bye: boolean;
  status: MatchStatus;
  created_at: string;
};

export type TournamentResult = {
  id: string;
  tournament_id: string;
  team_id: string;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  rank: number;
  tournament_wins: number;
};

export type LifetimeStats = {
  player_id: string;
  total_wins: number;
  total_losses: number;
  total_points_for: number;
  total_points_against: number;
  tournament_wins: number;
  tournaments_played: number;
  updated_at: string;
};

// A leaderboard row: lifetime stats joined with the player's name.
export type LeaderboardRow = LifetimeStats & { name: string };

// Convenience shape: a team with its resolved player names.
export type TeamWithPlayers = Team & {
  player1: Player | null;
  player2: Player | null;
};

// A standings row computed live from matches.
export interface StandingRow {
  team_id: string;
  label: string;
  /** Individual players on this team (for tappable names / profiles). */
  players: Array<{ id: string; name: string }>;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  diff: number;
  rank: number;
}

// Insert payload helpers (id/created_at filled by DB).
export type TeamInsert = Omit<Team, 'id'>;
export type MatchInsert = Omit<Match, 'id' | 'created_at'>;

// Minimal typed surface for the Supabase client.
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      players: {
        Row: Player;
        Insert: { id?: string; name: string; created_at?: string };
        Update: Partial<Player>;
        Relationships: [];
      };
      tournaments: {
        Row: Tournament;
        Insert: {
          id?: string;
          invite_code: string;
          host_identity: string;
          format: TournamentFormat;
          match_type: MatchType;
          status?: TournamentStatus;
          created_at?: string;
          completed_at?: string | null;
          score_target?: number | null;
          rr_format?: GameFormat | null;
          bracket_format?: GameFormat | null;
        };
        Update: Partial<Tournament>;
        Relationships: [];
      };
      teams: {
        Row: Team;
        Insert: { id?: string; tournament_id: string; player1_id: string; player2_id?: string | null };
        Update: Partial<Team>;
        Relationships: [];
      };
      matches: {
        Row: Match;
        Insert: {
          id?: string;
          tournament_id: string;
          round_number: number;
          court_number?: number | null;
          team1_id?: string | null;
          team2_id?: string | null;
          team1_score?: number | null;
          team2_score?: number | null;
          team1_games?: number | null;
          team2_games?: number | null;
          games?: GameScore[] | null;
          is_bye?: boolean;
          status?: MatchStatus;
          created_at?: string;
        };
        Update: Partial<Match>;
        Relationships: [];
      };
      tournament_results: {
        Row: TournamentResult;
        Insert: {
          id?: string;
          tournament_id: string;
          team_id: string;
          wins?: number;
          losses?: number;
          points_for?: number;
          points_against?: number;
          rank?: number;
          tournament_wins?: number;
        };
        Update: Partial<TournamentResult>;
        Relationships: [];
      };
      lifetime_stats: {
        Row: LifetimeStats;
        Insert: {
          player_id: string;
          total_wins?: number;
          total_losses?: number;
          total_points_for?: number;
          total_points_against?: number;
          tournament_wins?: number;
          tournaments_played?: number;
          updated_at?: string;
        };
        Update: Partial<LifetimeStats>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
