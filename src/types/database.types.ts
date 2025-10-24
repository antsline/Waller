// Supabase Database Types
// Auto-generated types for type-safe database access

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: 'player' | 'fan'
          username: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          username_change_count: number
          status: 'active' | 'suspended' | 'deleted'
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id: string
          role: 'player' | 'fan'
          username: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          username_change_count?: number
          status?: 'active' | 'suspended' | 'deleted'
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          role?: 'player' | 'fan'
          username?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          username_change_count?: number
          status?: 'active' | 'suspended' | 'deleted'
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      player_profiles: {
        Row: {
          user_id: string
          experience_years: number
          experience_months: number
          skill_level: number
          team_name: string | null
          home_gym: string | null
          main_location: string | null
          twitter_url: string | null
          instagram_url: string | null
          youtube_url: string | null
          is_open_to_collab: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          experience_years: number
          experience_months: number
          skill_level: number
          team_name?: string | null
          home_gym?: string | null
          main_location?: string | null
          twitter_url?: string | null
          instagram_url?: string | null
          youtube_url?: string | null
          is_open_to_collab?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          experience_years?: number
          experience_months?: number
          skill_level?: number
          team_name?: string | null
          home_gym?: string | null
          main_location?: string | null
          twitter_url?: string | null
          instagram_url?: string | null
          youtube_url?: string | null
          is_open_to_collab?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          video_url: string
          thumbnail_url: string
          video_duration: number
          video_size: number
          caption: string | null
          category_tag: 'challenge' | 'success' | 'practice' | 'combo' | 'new' | 'other' | null
          status: 'published' | 'deleted' | 'reported'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_url: string
          thumbnail_url: string
          video_duration: number
          video_size: number
          caption?: string | null
          category_tag?: 'challenge' | 'success' | 'practice' | 'combo' | 'new' | 'other' | null
          status?: 'published' | 'deleted' | 'reported'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_url?: string
          thumbnail_url?: string
          video_duration?: number
          video_size?: number
          caption?: string | null
          category_tag?: 'challenge' | 'success' | 'practice' | 'combo' | 'new' | 'other' | null
          status?: 'published' | 'deleted' | 'reported'
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          reaction_type: 'fire' | 'clap' | 'sparkle' | 'muscle'
          previous_type: 'fire' | 'clap' | 'sparkle' | 'muscle' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          reaction_type: 'fire' | 'clap' | 'sparkle' | 'muscle'
          previous_type?: 'fire' | 'clap' | 'sparkle' | 'muscle' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          reaction_type?: 'fire' | 'clap' | 'sparkle' | 'muscle'
          previous_type?: 'fire' | 'clap' | 'sparkle' | 'muscle' | null
          created_at?: string
          updated_at?: string
        }
      }
      post_counters: {
        Row: {
          post_id: string
          like_count: number
          reaction_fire_count: number
          reaction_clap_count: number
          reaction_sparkle_count: number
          reaction_muscle_count: number
          updated_at: string
        }
        Insert: {
          post_id: string
          like_count?: number
          reaction_fire_count?: number
          reaction_clap_count?: number
          reaction_sparkle_count?: number
          reaction_muscle_count?: number
          updated_at?: string
        }
        Update: {
          post_id?: string
          like_count?: number
          reaction_fire_count?: number
          reaction_clap_count?: number
          reaction_sparkle_count?: number
          reaction_muscle_count?: number
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          post_id: string
          reporter_user_id: string
          reason: 'inappropriate' | 'spam' | 'harassment' | 'impersonation' | 'other'
          reason_detail: string | null
          status: 'pending' | 'resolved' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          reporter_user_id: string
          reason: 'inappropriate' | 'spam' | 'harassment' | 'impersonation' | 'other'
          reason_detail?: string | null
          status?: 'pending' | 'resolved' | 'dismissed'
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          reporter_user_id?: string
          reason?: 'inappropriate' | 'spam' | 'harassment' | 'impersonation' | 'other'
          reason_detail?: string | null
          status?: 'pending' | 'resolved' | 'dismissed'
          created_at?: string
        }
      }
      deletion_logs: {
        Row: {
          id: string
          user_id: string
          post_id: string
          deleted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          deleted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          deleted_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
