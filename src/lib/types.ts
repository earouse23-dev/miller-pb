// Domain + database types for Miller Pickleball.

export type TournamentFormat = 'round_robin' | 'bracket' | 'both';
export type MatchType = 'singles' | 'doubles_fixed' | 'doubles_random';
export type TournamentStatus = 'active' | 'completed';
export type MatchStatus = 'pending' | 'completed';

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
  team1_score: number | null;
  team2_score: number | null;
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
